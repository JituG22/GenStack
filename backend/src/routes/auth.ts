import { Router } from 'express';
import { auth } from '../middleware/auth';

const router = Router();

// @route   POST /api/auth/register
// @desc    Register user
// @access  Public
router.post('/register', async (req, res) => {
  res.json({ message: 'Register endpoint - to be implemented' });
});

// @route   POST /api/auth/login
// @desc    Authenticate user & get token
// @access  Public
router.post('/login', async (req, res) => {
  res.json({ message: 'Login endpoint - to be implemented' });
});

// @route   GET /api/auth/me
// @desc    Get current user
// @access  Private
router.get('/me', auth, async (req, res) => {
  res.json({ message: 'Get current user - to be implemented' });
});

export default router;
