import { Request, Response, NextFunction } from 'express';
import jsonwebtoken from 'jsonwebtoken';
import { Role } from '@Prisma/client';

export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Authentication invalid: No token provided' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const payload = jsonwebtoken.verify(
      token,
      process.env.JWT_SECRET as string
    ) as { id: string; role: Role }; // Cast the decoded payload

    // Attach the user to the request object
    req.user = { id: payload.id, role: payload.role };
    next(); // Move to the next middleware/route handler
  } catch (error) {
    return res.status(401).json({ message: 'Authentication invalid: Token verification failed' });
  }
};