import { query } from "../../config/database";
import { comparePassword, hashPassword } from "../../utils/hash";
import { signToken } from "../../utils/jwt";

export const registerDoctor = async (data: {
  name: string;
  email: string;
  phone?: string;
  password: string;
}) => {
  const existing = await query("SELECT id FROM users WHERE email = $1", [
    data.email,
  ]);
  if (existing.length > 0)
    throw { status: 400, message: "Email sudah terdaftar" };

  const hash = await hashPassword(data.password);
  const rows = await query(
    `INSERT INTO users (name, email, phone, password_hash, role)
     VALUES ($1, $2, $3, $4, 'doctor')
     RETURNING id, name, email, phone, role, created_at`,
    [data.name, data.email, data.phone || null, hash],
  );
  return rows[0];
};

export const login = async (email: string, password: string) => {
  const rows = await query(
    "SELECT id, name, email, password_hash, role, is_active FROM users WHERE email = $1",
    [email],
  );
  const user = rows[0];
  if (!user) throw { status: 401, message: "Email atau password salah" };
  if (!user.is_active) throw { status: 403, message: "Akun tidak aktif" };

  const ok = await comparePassword(password, user.password_hash);
  if (!ok) throw { status: 401, message: "Email atau password salah" };

  const token = signToken({ userId: user.id, role: user.role });
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
