import { Router } from "express";
import * as controller from "./invoices.controller";
import { authMiddleware } from "../../middlewares/auth";

const router = Router();

router.use(authMiddleware);

// ⚠️ Urutan penting: statis sebelum /:id
router.get("/", controller.list);
router.get("/summary", controller.summary);
router.post(
  "/from-appointment/:appointmentId",
  controller.createFromAppointment,
);
router.post("/", controller.create);
router.get("/:id", controller.detail);
router.put("/:id", controller.update);
router.post("/:id/pay", controller.pay);
router.delete("/:id", controller.remove);

export default router;
