import { query } from "../../config/database";

// Daftar 32 gigi permanen (FDI)
export const ALL_TEETH = [
  // Rahang atas kanan (pasien)
  "18",
  "17",
  "16",
  "15",
  "14",
  "13",
  "12",
  "11",
  // Rahang atas kiri (pasien)
  "21",
  "22",
  "23",
  "24",
  "25",
  "26",
  "27",
  "28",
  // Rahang bawah kiri (pasien)
  "31",
  "32",
  "33",
  "34",
  "35",
  "36",
  "37",
  "38",
  // Rahang bawah kanan (pasien)
  "48",
  "47",
  "46",
  "45",
  "44",
  "43",
  "42",
  "41",
];

// Ambil odontogram terkini pasien (kondisi terbaru per gigi)
export const getPatientOdontogram = async (patientId: string) => {
  // Pastikan pasien ada
  const patient = await query(
    "SELECT id, full_name FROM patients WHERE id = $1",
    [patientId],
  );
  if (patient.length === 0)
    throw { status: 404, message: "Pasien tidak ditemukan" };

  // Ambil entri terbaru per gigi + surface
  // Pakai DISTINCT ON (PostgreSQL-specific) untuk efisiensi
  const rows = await query(
    `SELECT DISTINCT ON (tooth_number, COALESCE(surface, ''))
       id, tooth_number, condition, surface, notes, recorded_at, recorded_by
     FROM odontogram_entries
     WHERE patient_id = $1
     ORDER BY tooth_number, COALESCE(surface, ''), recorded_at DESC`,
    [patientId],
  );

  // Susun sebagai map: { '11': { overall: {...}, surfaces: { mesial: {...} } } }
  const teethMap: Record<string, any> = {};
  for (const tooth of ALL_TEETH) {
    teethMap[tooth] = {
      tooth_number: tooth,
      overall: null, // kondisi umum gigi (surface = null)
      surfaces: {}, // kondisi per permukaan
    };
  }

  for (const row of rows) {
    const t = teethMap[row.tooth_number];
    if (!t) continue;
    if (row.surface === null) {
      t.overall = row;
    } else {
      t.surfaces[row.surface] = row;
    }
  }

  return {
    patient: patient[0],
    teeth: Object.values(teethMap),
  };
};

// Riwayat lengkap satu gigi (untuk timeline)
export const getToothHistory = async (
  patientId: string,
  toothNumber: string,
) => {
  const rows = await query(
    `SELECT
       oe.*,
       u.name AS recorded_by_name
     FROM odontogram_entries oe
     LEFT JOIN users u ON u.id = oe.recorded_by
     WHERE oe.patient_id = $1 AND oe.tooth_number = $2
     ORDER BY oe.recorded_at DESC`,
    [patientId, toothNumber],
  );
  return rows;
};

// Ambil semua riwayat odontogram pasien
export const getPatientHistory = async (patientId: string) => {
  return query(
    `SELECT
       oe.*,
       u.name AS recorded_by_name
     FROM odontogram_entries oe
     LEFT JOIN users u ON u.id = oe.recorded_by
     WHERE oe.patient_id = $1
     ORDER BY oe.recorded_at DESC
     LIMIT 200`,
    [patientId],
  );
};

// Catat kondisi gigi baru
export const recordToothCondition = async (data: {
  patient_id: string;
  tooth_number: string;
  condition: string;
  surface?: string;
  notes?: string;
  recorded_by?: string;
}) => {
  // Validasi: nomor gigi valid?
  if (!ALL_TEETH.includes(data.tooth_number)) {
    throw {
      status: 400,
      message: `Nomor gigi tidak valid: ${data.tooth_number}`,
    };
  }

  // Validasi: kondisi valid?
  const validConditions = [
    "healthy",
    "caries",
    "filled",
    "crown",
    "extracted",
    "missing",
    "root_canal",
    "implant",
    "fractured",
  ];
  if (!validConditions.includes(data.condition)) {
    throw { status: 400, message: `Kondisi tidak valid: ${data.condition}` };
  }

  // Validasi: surface (kalau ada)
  const validSurfaces = ["mesial", "distal", "buccal", "lingual", "occlusal"];
  if (data.surface && !validSurfaces.includes(data.surface)) {
    throw { status: 400, message: `Surface tidak valid: ${data.surface}` };
  }

  // Pastikan pasien ada
  const p = await query("SELECT id FROM patients WHERE id = $1", [
    data.patient_id,
  ]);
  if (p.length === 0) throw { status: 404, message: "Pasien tidak ditemukan" };

  const rows = await query(
    `INSERT INTO odontogram_entries
       (patient_id, tooth_number, condition, surface, notes, recorded_by)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [
      data.patient_id,
      data.tooth_number,
      data.condition,
      data.surface || null,
      data.notes || null,
      data.recorded_by || null,
    ],
  );
  return rows[0];
};

// Batch record: catat beberapa gigi sekaligus
export const recordMultiple = async (
  patientId: string,
  entries: Array<{
    tooth_number: string;
    condition: string;
    surface?: string;
    notes?: string;
  }>,
  recordedBy?: string,
) => {
  const results = [];
  for (const entry of entries) {
    const r = await recordToothCondition({
      patient_id: patientId,
      tooth_number: entry.tooth_number,
      condition: entry.condition,
      surface: entry.surface,
      notes: entry.notes,
      recorded_by: recordedBy,
    });
    results.push(r);
  }
  return results;
};

// Hapus satu entry (jarang dipakai, tapi berguna untuk koreksi)
export const deleteEntry = async (id: string) => {
  const rows = await query(
    "DELETE FROM odontogram_entries WHERE id = $1 RETURNING id",
    [id],
  );
  if (rows.length === 0)
    throw { status: 404, message: "Entry tidak ditemukan" };
};

// Ringkasan statistik odontogram pasien
export const getSummary = async (patientId: string) => {
  const rows = await query<{ condition: string; count: string }>(
    `WITH latest AS (
       SELECT DISTINCT ON (tooth_number, COALESCE(surface, ''))
         tooth_number, condition
       FROM odontogram_entries
       WHERE patient_id = $1
       ORDER BY tooth_number, COALESCE(surface, ''), recorded_at DESC
     )
     SELECT condition, COUNT(DISTINCT tooth_number)::text AS count
     FROM latest
     GROUP BY condition`,
    [patientId],
  );

  const breakdown: Record<string, number> = {};
  let teethWithEntries = 0;
  for (const r of rows) {
    breakdown[r.condition] = parseInt(r.count, 10);
    teethWithEntries += parseInt(r.count, 10);
  }

  const totalTeeth = ALL_TEETH.length;
  // Gigi yang belum pernah dicatat = dianggap sehat
  const healthy = (breakdown.healthy || 0) + (totalTeeth - teethWithEntries);

  // "Bermasalah" = gigi yang punya kondisi selain healthy & missing
  const problematicConditions = [
    "caries",
    "filled",
    "crown",
    "extracted",
    "root_canal",
    "implant",
    "fractured",
  ];
  const affected = problematicConditions.reduce(
    (sum, c) => sum + (breakdown[c] || 0),
    0,
  );

  // "Ditangani" = gigi yang sudah di-treatment
  const treated =
    (breakdown.filled || 0) +
    (breakdown.crown || 0) +
    (breakdown.root_canal || 0) +
    (breakdown.implant || 0);

  return {
    total_teeth: totalTeeth,
    healthy,
    affected,
    treated,
    breakdown: {
      ...breakdown,
      healthy,
    },
  };
};
