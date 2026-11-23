// Release builds are a windowed app on Windows: without this the exe is a
// console program and a console window opens next to the app whenever it is
// started from the Start menu, Explorer or a file association. Debug builds
// keep the console so `tauri dev` still shows log output.
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use encoding_rs::{Encoding, EUC_JP, SHIFT_JIS, UTF_8, WINDOWS_1252};
use std::borrow::Cow;
use std::ffi::OsString;
use std::fs;
use std::io::{ErrorKind, Write};
use std::path::{Path, PathBuf};
use std::sync::Mutex;
use std::time::UNIX_EPOCH;
use tauri::{Emitter, Manager};
use tauri_plugin_dialog::DialogExt;

// Files the operating system asked PlainSheet to open: named on the command
// line (`plainsheet a.csv b.csv`, "Open with"), passed to a second launch that
// was redirected to the running app, or delivered by macOS as open-document
// events. The window takes them once it is ready.
struct PendingOpen(Mutex<Vec<String>>);

// Tells the running window that PendingOpen was filled.
const OPEN_FILE_EVENT: &str = "plainsheet://open-file";

// Errors the window turns into a message. They are short codes rather than
// text: the OS text would show absolute paths and is not translated.
const ERR_TOO_LARGE: &str = "too-large";
const ERR_UTF16: &str = "utf16";
const ERR_NUL: &str = "nul";
const ERR_NOT_FILE: &str = "not-file";
const ERR_DECODE: &str = "decode-failed";
const ERR_MODIFIED: &str = "modified-externally";

fn io_code(error: std::io::Error) -> String {
    match error.kind() {
        ErrorKind::NotFound => "not-found",
        ErrorKind::PermissionDenied => "permission-denied",
        _ => "io-error",
    }
    .to_string()
}

// Every argument that names an existing regular file, as an absolute path.
// Arguments starting with '-' are skipped (flags, macOS `-psn_…`). A relative
// name is resolved against the directory the app was started from.
fn files_from_args<I>(args: I, cwd: &Path) -> Vec<String>
where
    I: IntoIterator<Item = OsString>,
{
    args.into_iter()
        .filter(|arg| !arg.to_string_lossy().starts_with('-'))
        .map(PathBuf::from)
        .map(|path| {
            if path.is_absolute() {
                path
            } else {
                cwd.join(path)
            }
        })
        .filter(|path| path.is_absolute() && path.is_file())
        .filter_map(|path| path.to_str().map(str::to_owned))
        .collect()
}

fn queue_files(app: &tauri::AppHandle, files: Vec<String>) {
    if files.is_empty() {
        return;
    }
    if let Ok(mut pending) = app.state::<PendingOpen>().0.lock() {
        pending.extend(files);
    }
    let _ = app.emit(OPEN_FILE_EVENT, ());
}

#[tauri::command]
fn take_pending_files(pending: tauri::State<'_, PendingOpen>) -> Vec<String> {
    pending
        .0
        .lock()
        .map(|mut list| std::mem::take(&mut *list))
        .unwrap_or_default()
}

#[tauri::command]
async fn open_file_dialog(app: tauri::AppHandle) -> Option<Vec<String>> {
    app.dialog()
        .file()
        .add_filter(
            "Table files",
            &["csv", "tsv", "md", "markdown", "json", "yaml", "yml"],
        )
        .add_filter("CSV", &["csv"])
        .add_filter("TSV", &["tsv"])
        .blocking_pick_files()
        .map(|paths| paths.into_iter().map(|path| path.to_string()).collect())
}

const MAX_FILE_BYTES: u64 = 50 * 1024 * 1024;

// Defense in depth: these commands only ever receive absolute paths returned by
// the native file dialog, drop events, or take_pending_files, so reject
// anything else.
fn require_absolute(path: &str) -> Result<(), String> {
    if std::path::Path::new(path).is_absolute() {
        Ok(())
    } else {
        Err("not-absolute".to_string())
    }
}

// The path as the file system names it: real letter case, symlinks resolved,
// without the `\\?\` prefix Windows adds. Two spellings of one file then
// compare equal, so it opens in one tab.
fn canonical_path(path: &str) -> String {
    match fs::canonicalize(path) {
        Ok(real) => {
            let text = real.to_string_lossy();
            if let Some(rest) = text.strip_prefix(r"\\?\UNC\") {
                format!(r"\\{rest}")
            } else if let Some(rest) = text.strip_prefix(r"\\?\") {
                rest.to_string()
            } else {
                text.into_owned()
            }
        }
        Err(_) => path.to_string(),
    }
}

/// When a file was last written, to notice changes made outside the app.
#[derive(Debug, Clone, PartialEq, Eq, serde::Serialize, serde::Deserialize)]
struct FileStamp {
    // Nanoseconds since the Unix epoch, as text: JavaScript numbers lose digits.
    modified: String,
    size: u64,
}

fn stamp_of(metadata: &fs::Metadata) -> FileStamp {
    let modified = metadata
        .modified()
        .ok()
        .and_then(|time| time.duration_since(UNIX_EPOCH).ok())
        .map(|duration| duration.as_nanos())
        .unwrap_or_default();
    FileStamp {
        modified: modified.to_string(),
        size: metadata.len(),
    }
}

#[derive(Debug, serde::Serialize)]
struct ReadResult {
    content: String,
    encoding: String,
    warning: Option<String>,
    path: String,
    stamp: FileStamp,
}

#[tauri::command]
async fn read_file(path: String, encoding: Option<String>) -> Result<ReadResult, String> {
    require_absolute(&path)?;
    let metadata = fs::metadata(&path).map_err(io_code)?;
    if !metadata.is_file() {
        return Err(ERR_NOT_FILE.to_string());
    }
    if metadata.len() > MAX_FILE_BYTES {
        return Err(ERR_TOO_LARGE.to_string());
    }
    let bytes = fs::read(&path).map_err(io_code)?;
    let decoded = match encoding {
        Some(name) => decode_as(&bytes, &name)?,
        None => decode_bytes(&bytes)?,
    };
    Ok(ReadResult {
        content: decoded.content,
        encoding: decoded.encoding,
        warning: decoded.warning,
        path: canonical_path(&path),
        stamp: stamp_of(&metadata),
    })
}

#[tauri::command]
async fn write_file(
    path: String,
    content: String,
    encoding: Option<String>,
    expected: Option<FileStamp>,
) -> Result<FileStamp, String> {
    require_absolute(&path)?;
    let target_encoding = encoding.unwrap_or_else(|| "utf-8".to_string());
    let bytes = encode_text(&content, &target_encoding)?;
    // Write through a symlink to the file it points at.
    let target = fs::canonicalize(&path).unwrap_or_else(|_| PathBuf::from(&path));
    if let Some(expected) = expected {
        if let Ok(metadata) = fs::metadata(&target) {
            if stamp_of(&metadata) != expected {
                return Err(ERR_MODIFIED.to_string());
            }
        }
    }
    write_replacing(&target, &bytes).map_err(io_code)?;
    fs::metadata(&target).map(|metadata| stamp_of(&metadata)).map_err(io_code)
}

// Writes the new content to a temporary file next to the target and moves it
// over the target, so a failure part way (a full disk, a lost network drive)
// leaves the original file whole. Falls back to writing in place when the
// folder does not allow creating files.
fn write_replacing(target: &Path, bytes: &[u8]) -> std::io::Result<()> {
    let existing = fs::metadata(target).ok();
    if existing.as_ref().is_some_and(|metadata| metadata.permissions().readonly()) {
        return Err(ErrorKind::PermissionDenied.into());
    }
    let (Some(dir), Some(name)) = (target.parent(), target.file_name()) else {
        return fs::write(target, bytes);
    };
    let Ok((temp, mut file)) = create_temp_file(dir, &name.to_string_lossy(), existing.as_ref()) else {
        // A folder that does not allow creating files: write in place.
        return fs::write(target, bytes);
    };
    let written = (|| -> std::io::Result<()> {
        file.write_all(bytes)?;
        file.sync_all()?;
        drop(file);
        fs::rename(&temp, target)
    })();
    if written.is_err() {
        let _ = fs::remove_file(&temp);
        return fs::write(target, bytes);
    }
    Ok(())
}

// Creates a new, uniquely named file next to the target. create_new fails
// instead of opening a file or symlink that someone placed under the name, so
// the content cannot be redirected elsewhere. On Unix the file gets the
// original's permissions from the start.
fn create_temp_file(
    dir: &Path,
    name: &str,
    existing: Option<&fs::Metadata>,
) -> std::io::Result<(PathBuf, fs::File)> {
    let seed = std::time::SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|duration| duration.as_nanos())
        .unwrap_or_default();
    let mut last_error = None;
    for attempt in 0..16u32 {
        let temp = dir.join(format!(
            ".{name}.plainsheet-{}-{:x}.tmp",
            std::process::id(),
            seed.wrapping_add(u128::from(attempt) * 0x9e37_79b9)
        ));
        let mut options = fs::OpenOptions::new();
        options.write(true).create_new(true);
        #[cfg(unix)]
        {
            use std::os::unix::fs::{OpenOptionsExt, PermissionsExt};
            options.mode(existing.map_or(0o600, |metadata| metadata.permissions().mode() & 0o7777));
        }
        #[cfg(not(unix))]
        let _ = existing;
        match options.open(&temp) {
            Ok(file) => return Ok((temp, file)),
            Err(error) if error.kind() == ErrorKind::AlreadyExists => last_error = Some(error),
            Err(error) => return Err(error),
        }
    }
    Err(last_error.unwrap_or_else(|| ErrorKind::AlreadyExists.into()))
}

#[tauri::command]
async fn save_file_dialog(app: tauri::AppHandle, default_name: String) -> Option<String> {
    app.dialog()
        .file()
        .add_filter("CSV", &["csv"])
        .add_filter("TSV", &["tsv"])
        .add_filter("Markdown", &["md", "markdown"])
        .add_filter("JSON", &["json"])
        .add_filter("YAML", &["yaml", "yml"])
        .set_file_name(default_name)
        .blocking_save_file()
        .map(|path| path.to_string())
}

#[derive(Debug, PartialEq, Eq, serde::Serialize)]
struct DecodedText {
    content: String,
    encoding: String,
    // Something the user should know about how the file was read:
    // `invalid-utf8:N` (N bytes were not UTF-8 and show as U+FFFD),
    // `guessed-latin1`, or `roundtrip` (saving in this encoding changes some
    // bytes, e.g. NEC / IBM duplicate characters in Shift_JIS).
    warning: Option<String>,
}

fn looks_like_latin1_over_cp932(bytes: &[u8], cp932_text: &str) -> bool {
    let has_primary_japanese = cp932_text.chars().any(|ch| {
        matches!(
            ch,
            '\u{3000}'..='\u{303F}' | '\u{3040}'..='\u{309F}' | '\u{30A0}'..='\u{30FF}'
        )
    }) || bytes.iter().any(|&b| (0x81..=0x9f).contains(&b));
    if has_primary_japanese {
        return false;
    }

    bytes.iter().enumerate().any(|(idx, &b)| {
        if !(0xc0..=0xff).contains(&b) {
            return false;
        }
        let prev_ascii_alpha = idx > 0 && bytes[idx - 1].is_ascii_alphabetic();
        let next_ascii_alpha = idx + 1 < bytes.len() && bytes[idx + 1].is_ascii_alphabetic();
        prev_ascii_alpha || next_ascii_alpha
    })
}

// Invalid byte sequences and valid multi-byte characters in UTF-8 text.
fn utf8_profile(bytes: &[u8]) -> (usize, usize) {
    let mut invalid = 0;
    let mut multibyte = 0;
    let mut rest = bytes;
    loop {
        match std::str::from_utf8(rest) {
            Ok(valid) => {
                multibyte += valid.chars().filter(|ch| ch.len_utf8() > 1).count();
                return (invalid, multibyte);
            }
            Err(error) => {
                let (valid, after) = rest.split_at(error.valid_up_to());
                // valid_up_to marks a valid UTF-8 prefix.
                multibyte += std::str::from_utf8(valid)
                    .map(|text| text.chars().filter(|ch| ch.len_utf8() > 1).count())
                    .unwrap_or(0);
                invalid += 1;
                match error.error_len() {
                    Some(len) => rest = &after[len..],
                    None => return (invalid, multibyte),
                }
            }
        }
    }
}

fn reject_unsupported(bytes: &[u8]) -> Result<(), String> {
    // UTF-16 is not a supported save encoding; guessing at it below silently
    // produced mojibake (BOM'd) or invisible NULs (BOM-less), so fail loudly.
    if bytes.starts_with(&[0xff, 0xfe]) || bytes.starts_with(&[0xfe, 0xff]) {
        return Err(ERR_UTF16.to_string());
    }
    // NUL bytes indicate headerless UTF-16 or binary data mislabeled with a
    // table extension; check before both UTF-8 and legacy encodings so non-ASCII
    // UTF-16 files cannot fall through to Shift_JIS/Latin-1 as mojibake.
    if bytes.contains(&0) {
        return Err(ERR_NUL.to_string());
    }
    Ok(())
}

// Saving the decoded text in the same encoding gives different bytes.
fn changes_on_save(bytes: &[u8], content: &str, encoding: &'static Encoding) -> bool {
    let (encoded, _, had_errors) = encoding.encode(content);
    had_errors || encoded.as_ref() != bytes
}

fn decode_bytes(bytes: &[u8]) -> Result<DecodedText, String> {
    reject_unsupported(bytes)?;

    if bytes.starts_with(&[0xef, 0xbb, 0xbf]) {
        let (content, _, had_errors) = UTF_8.decode(&bytes[3..]);
        let warning = had_errors.then(|| format!("invalid-utf8:{}", utf8_profile(&bytes[3..]).0));
        return Ok(DecodedText {
            content: content.into_owned(),
            encoding: "utf-8-bom".to_string(),
            warning,
        });
    }

    if let Ok(content) = std::str::from_utf8(bytes) {
        return Ok(DecodedText {
            content: content.to_string(),
            encoding: "utf-8".to_string(),
            warning: None,
        });
    }

    // Mostly valid UTF-8 with a few broken bytes (a truncated copy, one stray
    // byte) is still UTF-8: reading it as Latin-1 turned every Japanese
    // character into mojibake.
    let (invalid, multibyte) = utf8_profile(bytes);
    if multibyte > 0 && invalid * 4 <= multibyte {
        return Ok(DecodedText {
            content: String::from_utf8_lossy(bytes).into_owned(),
            encoding: "utf-8".to_string(),
            warning: Some(format!("invalid-utf8:{invalid}")),
        });
    }

    let candidates = [
        ("cp932", SHIFT_JIS),
        ("euc-jp", EUC_JP),
        ("latin-1", WINDOWS_1252),
    ];
    let mut best: Option<(&str, &'static Encoding, Cow<'_, str>, usize)> = None;

    for (name, encoding) in candidates {
        let (content, _, had_errors) = encoding.decode(bytes);
        let replacement_count = content.matches(char::REPLACEMENT_CHARACTER).count();
        let score = if had_errors {
            replacement_count + 1000
        } else {
            replacement_count
        };
        match &best {
            Some((best_name, _, best_content, best_score)) if *best_score <= score => {
                if *best_score == score
                    && score == 0
                    && *best_name == "cp932"
                    && name == "latin-1"
                    && looks_like_latin1_over_cp932(bytes, best_content)
                {
                    best = Some((name, encoding, content, score));
                }
            }
            _ => best = Some((name, encoding, content, score)),
        }
    }

    let (name, encoding, content, _) = best.ok_or_else(|| ERR_DECODE.to_string())?;
    let warning = if name == "latin-1" {
        Some("guessed-latin1".to_string())
    } else if changes_on_save(bytes, &content, encoding) {
        Some("roundtrip".to_string())
    } else {
        None
    };
    Ok(DecodedText {
        content: content.into_owned(),
        encoding: name.to_string(),
        warning,
    })
}

// Reads the file in the encoding the user chose ("reopen with encoding").
fn decode_as(bytes: &[u8], name: &str) -> Result<DecodedText, String> {
    reject_unsupported(bytes)?;
    let (encoding, body): (&'static Encoding, &[u8]) = match name {
        "utf-8" | "utf-8-bom" => (
            UTF_8,
            bytes.strip_prefix(&[0xef, 0xbb, 0xbf][..]).unwrap_or(bytes),
        ),
        "cp932" => (SHIFT_JIS, bytes),
        "euc-jp" => (EUC_JP, bytes),
        "latin-1" => (WINDOWS_1252, bytes),
        _ => return Err(ERR_DECODE.to_string()),
    };
    let (content, had_errors) = encoding.decode_without_bom_handling(body);
    let warning = if had_errors {
        Some(format!(
            "invalid-{}:{}",
            if encoding == UTF_8 { "utf8" } else { "bytes" },
            content.matches(char::REPLACEMENT_CHARACTER).count()
        ))
    } else if encoding != UTF_8 && changes_on_save(body, &content, encoding) {
        Some("roundtrip".to_string())
    } else {
        None
    };
    let encoding_name = if encoding == UTF_8 && bytes.starts_with(&[0xef, 0xbb, 0xbf]) {
        "utf-8-bom"
    } else {
        name
    };
    Ok(DecodedText {
        content: content.into_owned(),
        encoding: encoding_name.to_string(),
        warning,
    })
}

fn encode_text(content: &str, encoding: &str) -> Result<Vec<u8>, String> {
    match encoding {
        "utf-8" => Ok(content.as_bytes().to_vec()),
        "utf-8-bom" => {
            let mut bytes = vec![0xef, 0xbb, 0xbf];
            bytes.extend_from_slice(content.as_bytes());
            Ok(bytes)
        }
        "cp932" => encode_with(SHIFT_JIS, content),
        "euc-jp" => encode_with(EUC_JP, content),
        "latin-1" => encode_with(WINDOWS_1252, content),
        _ => Err("unsupported-encoding".to_string()),
    }
}

fn encode_with(encoding: &'static Encoding, content: &str) -> Result<Vec<u8>, String> {
    let (encoded, _, had_errors) = encoding.encode(content);
    if had_errors {
        return Err("cannot-represent".to_string());
    }
    Ok(encoded.into_owned())
}

fn main() {
    let startup_files = files_from_args(
        std::env::args_os().skip(1),
        &std::env::current_dir().unwrap_or_default(),
    );
    let app = tauri::Builder::default()
        // Must be the first plugin. A second launch (double-clicking another
        // file) hands its files to this app and exits, so each file does not
        // start its own window that could save over the same file.
        .plugin(tauri_plugin_single_instance::init(|app, argv, cwd| {
            let files = files_from_args(argv.into_iter().skip(1).map(OsString::from), Path::new(&cwd));
            queue_files(app, files);
            if let Some(window) = app.get_webview_window("main") {
                let _ = window.unminimize();
                let _ = window.set_focus();
            }
        }))
        .plugin(tauri_plugin_dialog::init())
        .manage(PendingOpen(Mutex::new(startup_files)))
        // tauri_plugin_fs is intentionally NOT registered. PlainSheet ships
        // narrow read_file/write_file commands instead of exposing the fs
        // plugin's broad API so the webview cannot reach into arbitrary paths
        // even if a capability is later relaxed.
        .invoke_handler(tauri::generate_handler![
            open_file_dialog,
            read_file,
            write_file,
            save_file_dialog,
            take_pending_files
        ])
        .build(tauri::generate_context!());

    match app {
        Ok(app) => app.run(|_app, _event| {
            // macOS hands over documents (Finder "Open With", a double-clicked
            // associated file) as an event instead of a command-line argument,
            // both at launch and while the app is already running.
            #[cfg(any(target_os = "macos", target_os = "ios"))]
            if let tauri::RunEvent::Opened { urls } = &_event {
                let files = urls
                    .iter()
                    .filter_map(|url| url.to_file_path().ok())
                    .filter(|path| path.is_file())
                    .filter_map(|path| path.to_str().map(str::to_owned))
                    .collect();
                queue_files(_app, files);
            }
        }),
        Err(error) => eprintln!("failed to run PlainSheet: {error}"),
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn files_from_args_keeps_every_existing_file() {
        let dir = std::env::temp_dir().join(format!("plainsheet-args-{}", std::process::id()));
        fs::create_dir_all(dir.join("sub")).unwrap();
        let file = dir.join("data.csv");
        let other = dir.join("other.csv");
        fs::write(&file, "a,b\n").unwrap();
        fs::write(&other, "c\n").unwrap();
        let args = |list: &[&str]| list.iter().map(OsString::from).collect::<Vec<_>>();
        let one = vec![file.to_str().unwrap().to_owned()];

        // absolute path
        assert_eq!(
            files_from_args(vec![file.clone().into_os_string()], Path::new("")),
            one
        );
        // relative name, resolved against the start directory
        assert_eq!(files_from_args(args(&["data.csv"]), &dir), one);
        // flags and names that are not files are passed over; every file is kept
        assert_eq!(
            files_from_args(
                args(&["--flag", "-psn_0_1", "missing.csv", "sub", "data.csv", "other.csv"]),
                &dir
            ),
            vec![
                file.to_str().unwrap().to_owned(),
                other.to_str().unwrap().to_owned()
            ]
        );
        // nothing usable: no arguments, a directory, a missing file, no start directory
        assert!(files_from_args(args(&[]), &dir).is_empty());
        assert!(files_from_args(args(&["sub", "missing.csv"]), &dir).is_empty());
        assert!(files_from_args(args(&["data.csv"]), Path::new("")).is_empty());

        fs::remove_dir_all(&dir).unwrap();
    }

    #[test]
    fn rejects_nul_bytes_in_utf8_and_non_utf8() {
        assert_eq!(decode_bytes(b"a\0b\0"), Err(ERR_NUL.to_string()));
        // Headerless UTF-16LE containing non-ASCII ('é' = 0xE9 0x00)
        assert_eq!(decode_bytes(&[0x61, 0x00, 0xe9, 0x00]), Err(ERR_NUL.to_string()));
        // UTF-8 BOM followed by NUL byte
        assert_eq!(
            decode_bytes(&[0xef, 0xbb, 0xbf, b'a', 0x00]),
            Err(ERR_NUL.to_string())
        );
    }

    #[test]
    fn rejects_utf16_bom() {
        assert_eq!(decode_bytes(&[0xff, 0xfe, b'a', 0x00]), Err(ERR_UTF16.to_string()));
        assert_eq!(decode_bytes(&[0xfe, 0xff, 0x00, b'a']), Err(ERR_UTF16.to_string()));
    }

    #[test]
    fn decodes_shift_jis_japanese_as_cp932() {
        let (encoded, _, _) = SHIFT_JIS.encode("東京,大阪\n10,20\n");
        let decoded = decode_bytes(&encoded).expect("should decode Shift_JIS");
        assert_eq!(decoded.encoding, "cp932");
        assert_eq!(decoded.content, "東京,大阪\n10,20\n");
        assert_eq!(decoded.warning, None);
    }

    #[test]
    fn decodes_latin1_accented_words_as_latin1() {
        // "Résumés,München\n10,20\n" in Windows-1252 / Latin-1:
        // Without the heuristic, 0xE9+'s' and 0xFC+'n' are valid Shift_JIS 2-byte Kanji.
        let (encoded, _, _) = WINDOWS_1252.encode("Résumés,München\n10,20\n");
        let decoded = decode_bytes(&encoded).expect("should decode Latin-1");
        assert_eq!(decoded.encoding, "latin-1");
        assert_eq!(decoded.content, "Résumés,München\n10,20\n");
        assert_eq!(decoded.warning.as_deref(), Some("guessed-latin1"));
    }

    #[test]
    fn reads_utf8_with_a_stray_byte_as_utf8() {
        let mut bytes = "名前,都市\n山田,東京\n".as_bytes().to_vec();
        bytes.insert(6, 0xff);
        let decoded = decode_bytes(&bytes).expect("should decode");
        assert_eq!(decoded.encoding, "utf-8");
        assert_eq!(decoded.warning.as_deref(), Some("invalid-utf8:1"));
        assert!(decoded.content.contains("山田,東京"));
    }

    #[test]
    fn warns_when_shift_jis_bytes_change_on_save() {
        // NEC-selected IBM extension "纊" (ED 40) is written back as the IBM
        // code FA 5C.
        let decoded = decode_bytes(&[0xed, 0x40, b',', b'a', b'\n']).expect("should decode");
        assert_eq!(decoded.encoding, "cp932");
        assert_eq!(decoded.warning.as_deref(), Some("roundtrip"));
    }

    #[test]
    fn decodes_in_the_chosen_encoding() {
        let (encoded, _, _) = SHIFT_JIS.encode("東京\n");
        let decoded = decode_as(&encoded, "cp932").expect("should decode");
        assert_eq!(decoded.content, "東京\n");
        assert_eq!(decoded.encoding, "cp932");
        let as_utf8 = decode_as(&encoded, "utf-8").expect("should decode");
        assert!(as_utf8.warning.unwrap().starts_with("invalid-utf8:"));
    }

    #[test]
    fn writes_through_a_temporary_file_and_reports_outside_changes() {
        let dir = std::env::temp_dir().join(format!("plainsheet-write-{}", std::process::id()));
        fs::create_dir_all(&dir).unwrap();
        let file = dir.join("data.csv");
        fs::write(&file, "old\n").unwrap();
        let stamp = stamp_of(&fs::metadata(&file).unwrap());

        write_replacing(&file, b"newer\n").unwrap();
        assert_eq!(fs::read(&file).unwrap(), b"newer\n");
        // no temporary file is left behind
        assert_eq!(fs::read_dir(&dir).unwrap().count(), 1);
        // the stamp taken before the write no longer matches (the size differs;
        // file times can stay equal within the clock's resolution)
        assert_ne!(stamp_of(&fs::metadata(&file).unwrap()), stamp);

        fs::remove_dir_all(&dir).unwrap();
    }
}
