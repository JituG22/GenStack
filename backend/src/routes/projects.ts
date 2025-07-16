import { Router } from "express";
import { auth } from "../middleware/auth";

const router = Router();

// Project routes will be implemented here
router.get("/", auth, async (req, res) => {
  res.json({ message: "Projects endpoint - to be implemented" });
});

export default router;
