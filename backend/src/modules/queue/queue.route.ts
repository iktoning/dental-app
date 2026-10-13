import { Router } from "express";
import * as controller from "./queue.controller";
import { authMiddleware } from "../../middlewares/auth";

const router = Router();

router.use(authMiddleware);

// ⚠️ Urutan route penting! Yang statis harus duluan sebelum /:id
router.get("/", controller.list);
router.get("/current", controller.current);
router.get("/stats", controller.stats);
router.post("/call-next", controller.callNext);
router.post("/", controller.take);
router.get("/:id", controller.detail);
router.patch("/:id/status", controller.updateStatus);

export default router;
