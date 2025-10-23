import { Request, Response, NextFunction } from 'express';
import { Role } from '@Prisma/client';

// This is a "factory function" - it returns a middleware function
export const checkRole = (roles: Role[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Forbidden: You do not have permission' });
    }

    next();
  };
};