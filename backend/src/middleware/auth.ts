import { Response, NextFunction } from 'express';
import { AuthRequest, UserRole } from '../types';

export const auth = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    // TODO: Implement proper JWT authentication
    // Mock authentication for now
    req.user = {
      id: 'mock-user-id',
      email: 'mock@example.com',
      role: UserRole.DEVELOPER,
      organization: 'mock-org-id'
    };

    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      error: {
        code: 'TOKEN_ERROR',
        message: 'Token is not valid'
      },
      timestamp: new Date().toISOString()
    });
  }
};

export const authorize = (...roles: UserRole[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Access denied'
        },
        timestamp: new Date().toISOString()
      });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Insufficient permissions'
        },
        timestamp: new Date().toISOString()
      });
      return;
    }

    next();
  };
};
