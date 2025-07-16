import { Router } from "express";
import { auth, authorize } from "../middleware/auth";
import { UserRole } from "../types";

const router = Router();

// Admin routes will be implemented here
router.get("/users", auth, authorize(UserRole.ADMIN), async (req, res) => {
  res.json({ message: "Admin users endpoint - to be implemented" });
});

export default router;
