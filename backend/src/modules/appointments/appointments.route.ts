import { Router } from "express";
import * as controller from "./appointments.controller";
import { authMiddleware } from "../../middlewares/auth";

const router = Router();

router.use(authMiddleware);

router.get("/", controller.list);
router.get("/today", controller.today);
router.get("/:id", controller.detail);
router.post("/", controller.create);
router.put("/:id", controller.update);
router.delete("/:id", controller.remove);

router.get("/:id/treatments", controller.listTreatments);
router.post("/:id/treatments", controller.addTreatment);
router.delete("/:id/treatments/:treatmentId", controller.deleteTreatment);

export default router;
