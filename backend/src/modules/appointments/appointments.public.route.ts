import { Router } from "express";
import { z } from "zod";
import { query } from "../../config/database";
import * as appointmentService from "./appointments.service";

const router = Router();

const publicBookingSchema = z.object({
  full_name: z.string().min(2, "Nama minimal 2 karakter"),
  phone: z.string().min(8, "Nomor HP minimal 8 digit"),
  email: z
    .string()
    .email("Format email tidak valid")
    .optional()
    .or(z.literal("")),
  birth_date: z.string().min(1, "Tanggal lahir wajib diisi"),
  gender: z.enum(["male", "female", "other"]),
  address: z.string().min(5, "Alamat minimal 5 karakter"),
  allergies: z.string().optional(),
  medical_notes: z.string().optional(),
  scheduled_at: z.string(),
  complaint: z.string().optional(),
});

// Ambil slot yang tersedia (publik)
router.get("/available-slots", async (req, res, next) => {
  try {
    const { date, doctor_id } = req.query;
    if (!date) return res.status(400).json({ message: "Parameter date wajib" });

    // Ambil dokter pertama (karena single-doctor dulu)
    const doctorRows = await query<{ id: string }>(
      `SELECT id FROM users WHERE role = 'doctor' AND is_active = TRUE LIMIT 1`,
    );
    if (doctorRows.length === 0) {
      return res.json({ data: [] });
    }
    const doctorId = (doctor_id as string) || doctorRows[0].id;

    // Import di sini agar tidak circular
    const { getAvailableSlots } =
      await import("../schedules/schedules.service");
    const slots = await getAvailableSlots(doctorId, date as string);
    res.json({ data: slots });
  } catch (err) {
    next(err);
  }
});

// Info dokter (publik)
router.get("/doctor-info", async (_req, res, next) => {
  try {
    const rows = await query(
      `SELECT id, name FROM users WHERE role = 'doctor' AND is_active = TRUE LIMIT 1`,
    );
    if (rows.length === 0) {
      return res.status(404).json({ message: "Dokter tidak ditemukan" });
    }
    res.json({ data: { id: rows[0].id, name: rows[0].name } });
  } catch (err) {
    next(err);
  }
});

// Pasien booking sendiri (publik)
router.post("/", async (req, res, next) => {
  try {
    const body = publicBookingSchema.parse(req.body);

    // 1. Cari atau buat pasien berdasarkan nomor HP
    let patientId: string;
    const existing = await query<{ id: string }>(
      "SELECT id FROM patients WHERE phone = $1",
      [body.phone],
    );

    if (existing.length > 0) {
      patientId = existing[0].id;
    } else {
      // Buat pasien baru
      const patientRows = await query<{ id: string }>(
        `INSERT INTO patients
           (full_name, phone, email, birth_date, gender, address, allergies, medical_notes)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING id`,
        [
          body.full_name,
          body.phone,
          body.email || null,
          body.birth_date,
          body.gender,
          body.address,
          body.allergies || null,
          body.medical_notes || null,
        ],
      );
      patientId = patientRows[0].id;
    }

    // 2. Ambil dokter pertama
    const doctorRows = await query<{ id: string }>(
      `SELECT id FROM users WHERE role = 'doctor' AND is_active = TRUE LIMIT 1`,
    );
    if (doctorRows.length === 0) {
      throw { status: 500, message: "Dokter belum tersedia" };
    }
    const doctorId = doctorRows[0].id;

    // 3. Buat appointment (otomatis buat queue juga)
    const appointment = await appointmentService.createAppointment({
      patient_id: patientId,
      doctor_id: doctorId,
      scheduled_at: body.scheduled_at,
      complaint: body.complaint,
      source: "web",
    });

    // 4. Ambil queue ticket yang baru dibuat
    const queueRows = await query(
      `SELECT * FROM queue_tickets WHERE appointment_id = $1 LIMIT 1`,
      [appointment.id],
    );
    const queue = queueRows[0];

    res.status(201).json({
      message: "Booking berhasil",
      data: {
        appointment_id: appointment.id,
        scheduled_at: appointment.scheduled_at,
        queue_code: queue
          ? `A-${String(queue.queue_number).padStart(3, "0")}`
          : null,
        queue_number: queue?.queue_number || null,
      },
    });
  } catch (err) {
    next(err);
  }
});

export default router;
