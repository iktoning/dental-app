import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "../lib/api";
import Odontogram from "../components/Odontogram";
import ToothConditionModal from "../components/ToothConditionModal";

type Patient = {
  id: string;
  full_name: string;
  phone: string;
  email: string | null;
  birth_date: string | null;
  gender: string | null;
  address: string | null;
  allergies: string | null;
  medical_notes: string | null;
  created_at: string;
};

const GENDER_LABELS: Record<string, string> = {
  male: "♂ Laki-laki",
  female: "♀ Perempuan",
  other: "⚧ Lainnya",
};

export default function PatientDetail() {
  const { id } = useParams<{ id: string }>();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [odontogram, setOdontogram] = useState<any>(null);
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTooth, setSelectedTooth] = useState<string | null>(null);
  const [tab, setTab] = useState<"odontogram" | "riwayat">("odontogram");
  const [toothHistory, setToothHistory] = useState<any[]>([]);
  const [historyFilter, setHistoryFilter] = useState<string | null>(null);

  // Load data pasien + odontogram + summary
  const load = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const [p, o, s] = await Promise.all([
        api.get(`/patients/${id}`),
        api.get(`/odontogram/patient/${id}`),
        api.get(`/odontogram/patient/${id}/summary`),
      ]);
      setPatient(p.data.data);
      setOdontogram(o.data.data);
      setSummary(s.data.data);
    } finally {
      setLoading(false);
    }
  };

  // Load riwayat odontogram (semua atau per gigi)
  const loadHistory = async (toothNumber?: string) => {
    if (!id) return;
    try {
      if (toothNumber) {
        const res = await api.get(
          `/odontogram/patient/${id}/tooth/${toothNumber}`,
        );
        setToothHistory(res.data.data);
        setHistoryFilter(toothNumber);
      } else {
        const res = await api.get(`/odontogram/patient/${id}/history`);
        setToothHistory(res.data.data);
        setHistoryFilter(null);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    load();
  }, [id]);

  // Ketika pindah ke tab Riwayat, load semua riwayat (kalau belum ada)
  const handleTabChange = (newTab: "odontogram" | "riwayat") => {
    setTab(newTab);
    if (newTab === "riwayat" && toothHistory.length === 0) {
      loadHistory();
    }
  };

  if (loading) {
    return <p className="text-gray-500">Memuat data pasien...</p>;
  }

  if (!patient) {
    return (
      <div>
        <p className="text-red-500">Pasien tidak ditemukan.</p>
        <Link to="/patients" className="text-primary-600 hover:underline">
          ← Kembali
        </Link>
      </div>
    );
  }

  const age = patient.birth_date
    ? Math.floor(
        (Date.now() - new Date(patient.birth_date).getTime()) /
          (1000 * 60 * 60 * 24 * 365.25),
      )
    : null;

  return (
    <div>
      <Link
        to="/patients"
        className="text-primary-600 hover:underline text-sm inline-block mb-4"
      >
        ← Kembali ke Daftar Pasien
      </Link>

      {/* ========== Kartu Info Pasien ========== */}
      <div className="card mb-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold">👤 {patient.full_name}</h1>
            <div className="text-sm text-gray-600 mt-2 space-y-1">
              <p>📞 {patient.phone}</p>
              {patient.email && <p>✉️ {patient.email}</p>}
              {patient.birth_date && (
                <p>
                  🎂{" "}
                  {new Date(patient.birth_date).toLocaleDateString("id-ID", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                  {age !== null && ` (${age} tahun)`}
                </p>
              )}
              {patient.gender && <p>{GENDER_LABELS[patient.gender]}</p>}
              {patient.address && <p>📍 {patient.address}</p>}
            </div>
            {patient.allergies && (
              <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                ⚠️ <strong>Alergi:</strong> {patient.allergies}
              </div>
            )}
            {patient.medical_notes && (
              <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-sm text-yellow-800">
                📝 <strong>Catatan Medis:</strong> {patient.medical_notes}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ========== Ringkasan Odontogram ========== */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="card text-center">
            <p className="text-xs text-gray-500">Total Gigi</p>
            <p className="text-2xl font-bold">{summary.total_teeth}</p>
          </div>
          <div className="card text-center">
            <p className="text-xs text-gray-500">Sehat</p>
            <p className="text-2xl font-bold text-green-600">
              {summary.healthy}
            </p>
          </div>
          <div className="card text-center">
            <p className="text-xs text-gray-500">Bermasalah</p>
            <p className="text-2xl font-bold text-red-600">
              {summary.affected}
            </p>
          </div>
          <div className="card text-center">
            <p className="text-xs text-gray-500">Sudah Ditangani</p>
            <p className="text-2xl font-bold text-blue-600">
              {summary.treated || 0}
            </p>
          </div>
        </div>
      )}

      {/* ========== Tabs ========== */}
      <div className="flex border-b border-gray-200 mb-4">
        <button
          onClick={() => handleTabChange("odontogram")}
          className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
            tab === "odontogram"
              ? "border-primary-600 text-primary-600"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          🦷 Odontogram
        </button>
        <button
          onClick={() => handleTabChange("riwayat")}
          className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
            tab === "riwayat"
              ? "border-primary-600 text-primary-600"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          📋 Riwayat
        </button>
      </div>

      {/* ========== Tab Odontogram ========== */}
      {tab === "odontogram" && (
        <div className="card">
          <div className="mb-4">
            <h2 className="text-xl font-bold mb-1">Peta Gigi</h2>
            <p className="text-sm text-gray-500">
              Klik gigi untuk mencatat atau melihat kondisinya.
            </p>
          </div>
          {odontogram ? (
            <div className="overflow-x-auto">
              <Odontogram
                teeth={odontogram.teeth}
                onToothClick={(num) => setSelectedTooth(num)}
              />
            </div>
          ) : (
            <p className="text-gray-500">Data odontogram tidak tersedia.</p>
          )}
        </div>
      )}

      {/* ========== Tab Riwayat ========== */}
      {tab === "riwayat" && (
        <div className="card">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">
              {historyFilter
                ? `Riwayat Gigi ${historyFilter}`
                : "Semua Riwayat Odontogram"}
            </h2>
            {historyFilter && (
              <button
                onClick={() => loadHistory()}
                className="text-sm text-primary-600 hover:underline"
              >
                ← Lihat Semua Riwayat
              </button>
            )}
          </div>

          {toothHistory.length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              Belum ada riwayat odontogram.
            </p>
          ) : (
            <div className="space-y-2">
              {toothHistory.map((entry) => (
                <div
                  key={entry.id}
                  className="flex items-start gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
                >
                  <div className="w-14 text-center">
                    <div className="font-mono font-bold text-primary-600 text-lg">
                      {entry.tooth_number}
                    </div>
                    <div className="text-xs text-gray-400">Gigi</div>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium capitalize">
                        {entry.condition.replace("_", " ")}
                      </span>
                      {entry.surface && (
                        <span className="text-xs bg-gray-100 px-2 py-0.5 rounded">
                          {entry.surface}
                        </span>
                      )}
                    </div>
                    {entry.notes && (
                      <p className="text-sm text-gray-600">{entry.notes}</p>
                    )}
                    <p className="text-xs text-gray-400 mt-1">
                      {new Date(entry.recorded_at).toLocaleString("id-ID")}
                      {entry.recorded_by_name &&
                        ` · oleh ${entry.recorded_by_name}`}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ========== Modal Catat Kondisi ========== */}
      {selectedTooth && (
        <ToothConditionModal
          patientId={patient.id}
          toothNumber={selectedTooth}
          onClose={() => setSelectedTooth(null)}
          onSuccess={() => {
            setSelectedTooth(null);
            load();
          }}
          onViewHistory={(num) => {
            loadHistory(num);
            setTab("riwayat");
          }}
        />
      )}
    </div>
  );
}
