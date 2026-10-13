import { Pool, types } from "pg";
import { env } from "./env";

types.setTypeParser(1082, (val: string) => val);

const useUrl = !!process.env.DATABASE_URL;

console.log(
  "🔍 DB Connection Mode:",
  useUrl ? "DATABASE_URL" : "Individual vars",
);

export const pool = useUrl
  ? new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
    })
  : new Pool({
      host: env.db.host,
      port: env.db.port,
      user: env.db.user,
      password: env.db.password,
      database: env.db.name,
      options: "-c timezone=Asia/Jakarta",
    });

pool.on("error", (err) => {
  console.error("Unexpected DB error:", err);
  process.exit(1);
});

export const query = async <T = any>(
  text: string,
  params?: any[],
): Promise<T[]> => {
  const start = Date.now();
  const res = await pool.query(text, params);
  const duration = Date.now() - start;
  if (env.nodeEnv === "development") {
    console.log("Query:", { text, duration, rows: res.rowCount });
  }
  return res.rows as T[];
};
