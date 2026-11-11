# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 0.1.x   | :white_check_mark: |

## Security Model

PlainSheet is a local-first plain text spreadsheet editor:

- All file parsing and editing happen locally on your device.
- No table data or telemetry is uploaded to external servers.
- In the desktop app (Tauri), file system access is restricted to explicit user file dialogs and drag-and-drop paths.

## Reporting a Vulnerability

If you discover a security vulnerability in PlainSheet, please report it privately through [GitHub Private Vulnerability Reporting](https://github.com/ishizakahiroshi/PlainSheet/security/advisories/new) rather than opening a public issue.

Please include:

1. A description of the issue and its potential impact.
2. Steps or a minimal sample file to reproduce the issue.
3. Affected platform (Windows / macOS / Linux desktop or Web build) and version.
