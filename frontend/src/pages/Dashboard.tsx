import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../lib/api";

export default function Dashboard() {
  const [todayAppts, setTodayAppts] = useState<any[]>([]);
  const [queueStats, setQueueStats] = useState<any>(null);
  const [invoiceSummary, setInvoiceSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [a, q, i] = await Promise.all([
          api.get("/appointments/today"),
          api.get("/queue/stats"),
          api.get("/invoices/summary"),
        ]);
        setTodayAppts(a.data.data);
        setQueueStats(q.data.data);
        setInvoiceSummary(i.data.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) return <p>Memuat...</p>;

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Dashboard</h1>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="card">
          <p className="text-sm text-gray-500">Jadwal Hari Ini</p>
          <p className="text-3xl font-bold text-primary-600">
            {todayAppts.length}
          </p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-500">Antrian Menunggu</p>
          <p className="text-3xl font-bold text-yellow-600">
            {queueStats?.waiting || 0}
          </p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-500">Pendapatan</p>
          <p className="text-3xl font-bold text-green-600">
            Rp {(invoiceSummary?.total_paid || 0).toLocaleString("id-ID")}
          </p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-500">Belum Dibayar</p>
          <p className="text-3xl font-bold text-red-600">
            Rp{" "}
            {(invoiceSummary?.total_outstanding || 0).toLocaleString("id-ID")}
          </p>
        </div>
      </div>

      {/* Jadwal Hari Ini */}
      <div className="card">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">📅 Jadwal Hari Ini</h2>
          <Link
            to="/appointments"
            className="text-sm text-primary-600 hover:underline"
          >
            Lihat semua →
          </Link>
        </div>
        {todayAppts.length === 0 ? (
          <p className="text-gray-500">Belum ada jadwal hari ini.</p>
        ) : (
          <div className="space-y-2">
            {todayAppts.map((appt) => (
              <div
                key={appt.id}
                className="flex justify-between items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
              >
                <div>
                  <p className="font-medium">{appt.patient_name}</p>
                  <p className="text-sm text-gray-500">
                    {appt.complaint || "-"}
                  </p>
                </div>
                <div className="text-right flex items-center gap-3">
                  <div>
                    <p className="font-medium">
                      {new Date(appt.scheduled_at).toLocaleTimeString("id-ID", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                    <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded">
                      {appt.status}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
