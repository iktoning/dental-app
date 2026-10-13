import { hashPassword } from "../src/utils/hash";
import { query, pool } from "../src/config/database";

(async () => {
  try {
    const email = "dokter@example.com";
    const password = "dokter123";
    const hash = await hashPassword(password);

    // 1. Seeder dokter
    const users = await query(
      `INSERT INTO users (name, email, phone, password_hash, role)
       VALUES ($1, $2, $3, $4, 'doctor')
       ON CONFLICT (email) DO UPDATE
         SET password_hash = EXCLUDED.password_hash,
             name = EXCLUDED.name,
             phone = EXCLUDED.phone
       RETURNING id, name, email, role`,
      ["Dr. Gigi", email, "08123456789", hash],
    );

    console.log("✅ Dokter dibuat/diupdate:", users[0]);

    // 2. Seeder layanan
    const services: [string, number, number][] = [
      ["Konsultasi", 50000, 15],
      ["Scaling", 250000, 30],
      ["Tambal Komposit", 200000, 30],
      ["Cabut Gigi", 150000, 30],
      ["Root Canal", 800000, 60],
      ["Pasang Crown", 1500000, 60],
      ["Bleaching", 900000, 60],
    ];

    // Cek apakah sudah ada services, kalau kosong baru isi
    const existing = await query<{ count: string }>(
      "SELECT COUNT(*)::text AS count FROM services",
    );
    if (existing[0].count === "0") {
      for (const [name, price, duration] of services) {
        await query(
          `INSERT INTO services (name, price, duration_min) VALUES ($1, $2, $3)`,
          [name, price, duration],
        );
      }
      console.log(`✅ ${services.length} layanan ditambahkan`);
    } else {
      console.log(
        `ℹ️  Services sudah ada (${existing[0].count} baris), skip seeder layanan`,
      );
    }

    console.log("");
    console.log("======================================");
    console.log("🔑 KREDENSIAL LOGIN:");
    console.log("   Email    :", email);
    console.log("   Password :", password);
    console.log("======================================");
    console.log("");
  } catch (err) {
    console.error("❌ Seeder gagal:", err);
  } finally {
    await pool.end();
  }
})();
