"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const zod_1 = require("zod");
const database_1 = require("../../config/database");
const appointmentService = __importStar(require("./appointments.service"));
const router = (0, express_1.Router)();
const publicBookingSchema = zod_1.z.object({
    full_name: zod_1.z.string().min(2, "Nama minimal 2 karakter"),
    phone: zod_1.z.string().min(8, "Nomor HP minimal 8 digit"),
    email: zod_1.z
        .string()
        .email("Format email tidak valid")
        .optional()
        .or(zod_1.z.literal("")),
    birth_date: zod_1.z.string().min(1, "Tanggal lahir wajib diisi"),
    gender: zod_1.z.enum(["male", "female", "other"]),
    address: zod_1.z.string().min(5, "Alamat minimal 5 karakter"),
    allergies: zod_1.z.string().optional(),
    medical_notes: zod_1.z.string().optional(),
    scheduled_at: zod_1.z.string(),
    complaint: zod_1.z.string().optional(),
});
// Ambil slot yang tersedia (publik)
router.get("/available-slots", async (req, res, next) => {
    try {
        const { date, doctor_id } = req.query;
        if (!date)
            return res.status(400).json({ message: "Parameter date wajib" });
        // Ambil dokter pertama (karena single-doctor dulu)
        const doctorRows = await (0, database_1.query)(`SELECT id FROM users WHERE role = 'doctor' AND is_active = TRUE LIMIT 1`);
        if (doctorRows.length === 0) {
            return res.json({ data: [] });
        }
        const doctorId = doctor_id || doctorRows[0].id;
        // Import di sini agar tidak circular
        const { getAvailableSlots } = await Promise.resolve().then(() => __importStar(require("../schedules/schedules.service")));
        const slots = await getAvailableSlots(doctorId, date);
        res.json({ data: slots });
    }
    catch (err) {
        next(err);
    }
});
// Info dokter (publik)
router.get("/doctor-info", async (_req, res, next) => {
    try {
        const rows = await (0, database_1.query)(`SELECT id, name FROM users WHERE role = 'doctor' AND is_active = TRUE LIMIT 1`);
        if (rows.length === 0) {
            return res.status(404).json({ message: "Dokter tidak ditemukan" });
        }
        res.json({ data: { id: rows[0].id, name: rows[0].name } });
    }
    catch (err) {
        next(err);
    }
});
// Pasien booking sendiri (publik)
router.post("/", async (req, res, next) => {
    try {
        const body = publicBookingSchema.parse(req.body);
        // 1. Cari atau buat pasien berdasarkan nomor HP
        let patientId;
        const existing = await (0, database_1.query)("SELECT id FROM patients WHERE phone = $1", [body.phone]);
        if (existing.length > 0) {
            patientId = existing[0].id;
        }
        else {
            // Buat pasien baru
            const patientRows = await (0, database_1.query)(`INSERT INTO patients
           (full_name, phone, email, birth_date, gender, address, allergies, medical_notes)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING id`, [
                body.full_name,
                body.phone,
                body.email || null,
                body.birth_date,
                body.gender,
                body.address,
                body.allergies || null,
                body.medical_notes || null,
            ]);
            patientId = patientRows[0].id;
        }
        // 2. Ambil dokter pertama
        const doctorRows = await (0, database_1.query)(`SELECT id FROM users WHERE role = 'doctor' AND is_active = TRUE LIMIT 1`);
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
        const queueRows = await (0, database_1.query)(`SELECT * FROM queue_tickets WHERE appointment_id = $1 LIMIT 1`, [appointment.id]);
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
    }
    catch (err) {
        next(err);
    }
});
exports.default = router;
