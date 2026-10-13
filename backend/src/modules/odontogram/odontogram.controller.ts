import { Response, NextFunction } from "express";
import { z } from "zod";
import * as service from "./odontogram.service";
import { AuthRequest } from "../../middlewares/auth";

const recordSchema = z.object({
  patient_id: z.string().uuid(),
  tooth_number: z.string().min(1).max(2),
  condition: z.enum([
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
  surface: z
    .enum(["mesial", "distal", "buccal", "lingual", "occlusal"])
    .optional(),
  notes: z.string().optional(),
});

const batchSchema = z.object({
  patient_id: z.string().uuid(),
  entries: z
    .array(
      z.object({
        tooth_number: z.string().min(1).max(2),
        condition: z.enum([
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
        surface: z
          .enum(["mesial", "distal", "buccal", "lingual", "occlusal"])
          .optional(),
        notes: z.string().optional(),
      }),
    )
    .min(1),
});

export const getOdontogram = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const data = await service.getPatientOdontogram(req.params.patientId);
    res.json({ data });
  } catch (err) {
    next(err);
  }
};

export const toothHistory = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const data = await service.getToothHistory(
      req.params.patientId,
      req.params.toothNumber,
    );
    res.json({ data });
  } catch (err) {
    next(err);
  }
};

export const record = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const body = recordSchema.parse(req.body);
    const data = await service.recordToothCondition({
      ...body,
      recorded_by: req.user?.userId,
    });
    res.status(201).json({ message: "Kondisi gigi tercatat", data });
  } catch (err) {
    next(err);
  }
};

export const recordBatch = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const body = batchSchema.parse(req.body);
    const data = await service.recordMultiple(
      body.patient_id,
      body.entries,
      req.user?.userId,
    );
    res.status(201).json({
      message: `${data.length} kondisi gigi tercatat`,
      data,
    });
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
    await service.deleteEntry(req.params.id);
    res.json({ message: "Entry berhasil dihapus" });
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
    const data = await service.getSummary(req.params.patientId);
    res.json({ data });
  } catch (err) {
    next(err);
  }
};

export const patientHistory = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const data = await service.getPatientHistory(req.params.patientId);
    res.json({ data });
  } catch (err) {
    next(err);
  }
};
