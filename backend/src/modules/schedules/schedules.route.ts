import { Router } from "express";
import * as controller from "./schedules.controller";
import { authMiddleware } from "../../middlewares/auth";

const router = Router();
router.use(authMiddleware);

router.get("/", controller.list);
router.post("/", controller.save);
router.get("/available-slots", controller.availableSlots);
router.delete("/:id", controller.remove);

export default router;
