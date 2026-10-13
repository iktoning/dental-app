import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { api } from "../lib/api";
import { toast } from "../lib/toast";
import { SOURCE_LABELS, STATUS_QUEUE_LABELS } from "../lib/labels";

type QueueTicket = {
  id: string;
  queue_code: string;
  queue_number: number;
  patient_name: string | null;
  patient_phone: string | null;
  status: string;
  source: string;
  called_at: string | null;
  served_at: string | null;
  completed_at: string | null;
};

type Patient = {
  id: string;
  full_name: string;
  phone: string;
};

const STATUS_COLORS: Record<string, string> = {
  waiting: "bg-yellow-100 text-yellow-700",
  called: "bg-blue-100 text-blue-700",
  serving: "bg-purple-100 text-purple-700",
  done: "bg-green-100 text-green-700",
  skipped: "bg-gray-100 text-gray-500",
};

export default function Queue() {
  const [tickets, setTickets] = useState<QueueTicket[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [current, setCurrent] = useState<QueueTicket | null>(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [q, s, c] = await Promise.all([
        api.get("/queue"),
        api.get("/queue/stats"),
        api.get("/queue/current"),
      ]);
      setTickets(q.data.data);
      setStats(s.data.data);
      setCurrent(c.data.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // Auto-refresh tiap 15 detik
    const interval = setInterval(load, 15000);
    return () => clearInterval(interval);
  }, []);

  const updateStatus = async (id: string, status: string) => {
    try {
      await api.patch(`/queue/${id}/status`, { status });
      load();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Gagal update");
    }
  };

  const callNext = async () => {
    try {
      await api.post("/queue/call-next");
      load();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Tidak ada antrian");
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Antrian Hari Ini</h1>
        <div className="flex gap-2">
          <button onClick={callNext} className="btn-primary">
            📢 Panggil Berikutnya
          </button>
          <button onClick={() => setShowModal(true)} className="btn-secondary">
            + Ambil Nomor
          </button>
        </div>
      </div>

      {/* Current Queue Banner */}
      {current && (
        <div className="bg-linear-to-r from-primary-600 to-primary-700 text-white rounded-lg p-6 mb-6">
          <p className="text-sm opacity-90">Sedang Dipanggil</p>
          <div className="flex items-baseline gap-4 mt-2">
            <span className="text-5xl font-bold">{current.queue_code}</span>
            <span className="text-xl">{current.patient_name || "Pasien"}</span>
          </div>
        </div>
      )}

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <div className="card text-center">
            <p className="text-xs text-gray-500">Menunggu</p>
            <p className="text-2xl font-bold text-yellow-600">
              {stats.waiting}
            </p>
          </div>
          <div className="card text-center">
            <p className="text-xs text-gray-500">Dipanggil</p>
            <p className="text-2xl font-bold text-blue-600">{stats.called}</p>
          </div>
          <div className="card text-center">
            <p className="text-xs text-gray-500">Dilayani</p>
            <p className="text-2xl font-bold text-purple-600">
              {stats.serving}
            </p>
          </div>
          <div className="card text-center">
            <p className="text-xs text-gray-500">Selesai</p>
            <p className="text-2xl font-bold text-green-600">{stats.done}</p>
          </div>
          <div className="card text-center">
            <p className="text-xs text-gray-500">Total</p>
            <p className="text-2xl font-bold">{stats.total}</p>
          </div>
        </div>
      )}

      {/* List Antrian */}
      <div className="card">
        <h2 className="text-xl font-bold mb-4">Daftar Antrian</h2>
        {loading ? (
          <p>Memuat...</p>
        ) : tickets.length === 0 ? (
          <p className="text-gray-500 text-center py-8">
            Belum ada antrian hari ini.
          </p>
        ) : (
          <div className="space-y-2">
            {tickets.map((t) => (
              <div
                key={t.id}
                className="flex items-center justify-between p-3 border border-gray-200 rounded-lg"
              >
                <div className="flex items-center gap-4">
                  <span className="text-2xl font-bold text-primary-600 w-20">
                    {t.queue_code}
                  </span>
                  <div>
                    <p className="font-medium">
                      {t.patient_name || "Tanpa Nama"}
                    </p>
                    <p className="text-sm text-gray-500">
                      {t.patient_phone || "-"} · via{" "}
                      {SOURCE_LABELS[t.source] || t.source}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`text-xs px-2 py-1 rounded ${
                      STATUS_COLORS[t.status] || "bg-gray-100"
                    }`}
                  >
                    {STATUS_QUEUE_LABELS[t.status] || t.status}
                  </span>
                  <select
                    value={t.status}
                    onChange={(e) => updateStatus(t.id, e.target.value)}
                    className="text-xs border border-gray-300 rounded px-2 py-1"
                  >
                    <option value="waiting">Menunggu</option>
                    <option value="called">Dipanggil</option>
                    <option value="serving">Dilayani</option>
                    <option value="done">Selesai</option>
                    <option value="skipped">Lewat</option>
                  </select>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showModal && (
        <TakeQueueModal
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

function TakeQueueModal({
  onClose,
  onSuccess,
}: {
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [patientId, setPatientId] = useState("");
  const [source, setSource] = useState("walk_in");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  useEffect(() => {
    api.get("/patients").then((res) => setPatients(res.data.data));
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post("/queue", {
        patient_id: patientId,
        source,
      });
      setResult(res.data.data);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Gagal");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
        {result ? (
          <div className="text-center">
            <p className="text-gray-500 mb-2">Nomor Antrian</p>
            <p className="text-6xl font-bold text-primary-600 mb-4">
              {result.queue_code}
            </p>
            <p className="text-gray-600 mb-6">
              Silakan menunggu, Anda akan dipanggil.
            </p>
            <button onClick={onSuccess} className="btn-primary w-full">
              Tutup
            </button>
          </div>
        ) : (
          <>
            <h2 className="text-xl font-bold mb-4">Ambil Nomor Antrian</h2>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="label">Pasien *</label>
                <select
                  className="input"
                  required
                  value={patientId}
                  onChange={(e) => setPatientId(e.target.value)}
                >
                  <option value="">-- Pilih Pasien --</option>
                  {patients.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.full_name} ({p.phone})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Sumber</label>
                <select
                  className="input"
                  value={source}
                  onChange={(e) => setSource(e.target.value)}
                >
                  <option value="walk_in">Datang Langsung</option>
                  <option value="web">Web</option>
                  <option value="whatsapp">WhatsApp</option>
                </select>
              </div>
              <div className="flex gap-2 pt-4">
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
                  {loading ? "Memproses..." : "Ambil Nomor"}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
