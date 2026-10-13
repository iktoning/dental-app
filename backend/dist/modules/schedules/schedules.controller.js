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
exports.availableSlots = exports.remove = exports.save = exports.list = void 0;
const zod_1 = require("zod");
const service = __importStar(require("./schedules.service"));
const saveSchema = zod_1.z.object({
    day_of_week: zod_1.z.number().int().min(0).max(6),
    start_time: zod_1.z.string().regex(/^\d{2}:\d{2}$/),
    end_time: zod_1.z.string().regex(/^\d{2}:\d{2}$/),
    slot_duration: zod_1.z.number().int().positive().optional(),
});
const list = async (req, res, next) => {
    try {
        const doctorId = req.user.userId;
        const data = await service.getDoctorSchedules(doctorId);
        res.json({ data });
    }
    catch (err) {
        next(err);
    }
};
exports.list = list;
const save = async (req, res, next) => {
    try {
        const body = saveSchema.parse(req.body);
        const data = await service.saveSchedule(req.user.userId, body.day_of_week, body.start_time, body.end_time, body.slot_duration);
        res.status(201).json({ message: "Jadwal disimpan", data });
    }
    catch (err) {
        next(err);
    }
};
exports.save = save;
const remove = async (req, res, next) => {
    try {
        await service.deleteSchedule(req.params.id);
        res.json({ message: "Jadwal dihapus" });
    }
    catch (err) {
        next(err);
    }
};
exports.remove = remove;
const availableSlots = async (req, res, next) => {
    try {
        const date = req.query.date;
        if (!date)
            throw { status: 400, message: "Parameter date wajib" };
        const doctorId = req.query.doctor_id || req.user.userId;
        const data = await service.getAvailableSlots(doctorId, date);
        res.json({ data });
    }
    catch (err) {
        next(err);
    }
};
exports.availableSlots = availableSlots;
