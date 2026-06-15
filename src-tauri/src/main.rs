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

#[derive(serde::Serialize)]
struct DecodedText {
    content: String,
    encoding: String,
}

fn decode_bytes(bytes: &[u8]) -> Result<DecodedText, String> {
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
            Some((_, _, best_score)) if *best_score <= score => {}
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
        .plugin(tauri_plugin_fs::init())
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
