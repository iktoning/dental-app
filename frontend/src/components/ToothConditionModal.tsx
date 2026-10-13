import { useState } from "react";
import { api } from "../lib/api";
import { CONDITION_COLORS } from "./Odontogram";

const SURFACES = [
  { value: "", label: "Keseluruhan Gigi" },
  { value: "occlusal", label: "Occlusal (permukaan gigit)" },
  { value: "mesial", label: "Mesial (sisi dalam)" },
  { value: "distal", label: "Distal (sisi luar)" },
  { value: "buccal", label: "Buccal (sisi pipi)" },
  { value: "lingual", label: "Lingual (sisi lidah)" },
];

type Props = {
  patientId: string;
  toothNumber: string;
  onClose: () => void;
  onSuccess: () => void;
  onViewHistory?: (toothNumber: string) => void;
};

export default function ToothConditionModal({
  patientId,
  toothNumber,
  onClose,
  onSuccess,
  onViewHistory,
}: Props) {
  const [condition, setCondition] = useState("caries");
  const [surface, setSurface] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await api.post("/odontogram", {
        patient_id: patientId,
        tooth_number: toothNumber,
        condition,
        surface: surface || undefined,
        notes: notes.trim() || undefined,
      });
      onSuccess();
    } catch (err: any) {
      const data = err.response?.data;
      if (data?.errors && Array.isArray(data.errors)) {
        setError(
          data.errors.map((e: any) => `${e.field}: ${e.message}`).join(", "),
        );
      } else {
        setError(data?.message || "Gagal menyimpan");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-auto p-6">
        {/* Header */}
        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 className="text-xl font-bold mb-1">Catat Kondisi Gigi</h2>
            <p className="text-sm text-gray-500">
              Gigi nomor{" "}
              <span className="font-mono font-bold text-primary-600">
                {toothNumber}
              </span>
            </p>
          </div>
          {onViewHistory && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onViewHistory(toothNumber);
              }}
              className="text-xs text-primary-600 hover:underline whitespace-nowrap"
            >
              📜 Riwayat
            </button>
          )}
        </div>

        {error && (
          <div className="mb-3 p-3 bg-red-50 border border-red-200 text-red-700 rounded text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Pilihan Kondisi */}
          <div>
            <label className="label">Kondisi *</label>
            <div className="grid grid-cols-3 gap-2">
              {Object.entries(CONDITION_COLORS).map(([key, val]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setCondition(key)}
                  className={`p-2 rounded border-2 text-xs font-medium transition-all ${
                    condition === key
                      ? "border-primary-600 ring-2 ring-primary-200"
                      : "border-gray-200 hover:border-gray-400"
                  }`}
                >
                  <div
                    className={`${val.bg} border border-gray-400 rounded mx-auto mb-1`}
                    style={{ width: 20, height: 20 }}
                  />
                  <div className="text-center text-gray-700">{val.label}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Pilihan Permukaan */}
          <div>
            <label className="label">Permukaan Gigi</label>
            <select
              className="input"
              value={surface}
              onChange={(e) => setSurface(e.target.value)}
            >
              {SURFACES.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>

          {/* Catatan */}
          <div>
            <label className="label">Catatan</label>
            <textarea
              className="input"
              rows={2}
              placeholder="cth: Karies dalam, perlu tambalan komposit"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          {/* Tombol Aksi */}
          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary flex-1"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary flex-1"
            >
              {loading ? "Menyimpan..." : "Simpan"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
