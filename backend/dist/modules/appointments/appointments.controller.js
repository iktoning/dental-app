"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteTreatment = exports.listTreatments = exports.addTreatment = exports.today = exports.remove = exports.update = exports.create = exports.detail = exports.list = void 0;
const zod_1 = require("zod");
const service = __importStar(require("./appointments.service"));
const createSchema = zod_1.z.object({
    patient_id: zod_1.z.string().uuid(),
    doctor_id: zod_1.z.string().uuid().optional(),
    scheduled_at: zod_1.z.string(), // ISO 8601: 2025-01-15T10:00:00+07:00
    duration_min: zod_1.z.number().int().positive().optional(),
    complaint: zod_1.z.string().optional(),
    source: zod_1.z.enum(["web", "whatsapp", "walk_in", "phone"]).optional(),
    notes: zod_1.z.string().optional(),
});
const updateSchema = zod_1.z.object({
    scheduled_at: zod_1.z.string().optional(),
    duration_min: zod_1.z.number().int().positive().optional(),
    complaint: zod_1.z.string().optional(),
    notes: zod_1.z.string().optional(),
    status: zod_1.z
        .enum([
        "pending",
        "confirmed",
        "in_progress",
        "completed",
        "cancelled",
        "no_show",
    ])
        .optional(),
});
const list = async (req, res, next) => {
    try {
        const data = await service.listAppointments({
            date: req.query.date,
            from: req.query.from,
            to: req.query.to,
            doctorId: req.query.doctor_id,
            patientId: req.query.patient_id,
            status: req.query.status,
        });
        res.json({ data });
    }
    catch (err) {
        next(err);
    }
};
exports.list = list;
const detail = async (req, res, next) => {
    try {
        const data = await service.getAppointment(req.params.id);
        res.json({ data });
    }
    catch (err) {
        next(err);
    }
};
exports.detail = detail;
const create = async (req, res, next) => {
    try {
        const body = createSchema.parse(req.body);
        // Kalau tidak ada doctor_id, pakai user yang login (asumsi dokter)
        const doctor_id = body.doctor_id || req.user?.userId;
        const data = await service.createAppointment({
            ...body,
            doctor_id,
            created_by: req.user?.userId,
        });
        res.status(201).json({ message: "Appointment berhasil dibuat", data });
    }
    catch (err) {
        next(err);
    }
};
exports.create = create;
const update = async (req, res, next) => {
    try {
        const body = updateSchema.parse(req.body);
        const data = await service.updateAppointment(req.params.id, body);
        res.json({ message: "Appointment berhasil diupdate", data });
    }
    catch (err) {
        next(err);
    }
};
exports.update = update;
const remove = async (req, res, next) => {
    try {
        await service.deleteAppointment(req.params.id);
        res.json({ message: "Appointment berhasil dihapus" });
    }
    catch (err) {
        next(err);
    }
};
exports.remove = remove;
const today = async (req, res, next) => {
    try {
        const doctorId = req.query.doctor_id;
        const data = await service.todayAppointments(doctorId);
        res.json({ data });
    }
    catch (err) {
        next(err);
    }
};
exports.today = today;
const treatmentSchema = zod_1.z.object({
    service_id: zod_1.z.string().uuid().optional(),
    tooth_number: zod_1.z.string().optional(),
    diagnosis: zod_1.z.string().optional(),
    notes: zod_1.z.string().optional(),
    price: zod_1.z.number().nonnegative(),
});
const addTreatment = async (req, res, next) => {
    try {
        const body = treatmentSchema.parse(req.body);
        const data = await service.addTreatment({
            ...body,
            appointment_id: req.params.id,
        });
        res.status(201).json({ message: "Tindakan ditambahkan", data });
    }
    catch (err) {
        next(err);
    }
};
exports.addTreatment = addTreatment;
const listTreatments = async (req, res, next) => {
    try {
        const data = await service.listTreatments(req.params.id);
        res.json({ data });
    }
    catch (err) {
        next(err);
    }
};
exports.listTreatments = listTreatments;
const deleteTreatment = async (req, res, next) => {
    try {
        await service.deleteTreatment(req.params.treatmentId);
        res.json({ message: "Tindakan dihapus" });
    }
    catch (err) {
        next(err);
    }
};
exports.deleteTreatment = deleteTreatment;
