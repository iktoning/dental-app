import { Response, NextFunction } from "express";
import { z } from "zod";
import * as service from "./schedules.service";
import { AuthRequest } from "../../middlewares/auth";

const saveSchema = z.object({
  day_of_week: z.number().int().min(0).max(6),
  start_time: z.string().regex(/^\d{2}:\d{2}$/),
  end_time: z.string().regex(/^\d{2}:\d{2}$/),
  slot_duration: z.number().int().positive().optional(),
});

export const list = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const doctorId = req.user!.userId;
    const data = await service.getDoctorSchedules(doctorId);
    res.json({ data });
  } catch (err) {
    next(err);
  }
};

export const save = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const body = saveSchema.parse(req.body);
    const data = await service.saveSchedule(
      req.user!.userId,
      body.day_of_week,
      body.start_time,
      body.end_time,
      body.slot_duration,
    );
    res.status(201).json({ message: "Jadwal disimpan", data });
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
    await service.deleteSchedule(req.params.id);
    res.json({ message: "Jadwal dihapus" });
  } catch (err) {
    next(err);
  }
};

export const availableSlots = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const date = req.query.date as string;
    if (!date) throw { status: 400, message: "Parameter date wajib" };
    const doctorId = (req.query.doctor_id as string) || req.user!.userId;
    const data = await service.getAvailableSlots(doctorId, date);
    res.json({ data });
  } catch (err) {
    next(err);
  }
};
