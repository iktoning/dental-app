import { Response, NextFunction } from "express";
import { z } from "zod";
import * as service from "./invoices.service";
import { AuthRequest } from "../../middlewares/auth";

const createSchema = z.object({
  patient_id: z.string().uuid(),
  appointment_id: z.string().uuid().optional(),
  items: z
    .array(
      z.object({
        description: z.string().min(1),
        qty: z.number().int().positive(),
        price: z.number().nonnegative(),
      }),
    )
    .min(1),
  notes: z.string().optional(),
});

const paymentSchema = z.object({
  amount: z.number().positive(),
});

const updateSchema = z.object({
  notes: z.string().optional(),
  status: z.enum(["unpaid", "partial", "paid", "cancelled"]).optional(),
});

export const list = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const data = await service.listInvoices({
      status: req.query.status as string,
      patientId: req.query.patient_id as string,
      from: req.query.from as string,
      to: req.query.to as string,
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
    const data = await service.getInvoice(req.params.id);
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
    const data = await service.createInvoice({
      ...body,
      created_by: req.user?.userId,
    });
    res.status(201).json({ message: "Invoice berhasil dibuat", data });
  } catch (err) {
    next(err);
  }
};

export const createFromAppointment = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const appointmentId = req.params.appointmentId;
    const data = await service.createFromAppointment(
      appointmentId,
      req.user?.userId,
    );
    res.status(201).json({
      message: "Invoice berhasil dibuat dari appointment",
      data,
    });
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
    const data = await service.updateInvoice(req.params.id, body);
    res.json({ message: "Invoice berhasil diupdate", data });
  } catch (err) {
    next(err);
  }
};

export const pay = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { amount } = paymentSchema.parse(req.body);
    const data = await service.recordPayment(req.params.id, amount);
    res.json({ message: "Pembayaran tercatat", data });
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
    await service.deleteInvoice(req.params.id);
    res.json({ message: "Invoice berhasil dihapus" });
  } catch (err) {
    next(err);
  }
};

export const summary = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const data = await service.getSummary(
      req.query.from as string,
      req.query.to as string,
    );
    res.json({ data });
  } catch (err) {
    next(err);
  }
};
