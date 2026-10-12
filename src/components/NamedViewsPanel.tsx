import { useMemo, useState } from "react";
import type { FilterMap } from "../hooks/useFilter";
import { applyFilters } from "../hooks/useFilter";
import type { ColumnWidthMap } from "../types/sheet";
import { getLocale, type Locale } from "../lib/i18n";
import {
  compareColumnSignatures, createColumnSignature, missingFilterValues, namedViewStore,
  NamedViewsError, snapshotFilters, viewMatchesCurrent,
  type NamedView, type NamedViewApplication, type NamedViewGroup, type NamedViewStore, type SchemaCheck,
} from "../lib/namedViews";
import { FeatureDialog } from "./FeatureDialog";

export type NamedViewsPanelProps = {
  documentId: string;
  fileName?: string;
  rows: string[][];
  filters: FilterMap;
  colWidths: ColumnWidthMap;
  onApply: (view: NamedViewApplication) => void;
  onClose: () => void;
  activeViewId?: string | null;
  visibleCount?: number;
  headerRow?: boolean;
  locale?: Locale;
  store?: NamedViewStore;
};

/** The key prevents pending rename/import confirmations crossing a document switch. */
export function NamedViewsPanel(props: NamedViewsPanelProps) {
  return <NamedViewsDocument key={props.documentId} {...props} />;
}

function NamedViewsDocument({ documentId, fileName = "Untitled", rows, filters, colWidths, onApply, onClose, activeViewId, visibleCount, headerRow = true, locale = getLocale(), store = namedViewStore }: NamedViewsPanelProps) {
  const ja = locale === "ja";
  const label = (en: string, jp: string) => ja ? jp : en;
  const [document, setDocument] = useState(() => store.document(documentId, fileName));
  const [savedGroups, setSavedGroups] = useState<NamedViewGroup[]>([]);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [name, setName] = useState("");
  const [renameId, setRenameId] = useState<string | null>(null);
  const [renameName, setRenameName] = useState("");
  const [localActiveId, setLocalActiveId] = useState<string | null>(null);
  const [selectedGroup, setSelectedGroup] = useState("");
  const [showStored, setShowStored] = useState(false);
  const [importConfirmationRows, setImportConfirmationRows] = useState<string[][] | null>(null);
  const [positionConfirmationRows, setPositionConfirmationRows] = useState<string[][] | null>(null);
  const confirmImport = importConfirmationRows === rows;
  const confirmedPositions = positionConfirmationRows === rows;
  const setConfirmImport = (confirmed: boolean) => setImportConfirmationRows(confirmed ? rows : null);
  const setConfirmedPositions = (confirmed: boolean) => setPositionConfirmationRows(confirmed ? rows : null);
  const [confirmDelete, setConfirmDelete] = useState<"session" | "stored" | null>(null);
  const signature = useMemo(() => createColumnSignature(rows, headerRow), [rows, headerRow]);
  const currentId = activeViewId === undefined ? localActiveId : activeViewId;
  const active = document.views.find((view) => view.id === currentId);
  const modified = active && (!viewMatchesCurrent(active, filters, colWidths) || !compareColumnSignatures(active.signature, signature).safe);
  const total = Math.max(0, rows.length - (headerRow && rows.length ? 1 : 0));
  const count = visibleCount ?? Math.max(0, applyFilters(rows, filters, headerRow).length - (headerRow && rows.length ? 1 : 0));
  const source = savedGroups.find((group) => group.id === selectedGroup);
  const checks = source?.views.map((view) => compareColumnSignatures(view.signature, signature)) ?? [];
  const importSafe = Boolean(source?.views.length && checks.every((check) => check.safe));
  const missing = missingFilterValues({ filters: snapshotFilters(filters) }, rows, headerRow);

  const errorText = (error: unknown) => {
    if (!(error instanceof NamedViewsError)) return label("The view operation failed. Nothing was applied.", "表示設定の操作に失敗しました。適用していません。");
    const messages = {
      invalid: label("Saved view data is invalid or uses an unsupported version. Delete stored views to reset it.", "保存データが不正または未対応の版です。端末の保存済み表示を全削除してリセットできます。"),
      storage: label("Device storage is unavailable or full. No storage change was confirmed; session views remain available.", "端末の保存領域を利用できないか、容量が不足しています。保存変更は確認できません。セッション内の表示は利用できます。"),
      limit: label("Views exceed the 256 KiB storage limit or the 100-view/group limit. Delete unneeded views or shorten conditions.", "256 KiBまたは100件の上限を超えました。不要な表示を削除するか条件を減らしてください。"),
      name: label("Use a unique view name of 1–80 characters.", "1〜80文字で、重複しない表示名を入力してください。"),
      schema: label("Columns do not safely match. Recreate this view for the current columns.", "列を安全に対応付けできません。現在の列で表示を作り直してください。"),
      missing: label("This saved view no longer exists. Reload the saved-document list.", "保存済み表示が見つかりません。保存文書の一覧を読み直してください。"),
    };
    return messages[error.code];
  };
  const run = (operation: () => void) => {
    setError(""); setNotice("");
    try {
      operation();
      setDocument(store.document(documentId, fileName));
      if (showStored) setSavedGroups(store.savedGroups());
    } catch (error) { setError(errorText(error)); }
  };
  const select = (view: NamedViewApplication) => { setLocalActiveId(view.id); onApply(view); };
  const currentApplication = (id: string | null, name: string | null): NamedViewApplication => ({ id, name, filters: snapshotFilters(filters), colWidths: { ...colWidths } });
  const reasonText = (check: SchemaCheck) => {
    if (check.reason === "count") return label("Column count changed. Recreate this view.", "列数が変わりました。表示を作り直してください。");
    if (check.reason === "header-mode") return label("Header interpretation changed. Recreate this view.", "見出しの扱いが変わりました。表示を作り直してください。");
    if (check.reason === "duplicates") return label("Duplicate or blank headers cannot be matched safely. Give columns unique names, then recreate the view.", "重複または空の見出しは安全に対応付けできません。列名を一意にして表示を作り直してください。");
    if (check.reason === "headers") return label("Column names or order changed. Recreate this view.", "列名または列順が変わりました。表示を作り直してください。");
    return check.positional ? label("No headers: verify each column position before applying.", "見出しなし: 適用前に列の位置を確認してください。") : label("Column names and order match.", "列名と列順が一致しています。");
  };
  const conditions = (view: Pick<NamedView, "filters">) => view.filters.length ? view.filters.map(([col, values]) => `${label("Column", "列")} ${col + 1}: ${values.length ? values.map((value) => value === "" ? label("(blank)", "(空白)") : value).join(", ") : label("no values (zero matching rows)", "値なし（一致行なし）")}`).join(" · ") : label("All rows", "全行表示");
  const missingText = (entries: ReturnType<typeof missingFilterValues>) => entries.map(([col, values]) => `${label("Column", "列")} ${col + 1}: ${values.map((value) => value || label("(blank)", "(空白)")).join(", ")}`).join(" · ");

  return <FeatureDialog title={label("Named filter views", "名前付きフィルタ表示")} onClose={onClose}>
    <p>{fileName}</p>
    <p role="status">{label("Current view", "現在の表示")}: {active?.name ?? label("Custom / all rows", "カスタム／全行表示")}{modified ? label(" (modified)", "（変更あり）") : ""} · {count} / {total} {label("rows shown", "行を表示")}</p>
    <p style={{ overflowWrap: "anywhere" }}>{conditions({ filters: snapshotFilters(filters) })}</p>
    {missing.length > 0 && <p role="status">{label("Filter values no longer in this table", "現在の表に存在しない条件値")}: {missingText(missing)}. {label("They are kept in the view and may hide all rows.", "条件は保持されるため、表示行が0になる場合があります。")}</p>}
    <p>{label("Views contain filters and column widths only. They never change cell values, sorting, header interpretation, or CSV contents. By default they last only for this session.", "表示はフィルタと列幅だけを保存します。セル値・行順・見出しの扱い・CSV内容は変更しません。初期設定ではこのセッション内だけで保持します。")}</p>
    <button type="button" onClick={() => select({ id: null, name: null, filters: [], colWidths: { ...colWidths } })}>{label("Show all rows / leave view", "全行表示に戻る")}</button>
    <div className="settingsGrid">
      <label>{label("New view name", "新しい表示名")}<input value={name} maxLength={80} onChange={(event) => setName(event.target.value)} /></label>
      <button type="button" disabled={!name.trim()} onClick={() => run(() => {
        const view = store.save(documentId, name, filters, colWidths, signature);
        select(currentApplication(view.id, view.name)); setName("");
      })}>{label("Save current as new view", "現在の表示を新規保存")}</button>
      <label><input type="checkbox" checked={document.persistent} onChange={(event) => run(() => store.setPersistent(documentId, event.target.checked))} />{label("Keep this document's views on this device", "この文書の表示を端末に保存")}</label>
    </div>
    <p>{label("Optional storage: this app's localStorage, up to 256 KiB total. Filter values and header names may reveal table content. Nothing is attached to the CSV or synced. Unchecking removes this document's stored copy and keeps session views.", "任意の保存先: このアプリのlocalStorage、全体で最大256 KiB。条件値や見出しには表の内容が含まれます。CSVへの添付・同期はしません。チェックを外すと端末の保存分を削除し、セッション内だけで保持します。")}</p>
    {!headerRow && <label><input type="checkbox" checked={confirmedPositions} onChange={(event) => setConfirmedPositions(event.target.checked)} />{label("I verified that column positions still correspond to the saved conditions", "列の位置が保存した条件に対応することを確認しました")}</label>}
    <ul style={{ maxHeight: 260, overflow: "auto", paddingInlineStart: 20 }} aria-label={label("Views in this document", "この文書の表示")}>
      {document.views.map((view) => {
        const check = compareColumnSignatures(view.signature, signature);
        const absent = missingFilterValues(view, rows, headerRow);
        return <li key={view.id}>
          <strong>{view.name}</strong>
          <p style={{ overflowWrap: "anywhere" }}>{conditions(view)}</p>
          <p>{reasonText(check)}</p>
          {absent.length > 0 && <p>{label("Missing values", "存在しない条件値")}: {missingText(absent)}</p>}
          <button type="button" disabled={!check.safe || (check.positional && !confirmedPositions)} onClick={() => run(() => select(store.application(documentId, view.id, signature, confirmedPositions)))} aria-label={`${label("Apply", "適用")} ${view.name}`}>{label("Apply", "適用")}</button>
          <button type="button" onClick={() => { setRenameId(view.id); setRenameName(view.name); }} aria-label={`${label("Rename", "改名")} ${view.name}`}>{label("Rename", "改名")}</button>
          <button type="button" onClick={() => run(() => { store.duplicate(documentId, view.id); })} aria-label={`${label("Duplicate", "複製")} ${view.name}`}>{label("Duplicate", "複製")}</button>
          <button type="button" onClick={() => run(() => { store.remove(documentId, view.id); if (currentId === view.id) select(currentApplication(null, null)); })} aria-label={`${label("Delete", "削除")} ${view.name}`}>{label("Delete", "削除")}</button>
          {renameId === view.id && <div>
            <label>{label("Rename to", "新しい名前")}<input value={renameName} maxLength={80} onChange={(event) => setRenameName(event.target.value)} /></label>
            <button type="button" onClick={() => run(() => { const renamed = store.rename(documentId, view.id, renameName); if (currentId === view.id) select(currentApplication(renamed.id, renamed.name)); setRenameId(null); })}>{label("Save name", "名前を保存")}</button>
            <button type="button" onClick={() => setRenameId(null)}>{label("Cancel rename", "改名をキャンセル")}</button>
          </div>}
        </li>;
      })}
    </ul>
    {!document.views.length && <p>{label("No named views yet.", "名前付き表示はまだありません。")}</p>}
    <button type="button" disabled={!document.views.length} onClick={() => setConfirmDelete("session")}>{label("Delete all views for this document", "この文書の表示を全削除")}</button>
    <button type="button" onClick={() => run(() => { setSavedGroups(store.savedGroups()); setShowStored(true); setSelectedGroup(""); setConfirmImport(false); })}>{label("Choose a previously saved document", "以前に保存した文書を選ぶ")}</button>
    <button type="button" onClick={() => setConfirmDelete("stored")}>{label("Delete all device-stored views", "端末の保存済み表示を全削除")}</button>
    {confirmDelete && <div role="group" aria-label={label("Confirm deletion", "削除の確認")}>
      <p>{confirmDelete === "stored" ? label("Delete all device-stored views? Session views remain. This cannot be undone.", "端末の保存済み表示をすべて削除しますか？セッション内の表示は残ります。元に戻せません。") : label("Delete all named views for this document? Current filters and data stay as they are.", "この文書の名前付き表示を全削除しますか？現在の条件とデータはそのままです。")}</p>
      <button type="button" onClick={() => run(() => { if (confirmDelete === "stored") store.deleteAllSaved(); else { store.removeAll(documentId); select(currentApplication(null, null)); } setConfirmDelete(null); setSelectedGroup(""); setConfirmImport(false); })}>{label("Confirm delete all", "全削除を確定")}</button>
      <button type="button" onClick={() => setConfirmDelete(null)}>{label("Cancel deletion", "削除をキャンセル")}</button>
    </div>}
    {showStored && <section aria-label={label("Saved document preview", "保存文書の確認")}>
      <p>{label("Reopened files receive a new session identity. A matching filename never applies a view. Choose the original group, inspect its columns, then explicitly import; importing alone does not apply filters.", "開き直した文書は新しいセッションIDになります。同名ファイルにも自動適用しません。元のグループを選び、列を確認して取り込んでください。取込だけでは条件を適用しません。")}</p>
      <label>{label("Saved document group", "保存文書のグループ")}<select value={selectedGroup} onChange={(event) => { setSelectedGroup(event.target.value); setConfirmImport(false); }}>
        <option value="">{label("Choose explicitly…", "選択してください…")}</option>
        {savedGroups.map((group) => <option key={group.id} value={group.id}>{group.fileName} · {group.id.slice(0, 8)} · {group.views.length} {label("views", "件")}</option>)}
      </select></label>
      {source && <>
        <p>{label("Current columns", "現在の列")}: {signature.count} · {headerRow ? signature.headers.map((value, col) => `${col + 1}: ${value}`).join(" · ") : label("No header; positional mapping", "見出しなし・列位置で対応")}</p>
        <ul>{source.views.map((view) => <li key={view.id}>{view.name}: {view.signature.count} {label("columns", "列")} · {view.signature.headers.map((value, col) => `${col + 1}: ${value}`).join(" · ")} · {reasonText(compareColumnSignatures(view.signature, signature))}</li>)}</ul>
        <label><input type="checkbox" checked={confirmImport} disabled={!importSafe} onChange={(event) => setConfirmImport(event.target.checked)} />{label("This is the intended document and I verified every column's meaning and position", "対象の文書と、すべての列の意味・位置を確認しました")}</label>
        <button type="button" disabled={!importSafe || !confirmImport} onClick={() => run(() => { store.importSaved(documentId, source.id, signature, confirmImport); setConfirmImport(false); setSelectedGroup(""); setNotice(label("Views imported into this session. Choose Apply to use one.", "このセッションへ表示を取り込みました。適用する表示を選んでください。")); })}>{label("Import reviewed views", "確認した表示を取り込む")}</button>
        <button type="button" onClick={() => run(() => { store.deleteSavedGroup(source.id); setSelectedGroup(""); setConfirmImport(false); })}>{label("Delete this stored document group", "この保存文書グループを削除")}</button>
      </>}
    </section>}
    {error && <p role="alert">{error}</p>}
    {notice && <p role="status">{notice}</p>}
    <div className="modalActions"><button type="button" onClick={onClose}>{label("Close", "閉じる")}</button></div>
  </FeatureDialog>;
}
