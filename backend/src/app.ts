import express from "express";
import cors from "cors";
import authRoute from "./modules/auth/auth.route";
import patientsRoute from "./modules/patients/patients.route";
import appointmentsRoute from "./modules/appointments/appointments.route";
import queueRoute from "./modules/queue/queue.route";
import queuePublicRoute from "./modules/queue/queue.public.route";
import odontogramRoute from "./modules/odontogram/odontogram.route";
import invoicesRoute from "./modules/invoices/invoices.route";
import schedulesRoute from "./modules/schedules/schedules.route";
import appointmentsPublicRoute from "./modules/appointments/appointments.public.route";
import servicesRoute from "./modules/services/service.route";
import { env } from "./config/env";
import { errorHandler } from "./middlewares/error";

const app = express();

// CORS
const allowedOrigins =
  env.corsOrigin === "*"
    ? true
    : env.corsOrigin.split(",").map((o) => o.trim());

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  }),
);
app.use(express.json());

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
        toothHistory:
          "GET /api/odontogram/patient/:patientId/tooth/:toothNumber",
        record: "POST /api/odontogram",
        recordBatch: "POST /api/odontogram/batch",
        deleteEntry: "DELETE /api/odontogram/entries/:id",
      },
    },
  });
});

app.get("/health", (_req, res) => res.json({ status: "ok" }));

// Public routes (tanpa auth) — WAJIB di atas routes yang pakai auth middleware
app.use("/api/public/queue", queuePublicRoute);
app.use("/api/public/booking", appointmentsPublicRoute);

// Protected routes
app.use("/api/auth", authRoute);
app.use("/api/patients", patientsRoute);
app.use("/api/appointments", appointmentsRoute);
app.use("/api/queue", queueRoute);
app.use("/api/odontogram", odontogramRoute);
app.use("/api/invoices", invoicesRoute);
app.use("/api/schedules", schedulesRoute);
app.use("/api/services", servicesRoute);
app.use(errorHandler);

export default app;
