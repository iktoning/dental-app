import { Router } from "express";
import { z } from "zod";
import * as service from "./queue.service";

const router = Router();

const publicTakeSchema = z.object({
  patient_id: z.string().uuid(),
  appointment_id: z.string().uuid().optional(),
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
  } catch (err) {
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
  } catch (err) {
    next(err);
  }
});

// Statistik ringkas (publik)
router.get("/stats", async (req, res, next) => {
  try {
    const data = await service.queueStats();
    res.json({ data });
  } catch (err) {
    next(err);
  }
});

export default router;
