import { Router } from "express";
import { auth } from "../middleware/auth";

const router = Router();

// Template routes will be implemented here
router.get("/", auth, async (req, res) => {
  res.json({ message: "Templates endpoint - to be implemented" });
});

export default router;
