import { query } from "../../config/database";
import { todayLocal } from "../../utils/date";

// Ambil nomor antrian berikutnya untuk hari ini
const generateQueueNumber = async (date: string): Promise<number> => {
  const rows = await query<{ next: number }>(
    `SELECT COALESCE(MAX(queue_number), 0) + 1 AS next
     FROM queue_tickets
     WHERE queue_date = $1`,
    [date],
  );
  return rows[0].next;
};

// Format nomor antrian: A-001
const formatQueueNumber = (n: number): string => {
  return `A-${String(n).padStart(3, "0")}`;
};

// Ambil nomor antrian baru
export const takeQueue = async (data: {
  patient_id?: string;
  appointment_id?: string;
  source?: string;
  queue_date?: string;
}) => {
  const date = data.queue_date || todayLocal();
  const source = data.source || "walk_in";

  // Validasi: kalau patient_id ada, pastikan ada
  if (data.patient_id) {
    const p = await query("SELECT id FROM patients WHERE id = $1", [
      data.patient_id,
    ]);
    if (p.length === 0)
      throw { status: 404, message: "Pasien tidak ditemukan" };
  }

  const queueNumber = await generateQueueNumber(date);

  const rows = await query(
    `INSERT INTO queue_tickets
       (patient_id, appointment_id, queue_date, queue_number, status, source)
     VALUES ($1, $2, $3, $4, 'waiting', $5)
     RETURNING *`,
    [
      data.patient_id || null,
      data.appointment_id || null,
      date,
      queueNumber,
      source,
    ],
  );

  const ticket = rows[0];
  return {
    ...ticket,
    queue_code: formatQueueNumber(ticket.queue_number),
  };
};

// List antrian hari ini
export const listQueue = async (filters: {
  date?: string;
  status?: string;
  source?: string;
}) => {
  const date = filters.date || todayLocal();
  const conditions = ["q.queue_date = $1"];
  const params: any[] = [date];
  let i = 2;

  if (filters.status) {
    conditions.push(`q.status = $${i++}`);
    params.push(filters.status);
  }
  if (filters.source) {
    conditions.push(`q.source = $${i++}`);
    params.push(filters.source);
  }

  const rows = await query(
    `SELECT
       q.*,
       p.full_name AS patient_name,
       p.phone AS patient_phone
     FROM queue_tickets q
     LEFT JOIN patients p ON p.id = q.patient_id
     WHERE ${conditions.join(" AND ")}
     ORDER BY q.queue_number ASC`,
    params,
  );

  return rows.map((r: any) => ({
    ...r,
    queue_code: formatQueueNumber(r.queue_number),
  }));
};

// Ambil detail satu ticket
export const getQueueTicket = async (id: string) => {
  const rows = await query(
    `SELECT
       q.*,
       p.full_name AS patient_name,
       p.phone AS patient_phone
     FROM queue_tickets q
     LEFT JOIN patients p ON p.id = q.patient_id
     WHERE q.id = $1`,
    [id],
  );
  if (rows.length === 0)
    throw { status: 404, message: "Antrian tidak ditemukan" };
  const t = rows[0];
  return { ...t, queue_code: formatQueueNumber(t.queue_number) };
};

// Update status antrian (called / serving / done / skipped)
export const updateQueueStatus = async (id: string, status: string) => {
  const allowed = ["waiting", "called", "serving", "done", "skipped"];
  if (!allowed.includes(status))
    throw { status: 400, message: "Status tidak valid" };

  const timestampField: Record<string, string> = {
    called: "called_at",
    serving: "served_at",
    done: "completed_at",
  };
  const timeUpdate = timestampField[status]
    ? `, ${timestampField[status]} = NOW()`
    : "";

  const rows = await query(
    `UPDATE queue_tickets
     SET status = $1${timeUpdate}
     WHERE id = $2
     RETURNING *`,
    [status, id],
  );
  if (rows.length === 0)
    throw { status: 404, message: "Antrian tidak ditemukan" };
  const t = rows[0];
  return { ...t, queue_code: formatQueueNumber(t.queue_number) };
};

// Ambil antrian yang sedang dipanggil (yang statusnya 'called' paling awal)
export const currentQueue = async (date?: string) => {
  const d = date || todayLocal();
  const rows = await query(
    `SELECT
       q.*,
       p.full_name AS patient_name,
       p.phone AS patient_phone
     FROM queue_tickets q
     LEFT JOIN patients p ON p.id = q.patient_id
     WHERE q.queue_date = $1 AND q.status IN ('called', 'serving')
     ORDER BY q.queue_number ASC
     LIMIT 1`,
    [d],
  );
  if (rows.length === 0) return null;
  const t = rows[0];
  return { ...t, queue_code: formatQueueNumber(t.queue_number) };
};

// Panggil antrian berikutnya (yang masih waiting dengan nomor terkecil)
export const callNext = async (date?: string) => {
  const d = date || todayLocal();
  const rows = await query(
    `SELECT id FROM queue_tickets
     WHERE queue_date = $1 AND status = 'waiting'
     ORDER BY queue_number ASC
     LIMIT 1`,
    [d],
  );
  if (rows.length === 0)
    throw { status: 404, message: "Tidak ada antrian yang menunggu" };
  return updateQueueStatus(rows[0].id, "called");
};

// Statistik antrian hari ini
export const queueStats = async (date?: string) => {
  const d = date || todayLocal();
  const rows = await query<{ status: string; count: string }>(
    `SELECT status, COUNT(*)::text AS count
     FROM queue_tickets
     WHERE queue_date = $1
     GROUP BY status`,
    [d],
  );
  const stats: Record<string, number> = {
    waiting: 0,
    called: 0,
    serving: 0,
    done: 0,
    skipped: 0,
  };
  for (const r of rows) stats[r.status] = parseInt(r.count, 10);
  const total = Object.values(stats).reduce((a, b) => a + b, 0);
  return { date: d, total, ...stats };
};
