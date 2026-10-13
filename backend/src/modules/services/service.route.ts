import { Router } from "express";
import { query } from "../../config/database";
import { authMiddleware } from "../../middlewares/auth";

const router = Router();
router.use(authMiddleware);

router.get("/", async (_req, res, next) => {
  try {
    const data = await query(
      "SELECT * FROM services WHERE is_active = TRUE ORDER BY name",
    );
    res.json({ data });
  } catch (err) {
    next(err);
  }
});

export default router;
