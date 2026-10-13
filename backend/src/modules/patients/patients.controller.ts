import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import * as service from "./patients.service";

// Helper
const emptyToUndefined = (schema: z.ZodTypeAny) =>
  z.preprocess((val) => (val === "" || val === null ? undefined : val), schema);

const createSchema = z.object({
  full_name: z.string().min(2, "Nama minimal 2 karakter"),
  phone: z.string().min(8, "Nomor telepon minimal 8 digit"),
  birth_date: z.string().min(1, "Tanggal lahir wajib diisi"),
  gender: z.enum(["male", "female", "other"], {
    errorMap: () => ({ message: "Gender harus dipilih" }),
  }),
  address: z.string().min(5, "Alamat minimal 5 karakter"),
  // Opsional
  email: emptyToUndefined(
    z.string().email("Format email tidak valid").optional(),
  ),
  allergies: emptyToUndefined(z.string().optional()),
  medical_notes: emptyToUndefined(z.string().optional()),
});

export const list = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const search = req.query.search as string | undefined;
    const data = await service.listPatients(search);
    res.json({ data });
  } catch (err) {
    next(err);
  }
};

export const detail = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const data = await service.getPatient(req.params.id);
    res.json({ data });
  } catch (err) {
    next(err);
  }
};

export const create = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const data = createSchema.parse(req.body);
    const patient = await service.createPatient(data);
    res
      .status(201)
      .json({ message: "Pasien berhasil ditambahkan", data: patient });
  } catch (err) {
    next(err);
  }
};

export const update = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const data = createSchema.partial().parse(req.body);
    const patient = await service.updatePatient(req.params.id, data);
    res.json({ message: "Pasien berhasil diupdate", data: patient });
  } catch (err) {
    next(err);
  }
};

export const remove = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    await service.deletePatient(req.params.id);
    res.json({ message: "Pasien berhasil dihapus" });
  } catch (err) {
    next(err);
  }
};
