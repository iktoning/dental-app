import { query, pool } from "../src/config/database";

(async () => {
  try {
    const doctorRows = await query<{ id: string }>(
      `SELECT id FROM users WHERE email = 'dokter@example.com'`,
    );
    if (doctorRows.length === 0) throw new Error("Dokter tidak ditemukan");
    const doctorId = doctorRows[0].id;

    // Cek apakah sudah ada jadwal
    const existing = await query<{ count: string }>(
      "SELECT COUNT(*)::text AS count FROM doctor_schedules WHERE doctor_id = $1",
      [doctorId],
    );
    if (existing[0].count !== "0") {
      console.log("ℹ️  Jadwal sudah ada, skip seeder");
      return;
    }

    // Senin-Jumat: 09:00-17:00, Sabtu: 09:00-13:00, Minggu: libur
    const schedules = [
      { day: 1, start: "09:00", end: "17:00" }, // Senin
      { day: 2, start: "09:00", end: "17:00" }, // Selasa
      { day: 3, start: "09:00", end: "17:00" }, // Rabu
      { day: 4, start: "09:00", end: "17:00" }, // Kamis
      { day: 5, start: "09:00", end: "17:00" }, // Jumat
      { day: 6, start: "09:00", end: "13:00" }, // Sabtu
    ];

    for (const s of schedules) {
      await query(
        `INSERT INTO doctor_schedules (doctor_id, day_of_week, start_time, end_time, slot_duration)
         VALUES ($1, $2, $3, $4, 30)`,
        [doctorId, s.day, s.start, s.end],
      );
    }

    console.log(`✅ ${schedules.length} jadwal praktik ditambahkan`);
    console.log("");
    console.log("Jam praktik default:");
    console.log("  Senin-Jumat: 09:00 - 17:00");
    console.log("  Sabtu      : 09:00 - 13:00");
    console.log("  Minggu     : Libur");
  } catch (err) {
    console.error("❌ Seeder gagal:", err);
  } finally {
    await pool.end();
  }
})();
