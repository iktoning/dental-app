"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.query = exports.pool = void 0;
const pg_1 = require("pg");
const env_1 = require("./env");
pg_1.types.setTypeParser(1082, (val) => val);
// Railway / Heroku / cloud biasanya pakai DATABASE_URL
const useUrl = !!process.env.DATABASE_URL;
exports.pool = new pg_1.Pool({
    host: env_1.env.db.host,
    port: env_1.env.db.port,
    user: env_1.env.db.user,
    password: env_1.env.db.password,
    database: env_1.env.db.name,
    // Set timezone koneksi ke Asia/Jakarta
    options: "-c timezone=Asia/Jakarta",
});
exports.pool.on("error", (err) => {
    console.error("Unexpected DB error:", err);
    process.exit(1);
});
const query = async (text, params) => {
    const start = Date.now();
    const res = await exports.pool.query(text, params);
    const duration = Date.now() - start;
    if (env_1.env.nodeEnv === "development") {
        console.log("Query:", { text, duration, rows: res.rowCount });
    }
    return res.rows;
};
exports.query = query;
