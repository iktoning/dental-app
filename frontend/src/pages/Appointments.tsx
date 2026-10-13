import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { api } from "../lib/api";
import { toast } from "../lib/toast";
import ConfirmDialog from "../components/ConfirmDialog";
import { SOURCE_LABELS, STATUS_APPOINTMENT_LABELS } from "../lib/labels";

type Appointment = {
  id: string;
  patient_id: string;
  patient_name: string;
  patient_phone: string;
  doctor_name: string;
  scheduled_at: string;
  duration_min: number;
  status: string;
  complaint: string | null;
  source: string;
};

type Patient = {
  id: string;
  full_name: string;
  phone: string;
};

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-700",
  confirmed: "bg-blue-100 text-blue-700",
  in_progress: "bg-purple-100 text-purple-700",
  completed: "bg-green-100 text-green-700",
  cancelled: "bg-gray-100 text-gray-700",
  no_show: "bg-red-100 text-red-700",
};

export default function Appointments() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().slice(0, 10),
  );
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [treatmentAppt, setTreatmentAppt] = useState<Appointment | null>(null);
  const [confirmAppt, setConfirmAppt] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get("/appointments", {
        params: { date: selectedDate },
      });
      setAppointments(res.data.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [selectedDate]);

  const updateStatus = async (id: string, status: string) => {
    try {
      await api.put(`/appointments/${id}`, { status });
      load();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Gagal update status");
    }
  };

  const handleConfirmInvoice = async () => {
    if (!confirmAppt) return;
    const appointmentId = confirmAppt;
    setConfirmAppt(null);
    try {
      const res = await api.post(`/invoices/from-appointment/${appointmentId}`);
      toast.success(`Invoice ${res.data.data.invoice_number} berhasil dibuat`);
      setTimeout(() => {
        window.location.href = "/invoices";
      }, 1500);
    } catch (err: any) {
      toast.error(
        err.response?.data?.message ||
          "Gagal buat invoice. Pastikan ada tindakan terlebih dahulu.",
      );
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Jadwal Appointment</h1>
        <button onClick={() => setShowModal(true)} className="btn-primary">
          + Booking Baru
        </button>
      </div>

      <div className="card mb-4">
        <div className="flex gap-4 items-end">
          <div className="flex-1">
            <label className="label">Pilih Tanggal</label>
            <input
              type="date"
              className="input"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
            />
          </div>
          <button
            onClick={() =>
              setSelectedDate(new Date().toISOString().slice(0, 10))
            }
            className="btn-secondary"
          >
            Hari Ini
          </button>
        </div>
      </div>

      <div className="card">
        {loading ? (
          <p>Memuat...</p>
        ) : appointments.length === 0 ? (
          <p className="text-gray-500 text-center py-8">
            Tidak ada jadwal pada tanggal ini.
          </p>
        ) : (
          <div className="space-y-3">
            {appointments.map((appt) => {
              const time = new Date(appt.scheduled_at);
              return (
                <div
                  key={appt.id}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-sm"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-2xl font-bold text-primary-600">
                          {time.toLocaleTimeString("id-ID", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                        <span
                          className={`text-xs px-2 py-1 rounded ${
                            STATUS_COLORS[appt.status] || "bg-gray-100"
                          }`}
                        >
                          {STATUS_APPOINTMENT_LABELS[appt.status] ||
                            appt.status}
                        </span>
                        <span className="text-xs text-gray-500">
                          via {SOURCE_LABELS[appt.source] || appt.source}
                        </span>
                      </div>
                      <p className="font-medium">{appt.patient_name}</p>
                      <p className="text-sm text-gray-500">
                        📞 {appt.patient_phone}
                      </p>
                      {appt.complaint && (
                        <p className="text-sm text-gray-600 mt-2">
                          💬 {appt.complaint}
                        </p>
                      )}
                    </div>
                    <div className="flex flex-col gap-2">
                      {appt.status === "pending" && (
                        <button
                          onClick={() => updateStatus(appt.id, "confirmed")}
                          className="text-xs px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                        >
                          Konfirmasi
                        </button>
                      )}
                      {appt.status === "confirmed" && (
                        <button
                          onClick={() => updateStatus(appt.id, "in_progress")}
                          className="text-xs px-3 py-1 bg-purple-600 text-white rounded hover:bg-purple-700"
                        >
                          Mulai
                        </button>
                      )}
                      {appt.status === "in_progress" && (
                        <button
                          onClick={() => updateStatus(appt.id, "completed")}
                          className="text-xs px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700"
                        >
                          Selesai
                        </button>
                      )}
                      {appt.status === "completed" && (
                        <button
                          onClick={() => setConfirmAppt(appt.id)}
                          className="text-xs px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                        >
                          Buat Invoice
                        </button>
                      )}
                      {["in_progress", "completed"].includes(appt.status) && (
                        <button
                          onClick={() => setTreatmentAppt(appt)}
                          className="text-xs px-3 py-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                        >
                          Tindakan
                        </button>
                      )}
                      {["pending", "confirmed"].includes(appt.status) && (
                        <button
                          onClick={() => updateStatus(appt.id, "cancelled")}
                          className="text-xs px-3 py-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                        >
                          Batalkan
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {showModal && (
        <BookingModal
          onClose={() => setShowModal(false)}
          onSuccess={() => {
            setShowModal(false);
            load();
          }}
        />
      )}

      {confirmAppt && (
        <ConfirmDialog
          title="Buat Invoice?"
          message="Invoice akan dibuat otomatis dari tindakan yang tercatat pada appointment ini."
          confirmLabel="Ya, Buat Invoice"
          onConfirm={handleConfirmInvoice}
          onCancel={() => setConfirmAppt(null)}
        />
      )}

      {treatmentAppt && (
        <TreatmentModal
          appointment={treatmentAppt}
          onClose={() => setTreatmentAppt(null)}
          onSuccess={() => {
            setTreatmentAppt(null);
            load();
          }}
        />
      )}
    </div>
  );
}

function BookingModal({
  onClose,
  onSuccess,
}: {
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [slots, setSlots] = useState<{ time: string; available: boolean }[]>(
    [],
  );
  const [form, setForm] = useState({
    patient_id: "",
    date: new Date().toISOString().slice(0, 10),
    time: "",
    complaint: "",
    source: "walk_in",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    api.get("/patients").then((res) => setPatients(res.data.data));
  }, []);

  // Load slot setiap tanggal berubah
  useEffect(() => {
    if (!form.date) return;
    api
      .get("/schedules/available-slots", { params: { date: form.date } })
      .then((res) => setSlots(res.data.data))
      .catch(() => setSlots([]));
  }, [form.date]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.time) {
      setError("Pilih slot waktu terlebih dahulu");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const scheduled_at = `${form.date}T${form.time}:00+07:00`;
      await api.post("/appointments", {
        patient_id: form.patient_id,
        scheduled_at,
        duration_min: 30,
        complaint: form.complaint,
        source: form.source,
      });
      onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.message || "Gagal booking");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-auto">
        <div className="p-6">
          <h2 className="text-xl font-bold mb-4">Booking Appointment</h2>
          {error && (
            <div className="mb-3 p-3 bg-red-50 text-red-700 rounded text-sm">
              {error}
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="label">Pasien *</label>
              <select
                className="input"
                required
                value={form.patient_id}
                onChange={(e) =>
                  setForm({ ...form, patient_id: e.target.value })
                }
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
              <label className="label">Tanggal *</label>
              <input
                type="date"
                className="input"
                required
                value={form.date}
                min={new Date().toISOString().slice(0, 10)}
                onChange={(e) =>
                  setForm({ ...form, date: e.target.value, time: "" })
                }
              />
            </div>
            <div>
              <label className="label">Pilih Slot Waktu *</label>
              {slots.length === 0 ? (
                <p className="text-sm text-gray-500 py-2">
                  Tidak ada slot tersedia untuk tanggal ini.
                </p>
              ) : (
                <div>
                  <div className="grid grid-cols-4 gap-2">
                    {slots.map((s) => {
                      const isBooked = !s.available;
                      const isSelected = form.time === s.time;
                      return (
                        <button
                          key={s.time}
                          type="button"
                          disabled={isBooked}
                          onClick={() => setForm({ ...form, time: s.time })}
                          className={`relative py-2 px-3 rounded border-2 text-sm font-medium transition-all ${
                            isSelected
                              ? "bg-primary-600 text-white border-primary-600 shadow-md"
                              : isBooked
                                ? "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed line-through"
                                : "bg-white text-gray-700 border-gray-300 hover:border-primary-500 hover:bg-primary-50"
                          }`}
                          title={
                            isBooked ? "Sudah dipesan pasien lain" : "Tersedia"
                          }
                        >
                          {s.time}
                          {isBooked && (
                            <span className="absolute -top-1 -right-1 text-[9px] bg-red-500 text-white rounded-full px-1.5 py-0.5 font-bold leading-none">
                              ✕
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>

                  <p className="text-xs text-gray-500 mt-2 flex items-center gap-3">
                    <span className="flex items-center gap-1">
                      <span className="w-3 h-3 rounded border-2 border-gray-300 bg-white inline-block"></span>
                      Tersedia
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-3 h-3 rounded border-2 border-gray-200 bg-gray-100 inline-block"></span>
                      Sudah dipesan
                    </span>
                  </p>
                </div>
              )}
              <p className="text-xs text-gray-500 mt-1">
                Format 24 jam. Slot abu-abu sudah terisi.
              </p>
            </div>
            <div>
              <label className="label">Keluhan</label>
              <textarea
                className="input"
                rows={3}
                value={form.complaint}
                onChange={(e) =>
                  setForm({ ...form, complaint: e.target.value })
                }
              />
            </div>
            <div>
              <label className="label">Sumber</label>
              <select
                className="input"
                value={form.source}
                onChange={(e) => setForm({ ...form, source: e.target.value })}
              >
                <option value="walk_in">Datang Langsung</option>
                <option value="web">Web</option>
                <option value="whatsapp">WhatsApp</option>
                <option value="phone">Telepon</option>
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
                {loading ? "Menyimpan..." : "Booking"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

function TreatmentModal({
  appointment,
  onClose,
  onSuccess,
}: {
  appointment: Appointment;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [treatments, setTreatments] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [form, setForm] = useState({
    service_id: "",
    tooth_number: "",
    diagnosis: "",
    notes: "",
    price: 0,
  });
  const [loading, setLoading] = useState(false);

  const loadTreatments = async () => {
    const res = await api.get(`/appointments/${appointment.id}/treatments`);
    setTreatments(res.data.data);
  };

  useEffect(() => {
    loadTreatments();
    api.get("/services").then((res) => setServices(res.data.data));
  }, []);

  // Auto-fill harga saat service dipilih
  useEffect(() => {
    if (form.service_id) {
      const s = services.find((x) => x.id === form.service_id);
      if (s) setForm((prev) => ({ ...prev, price: Number(s.price) }));
    }
  }, [form.service_id, services]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post(`/appointments/${appointment.id}/treatments`, {
        service_id: form.service_id || undefined,
        tooth_number: form.tooth_number || undefined,
        diagnosis: form.diagnosis || undefined,
        notes: form.notes || undefined,
        price: form.price,
      });
      setForm({
        service_id: "",
        tooth_number: "",
        diagnosis: "",
        notes: "",
        price: 0,
      });
      loadTreatments();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Gagal menambah");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Hapus tindakan ini?")) return;
    await api.delete(`/appointments/${appointment.id}/treatments/${id}`);
    loadTreatments();
  };

  const total = treatments.reduce((s, t) => s + Number(t.price), 0);

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-auto p-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 className="text-xl font-bold">Tindakan</h2>
            <p className="text-sm text-gray-500">
              {appointment.patient_name} ·{" "}
              {new Date(appointment.scheduled_at).toLocaleString("id-ID")}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        </div>

        {/* List Tindakan */}
        {treatments.length > 0 && (
          <div className="mb-6">
            <h3 className="font-medium mb-2">Tindakan Tercatat:</h3>
            <div className="space-y-2">
              {treatments.map((t) => (
                <div
                  key={t.id}
                  className="flex justify-between items-center bg-gray-50 rounded px-3 py-2"
                >
                  <div>
                    <p className="font-medium">
                      {t.service_name || t.diagnosis || "Tindakan"}
                    </p>
                    <p className="text-xs text-gray-500">
                      {t.tooth_number && `Gigi ${t.tooth_number} · `}
                      Rp {Number(t.price).toLocaleString("id-ID")}
                    </p>
                  </div>
                  <button
                    onClick={() => handleDelete(t.id)}
                    className="text-red-500 text-sm hover:underline"
                  >
                    Hapus
                  </button>
                </div>
              ))}
            </div>
            <div className="text-right mt-3 font-bold">
              Total: Rp {total.toLocaleString("id-ID")}
            </div>
          </div>
        )}

        {/* Form Tambah */}
        <form onSubmit={handleAdd} className="border-t pt-4 space-y-3">
          <h3 className="font-medium">Tambah Tindakan:</h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Layanan</label>
              <select
                className="input"
                value={form.service_id}
                onChange={(e) =>
                  setForm({ ...form, service_id: e.target.value })
                }
              >
                <option value="">-- Pilih Layanan --</option>
                {services.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} (Rp {Number(s.price).toLocaleString("id-ID")})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Nomor Gigi (opsional)</label>
              <input
                className="input"
                placeholder="cth: 36"
                value={form.tooth_number}
                onChange={(e) =>
                  setForm({ ...form, tooth_number: e.target.value })
                }
              />
            </div>
          </div>
          <div>
            <label className="label">Diagnosis / Catatan</label>
            <input
              className="input"
              value={form.diagnosis}
              onChange={(e) => setForm({ ...form, diagnosis: e.target.value })}
            />
          </div>
          <div>
            <label className="label">Harga</label>
            <input
              type="number"
              className="input"
              value={form.price}
              onChange={(e) =>
                setForm({ ...form, price: parseFloat(e.target.value) || 0 })
              }
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full"
          >
            {loading ? "Menambah..." : "+ Tambah Tindakan"}
          </button>
        </form>

        <button onClick={onSuccess} className="btn-secondary w-full mt-4">
          Selesai
        </button>
      </div>
    </div>
  );
}
