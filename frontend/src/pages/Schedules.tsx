import { useEffect, useState } from "react";
import { api } from "../lib/api";
import { toast } from "../lib/toast";

const DAYS = [
  { value: 0, label: "Minggu" },
  { value: 1, label: "Senin" },
  { value: 2, label: "Selasa" },
  { value: 3, label: "Rabu" },
  { value: 4, label: "Kamis" },
  { value: 5, label: "Jumat" },
  { value: 6, label: "Sabtu" },
];

type Schedule = {
  id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  slot_duration: number;
  is_active: boolean;
};

export default function Schedules() {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Schedule | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get("/schedules");
      setSchedules(res.data.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("Hapus jadwal ini?")) return;
    try {
      await api.delete(`/schedules/${id}`);
      load();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Gagal hapus");
    }
  };

  // Kelompokkan per hari
  const grouped: Record<number, Schedule[]> = {};
  for (const s of schedules) {
    if (!grouped[s.day_of_week]) grouped[s.day_of_week] = [];
    grouped[s.day_of_week].push(s);
  }

  const openAdd = () => {
    setEditing(null);
    setShowModal(true);
  };

  const openEdit = (s: Schedule) => {
    setEditing(s);
    setShowModal(true);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Jam Praktik</h1>
          <p className="text-gray-500 text-sm mt-1">
            Atur jam operasional dan slot waktu yang bisa dipesan pasien.
          </p>
        </div>
        <button onClick={openAdd} className="btn-primary">
          + Tambah Jadwal
        </button>
      </div>

      <div className="card">
        {loading ? (
          <p>Memuat...</p>
        ) : schedules.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 mb-4">
              Belum ada jadwal praktik. Tambahkan jam operasional Anda.
            </p>
            <button onClick={openAdd} className="btn-primary">
              + Tambah Jadwal Pertama
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {DAYS.map((day) => {
              const items = grouped[day.value] || [];
              return (
                <div
                  key={day.value}
                  className="border border-gray-200 rounded-lg p-4"
                >
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="font-bold text-lg">{day.label}</h3>
                    {items.length === 0 && (
                      <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded">
                        Libur
                      </span>
                    )}
                  </div>
                  {items.length === 0 ? (
                    <p className="text-sm text-gray-400 italic">
                      Tidak ada jadwal untuk hari ini.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {items.map((s) => (
                        <div
                          key={s.id}
                          className="flex justify-between items-center bg-gray-50 rounded-lg px-4 py-2"
                        >
                          <div className="flex items-center gap-4">
                            <span className="font-mono font-medium">
                              {s.start_time.slice(0, 5)} —{" "}
                              {s.end_time.slice(0, 5)}
                            </span>
                            <span className="text-xs text-gray-500">
                              slot {s.slot_duration} menit
                            </span>
                            {!s.is_active && (
                              <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded">
                                Nonaktif
                              </span>
                            )}
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => openEdit(s)}
                              className="text-primary-600 hover:underline text-sm"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDelete(s.id)}
                              className="text-red-500 hover:underline text-sm"
                            >
                              Hapus
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {showModal && (
        <ScheduleModal
          editing={editing}
          onClose={() => setShowModal(false)}
          onSuccess={() => {
            setShowModal(false);
            load();
          }}
        />
      )}
    </div>
  );
}

function ScheduleModal({
  editing,
  onClose,
  onSuccess,
}: {
  editing: Schedule | null;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [form, setForm] = useState({
    day_of_week: editing?.day_of_week ?? 1,
    start_time: editing?.start_time?.slice(0, 5) ?? "09:00",
    end_time: editing?.end_time?.slice(0, 5) ?? "17:00",
    slot_duration: editing?.slot_duration ?? 30,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validasi: end_time harus > start_time
    if (form.end_time <= form.start_time) {
      setError("Jam selesai harus lebih besar dari jam mulai");
      return;
    }

    setLoading(true);
    try {
      await api.post("/schedules", form);
      onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.message || "Gagal menyimpan");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
        <h2 className="text-xl font-bold mb-4">
          {editing ? "Edit Jadwal" : "Tambah Jadwal"}
        </h2>

        {error && (
          <div className="mb-3 p-3 bg-red-50 border border-red-200 text-red-700 rounded text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Hari *</label>
            <select
              className="input"
              value={form.day_of_week}
              onChange={(e) =>
                setForm({ ...form, day_of_week: parseInt(e.target.value) })
              }
            >
              {DAYS.map((d) => (
                <option key={d.value} value={d.value}>
                  {d.label}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Jam Mulai *</label>
              <input
                type="time"
                className="input"
                value={form.start_time}
                onChange={(e) =>
                  setForm({ ...form, start_time: e.target.value })
                }
                required
              />
            </div>
            <div>
              <label className="label">Jam Selesai *</label>
              <input
                type="time"
                className="input"
                value={form.end_time}
                onChange={(e) => setForm({ ...form, end_time: e.target.value })}
                required
              />
            </div>
          </div>

          <div>
            <label className="label">Durasi Slot (menit)</label>
            <select
              className="input"
              value={form.slot_duration}
              onChange={(e) =>
                setForm({ ...form, slot_duration: parseInt(e.target.value) })
              }
            >
              <option value={15}>15 menit</option>
              <option value={20}>20 menit</option>
              <option value={30}>30 menit</option>
              <option value={45}>45 menit</option>
              <option value={60}>60 menit</option>
            </select>
            <p className="text-xs text-gray-500 mt-1">
              Slot waktu yang bisa dipilih pasien saat booking.
            </p>
          </div>

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
