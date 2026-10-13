import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { api } from "../lib/api";
import { toast } from "../lib/toast";

type Invoice = {
  id: string;
  invoice_number: string;
  patient_name: string;
  patient_phone: string;
  total_amount: string;
  paid_amount: string;
  status: string;
  created_at: string;
};

type Patient = {
  id: string;
  full_name: string;
  phone: string;
};

const STATUS_COLORS: Record<string, string> = {
  unpaid: "bg-red-100 text-red-700",
  partial: "bg-yellow-100 text-yellow-700",
  paid: "bg-green-100 text-green-700",
  cancelled: "bg-gray-100 text-gray-500",
};

export default function Invoices() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [filterStatus, setFilterStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);

  const load = async () => {
    setLoading(true);
    try {
      const [inv, sum] = await Promise.all([
        api.get("/invoices", { params: { status: filterStatus || undefined } }),
        api.get("/invoices/summary"),
      ]);
      setInvoices(inv.data.data);
      setSummary(sum.data.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [filterStatus]);

  const openDetail = async (id: string) => {
    const res = await api.get(`/invoices/${id}`);
    setSelectedInvoice(res.data.data);
  };

  const formatRp = (n: string | number) => {
    return "Rp " + Number(n).toLocaleString("id-ID");
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Invoice</h1>
        <button onClick={() => setShowModal(true)} className="btn-primary">
          + Invoice Baru
        </button>
      </div>

      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="card">
            <p className="text-sm text-gray-500">Total Invoice</p>
            <p className="text-2xl font-bold">{summary.total_invoices}</p>
          </div>
          <div className="card">
            <p className="text-sm text-gray-500">Total Tagihan</p>
            <p className="text-2xl font-bold">
              {formatRp(summary.total_amount)}
            </p>
          </div>
          <div className="card">
            <p className="text-sm text-gray-500">Sudah Dibayar</p>
            <p className="text-2xl font-bold text-green-600">
              {formatRp(summary.total_paid)}
            </p>
          </div>
          <div className="card">
            <p className="text-sm text-gray-500">Belum Dibayar</p>
            <p className="text-2xl font-bold text-red-600">
              {formatRp(summary.total_outstanding)}
            </p>
          </div>
        </div>
      )}

      <div className="card mb-4">
        <label className="label">Filter Status</label>
        <select
          className="input"
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
        >
          <option value="">Semua</option>
          <option value="unpaid">Belum Dibayar</option>
          <option value="partial">Sebagian</option>
          <option value="paid">Lunas</option>
          <option value="cancelled">Dibatalkan</option>
        </select>
      </div>

      <div className="card">
        {loading ? (
          <p>Memuat...</p>
        ) : invoices.length === 0 ? (
          <p className="text-gray-500 text-center py-8">Belum ada invoice.</p>
        ) : (
          <table className="w-full">
            <thead className="text-left border-b border-gray-200">
              <tr>
                <th className="pb-3 font-medium text-gray-600">No. Invoice</th>
                <th className="pb-3 font-medium text-gray-600">Pasien</th>
                <th className="pb-3 font-medium text-gray-600">Total</th>
                <th className="pb-3 font-medium text-gray-600">Dibayar</th>
                <th className="pb-3 font-medium text-gray-600">Status</th>
                <th className="pb-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {invoices.map((inv) => (
                <tr key={inv.id} className="hover:bg-gray-50">
                  <td className="py-3 font-mono text-sm">
                    {inv.invoice_number}
                  </td>
                  <td className="py-3">
                    <p className="font-medium">{inv.patient_name}</p>
                    <p className="text-xs text-gray-500">{inv.patient_phone}</p>
                  </td>
                  <td className="py-3">{formatRp(inv.total_amount)}</td>
                  <td className="py-3">{formatRp(inv.paid_amount)}</td>
                  <td className="py-3">
                    <span
                      className={`text-xs px-2 py-1 rounded ${
                        STATUS_COLORS[inv.status] || "bg-gray-100"
                      }`}
                    >
                      {inv.status}
                    </span>
                  </td>
                  <td className="py-3 text-right">
                    <button
                      onClick={() => openDetail(inv.id)}
                      className="text-primary-600 hover:underline text-sm"
                    >
                      Detail →
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showModal && (
        <InvoiceModal
          onClose={() => setShowModal(false)}
          onSuccess={() => {
            setShowModal(false);
            load();
          }}
        />
      )}

      {selectedInvoice && (
        <InvoiceDetailModal
          invoice={selectedInvoice}
          onClose={() => setSelectedInvoice(null)}
          onPaid={() => {
            setSelectedInvoice(null);
            load();
          }}
        />
      )}
    </div>
  );
}

function InvoiceModal({
  onClose,
  onSuccess,
}: {
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [patientId, setPatientId] = useState("");
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState([{ description: "", qty: 1, price: 0 }]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    api.get("/patients").then((res) => setPatients(res.data.data));
  }, []);

  const total = items.reduce((s, i) => s + i.qty * i.price, 0);

  const addItem = () =>
    setItems([...items, { description: "", qty: 1, price: 0 }]);
  const removeItem = (i: number) =>
    setItems(items.filter((_, idx) => idx !== i));
  const updateItem = (i: number, field: string, value: any) => {
    setItems(
      items.map((item, idx) =>
        idx === i ? { ...item, [field]: value } : item,
      ),
    );
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await api.post("/invoices", {
        patient_id: patientId,
        items: items.filter((i) => i.description && i.qty > 0),
        notes,
      });
      onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.message || "Gagal");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-auto p-6">
        <h2 className="text-xl font-bold mb-4">Buat Invoice Baru</h2>
        {error && (
          <div className="mb-3 p-3 bg-red-50 text-red-700 rounded text-sm">
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Pasien *</label>
            <select
              className="input"
              required
              value={patientId}
              onChange={(e) => setPatientId(e.target.value)}
            >
              <option value="">-- Pilih --</option>
              {patients.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.full_name} ({p.phone})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="label">Item Tindakan</label>

            {/* Header kolom */}
            <div className="grid grid-cols-12 gap-2 mb-1 px-1">
              <div className="col-span-5 text-xs font-medium text-gray-600">
                Deskripsi
              </div>
              <div className="col-span-2 text-xs font-medium text-gray-600 text-center">
                Jumlah
              </div>
              <div className="col-span-3 text-xs font-medium text-gray-600 text-right">
                Harga Satuan
              </div>
              <div className="col-span-2 text-xs font-medium text-gray-600 text-right">
                Subtotal
              </div>
            </div>

            <div className="space-y-2">
              {items.map((item, i) => (
                <div key={i} className="grid grid-cols-12 gap-2 items-center">
                  <input
                    placeholder="cth: Tambal Gigi 36"
                    className="input col-span-5"
                    value={item.description}
                    onChange={(e) =>
                      updateItem(i, "description", e.target.value)
                    }
                  />
                  <input
                    type="number"
                    min="1"
                    className="input col-span-2 text-center"
                    value={item.qty}
                    onChange={(e) =>
                      updateItem(i, "qty", parseInt(e.target.value) || 1)
                    }
                  />
                  <input
                    type="number"
                    min="0"
                    className="input col-span-3 text-right"
                    value={item.price}
                    onChange={(e) =>
                      updateItem(i, "price", parseFloat(e.target.value) || 0)
                    }
                  />
                  <div className="col-span-2 text-right text-sm font-medium pr-1">
                    <span className="text-sm font-medium">
                      Rp {(item.qty * item.price).toLocaleString("id-ID")}
                    </span>
                    {items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeItem(i)}
                        className="text-red-400 hover:text-red-600 text=xs ml-1"
                        title="hapus item"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={addItem}
              className="text-primary-600 text-sm mt-3 hover:underline"
            >
              + Tambah Item
            </button>
          </div>

          <div className="border-t pt-3 bg-gray-50 -mx-6 px-6 py-4">
            <div className="flex justify-between text-sm text-gray-600 mb-1">
              <span>Jumlah item:</span>
              <span>{items.filter((i) => i.description).length}</span>
            </div>
            <div className="flex justify-between font-bold text-lg">
              <span>Total</span>
              <span>Rp {total.toLocaleString("id-ID")}</span>
            </div>
          </div>

          <div>
            <label className="label">Catatan</label>
            <textarea
              className="input"
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
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
              {loading ? "Menyimpan..." : "Buat Invoice"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function InvoiceDetailModal({
  invoice,
  onClose,
  onPaid,
}: {
  invoice: any;
  onClose: () => void;
  onPaid: () => void;
}) {
  const [amount, setAmount] = useState<number>(
    Number(invoice.total_amount) - Number(invoice.paid_amount),
  );
  const [loading, setLoading] = useState(false);

  const formatRp = (n: any) => "Rp " + Number(n).toLocaleString("id-ID");
  const outstanding =
    Number(invoice.total_amount) - Number(invoice.paid_amount);

  const handlePay = async () => {
    setLoading(true);
    try {
      await api.post(`/invoices/${invoice.id}/pay`, { amount });
      onPaid();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Gagal bayar");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-auto p-6 invoice-print-area">
        {/* Header */}
        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 className="text-xl font-bold font-mono">
              {invoice.invoice_number}
            </h2>
            <p className="text-sm text-gray-500">
              {new Date(invoice.created_at).toLocaleString("id-ID")}
            </p>
          </div>
          <div className="flex gap-2 no-print">
            <button
              onClick={() => window.print()}
              className="text-xs px-3 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
            >
              🖨️ Print
            </button>
            <span
              className={`text-xs px-3 py-1 rounded ${
                STATUS_COLORS[invoice.status] || "bg-gray-100"
              }`}
            >
              {invoice.status}
            </span>
          </div>
        </div>

        {/* Info Pasien */}
        <div className="mb-4">
          <p className="text-sm text-gray-500">Pasien</p>
          <p className="font-medium">{invoice.patient_name}</p>
          <p className="text-sm text-gray-500">{invoice.patient_phone}</p>
          {invoice.patient_address && (
            <p className="text-sm text-gray-500">{invoice.patient_address}</p>
          )}
        </div>

        {/* Items */}
        <div className="border-t border-b py-3 mb-4">
          {invoice.items?.map((item: any) => (
            <div key={item.id} className="flex justify-between py-1 text-sm">
              <span>
                {item.description} × {item.qty}
              </span>
              <span>{formatRp(item.subtotal)}</span>
            </div>
          ))}
        </div>

        {/* Total */}
        <div className="space-y-1 mb-4">
          <div className="flex justify-between">
            <span>Total</span>
            <span className="font-medium">
              {formatRp(invoice.total_amount)}
            </span>
          </div>
          <div className="flex justify-between text-green-600">
            <span>Dibayar</span>
            <span className="font-medium">{formatRp(invoice.paid_amount)}</span>
          </div>
          <div className="flex justify-between font-bold text-lg border-t pt-2">
            <span>Sisa</span>
            <span
              className={outstanding > 0 ? "text-red-600" : "text-green-600"}
            >
              {formatRp(outstanding)}
            </span>
          </div>
        </div>

        {/* Form Bayar */}
        {outstanding > 0 && (
          <div className="mb-4 no-print">
            <label className="label">Jumlah Bayar</label>
            <input
              type="number"
              className="input"
              value={amount}
              onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
              max={outstanding}
            />
            <button
              onClick={handlePay}
              disabled={loading}
              className="btn-primary w-full mt-2"
            >
              {loading ? "Memproses..." : `Bayar ${formatRp(amount)}`}
            </button>
          </div>
        )}

        <button onClick={onClose} className="btn-secondary w-full no-print">
          Tutup
        </button>
      </div>
    </div>
  );
}
