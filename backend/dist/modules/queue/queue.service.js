"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.queueStats = exports.callNext = exports.currentQueue = exports.updateQueueStatus = exports.getQueueTicket = exports.listQueue = exports.takeQueue = void 0;
const database_1 = require("../../config/database");
const date_1 = require("../../utils/date");
// Ambil nomor antrian berikutnya untuk hari ini
const generateQueueNumber = async (date) => {
    const rows = await (0, database_1.query)(`SELECT COALESCE(MAX(queue_number), 0) + 1 AS next
     FROM queue_tickets
     WHERE queue_date = $1`, [date]);
    return rows[0].next;
};
// Format nomor antrian: A-001
const formatQueueNumber = (n) => {
    return `A-${String(n).padStart(3, "0")}`;
};
// Ambil nomor antrian baru
const takeQueue = async (data) => {
    const date = data.queue_date || (0, date_1.todayLocal)();
    const source = data.source || "walk_in";
    // Validasi: kalau patient_id ada, pastikan ada
    if (data.patient_id) {
        const p = await (0, database_1.query)("SELECT id FROM patients WHERE id = $1", [
            data.patient_id,
        ]);
        if (p.length === 0)
            throw { status: 404, message: "Pasien tidak ditemukan" };
    }
    const queueNumber = await generateQueueNumber(date);
    const rows = await (0, database_1.query)(`INSERT INTO queue_tickets
       (patient_id, appointment_id, queue_date, queue_number, status, source)
     VALUES ($1, $2, $3, $4, 'waiting', $5)
     RETURNING *`, [
        data.patient_id || null,
        data.appointment_id || null,
        date,
        queueNumber,
        source,
    ]);
    const ticket = rows[0];
    return {
        ...ticket,
        queue_code: formatQueueNumber(ticket.queue_number),
    };
};
exports.takeQueue = takeQueue;
// List antrian hari ini
const listQueue = async (filters) => {
    const date = filters.date || (0, date_1.todayLocal)();
    const conditions = ["q.queue_date = $1"];
    const params = [date];
    let i = 2;
    if (filters.status) {
        conditions.push(`q.status = $${i++}`);
        params.push(filters.status);
    }
    if (filters.source) {
        conditions.push(`q.source = $${i++}`);
        params.push(filters.source);
    }
    const rows = await (0, database_1.query)(`SELECT
       q.*,
       p.full_name AS patient_name,
       p.phone AS patient_phone
     FROM queue_tickets q
     LEFT JOIN patients p ON p.id = q.patient_id
     WHERE ${conditions.join(" AND ")}
     ORDER BY q.queue_number ASC`, params);
    return rows.map((r) => ({
        ...r,
        queue_code: formatQueueNumber(r.queue_number),
    }));
};
exports.listQueue = listQueue;
// Ambil detail satu ticket
const getQueueTicket = async (id) => {
    const rows = await (0, database_1.query)(`SELECT
       q.*,
       p.full_name AS patient_name,
       p.phone AS patient_phone
     FROM queue_tickets q
     LEFT JOIN patients p ON p.id = q.patient_id
     WHERE q.id = $1`, [id]);
    if (rows.length === 0)
        throw { status: 404, message: "Antrian tidak ditemukan" };
    const t = rows[0];
    return { ...t, queue_code: formatQueueNumber(t.queue_number) };
};
exports.getQueueTicket = getQueueTicket;
// Update status antrian (called / serving / done / skipped)
const updateQueueStatus = async (id, status) => {
    const allowed = ["waiting", "called", "serving", "done", "skipped"];
    if (!allowed.includes(status))
        throw { status: 400, message: "Status tidak valid" };
    const timestampField = {
        called: "called_at",
        serving: "served_at",
        done: "completed_at",
    };
    const timeUpdate = timestampField[status]
        ? `, ${timestampField[status]} = NOW()`
        : "";
    const rows = await (0, database_1.query)(`UPDATE queue_tickets
     SET status = $1${timeUpdate}
     WHERE id = $2
     RETURNING *`, [status, id]);
    if (rows.length === 0)
        throw { status: 404, message: "Antrian tidak ditemukan" };
    const t = rows[0];
    return { ...t, queue_code: formatQueueNumber(t.queue_number) };
};
exports.updateQueueStatus = updateQueueStatus;
// Ambil antrian yang sedang dipanggil (yang statusnya 'called' paling awal)
const currentQueue = async (date) => {
    const d = date || (0, date_1.todayLocal)();
    const rows = await (0, database_1.query)(`SELECT
       q.*,
       p.full_name AS patient_name,
       p.phone AS patient_phone
     FROM queue_tickets q
     LEFT JOIN patients p ON p.id = q.patient_id
     WHERE q.queue_date = $1 AND q.status IN ('called', 'serving')
     ORDER BY q.queue_number ASC
     LIMIT 1`, [d]);
    if (rows.length === 0)
        return null;
    const t = rows[0];
    return { ...t, queue_code: formatQueueNumber(t.queue_number) };
};
exports.currentQueue = currentQueue;
// Panggil antrian berikutnya (yang masih waiting dengan nomor terkecil)
const callNext = async (date) => {
    const d = date || (0, date_1.todayLocal)();
    const rows = await (0, database_1.query)(`SELECT id FROM queue_tickets
     WHERE queue_date = $1 AND status = 'waiting'
     ORDER BY queue_number ASC
     LIMIT 1`, [d]);
    if (rows.length === 0)
        throw { status: 404, message: "Tidak ada antrian yang menunggu" };
    return (0, exports.updateQueueStatus)(rows[0].id, "called");
};
exports.callNext = callNext;
// Statistik antrian hari ini
const queueStats = async (date) => {
    const d = date || (0, date_1.todayLocal)();
    const rows = await (0, database_1.query)(`SELECT status, COUNT(*)::text AS count
     FROM queue_tickets
     WHERE queue_date = $1
     GROUP BY status`, [d]);
    const stats = {
        waiting: 0,
        called: 0,
        serving: 0,
        done: 0,
        skipped: 0,
    };
    for (const r of rows)
        stats[r.status] = parseInt(r.count, 10);
    const total = Object.values(stats).reduce((a, b) => a + b, 0);
    return { date: d, total, ...stats };
};
exports.queueStats = queueStats;
