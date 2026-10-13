import { Response, NextFunction } from "express";
import { z } from "zod";
import * as service from "./queue.service";
import { AuthRequest } from "../../middlewares/auth";

const takeSchema = z.object({
  patient_id: z.string().uuid().optional(),
  appointment_id: z.string().uuid().optional(),
  source: z.enum(["web", "whatsapp", "walk_in", "phone"]).optional(),
  queue_date: z.string().optional(),
});

const statusSchema = z.object({
  status: z.enum(["waiting", "called", "serving", "done", "skipped"]),
});

export const take = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const body = takeSchema.parse(req.body);
    const data = await service.takeQueue(body);
    res.status(201).json({ message: "Nomor antrian berhasil diambil", data });
  } catch (err) {
    next(err);
  }
};

export const list = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const data = await service.listQueue({
      date: req.query.date as string,
      status: req.query.status as string,
      source: req.query.source as string,
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
    const data = await service.getQueueTicket(req.params.id);
    res.json({ data });
  } catch (err) {
    next(err);
  }
};

export const updateStatus = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { status } = statusSchema.parse(req.body);
    const data = await service.updateQueueStatus(req.params.id, status);
    res.json({ message: "Status antrian diupdate", data });
  } catch (err) {
    next(err);
  }
};

export const current = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const data = await service.currentQueue(req.query.date as string);
    res.json({ data });
  } catch (err) {
    next(err);
  }
};

export const callNext = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const data = await service.callNext(req.query.date as string);
    res.json({ message: "Antrian dipanggil", data });
  } catch (err) {
    next(err);
  }
};

export const stats = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const data = await service.queueStats(req.query.date as string);
    res.json({ data });
  } catch (err) {
    next(err);
  }
};
