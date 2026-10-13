import { Response, NextFunction } from "express";
import { z } from "zod";
import * as service from "./appointments.service";
import { AuthRequest } from "../../middlewares/auth";

const createSchema = z.object({
  patient_id: z.string().uuid(),
  doctor_id: z.string().uuid().optional(),
  scheduled_at: z.string(), // ISO 8601: 2025-01-15T10:00:00+07:00
  duration_min: z.number().int().positive().optional(),
  complaint: z.string().optional(),
  source: z.enum(["web", "whatsapp", "walk_in", "phone"]).optional(),
  notes: z.string().optional(),
});

const updateSchema = z.object({
  scheduled_at: z.string().optional(),
  duration_min: z.number().int().positive().optional(),
  complaint: z.string().optional(),
  notes: z.string().optional(),
  status: z
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

export const list = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const data = await service.listAppointments({
      date: req.query.date as string,
      from: req.query.from as string,
      to: req.query.to as string,
      doctorId: req.query.doctor_id as string,
      patientId: req.query.patient_id as string,
      status: req.query.status as string,
    });
    res.json({ data });
  } catch (err) {
    next(err);
  }
};

export const detail = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const data = await service.getAppointment(req.params.id);
    res.json({ data });
  } catch (err) {
    next(err);
  }
};

export const create = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
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
  } catch (err) {
    next(err);
  }
};

export const update = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const body = updateSchema.parse(req.body);
    const data = await service.updateAppointment(req.params.id, body);
    res.json({ message: "Appointment berhasil diupdate", data });
  } catch (err) {
    next(err);
  }
};

export const remove = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    await service.deleteAppointment(req.params.id);
    res.json({ message: "Appointment berhasil dihapus" });
  } catch (err) {
    next(err);
  }
};

export const today = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const doctorId = req.query.doctor_id as string | undefined;
    const data = await service.todayAppointments(doctorId);
    res.json({ data });
  } catch (err) {
    next(err);
  }
};

const treatmentSchema = z.object({
  service_id: z.string().uuid().optional(),
  tooth_number: z.string().optional(),
  diagnosis: z.string().optional(),
  notes: z.string().optional(),
  price: z.number().nonnegative(),
});

export const addTreatment = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const body = treatmentSchema.parse(req.body);
    const data = await service.addTreatment({
      ...body,
      appointment_id: req.params.id,
    });
    res.status(201).json({ message: "Tindakan ditambahkan", data });
  } catch (err) {
    next(err);
  }
};

export const listTreatments = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const data = await service.listTreatments(req.params.id);
    res.json({ data });
  } catch (err) {
    next(err);
  }
};

export const deleteTreatment = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    await service.deleteTreatment(req.params.treatmentId);
    res.json({ message: "Tindakan dihapus" });
  } catch (err) {
    next(err);
  }
};
