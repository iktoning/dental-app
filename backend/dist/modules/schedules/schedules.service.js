"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAvailableSlots = exports.deleteSchedule = exports.saveSchedule = exports.getDoctorSchedules = void 0;
const database_1 = require("../../config/database");
// Ambil jadwal praktik dokter
const getDoctorSchedules = async (doctorId) => {
    return (0, database_1.query)(`SELECT * FROM doctor_schedules
     WHERE doctor_id = $1 AND is_active = TRUE
     ORDER BY day_of_week, start_time`, [doctorId]);
};
exports.getDoctorSchedules = getDoctorSchedules;
// Simpan jadwal
const saveSchedule = async (doctorId, dayOfWeek, startTime, endTime, slotDuration = 30) => {
    const rows = await (0, database_1.query)(`INSERT INTO doctor_schedules (doctor_id, day_of_week, start_time, end_time, slot_duration)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (doctor_id, day_of_week, start_time)
     DO UPDATE SET end_time = EXCLUDED.end_time, slot_duration = EXCLUDED.slot_duration
     RETURNING *`, [doctorId, dayOfWeek, startTime, endTime, slotDuration]);
    return rows[0];
};
exports.saveSchedule = saveSchedule;
const deleteSchedule = async (id) => {
    const rows = await (0, database_1.query)("DELETE FROM doctor_schedules WHERE id = $1 RETURNING id", [id]);
    if (rows.length === 0)
        throw { status: 404, message: "Jadwal tidak ditemukan" };
};
exports.deleteSchedule = deleteSchedule;
// Generate slot waktu untuk tanggal tertentu
const getAvailableSlots = async (doctorId, date) => {
    // date format: YYYY-MM-DD
    const d = new Date(date + "T00:00:00");
    const dayOfWeek = d.getDay(); // 0=Minggu
    const schedules = await (0, database_1.query)(`SELECT start_time, end_time, slot_duration
     FROM doctor_schedules
     WHERE doctor_id = $1 AND day_of_week = $2 AND is_active = TRUE`, [doctorId, dayOfWeek]);
    if (schedules.length === 0)
        return [];
    const allSlots = [];
    for (const s of schedules) {
        const slots = generateSlots(s.start_time, s.end_time, s.slot_duration);
        allSlots.push(...slots);
    }
    // Ambil appointment yang sudah ada di tanggal itu
    const booked = await (0, database_1.query)(`SELECT scheduled_at FROM appointments
     WHERE doctor_id = $1
       AND DATE(scheduled_at AT TIME ZONE 'Asia/Jakarta') = $2
       AND status NOT IN ('cancelled', 'no_show')`, [doctorId, date]);
    const bookedTimes = new Set(booked.map((b) => {
        const t = new Date(b.scheduled_at);
        return t.toLocaleTimeString("id-ID", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
            timeZone: "Asia/Jakarta",
        });
    }));
    return allSlots.map((slot) => ({
        time: slot,
        available: !bookedTimes.has(slot),
    }));
};
exports.getAvailableSlots = getAvailableSlots;
// Helper: generate slot dari range jam
const generateSlots = (start, end, duration) => {
    const slots = [];
    const [sh, sm] = start.split(":").map(Number);
    const [eh, em] = end.split(":").map(Number);
    let current = sh * 60 + sm;
    const endMin = eh * 60 + em;
    while (current + duration <= endMin) {
        const h = Math.floor(current / 60);
        const m = current % 60;
        slots.push(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
        current += duration;
    }
    return slots;
};
