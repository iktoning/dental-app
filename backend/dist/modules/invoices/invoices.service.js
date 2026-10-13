"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSummary = exports.deleteInvoice = exports.recordPayment = exports.updateInvoice = exports.createFromAppointment = exports.createInvoice = exports.getInvoice = exports.listInvoices = void 0;
const database_1 = require("../../config/database");
const listInvoices = async (filters) => {
    const conditions = [];
    const params = [];
    let i = 1;
    if (filters.status) {
        conditions.push(`i.status = $${i++}`);
        params.push(filters.status);
    }
    if (filters.patientId) {
        conditions.push(`i.patient_id = $${i++}`);
        params.push(filters.patientId);
    }
    if (filters.from) {
        conditions.push(`i.created_at >= $${i++}`);
        params.push(filters.from);
    }
    if (filters.to) {
        conditions.push(`i.created_at <= $${i++}`);
        params.push(filters.to);
    }
    const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
    return (0, database_1.query)(`SELECT
       i.*,
       p.full_name AS patient_name,
       p.phone AS patient_phone
     FROM invoices i
     JOIN patients p ON p.id = i.patient_id
     ${where}
     ORDER BY i.created_at DESC
     LIMIT 200`, params);
};
exports.listInvoices = listInvoices;
const getInvoice = async (id) => {
    const inv = await (0, database_1.query)(`SELECT
       i.*,
       p.full_name AS patient_name,
       p.phone AS patient_phone,
       p.address AS patient_address
     FROM invoices i
     JOIN patients p ON p.id = i.patient_id
     WHERE i.id = $1`, [id]);
    if (inv.length === 0)
        throw { status: 404, message: "Invoice tidak ditemukan" };
    const items = await (0, database_1.query)(`SELECT * FROM invoice_items WHERE invoice_id = $1 ORDER BY id`, [id]);
    return { ...inv[0], items };
};
exports.getInvoice = getInvoice;
const createInvoice = async (data) => {
    if (!data.items || data.items.length === 0) {
        throw { status: 400, message: "Invoice harus memiliki minimal 1 item" };
    }
    // Pastikan pasien ada
    const p = await (0, database_1.query)("SELECT id FROM patients WHERE id = $1", [
        data.patient_id,
    ]);
    if (p.length === 0)
        throw { status: 404, message: "Pasien tidak ditemukan" };
    // Hitung total
    const totalAmount = data.items.reduce((sum, item) => sum + item.qty * item.price, 0);
    const client = await database_1.pool.connect();
    try {
        await client.query("BEGIN");
        // Insert invoice (invoice_number akan digenerate otomatis oleh trigger)
        const invRes = await client.query(`INSERT INTO invoices
         (patient_id, appointment_id, total_amount, notes, created_by)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`, [
            data.patient_id,
            data.appointment_id || null,
            totalAmount,
            data.notes || null,
            data.created_by || null,
        ]);
        const invoice = invRes.rows[0];
        // Insert items
        for (const item of data.items) {
            const subtotal = item.qty * item.price;
            await client.query(`INSERT INTO invoice_items (invoice_id, description, qty, price, subtotal)
         VALUES ($1, $2, $3, $4, $5)`, [invoice.id, item.description, item.qty, item.price, subtotal]);
        }
        await client.query("COMMIT");
        // Ambil invoice lengkap dengan items
        return (0, exports.getInvoice)(invoice.id);
    }
    catch (err) {
        await client.query("ROLLBACK");
        throw err;
    }
    finally {
        client.release();
    }
};
exports.createInvoice = createInvoice;
// Generate invoice otomatis dari treatments pada appointment
const createFromAppointment = async (appointmentId, createdBy) => {
    const treatments = await (0, database_1.query)(`SELECT
       t.id, t.tooth_number, t.price, t.diagnosis,
       s.name AS service_name
     FROM treatments t
     LEFT JOIN services s ON s.id = t.service_id
     WHERE t.appointment_id = $1`, [appointmentId]);
    if (treatments.length === 0) {
        throw { status: 400, message: "Appointment ini belum memiliki tindakan" };
    }
    const appt = await (0, database_1.query)("SELECT patient_id FROM appointments WHERE id = $1", [appointmentId]);
    if (appt.length === 0)
        throw { status: 404, message: "Appointment tidak ditemukan" };
    const items = treatments.map((t) => ({
        description: t.service_name
            ? `${t.service_name}${t.tooth_number ? ` - Gigi ${t.tooth_number}` : ""}`
            : t.diagnosis || "Tindakan",
        qty: 1,
        price: Number(t.price),
    }));
    return (0, exports.createInvoice)({
        patient_id: appt[0].patient_id,
        appointment_id: appointmentId,
        items,
        created_by: createdBy,
    });
};
exports.createFromAppointment = createFromAppointment;
const updateInvoice = async (id, data) => {
    const fields = [];
    const values = [];
    let i = 1;
    if (data.notes !== undefined) {
        fields.push(`notes = $${i++}`);
        values.push(data.notes);
    }
    if (data.status !== undefined) {
        const validStatuses = ["unpaid", "partial", "paid", "cancelled"];
        if (!validStatuses.includes(data.status)) {
            throw { status: 400, message: "Status tidak valid" };
        }
        fields.push(`status = $${i++}`);
        values.push(data.status);
    }
    if (fields.length === 0)
        throw { status: 400, message: "Tidak ada data yang diubah" };
    values.push(id);
    const rows = await (0, database_1.query)(`UPDATE invoices SET ${fields.join(", ")} WHERE id = $${i} RETURNING *`, values);
    if (rows.length === 0)
        throw { status: 404, message: "Invoice tidak ditemukan" };
    return rows[0];
};
exports.updateInvoice = updateInvoice;
// Catat pembayaran
const recordPayment = async (id, amount) => {
    if (amount <= 0)
        throw { status: 400, message: "Jumlah pembayaran harus > 0" };
    const inv = await (0, database_1.query)("SELECT * FROM invoices WHERE id = $1", [id]);
    if (inv.length === 0)
        throw { status: 404, message: "Invoice tidak ditemukan" };
    const invoice = inv[0];
    const total = Number(invoice.total_amount);
    const paid = Number(invoice.paid_amount);
    const newPaid = paid + amount;
    if (newPaid > total) {
        throw {
            status: 400,
            message: `Jumlah bayar melebihi total. Total: ${total}, sudah bayar: ${paid}, sisa: ${total - paid}`,
        };
    }
    let status = "unpaid";
    let paidAt = null;
    if (newPaid >= total) {
        status = "paid";
        paidAt = new Date().toISOString();
    }
    else if (newPaid > 0) {
        status = "partial";
    }
    const rows = await (0, database_1.query)(`UPDATE invoices
     SET paid_amount = $1, status = $2, paid_at = $3
     WHERE id = $4
     RETURNING *`, [newPaid, status, paidAt, id]);
    return rows[0];
};
exports.recordPayment = recordPayment;
const deleteInvoice = async (id) => {
    const rows = await (0, database_1.query)("DELETE FROM invoices WHERE id = $1 RETURNING id", [
        id,
    ]);
    if (rows.length === 0)
        throw { status: 404, message: "Invoice tidak ditemukan" };
};
exports.deleteInvoice = deleteInvoice;
// Ringkasan keuangan (untuk dashboard)
const getSummary = async (from, to) => {
    const params = [];
    const conditions = [];
    let i = 1;
    if (from) {
        conditions.push(`created_at >= $${i++}`);
        params.push(from);
    }
    if (to) {
        conditions.push(`created_at <= $${i++}`);
        params.push(to);
    }
    const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
    const rows = await (0, database_1.query)(`SELECT
       status,
       COUNT(*)::text AS count,
       COALESCE(SUM(total_amount), 0)::text AS total,
       COALESCE(SUM(paid_amount), 0)::text AS paid
     FROM invoices
     ${where}
     GROUP BY status`, params);
    const summary = {
        total_invoices: 0,
        total_amount: 0,
        total_paid: 0,
        total_outstanding: 0,
        by_status: {},
    };
    for (const r of rows) {
        const count = parseInt(r.count, 10);
        const total = parseFloat(r.total);
        const paid = parseFloat(r.paid);
        summary.total_invoices += count;
        summary.total_amount += total;
        summary.total_paid += paid;
        summary.by_status[r.status] = { count, total, paid };
    }
    summary.total_outstanding = summary.total_amount - summary.total_paid;
    return summary;
};
exports.getSummary = getSummary;
