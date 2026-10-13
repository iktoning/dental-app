import { useEffect } from "react";

type Props = {
  type: "success" | "error" | "info";
  message: string;
  onClose: () => void;
  duration?: number;
};

export default function Toast({
  type,
  message,
  onClose,
  duration = 3500,
}: Props) {
  useEffect(() => {
    const t = setTimeout(onClose, duration);
    return () => clearTimeout(t);
  }, [duration, onClose]);

  const styles = {
    success: {
      bg: "bg-green-50",
      border: "border-green-200",
      text: "text-green-800",
      icon: "✅",
    },
    error: {
      bg: "bg-red-50",
      border: "border-red-200",
      text: "text-red-800",
      icon: "❌",
    },
    info: {
      bg: "bg-blue-50",
      border: "border-blue-200",
      text: "text-blue-800",
      icon: "ℹ️",
    },
  }[type];

  return (
    <div className="fixed top-4 right-4 z-[70] animate-in slide-in-from-top">
      <div
        className={`${styles.bg} ${styles.border} ${styles.text} border rounded-lg shadow-lg px-4 py-3 flex items-start gap-3 max-w-sm`}
      >
        <span className="text-lg">{styles.icon}</span>
        <p className="flex-1 text-sm font-medium">{message}</p>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 text-sm"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
