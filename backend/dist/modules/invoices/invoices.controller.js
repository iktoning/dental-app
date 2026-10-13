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
exports.summary = exports.remove = exports.pay = exports.update = exports.createFromAppointment = exports.create = exports.detail = exports.list = void 0;
const zod_1 = require("zod");
const service = __importStar(require("./invoices.service"));
const createSchema = zod_1.z.object({
    patient_id: zod_1.z.string().uuid(),
    appointment_id: zod_1.z.string().uuid().optional(),
    items: zod_1.z
        .array(zod_1.z.object({
        description: zod_1.z.string().min(1),
        qty: zod_1.z.number().int().positive(),
        price: zod_1.z.number().nonnegative(),
    }))
        .min(1),
    notes: zod_1.z.string().optional(),
});
const paymentSchema = zod_1.z.object({
    amount: zod_1.z.number().positive(),
});
const updateSchema = zod_1.z.object({
    notes: zod_1.z.string().optional(),
    status: zod_1.z.enum(["unpaid", "partial", "paid", "cancelled"]).optional(),
});
const list = async (req, res, next) => {
    try {
        const data = await service.listInvoices({
            status: req.query.status,
            patientId: req.query.patient_id,
            from: req.query.from,
            to: req.query.to,
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
        const data = await service.getInvoice(req.params.id);
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
        const data = await service.createInvoice({
            ...body,
            created_by: req.user?.userId,
        });
        res.status(201).json({ message: "Invoice berhasil dibuat", data });
    }
    catch (err) {
        next(err);
    }
};
exports.create = create;
const createFromAppointment = async (req, res, next) => {
    try {
        const appointmentId = req.params.appointmentId;
        const data = await service.createFromAppointment(appointmentId, req.user?.userId);
        res.status(201).json({
            message: "Invoice berhasil dibuat dari appointment",
            data,
        });
    }
    catch (err) {
        next(err);
    }
};
exports.createFromAppointment = createFromAppointment;
const update = async (req, res, next) => {
    try {
        const body = updateSchema.parse(req.body);
        const data = await service.updateInvoice(req.params.id, body);
        res.json({ message: "Invoice berhasil diupdate", data });
    }
    catch (err) {
        next(err);
    }
};
exports.update = update;
const pay = async (req, res, next) => {
    try {
        const { amount } = paymentSchema.parse(req.body);
        const data = await service.recordPayment(req.params.id, amount);
        res.json({ message: "Pembayaran tercatat", data });
    }
    catch (err) {
        next(err);
    }
};
exports.pay = pay;
const remove = async (req, res, next) => {
    try {
        await service.deleteInvoice(req.params.id);
        res.json({ message: "Invoice berhasil dihapus" });
    }
    catch (err) {
        next(err);
    }
};
exports.remove = remove;
const summary = async (req, res, next) => {
    try {
        const data = await service.getSummary(req.query.from, req.query.to);
        res.json({ data });
    }
    catch (err) {
        next(err);
    }
};
exports.summary = summary;
