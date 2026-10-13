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
const express_1 = require("express");
const zod_1 = require("zod");
const service = __importStar(require("./queue.service"));
const router = (0, express_1.Router)();
const publicTakeSchema = zod_1.z.object({
    patient_id: zod_1.z.string().uuid(),
    appointment_id: zod_1.z.string().uuid().optional(),
});
// Pasien ambil nomor antrian (via web setelah booking)
router.post("/take", async (req, res, next) => {
    try {
        const body = publicTakeSchema.parse(req.body);
        const data = await service.takeQueue({ ...body, source: "web" });
        res.status(201).json({
            message: "Nomor antrian berhasil diambil",
            data: {
                queue_code: data.queue_code,
                queue_number: data.queue_number,
                queue_date: data.queue_date,
                status: data.status,
            },
        });
    }
    catch (err) {
        next(err);
    }
});
// Cek antrian saat ini (publik — untuk display di ruang tunggu)
router.get("/current", async (req, res, next) => {
    try {
        const data = await service.currentQueue();
        res.json({
            data: data
                ? {
                    queue_code: data.queue_code,
                    patient_name: data.patient_name?.split(" ")[0] || "Pasien", // hanya nama depan
                    status: data.status,
                }
                : null,
        });
    }
    catch (err) {
        next(err);
    }
});
// Statistik ringkas (publik)
router.get("/stats", async (req, res, next) => {
    try {
        const data = await service.queueStats();
        res.json({ data });
    }
    catch (err) {
        next(err);
    }
});
exports.default = router;
