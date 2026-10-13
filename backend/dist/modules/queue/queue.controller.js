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
exports.stats = exports.callNext = exports.current = exports.updateStatus = exports.detail = exports.list = exports.take = void 0;
const zod_1 = require("zod");
const service = __importStar(require("./queue.service"));
const takeSchema = zod_1.z.object({
    patient_id: zod_1.z.string().uuid().optional(),
    appointment_id: zod_1.z.string().uuid().optional(),
    source: zod_1.z.enum(["web", "whatsapp", "walk_in", "phone"]).optional(),
    queue_date: zod_1.z.string().optional(),
});
const statusSchema = zod_1.z.object({
    status: zod_1.z.enum(["waiting", "called", "serving", "done", "skipped"]),
});
const take = async (req, res, next) => {
    try {
        const body = takeSchema.parse(req.body);
        const data = await service.takeQueue(body);
        res.status(201).json({ message: "Nomor antrian berhasil diambil", data });
    }
    catch (err) {
        next(err);
    }
};
exports.take = take;
const list = async (req, res, next) => {
    try {
        const data = await service.listQueue({
            date: req.query.date,
            status: req.query.status,
            source: req.query.source,
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
        const data = await service.getQueueTicket(req.params.id);
        res.json({ data });
    }
    catch (err) {
        next(err);
    }
};
exports.detail = detail;
const updateStatus = async (req, res, next) => {
    try {
        const { status } = statusSchema.parse(req.body);
        const data = await service.updateQueueStatus(req.params.id, status);
        res.json({ message: "Status antrian diupdate", data });
    }
    catch (err) {
        next(err);
    }
};
exports.updateStatus = updateStatus;
const current = async (req, res, next) => {
    try {
        const data = await service.currentQueue(req.query.date);
        res.json({ data });
    }
    catch (err) {
        next(err);
    }
};
exports.current = current;
const callNext = async (req, res, next) => {
    try {
        const data = await service.callNext(req.query.date);
        res.json({ message: "Antrian dipanggil", data });
    }
    catch (err) {
        next(err);
    }
};
exports.callNext = callNext;
const stats = async (req, res, next) => {
    try {
        const data = await service.queueStats(req.query.date);
        res.json({ data });
    }
    catch (err) {
        next(err);
    }
};
exports.stats = stats;
