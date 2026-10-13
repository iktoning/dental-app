type Props = {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "primary" | "danger";
  onConfirm: () => void;
  onCancel: () => void;
};

export default function ConfirmDialog({
  title,
  message,
  confirmLabel = "Ya, Lanjutkan",
  cancelLabel = "Batal",
  variant = "primary",
  onConfirm,
  onCancel,
}: Props) {
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-60">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden">
        <div className="p-6">
          <div className="text-center mb-4">
            <div
              className={`inline-flex items-center justify-center w-14 h-14 rounded-full mb-3 ${
                variant === "danger" ? "bg-red-100" : "bg-primary-100"
              }`}
            >
              <span className="text-3xl">
                {variant === "danger" ? "⚠️" : "❓"}
              </span>
            </div>
            <h3 className="text-lg font-bold">{title}</h3>
            <p className="text-sm text-gray-600 mt-2">{message}</p>
          </div>

          <div className="flex gap-2 mt-6">
            <button onClick={onCancel} className="btn-secondary flex-1">
              {cancelLabel}
            </button>
            <button
              onClick={onConfirm}
              className={`flex-1 rounded-lg px-4 py-2 font-medium transition-colors text-white ${
                variant === "danger"
                  ? "bg-red-600 hover:bg-red-700"
                  : "bg-primary-600 hover:bg-primary-700"
              }`}
            >
              {confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
