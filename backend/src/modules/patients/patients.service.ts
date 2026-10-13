import { query } from "../../config/database";

export const listPatients = async (search?: string) => {
  if (search) {
    return query(
      `SELECT * FROM patients
       WHERE full_name ILIKE $1 OR phone ILIKE $1
       ORDER BY full_name LIMIT 100`,
      [`%${search}%`],
    );
  }
  return query("SELECT * FROM patients ORDER BY created_at DESC LIMIT 100");
};

export const getPatient = async (id: string) => {
  const rows = await query("SELECT * FROM patients WHERE id = $1", [id]);
  if (rows.length === 0)
    throw { status: 404, message: "Pasien tidak ditemukan" };
  return rows[0];
};

export const createPatient = async (data: {
  full_name: string;
  phone: string;
  email?: string;
  birth_date?: string;
  gender?: string;
  address?: string;
  allergies?: string;
  medical_notes?: string;
}) => {
  const rows = await query(
    `INSERT INTO patients (full_name, phone, email, birth_date, gender, address, allergies, medical_notes)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
     RETURNING *`,
    [
      data.full_name,
      data.phone,
      data.email || null,
      data.birth_date || null,
      data.gender || null,
      data.address || null,
      data.allergies || null,
      data.medical_notes || null,
    ],
  );
  return rows[0];
};

export const updatePatient = async (
  id: string,
  data: Partial<{
    full_name: string;
    phone: string;
    email: string;
    birth_date: string;
    gender: string;
    address: string;
    allergies: string;
    medical_notes: string;
  }>,
) => {
  const fields: string[] = [];
  const values: any[] = [];
  let i = 1;
  for (const [key, value] of Object.entries(data)) {
    if (value !== undefined) {
      fields.push(`${key} = $${i++}`);
      values.push(value);
    }
  }
  if (fields.length === 0)
    throw { status: 400, message: "Tidak ada data yang diubah" };
  values.push(id);
  const rows = await query(
    `UPDATE patients SET ${fields.join(", ")} WHERE id = $${i} RETURNING *`,
    values,
  );
  if (rows.length === 0)
    throw { status: 404, message: "Pasien tidak ditemukan" };
  return rows[0];
};

export const deletePatient = async (id: string) => {
  const rows = await query("DELETE FROM patients WHERE id = $1 RETURNING id", [
    id,
  ]);
  if (rows.length === 0)
    throw { status: 404, message: "Pasien tidak ditemukan" };
};
