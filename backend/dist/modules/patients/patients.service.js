"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deletePatient = exports.updatePatient = exports.createPatient = exports.getPatient = exports.listPatients = void 0;
const database_1 = require("../../config/database");
const listPatients = async (search) => {
    if (search) {
        return (0, database_1.query)(`SELECT * FROM patients
       WHERE full_name ILIKE $1 OR phone ILIKE $1
       ORDER BY full_name LIMIT 100`, [`%${search}%`]);
    }
    return (0, database_1.query)("SELECT * FROM patients ORDER BY created_at DESC LIMIT 100");
};
exports.listPatients = listPatients;
const getPatient = async (id) => {
    const rows = await (0, database_1.query)("SELECT * FROM patients WHERE id = $1", [id]);
    if (rows.length === 0)
        throw { status: 404, message: "Pasien tidak ditemukan" };
    return rows[0];
};
exports.getPatient = getPatient;
const createPatient = async (data) => {
    const rows = await (0, database_1.query)(`INSERT INTO patients (full_name, phone, email, birth_date, gender, address, allergies, medical_notes)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
     RETURNING *`, [
        data.full_name,
        data.phone,
        data.email || null,
        data.birth_date || null,
        data.gender || null,
        data.address || null,
        data.allergies || null,
        data.medical_notes || null,
    ]);
    return rows[0];
};
exports.createPatient = createPatient;
const updatePatient = async (id, data) => {
    const fields = [];
    const values = [];
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
    const rows = await (0, database_1.query)(`UPDATE patients SET ${fields.join(", ")} WHERE id = $${i} RETURNING *`, values);
    if (rows.length === 0)
        throw { status: 404, message: "Pasien tidak ditemukan" };
    return rows[0];
};
exports.updatePatient = updatePatient;
const deletePatient = async (id) => {
    const rows = await (0, database_1.query)("DELETE FROM patients WHERE id = $1 RETURNING id", [
        id,
    ]);
    if (rows.length === 0)
        throw { status: 404, message: "Pasien tidak ditemukan" };
};
exports.deletePatient = deletePatient;
