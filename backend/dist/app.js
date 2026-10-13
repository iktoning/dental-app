"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const auth_route_1 = __importDefault(require("./modules/auth/auth.route"));
const patients_route_1 = __importDefault(require("./modules/patients/patients.route"));
const appointments_route_1 = __importDefault(require("./modules/appointments/appointments.route"));
const queue_route_1 = __importDefault(require("./modules/queue/queue.route"));
const queue_public_route_1 = __importDefault(require("./modules/queue/queue.public.route"));
const odontogram_route_1 = __importDefault(require("./modules/odontogram/odontogram.route"));
const invoices_route_1 = __importDefault(require("./modules/invoices/invoices.route"));
const schedules_route_1 = __importDefault(require("./modules/schedules/schedules.route"));
const appointments_public_route_1 = __importDefault(require("./modules/appointments/appointments.public.route"));
const service_route_1 = __importDefault(require("./modules/services/service.route"));
const env_1 = require("./config/env");
const error_1 = require("./middlewares/error");
const app = (0, express_1.default)();
// CORS
const allowedOrigins = env_1.env.corsOrigin === "*"
    ? true
    : env_1.env.corsOrigin.split(",").map((o) => o.trim());
app.use((0, cors_1.default)({
    origin: allowedOrigins,
    credentials: true,
}));
app.use(express_1.default.json());
app.get("/", (_req, res) => {
    res.json({
        name: "Dental App API",
        version: "1.0.0",
        status: "running",
        endpoints: {
            health: "GET /health",
            auth: {
                register: "POST /api/auth/register",
                login: "POST /api/auth/login",
            },
            patients: {
                list: "GET /api/patients",
                detail: "GET /api/patients/:id",
                create: "POST /api/patients",
                update: "PUT /api/patients/:id",
                delete: "DELETE /api/patients/:id",
            },
            appointments: {
                list: "GET /api/appointments?date=YYYY-MM-DD",
                today: "GET /api/appointments/today",
                detail: "GET /api/appointments/:id",
                create: "POST /api/appointments",
                update: "PUT /api/appointments/:id",
                delete: "DELETE /api/appointments/:id",
            },
            queue: {
                list: "GET /api/queue?date=YYYY-MM-DD",
                current: "GET /api/queue/current",
                stats: "GET /api/queue/stats",
                take: "POST /api/queue",
                callNext: "POST /api/queue/call-next",
                updateStatus: "PATCH /api/queue/:id/status",
            },
            queuePublic: {
                take: "POST /api/public/queue/take",
                current: "GET /api/public/queue/current",
                stats: "GET /api/public/queue/stats",
            },
            odontogram: {
                get: "GET /api/odontogram/patient/:patientId",
                summary: "GET /api/odontogram/patient/:patientId/summary",
                toothHistory: "GET /api/odontogram/patient/:patientId/tooth/:toothNumber",
                record: "POST /api/odontogram",
                recordBatch: "POST /api/odontogram/batch",
                deleteEntry: "DELETE /api/odontogram/entries/:id",
            },
        },
    });
});
app.get("/health", (_req, res) => res.json({ status: "ok" }));
// Public routes (tanpa auth) — WAJIB di atas routes yang pakai auth middleware
app.use("/api/public/queue", queue_public_route_1.default);
app.use("/api/public/booking", appointments_public_route_1.default);
// Protected routes
app.use("/api/auth", auth_route_1.default);
app.use("/api/patients", patients_route_1.default);
app.use("/api/appointments", appointments_route_1.default);
app.use("/api/queue", queue_route_1.default);
app.use("/api/odontogram", odontogram_route_1.default);
app.use("/api/invoices", invoices_route_1.default);
app.use("/api/schedules", schedules_route_1.default);
app.use("/api/services", service_route_1.default);
app.use(error_1.errorHandler);
exports.default = app;
