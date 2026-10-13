"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const database_1 = require("../../config/database");
const auth_1 = require("../../middlewares/auth");
const router = (0, express_1.Router)();
router.use(auth_1.authMiddleware);
router.get("/", async (_req, res, next) => {
    try {
        const data = await (0, database_1.query)("SELECT * FROM services WHERE is_active = TRUE ORDER BY name");
        res.json({ data });
    }
    catch (err) {
        next(err);
    }
});
exports.default = router;
