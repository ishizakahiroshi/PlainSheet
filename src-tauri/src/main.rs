use encoding_rs::{Encoding, EUC_JP, SHIFT_JIS, UTF_8, WINDOWS_1252};
use std::borrow::Cow;
use std::fs;
use tauri_plugin_dialog::DialogExt;

#[tauri::command]
async fn open_file_dialog(app: tauri::AppHandle) -> Option<String> {
    app.dialog()
        .file()
        .add_filter(
            "Table files",
            &["csv", "tsv", "md", "markdown", "json", "yaml", "yml"],
        )
        .add_filter("CSV", &["csv"])
        .add_filter("TSV", &["tsv"])
        .blocking_pick_file()
        .map(|path| path.to_string())
}

const MAX_FILE_BYTES: u64 = 50 * 1024 * 1024;

// Defense in depth: these commands only ever receive absolute paths returned by
// the native file dialog or drop events, so reject anything else.
fn require_absolute(path: &str) -> Result<(), String> {
    if std::path::Path::new(path).is_absolute() {
        Ok(())
    } else {
        Err(format!("refusing non-absolute path: {path}"))
    }
}

#[tauri::command]
async fn read_file(path: String) -> Result<DecodedText, String> {
    require_absolute(&path)?;
    let metadata =
        fs::metadata(&path).map_err(|error| format!("failed to inspect {path}: {error}"))?;
    if !metadata.is_file() {
        return Err(format!("refusing non-regular file: {path}"));
    }
    if metadata.len() > MAX_FILE_BYTES {
        return Err(format!(
            "file exceeds maximum supported size ({} MB): {path}",
            MAX_FILE_BYTES / (1024 * 1024)
        ));
    }
    let bytes = fs::read(&path).map_err(|error| format!("failed to read {path}: {error}"))?;
    decode_bytes(&bytes)
}

#[tauri::command]
async fn write_file(path: String, content: String, encoding: Option<String>) -> Result<(), String> {
    require_absolute(&path)?;
    let target_encoding = encoding.unwrap_or_else(|| "utf-8".to_string());
    let bytes = encode_text(&content, &target_encoding)?;
    fs::write(&path, bytes).map_err(|error| format!("failed to write {path}: {error}"))
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

fn decode_bytes(bytes: &[u8]) -> Result<DecodedText, String> {
    // UTF-16 is not a supported save encoding; guessing at it below silently
    // produced mojibake (BOM'd) or invisible NULs (BOM-less), so fail loudly.
    if bytes.starts_with(&[0xff, 0xfe]) || bytes.starts_with(&[0xfe, 0xff]) {
        return Err("UTF-16 files are not supported".to_string());
    }

    // NUL bytes indicate headerless UTF-16 or binary data mislabeled with a
    // table extension; check before both UTF-8 and legacy encodings so non-ASCII
    // UTF-16 files cannot fall through to Shift_JIS/Latin-1 as mojibake.
    if bytes.contains(&0) {
        return Err("file contains NUL bytes".to_string());
    }

    if bytes.starts_with(&[0xef, 0xbb, 0xbf]) {
        let (content, _, had_errors) = UTF_8.decode(&bytes[3..]);
        if had_errors {
            return Err("invalid UTF-8 BOM file".to_string());
        }
        return Ok(DecodedText {
            content: content.into_owned(),
            encoding: "utf-8-bom".to_string(),
        });
    }

    if let Ok(content) = std::str::from_utf8(bytes) {
        return Ok(DecodedText {
            content: content.to_string(),
            encoding: "utf-8".to_string(),
        });
    }

    let candidates = [
        ("cp932", SHIFT_JIS),
        ("euc-jp", EUC_JP),
        ("latin-1", WINDOWS_1252),
    ];
    let mut best: Option<(String, Cow<'_, str>, usize)> = None;

    for (name, encoding) in candidates {
        let (content, _, had_errors) = encoding.decode(bytes);
        let replacement_count = content.matches(char::REPLACEMENT_CHARACTER).count();
        let score = if had_errors {
            replacement_count + 1000
        } else {
            replacement_count
        };
        match &best {
            Some((best_name, best_content, best_score)) if *best_score <= score => {
                if *best_score == score
                    && score == 0
                    && best_name == "cp932"
                    && name == "latin-1"
                    && looks_like_latin1_over_cp932(bytes, best_content)
                {
                    best = Some((name.to_string(), content, score));
                }
            }
            _ => best = Some((name.to_string(), content, score)),
        }
    }

    best.map(|(encoding, content, _)| DecodedText {
        content: content.into_owned(),
        encoding,
    })
    .ok_or_else(|| "could not decode file".to_string())
}

fn encode_text(content: &str, encoding: &str) -> Result<Vec<u8>, String> {
    match encoding {
        "utf-8" => Ok(content.as_bytes().to_vec()),
        "utf-8-bom" => {
            let mut bytes = vec![0xef, 0xbb, 0xbf];
            bytes.extend_from_slice(content.as_bytes());
            Ok(bytes)
        }
        "cp932" => encode_with(SHIFT_JIS, content, "Shift_JIS"),
        "euc-jp" => encode_with(EUC_JP, content, "EUC-JP"),
        "latin-1" => encode_with(WINDOWS_1252, content, "Latin-1"),
        other => Err(format!("unsupported encoding: {other}")),
    }
}

fn encode_with(encoding: &'static Encoding, content: &str, label: &str) -> Result<Vec<u8>, String> {
    let (encoded, _, had_errors) = encoding.encode(content);
    if had_errors {
        return Err(format!(
            "{label} cannot represent some characters in this file"
        ));
    }
    Ok(encoded.into_owned())
}

fn main() {
    let app = tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        // tauri_plugin_fs is intentionally NOT registered. PlainSheet ships
        // narrow read_file/write_file commands instead of exposing the fs
        // plugin's broad API so the webview cannot reach into arbitrary paths
        // even if a capability is later relaxed.
        .invoke_handler(tauri::generate_handler![
            open_file_dialog,
            read_file,
            write_file,
            save_file_dialog
        ])
        .run(tauri::generate_context!());

    if let Err(error) = app {
        eprintln!("failed to run PlainSheet: {error}");
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn rejects_nul_bytes_in_utf8_and_non_utf8() {
        assert_eq!(
            decode_bytes(b"a\0b\0"),
            Err("file contains NUL bytes".to_string())
        );
        // Headerless UTF-16LE containing non-ASCII ('é' = 0xE9 0x00)
        assert_eq!(
            decode_bytes(&[0x61, 0x00, 0xe9, 0x00]),
            Err("file contains NUL bytes".to_string())
        );
        // UTF-8 BOM followed by NUL byte
        assert_eq!(
            decode_bytes(&[0xef, 0xbb, 0xbf, b'a', 0x00]),
            Err("file contains NUL bytes".to_string())
        );
    }

    #[test]
    fn rejects_utf16_bom() {
        assert_eq!(
            decode_bytes(&[0xff, 0xfe, b'a', 0x00]),
            Err("UTF-16 files are not supported".to_string())
        );
        assert_eq!(
            decode_bytes(&[0xfe, 0xff, 0x00, b'a']),
            Err("UTF-16 files are not supported".to_string())
        );
    }

    #[test]
    fn decodes_shift_jis_japanese_as_cp932() {
        let (encoded, _, _) = SHIFT_JIS.encode("東京,大阪\n10,20\n");
        let decoded = decode_bytes(&encoded).expect("should decode Shift_JIS");
        assert_eq!(decoded.encoding, "cp932");
        assert_eq!(decoded.content, "東京,大阪\n10,20\n");
    }

    #[test]
    fn decodes_latin1_accented_words_as_latin1() {
        // "Résumés,München\n10,20\n" in Windows-1252 / Latin-1:
        // Without the heuristic, 0xE9+'s' and 0xFC+'n' are valid Shift_JIS 2-byte Kanji.
        let (encoded, _, _) = WINDOWS_1252.encode("Résumés,München\n10,20\n");
        let decoded = decode_bytes(&encoded).expect("should decode Latin-1");
        assert_eq!(decoded.encoding, "latin-1");
        assert_eq!(decoded.content, "Résumés,München\n10,20\n");
    }
}
