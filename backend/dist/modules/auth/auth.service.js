"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.login = exports.registerDoctor = void 0;
const database_1 = require("../../config/database");
const hash_1 = require("../../utils/hash");
const jwt_1 = require("../../utils/jwt");
const registerDoctor = async (data) => {
    const existing = await (0, database_1.query)("SELECT id FROM users WHERE email = $1", [
        data.email,
    ]);
    if (existing.length > 0)
        throw { status: 400, message: "Email sudah terdaftar" };
    const hash = await (0, hash_1.hashPassword)(data.password);
    const rows = await (0, database_1.query)(`INSERT INTO users (name, email, phone, password_hash, role)
     VALUES ($1, $2, $3, $4, 'doctor')
     RETURNING id, name, email, phone, role, created_at`, [data.name, data.email, data.phone || null, hash]);
    return rows[0];
};
exports.registerDoctor = registerDoctor;
const login = async (email, password) => {
    const rows = await (0, database_1.query)("SELECT id, name, email, password_hash, role, is_active FROM users WHERE email = $1", [email]);
    const user = rows[0];
    if (!user)
        throw { status: 401, message: "Email atau password salah" };
    if (!user.is_active)
        throw { status: 403, message: "Akun tidak aktif" };
    const ok = await (0, hash_1.comparePassword)(password, user.password_hash);
    if (!ok)
        throw { status: 401, message: "Email atau password salah" };
    const token = (0, jwt_1.signToken)({ userId: user.id, role: user.role });
    return {
        token,
        user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
        },
    };
};
exports.login = login;
