import { t } from "../lib/i18n";

type ConfirmDialogProps = {
  open: boolean;
  title?: string;
  message?: string;
  onConfirm: () => void;
  onCancel: () => void;
};

export function ConfirmDialog({ open, title, message, onConfirm, onCancel }: ConfirmDialogProps) {
  if (!open) {
    return null;
  }

  return (
    <div className="modalBackdrop" role="presentation">
      <section className="modal" role="dialog" aria-modal="true" aria-labelledby="confirm-title">
        <h2 id="confirm-title">{title ?? t("confirmDeleteTitle")}</h2>
        <p>{message ?? t("confirmDeleteMessage")}</p>
        <div className="modal__actions">
          <button type="button" aria-label={t("cancel")} onClick={onCancel}>
            {t("cancel")}
          </button>
          <button className="dangerButton" type="button" aria-label={t("deleteAction")} onClick={onConfirm}>
            {t("deleteAction")}
          </button>
        </div>
      </section>
    </div>
  );
}
