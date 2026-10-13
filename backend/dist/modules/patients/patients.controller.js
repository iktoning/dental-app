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
exports.remove = exports.update = exports.create = exports.detail = exports.list = void 0;
const zod_1 = require("zod");
const service = __importStar(require("./patients.service"));
// Helper
const emptyToUndefined = (schema) => zod_1.z.preprocess((val) => (val === "" || val === null ? undefined : val), schema);
const createSchema = zod_1.z.object({
    full_name: zod_1.z.string().min(2, "Nama minimal 2 karakter"),
    phone: zod_1.z.string().min(8, "Nomor telepon minimal 8 digit"),
    birth_date: zod_1.z.string().min(1, "Tanggal lahir wajib diisi"),
    gender: zod_1.z.enum(["male", "female", "other"], {
        errorMap: () => ({ message: "Gender harus dipilih" }),
    }),
    address: zod_1.z.string().min(5, "Alamat minimal 5 karakter"),
    // Opsional
    email: emptyToUndefined(zod_1.z.string().email("Format email tidak valid").optional()),
    allergies: emptyToUndefined(zod_1.z.string().optional()),
    medical_notes: emptyToUndefined(zod_1.z.string().optional()),
});
const list = async (req, res, next) => {
    try {
        const search = req.query.search;
        const data = await service.listPatients(search);
        res.json({ data });
    }
    catch (err) {
        next(err);
    }
};
exports.list = list;
const detail = async (req, res, next) => {
    try {
        const data = await service.getPatient(req.params.id);
        res.json({ data });
    }
    catch (err) {
        next(err);
    }
};
exports.detail = detail;
const create = async (req, res, next) => {
    try {
        const data = createSchema.parse(req.body);
        const patient = await service.createPatient(data);
        res
            .status(201)
            .json({ message: "Pasien berhasil ditambahkan", data: patient });
    }
    catch (err) {
        next(err);
    }
};
exports.create = create;
const update = async (req, res, next) => {
    try {
        const data = createSchema.partial().parse(req.body);
        const patient = await service.updatePatient(req.params.id, data);
        res.json({ message: "Pasien berhasil diupdate", data: patient });
    }
    catch (err) {
        next(err);
    }
};
exports.update = update;
const remove = async (req, res, next) => {
    try {
        await service.deletePatient(req.params.id);
        res.json({ message: "Pasien berhasil dihapus" });
    }
    catch (err) {
        next(err);
    }
};
exports.remove = remove;
