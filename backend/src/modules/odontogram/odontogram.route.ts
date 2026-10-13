import { Router } from "express";
import * as controller from "./odontogram.controller";
import { authMiddleware } from "../../middlewares/auth";

const router = Router();

router.use(authMiddleware);

// Batch record (bisa catat banyak gigi sekaligus)
router.post("/batch", controller.recordBatch);

// Catat satu kondisi
router.post("/", controller.record);

// Hapus entry
router.delete("/entries/:id", controller.remove);

// Get odontogram lengkap pasien
router.get("/patient/:patientId", controller.getOdontogram);
router.get("/patient/:patientId/summary", controller.summary);
router.get("/patient/:patientId/tooth/:toothNumber", controller.toothHistory);
router.get("/patient/:patientId/history", controller.patientHistory);
router.get("/patient/:patientId/tooth/:toothNumber", controller.toothHistory);

export default router;
