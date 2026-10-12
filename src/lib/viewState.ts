export type DocumentView = {
  filters: [number, string[]][];
  useHeaderRow: boolean;
  freezeColumns: number;
  freezeRows: number;
  formulaEnabled: boolean;
};
export function createDocumentView(): DocumentView {
  return {
    filters: [],
    useHeaderRow: true,
    freezeColumns: 0,
    freezeRows: 0,
    formulaEnabled: false,
  };
}
