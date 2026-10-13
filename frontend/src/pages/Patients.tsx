import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../lib/api";

type Patient = {
  id: string;
  full_name: string;
  phone: string;
  email: string | null;
  birth_date: string | null;
  gender: string | null;
};

export default function Patients() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get("/patients", { params: { search } });
      setPatients(res.data.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [search]);

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Pasien</h1>
        <button onClick={() => setShowModal(true)} className="btn-primary">
          + Tambah Pasien
        </button>
      </div>

      <div className="card mb-4">
        <input
          type="text"
          className="input"
          placeholder="Cari nama atau nomor HP..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="card">
        {loading ? (
          <p>Memuat...</p>
        ) : patients.length === 0 ? (
          <p className="text-gray-500 text-center py-8">Belum ada pasien.</p>
        ) : (
          <table className="w-full">
            <thead className="text-left border-b border-gray-200">
              <tr>
                <th className="pb-3 font-medium text-gray-600">Nama</th>
                <th className="pb-3 font-medium text-gray-600">Telepon</th>
                <th className="pb-3 font-medium text-gray-600">Gender</th>
                <th className="pb-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {patients.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className="py-3 font-medium">{p.full_name}</td>
                  <td className="py-3">{p.phone}</td>
                  <td className="py-3 text-gray-500">{p.gender || "-"}</td>
                  <td className="py-3 text-right">
                    <Link
                      to={`/patients/${p.id}`}
                      className="text-primary-600 hover:underline text-sm"
                    >
                      Detail →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showModal && (
        <PatientFormModal
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

function PatientFormModal({
  onClose,
  onSuccess,
}: {
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [form, setForm] = useState({
    full_name: "",
    phone: "",
    email: "",
    birth_date: "",
    gender: "",
    address: "",
    allergies: "",
    medical_notes: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [generalError, setGeneralError] = useState("");
  const [loading, setLoading] = useState(false);

  // Update field + hapus error field itu saat user mulai mengetik
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

  // Validasi client-side sebelum submit
  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Nama — wajib
    if (!form.full_name.trim()) {
      newErrors.full_name = "Nama wajib diisi";
    } else if (form.full_name.trim().length < 2) {
      newErrors.full_name = "Nama minimal 2 karakter";
    }

    // No. HP — wajib
    if (!form.phone.trim()) {
      newErrors.phone = "Nomor HP wajib diisi";
    } else if (!/^[0-9+\-\s]{8,}$/.test(form.phone.trim())) {
      newErrors.phone = "Nomor HP minimal 8 digit (angka, +, -, spasi)";
    }

    // Email — opsional, tapi kalau diisi harus valid
    if (
      form.email.trim() &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())
    ) {
      newErrors.email = "Format email tidak valid";
    }

    // Tanggal Lahir — wajib
    if (!form.birth_date) {
      newErrors.birth_date = "Tanggal lahir wajib diisi";
    } else {
      const birth = new Date(form.birth_date);
      const today = new Date();
      if (birth > today) {
        newErrors.birth_date = "Tanggal lahir tidak boleh di masa depan";
      }
    }

    // Gender — wajib
    if (!form.gender) {
      newErrors.gender = "Gender wajib dipilih";
    }

    // Alamat — wajib
    if (!form.address.trim()) {
      newErrors.address = "Alamat wajib diisi";
    } else if (form.address.trim().length < 5) {
      newErrors.address = "Alamat minimal 5 karakter";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGeneralError("");

    if (!validate()) {
      //   setGeneralError("Mohon lengkapi form yang wajib diisi");
      return;
    }

    setLoading(true);
    try {
      // Kirim hanya field yang ada isinya (opsional)
      const payload: Record<string, any> = {
        full_name: form.full_name.trim(),
        phone: form.phone.trim(),
        birth_date: form.birth_date,
        gender: form.gender,
        address: form.address.trim(),
        // Opsional
        ...(form.email.trim() && { email: form.email.trim() }),
        ...(form.allergies.trim() && { allergies: form.allergies.trim() }),
        ...(form.medical_notes.trim() && {
          medical_notes: form.medical_notes.trim(),
        }),
      };

      await api.post("/patients", payload);
      onSuccess();
    } catch (err: any) {
      const data = err.response?.data;
      // Handle error validasi dari backend (Zod)
      if (data?.errors && Array.isArray(data.errors)) {
        const backendErrors: Record<string, string> = {};
        for (const e of data.errors) {
          if (e.field) backendErrors[e.field] = e.message;
        }
        setErrors(backendErrors);
        setGeneralError("Mohon periksa kembali form Anda");
      } else {
        setGeneralError(data?.message || "Gagal menyimpan data");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-auto">
        <div className="p-6">
          <h2 className="text-xl font-bold mb-4">Tambah Pasien</h2>

          {generalError && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm flex items-start gap-2">
              <span>⚠️</span>
              <span>{generalError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            {/* Nama Lengkap — WAJIB */}
            <div>
              <label className="label">
                Nama Lengkap <span className="text-red-500">*</span>
              </label>
              <input
                className={`input ${errors.full_name ? "border-red-500 focus:ring-red-500" : ""}`}
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

            {/* No. HP — WAJIB */}
            <div>
              <label className="label">
                No. HP <span className="text-red-500">*</span>
              </label>
              <input
                className={`input ${errors.phone ? "border-red-500 focus:ring-red-500" : ""}`}
                value={form.phone}
                onChange={(e) => updateField("phone", e.target.value)}
                placeholder="cth: 08123456789"
              />
              {errors.phone && (
                <p className="text-red-600 text-xs mt-1">• {errors.phone}</p>
              )}
            </div>

            {/* Email — OPSIONAL */}
            <div>
              <label className="label">
                Email <span className="text-gray-400 text-xs">(opsional)</span>
              </label>
              <input
                type="email"
                className={`input ${errors.email ? "border-red-500 focus:ring-red-500" : ""}`}
                value={form.email}
                onChange={(e) => updateField("email", e.target.value)}
                placeholder="cth: budi@email.com"
              />
              {errors.email && (
                <p className="text-red-600 text-xs mt-1">• {errors.email}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              {/* Tanggal Lahir — WAJIB */}
              <div>
                <label className="label">
                  Tanggal Lahir<span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  className={`input ${errors.birth_date ? "border-red-500 focus:ring-red-500" : ""}`}
                  value={form.birth_date}
                  onChange={(e) => updateField("birth_date", e.target.value)}
                  max={new Date().toISOString().slice(0, 10)}
                />
                {errors.birth_date && (
                  <p className="text-red-600 text-xs mt-1">
                    • {errors.birth_date}
                  </p>
                )}
              </div>

              {/* Gender — WAJIB */}
              <div>
                <label className="label">
                  Gender <span className="text-red-500">*</span>
                </label>
                <select
                  className={`input ${errors.gender ? "border-red-500 focus:ring-red-500" : ""}`}
                  value={form.gender}
                  onChange={(e) => updateField("gender", e.target.value)}
                >
                  <option value="">-- Pilih --</option>
                  <option value="male">Laki-laki</option>
                  <option value="female">Perempuan</option>
                  <option value="other">Lainnya</option>
                </select>
                {errors.gender && (
                  <p className="text-red-600 text-xs mt-1">• {errors.gender}</p>
                )}
              </div>
            </div>

            {/* Alamat — WAJIB */}
            <div>
              <label className="label">
                Alamat <span className="text-red-500">*</span>
              </label>
              <textarea
                className={`input ${errors.address ? "border-red-500 focus:ring-red-500" : ""}`}
                rows={2}
                placeholder="cth: Jl. Merdeka No. 10, Jakarta"
                value={form.address}
                onChange={(e) => updateField("address", e.target.value)}
              />
              {errors.address && (
                <p className="text-red-600 text-xs mt-1">• {errors.address}</p>
              )}
            </div>

            <div>
              <label className="label">
                Alergi <span className="text-gray-400 text-xs">(opsional)</span>
              </label>
              <input
                className="input"
                placeholder="cth: Penisilin"
                value={form.allergies}
                onChange={(e) => updateField("allergies", e.target.value)}
              />
            </div>

            <div>
              <label className="label">
                Catatan Medis{" "}
                <span className="text-gray-400 text-xs">(opsional)</span>
              </label>
              <textarea
                className="input"
                rows={2}
                placeholder="cth: Riwayat diabetes, hipertensi"
                value={form.medical_notes}
                onChange={(e) => updateField("medical_notes", e.target.value)}
              />
            </div>

            <div className="flex gap-2 pt-4 border-t">
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
    </div>
  );
}
