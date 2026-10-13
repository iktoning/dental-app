import { useEffect, useState } from "react";
import { publicApi } from "../lib/api";

type CurrentQueue = {
  queue_code: string;
  patient_name: string;
  status: string;
} | null;

type Stats = {
  date: string;
  total: number;
  waiting: number;
  called: number;
  serving: number;
  done: number;
  skipped: number;
};

export default function PublicQueueDisplay() {
  const [current, setCurrent] = useState<CurrentQueue>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [time, setTime] = useState(new Date());

  const loadData = async () => {
    try {
      const [c, s] = await Promise.all([
        publicApi.get("/queue/current"),
        publicApi.get("/queue/stats"),
      ]);
      setCurrent(c.data.data);
      setStats(s.data.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 5000); // refresh tiap 5 detik
    return () => clearInterval(interval);
  }, []);

  // Jam digital
  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const statusLabel: Record<string, string> = {
    called: "Sedang Dipanggil",
    serving: "Sedang Dilayani",
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-primary-900 via-primary-700 to-primary-900 text-white p-8">
      {/* Header */}
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-4xl font-bold">🦷 Klinik Gigi</h1>
          <p className="text-primary-200 text-lg mt-1">
            Sistem Antrian Digital
          </p>
        </div>
        <div className="text-right">
          <p className="text-3xl font-mono font-bold">
            {time.toLocaleTimeString("id-ID", {
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
            })}
          </p>
          <p className="text-primary-200 text-sm">
            {time.toLocaleDateString("id-ID", {
              weekday: "long",
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </p>
        </div>
      </div>

      {/* Nomor yang Sedang Dipanggil */}
      <div className="bg-white/10 backdrop-blur rounded-3xl p-12 mb-8 border-2 border-white/20">
        <p className="text-center text-xl text-primary-200 mb-4">
          {current
            ? statusLabel[current.status] || "Sedang Dipanggil"
            : "Belum Ada Antrian"}
        </p>

        {current ? (
          <>
            <p className="text-center text-[10rem] leading-none font-black text-white drop-shadow-lg">
              {current.queue_code}
            </p>
            <p className="text-center text-3xl font-semibold text-primary-100 mt-4">
              {current.patient_name}
            </p>
            <p className="text-center text-lg text-primary-200 mt-2">
              Silakan menuju ruang perawatan
            </p>
          </>
        ) : (
          <p className="text-center text-6xl font-bold text-primary-200 py-12">
            --
          </p>
        )}
      </div>

      {/* Statistik */}
      {stats && (
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-yellow-500/20 border-2 border-yellow-400/40 rounded-2xl p-6 text-center">
            <p className="text-yellow-200 text-sm mb-1">Menunggu</p>
            <p className="text-5xl font-bold">{stats.waiting}</p>
          </div>
          <div className="bg-blue-500/20 border-2 border-blue-400/40 rounded-2xl p-6 text-center">
            <p className="text-blue-200 text-sm mb-1">Dipanggil</p>
            <p className="text-5xl font-bold">{stats.called}</p>
          </div>
          <div className="bg-purple-500/20 border-2 border-purple-400/40 rounded-2xl p-6 text-center">
            <p className="text-purple-200 text-sm mb-1">Dilayani</p>
            <p className="text-5xl font-bold">{stats.serving}</p>
          </div>
          <div className="bg-green-500/20 border-2 border-green-400/40 rounded-2xl p-6 text-center">
            <p className="text-green-200 text-sm mb-1">Selesai</p>
            <p className="text-5xl font-bold">{stats.done}</p>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="mt-8 text-center text-primary-200 text-sm">
        Halaman ini memperbarui otomatis setiap 5 detik
      </div>
    </div>
  );
}
