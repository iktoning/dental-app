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
exports.patientHistory = exports.summary = exports.remove = exports.recordBatch = exports.record = exports.toothHistory = exports.getOdontogram = void 0;
const zod_1 = require("zod");
const service = __importStar(require("./odontogram.service"));
const recordSchema = zod_1.z.object({
    patient_id: zod_1.z.string().uuid(),
    tooth_number: zod_1.z.string().min(1).max(2),
    condition: zod_1.z.enum([
        "healthy",
        "caries",
        "filled",
        "crown",
        "extracted",
        "missing",
        "root_canal",
        "implant",
        "fractured",
    ]),
    surface: zod_1.z
        .enum(["mesial", "distal", "buccal", "lingual", "occlusal"])
        .optional(),
    notes: zod_1.z.string().optional(),
});
const batchSchema = zod_1.z.object({
    patient_id: zod_1.z.string().uuid(),
    entries: zod_1.z
        .array(zod_1.z.object({
        tooth_number: zod_1.z.string().min(1).max(2),
        condition: zod_1.z.enum([
            "healthy",
            "caries",
            "filled",
            "crown",
            "extracted",
            "missing",
            "root_canal",
            "implant",
            "fractured",
        ]),
        surface: zod_1.z
            .enum(["mesial", "distal", "buccal", "lingual", "occlusal"])
            .optional(),
        notes: zod_1.z.string().optional(),
    }))
        .min(1),
});
const getOdontogram = async (req, res, next) => {
    try {
        const data = await service.getPatientOdontogram(req.params.patientId);
        res.json({ data });
    }
    catch (err) {
        next(err);
    }
};
exports.getOdontogram = getOdontogram;
const toothHistory = async (req, res, next) => {
    try {
        const data = await service.getToothHistory(req.params.patientId, req.params.toothNumber);
        res.json({ data });
    }
    catch (err) {
        next(err);
    }
};
exports.toothHistory = toothHistory;
const record = async (req, res, next) => {
    try {
        const body = recordSchema.parse(req.body);
        const data = await service.recordToothCondition({
            ...body,
            recorded_by: req.user?.userId,
        });
        res.status(201).json({ message: "Kondisi gigi tercatat", data });
    }
    catch (err) {
        next(err);
    }
};
exports.record = record;
const recordBatch = async (req, res, next) => {
    try {
        const body = batchSchema.parse(req.body);
        const data = await service.recordMultiple(body.patient_id, body.entries, req.user?.userId);
        res.status(201).json({
            message: `${data.length} kondisi gigi tercatat`,
            data,
        });
    }
    catch (err) {
        next(err);
    }
};
exports.recordBatch = recordBatch;
const remove = async (req, res, next) => {
    try {
        await service.deleteEntry(req.params.id);
        res.json({ message: "Entry berhasil dihapus" });
    }
    catch (err) {
        next(err);
    }
};
exports.remove = remove;
const summary = async (req, res, next) => {
    try {
        const data = await service.getSummary(req.params.patientId);
        res.json({ data });
    }
    catch (err) {
        next(err);
    }
};
exports.summary = summary;
const patientHistory = async (req, res, next) => {
    try {
        const data = await service.getPatientHistory(req.params.patientId);
        res.json({ data });
    }
    catch (err) {
        next(err);
    }
};
exports.patientHistory = patientHistory;
