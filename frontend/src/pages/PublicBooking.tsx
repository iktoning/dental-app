import { useEffect, useState } from "react";
import { publicApi } from "../lib/api";

const GENDER_LABELS: Record<string, string> = {
  male: "Laki-laki",
  female: "Perempuan",
  other: "Lainnya",
};

export default function PublicBooking() {
  const [step, setStep] = useState<1 | 2 | 3>(1); // 1: pilih tanggal, 2: isi data, 3: sukses
  const [doctor, setDoctor] = useState<{ id: string; name: string } | null>(
    null,
  );
  const [slots, setSlots] = useState<{ time: string; available: boolean }[]>(
    [],
  );
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    full_name: "",
    phone: "",
    email: "",
    birth_date: "",
    gender: "",
    address: "",
    allergies: "",
    medical_notes: "",
    complaint: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Load info dokter
  useEffect(() => {
    publicApi
      .get("/booking/doctor-info")
      .then((res) => setDoctor(res.data.data))
      .catch(() => setError("Tidak dapat memuat info dokter"));
  }, []);

  // Load slot saat tanggal berubah
  useEffect(() => {
    if (!selectedDate) return;
    setSelectedTime("");
    publicApi
      .get("/booking/available-slots", { params: { date: selectedDate } })
      .then((res) => setSlots(res.data.data))
      .catch(() => setSlots([]));
  }, [selectedDate]);

  const updateField = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!form.full_name.trim()) e.full_name = "Nama wajib diisi";
    else if (form.full_name.trim().length < 2)
      e.full_name = "Nama minimal 2 karakter";

    if (!form.phone.trim()) e.phone = "Nomor HP wajib diisi";
    else if (!/^[0-9+\-\s]{8,}$/.test(form.phone.trim()))
      e.phone = "Nomor HP minimal 8 digit";

    if (
      form.email.trim() &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())
    )
      e.email = "Format email tidak valid";

    if (!form.birth_date) e.birth_date = "Tanggal lahir wajib diisi";
    if (!form.gender) e.gender = "Gender wajib dipilih";
    if (!form.address.trim()) e.address = "Alamat wajib diisi";

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!validate()) {
      setError("Mohon lengkapi form yang wajib diisi");
      return;
    }

    setLoading(true);
    try {
      const scheduled_at = `${selectedDate}T${selectedTime}:00+07:00`;
      const res = await publicApi.post("/booking", {
        ...form,
        scheduled_at,
      });
      setResult(res.data.data);
      setStep(3);
    } catch (err: any) {
      const data = err.response?.data;
      if (data?.errors && Array.isArray(data.errors)) {
        const backendErrors: Record<string, string> = {};
        for (const er of data.errors) {
          if (er.field) backendErrors[er.field] = er.message;
        }
        setErrors(backendErrors);
        setError("Mohon periksa kembali form Anda");
      } else {
        setError(data?.message || "Booking gagal, silakan coba lagi");
      }
    } finally {
      setLoading(false);
    }
  };

  const today = new Date().toISOString().slice(0, 10);
  const maxDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);

  return (
    <div className="min-h-screen bg-linear-to-br from-primary-50 to-blue-100 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-5xl mb-2">🦷</div>
          <h1 className="text-3xl font-bold text-primary-700">
            Booking Online
          </h1>
          <p className="text-gray-600 mt-1">
            {doctor ? `Dengan ${doctor.name}` : "Memuat..."}
          </p>
        </div>

        {/* Progress */}
        <div className="flex items-center justify-center gap-2 mb-6">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                  step >= s
                    ? "bg-primary-600 text-white"
                    : "bg-gray-200 text-gray-500"
                }`}
              >
                {s}
              </div>
              {s < 3 && (
                <div
                  className={`w-12 h-1 ${
                    step > s ? "bg-primary-600" : "bg-gray-200"
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
              ⚠️ {error}
            </div>
          )}

          {/* STEP 1: Pilih Jadwal */}
          {step === 1 && (
            <div>
              <h2 className="text-xl font-bold mb-4">Pilih Jadwal Kunjungan</h2>

              <div className="mb-4">
                <label className="label">Tanggal</label>
                <input
                  type="date"
                  className="input"
                  value={selectedDate}
                  min={today}
                  max={maxDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                />
              </div>

              {selectedDate && (
                <div className="mb-6">
                  <label className="label">Jam Tersedia</label>
                  {slots.length === 0 ? (
                    <p className="text-sm text-gray-500 py-2">
                      Tidak ada slot tersedia untuk tanggal ini.
                    </p>
                  ) : (
                    <div className="grid grid-cols-4 gap-2">
                      {slots.map((s) => (
                        <button
                          key={s.time}
                          type="button"
                          disabled={!s.available}
                          onClick={() => setSelectedTime(s.time)}
                          className={`py-2 px-3 rounded-lg border text-sm font-medium transition-colors ${
                            selectedTime === s.time
                              ? "bg-primary-600 text-white border-primary-600"
                              : s.available
                                ? "bg-white text-gray-700 border-gray-300 hover:border-primary-500"
                                : "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed"
                          }`}
                        >
                          {s.time}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <button
                type="button"
                onClick={() => setStep(2)}
                disabled={!selectedDate || !selectedTime}
                className="btn-primary w-full"
              >
                Lanjut Isi Data →
              </button>
            </div>
          )}

          {/* STEP 2: Isi Data */}
          {step === 2 && (
            <form onSubmit={handleSubmit}>
              <h2 className="text-xl font-bold mb-1">Data Diri</h2>
              <p className="text-sm text-gray-500 mb-4">
                Jadwal:{" "}
                <strong>
                  {new Date(selectedDate).toLocaleDateString("id-ID", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}{" "}
                  pukul {selectedTime}
                </strong>
              </p>

              {/* Nama */}
              <div className="mb-3">
                <label className="label">
                  Nama Lengkap <span className="text-red-500">*</span>
                </label>
                <input
                  className={`input ${errors.full_name ? "border-red-500" : ""}`}
                  value={form.full_name}
                  onChange={(e) => updateField("full_name", e.target.value)}
                  placeholder="cth: Budi Santoso"
                />
                {errors.full_name && (
                  <p className="text-red-600 text-xs mt-1">
                    • {errors.full_name}
                  </p>
                )}
              </div>

              {/* Phone */}
              <div className="mb-3">
                <label className="label">
                  Nomor HP / WhatsApp <span className="text-red-500">*</span>
                </label>
                <input
                  className={`input ${errors.phone ? "border-red-500" : ""}`}
                  value={form.phone}
                  onChange={(e) => updateField("phone", e.target.value)}
                  placeholder="cth: 08123456789"
                />
                {errors.phone && (
                  <p className="text-red-600 text-xs mt-1">• {errors.phone}</p>
                )}
              </div>

              {/* Email */}
              <div className="mb-3">
                <label className="label">
                  Email{" "}
                  <span className="text-gray-400 text-xs">(opsional)</span>
                </label>
                <input
                  type="email"
                  className={`input ${errors.email ? "border-red-500" : ""}`}
                  value={form.email}
                  onChange={(e) => updateField("email", e.target.value)}
                />
                {errors.email && (
                  <p className="text-red-600 text-xs mt-1">• {errors.email}</p>
                )}
              </div>

              {/* Birth + Gender */}
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                  <label className="label">
                    Tanggal Lahir <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    className={`input ${errors.birth_date ? "border-red-500" : ""}`}
                    value={form.birth_date}
                    max={today}
                    onChange={(e) => updateField("birth_date", e.target.value)}
                  />
                  {errors.birth_date && (
                    <p className="text-red-600 text-xs mt-1">
                      • {errors.birth_date}
                    </p>
                  )}
                </div>
                <div>
                  <label className="label">
                    Gender <span className="text-red-500">*</span>
                  </label>
                  <select
                    className={`input ${errors.gender ? "border-red-500" : ""}`}
                    value={form.gender}
                    onChange={(e) => updateField("gender", e.target.value)}
                  >
                    <option value="">-- Pilih --</option>
                    {Object.entries(GENDER_LABELS).map(([k, v]) => (
                      <option key={k} value={k}>
                        {v}
                      </option>
                    ))}
                  </select>
                  {errors.gender && (
                    <p className="text-red-600 text-xs mt-1">
                      • {errors.gender}
                    </p>
                  )}
                </div>
              </div>

              {/* Address */}
              <div className="mb-3">
                <label className="label">
                  Alamat <span className="text-red-500">*</span>
                </label>
                <textarea
                  className={`input ${errors.address ? "border-red-500" : ""}`}
                  rows={2}
                  value={form.address}
                  onChange={(e) => updateField("address", e.target.value)}
                  placeholder="cth: Jl. Merdeka No. 10, Jakarta"
                />
                {errors.address && (
                  <p className="text-red-600 text-xs mt-1">
                    • {errors.address}
                  </p>
                )}
              </div>

              {/* Complaint */}
              <div className="mb-3">
                <label className="label">Keluhan</label>
                <textarea
                  className="input"
                  rows={3}
                  value={form.complaint}
                  onChange={(e) => updateField("complaint", e.target.value)}
                  placeholder="cth: Gigi belakang kiri sakit saat makan"
                />
              </div>

              {/* Allergies + Medical */}
              <details className="mb-3">
                <summary className="text-sm text-primary-600 cursor-pointer hover:underline">
                  Info medis tambahan (opsional)
                </summary>
                <div className="mt-3 space-y-3">
                  <div>
                    <label className="label">Alergi</label>
                    <input
                      className="input"
                      value={form.allergies}
                      onChange={(e) => updateField("allergies", e.target.value)}
                      placeholder="cth: Penisilin"
                    />
                  </div>
                  <div>
                    <label className="label">Catatan Medis</label>
                    <textarea
                      className="input"
                      rows={2}
                      value={form.medical_notes}
                      onChange={(e) =>
                        updateField("medical_notes", e.target.value)
                      }
                      placeholder="cth: Diabetes, hipertensi"
                    />
                  </div>
                </div>
              </details>

              <div className="flex gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="btn-secondary flex-1"
                >
                  ← Kembali
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary flex-1"
                >
                  {loading ? "Memproses..." : "Konfirmasi Booking"}
                </button>
              </div>
            </form>
          )}

          {/* STEP 3: Sukses */}
          {step === 3 && result && (
            <div className="text-center">
              <div className="text-6xl mb-4">✅</div>
              <h2 className="text-2xl font-bold text-green-600 mb-2">
                Booking Berhasil!
              </h2>
              <p className="text-gray-600 mb-6">Kami tunggu kedatangan Anda.</p>

              <div className="bg-primary-50 border-2 border-primary-200 rounded-xl p-6 mb-6">
                <p className="text-sm text-gray-600 mb-1">Nomor Antrian Anda</p>
                <p className="text-6xl font-bold text-primary-700 mb-2">
                  {result.queue_code}
                </p>
                <p className="text-sm text-gray-600">
                  Jadwal:{" "}
                  <strong>
                    {new Date(result.scheduled_at).toLocaleString("id-ID", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </strong>
                </p>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-left text-sm">
                <p className="font-medium mb-2">📌 Catatan:</p>
                <ul className="space-y-1 text-gray-700 list-disc list-inside">
                  <li>Mohon datang 10 menit sebelum jadwal</li>
                  <li>Tunjukkan nomor antrian Anda ke resepsionis</li>
                  <li>Jika berhalangan, hubungi klinik untuk reschedule</li>
                </ul>
              </div>

              <button
                onClick={() => {
                  setStep(1);
                  setResult(null);
                  setSelectedDate("");
                  setSelectedTime("");
                  setForm({
                    full_name: "",
                    phone: "",
                    email: "",
                    birth_date: "",
                    gender: "",
                    address: "",
                    allergies: "",
                    medical_notes: "",
                    complaint: "",
                  });
                }}
                className="btn-secondary w-full mt-6"
              >
                Booking Lagi
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
