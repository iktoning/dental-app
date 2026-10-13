import { query, pool } from "../../config/database";
import { todayLocal } from "../../utils/date";

export const listAppointments = async (filters: {
  date?: string;
  doctorId?: string;
  patientId?: string;
  status?: string;
  from?: string;
  to?: string;
}) => {
  const conditions: string[] = [];
  const params: any[] = [];
  let i = 1;

  if (filters.date) {
    conditions.push(`DATE(a.scheduled_at) = $${i++}`);
    params.push(filters.date);
  }
  if (filters.from) {
    conditions.push(`a.scheduled_at >= $${i++}`);
    params.push(filters.from);
  }
  if (filters.to) {
    conditions.push(`a.scheduled_at <= $${i++}`);
    params.push(filters.to);
  }
  if (filters.doctorId) {
    conditions.push(`a.doctor_id = $${i++}`);
    params.push(filters.doctorId);
  }
  if (filters.patientId) {
    conditions.push(`a.patient_id = $${i++}`);
    params.push(filters.patientId);
  }
  if (filters.status) {
    conditions.push(`a.status = $${i++}`);
    params.push(filters.status);
  }

  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

  return query(
    `SELECT
       a.*,
       p.full_name AS patient_name,
       p.phone AS patient_phone,
       u.name AS doctor_name
     FROM appointments a
     JOIN patients p ON p.id = a.patient_id
     JOIN users u ON u.id = a.doctor_id
     ${where}
     ORDER BY a.scheduled_at ASC
     LIMIT 200`,
    params,
  );
};

export const getAppointment = async (id: string) => {
  const rows = await query(
    `SELECT
       a.*,
       p.full_name AS patient_name,
       p.phone AS patient_phone,
       p.allergies AS patient_allergies,
       u.name AS doctor_name
     FROM appointments a
     JOIN patients p ON p.id = a.patient_id
     JOIN users u ON u.id = a.doctor_id
     WHERE a.id = $1`,
    [id],
  );
  if (rows.length === 0)
    throw { status: 404, message: "Appointment tidak ditemukan" };
  return rows[0];
};

export const createAppointment = async (data: {
  patient_id: string;
  doctor_id?: string;
  scheduled_at: string;
  duration_min?: number;
  complaint?: string;
  source?: string;
  notes?: string;
  created_by?: string;
}) => {
  // Validasi: pasien ada?
  const patient = await query("SELECT id FROM patients WHERE id = $1", [
    data.patient_id,
  ]);
  if (patient.length === 0)
    throw { status: 404, message: "Pasien tidak ditemukan" };

  const duration = data.duration_min || 30;
  const source = data.source || "web";

  // Cek bentrok jadwal dokter (overlap)
  if (data.doctor_id) {
    const conflict = await query(
      `SELECT id FROM appointments
       WHERE doctor_id = $1
         AND status NOT IN ('cancelled', 'no_show')
         AND (
           (scheduled_at, scheduled_at + (duration_min || ' minutes')::interval)
           OVERLAPS
           ($2::timestamptz, $2::timestamptz + ($3 || ' minutes')::interval)
         )`,
      [data.doctor_id, data.scheduled_at, duration],
    );
    if (conflict.length > 0) {
      throw {
        status: 409,
        message: "Jadwal dokter bentrok dengan appointment lain",
      };
    }
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // Insert appointment
    const apptRes = await client.query(
      `INSERT INTO appointments
         (patient_id, doctor_id, scheduled_at, duration_min, complaint, source, notes, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        data.patient_id,
        data.doctor_id,
        data.scheduled_at,
        duration,
        data.complaint || null,
        source,
        data.notes || null,
        data.created_by || null,
      ],
    );
    const appointment = apptRes.rows[0];

    // 🔥 OTOMATIS BUAT QUEUE TICKET
    // Nomor antrian = jumlah queue hari itu + 1
    const apptDate = new Date(data.scheduled_at);
    const queueDate = apptDate.toLocaleDateString("en-CA", {
      timeZone: "Asia/Jakarta",
    }); // YYYY-MM-DD

    const qRes = await client.query(
      `SELECT COALESCE(MAX(queue_number), 0) + 1 AS next
       FROM queue_tickets WHERE queue_date = $1`,
      [queueDate],
    );
    const queueNumber = qRes.rows[0].next;

    await client.query(
      `INSERT INTO queue_tickets
         (patient_id, appointment_id, queue_date, queue_number, status, source)
       VALUES ($1, $2, $3, $4, 'waiting', $5)`,
      [data.patient_id, appointment.id, queueDate, queueNumber, source],
    );

    await client.query("COMMIT");
    return appointment;
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
};

export const updateAppointment = async (
  id: string,
  data: Partial<{
    scheduled_at: string;
    duration_min: number;
    complaint: string;
    notes: string;
    status: string;
  }>,
) => {
  const allowed = [
    "scheduled_at",
    "duration_min",
    "complaint",
    "notes",
    "status",
  ];
  const fields: string[] = [];
  const values: any[] = [];
  let i = 1;

  for (const [key, value] of Object.entries(data)) {
    if (value !== undefined && allowed.includes(key)) {
      fields.push(`${key} = $${i++}`);
      values.push(value);
    }
  }
  if (fields.length === 0)
    throw { status: 400, message: "Tidak ada data yang diubah" };

  values.push(id);
  const rows = await query(
    `UPDATE appointments SET ${fields.join(", ")} WHERE id = $${i} RETURNING *`,
    values,
  );
  if (rows.length === 0)
    throw { status: 404, message: "Appointment tidak ditemukan" };
  return rows[0];
};

export const deleteAppointment = async (id: string) => {
  const rows = await query(
    "DELETE FROM appointments WHERE id = $1 RETURNING id",
    [id],
  );
  if (rows.length === 0)
    throw { status: 404, message: "Appointment tidak ditemukan" };
};

// Dashboard: appointment hari ini
export const todayAppointments = async (doctorId?: string) => {
  const params: any[] = [];
  let where = `DATE(a.scheduled_at) = CURRENT_DATE`;
  if (doctorId) {
    where += ` AND a.doctor_id = $1`;
    params.push(doctorId);
  }
  return query(
    `SELECT
       a.*,
       p.full_name AS patient_name,
       p.phone AS patient_phone
     FROM appointments a
     JOIN patients p ON p.id = a.patient_id
     WHERE ${where}
     ORDER BY a.scheduled_at ASC`,
    params,
  );
};

// Tambah treatment ke appointment
export const addTreatment = async (data: {
  appointment_id: string;
  service_id?: string;
  tooth_number?: string;
  diagnosis?: string;
  notes?: string;
  price: number;
}) => {
  const rows = await query(
    `INSERT INTO treatments
       (appointment_id, service_id, tooth_number, diagnosis, notes, price)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [
      data.appointment_id,
      data.service_id || null,
      data.tooth_number || null,
      data.diagnosis || null,
      data.notes || null,
      data.price,
    ],
  );
  return rows[0];
};

// List treatment per appointment
export const listTreatments = async (appointmentId: string) => {
  return query(
    `SELECT t.*, s.name AS service_name
     FROM treatments t
     LEFT JOIN services s ON s.id = t.service_id
     WHERE t.appointment_id = $1
     ORDER BY t.created_at`,
    [appointmentId],
  );
};

// Hapus treatment
export const deleteTreatment = async (id: string) => {
  const rows = await query(
    "DELETE FROM treatments WHERE id = $1 RETURNING id",
    [id],
  );
  if (rows.length === 0)
    throw { status: 404, message: "Tindakan tidak ditemukan" };
};
