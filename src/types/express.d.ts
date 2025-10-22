// This tells TypeScript that req can have a user property.
import { Role } from '@prisma/client';

declare global {
  namespace Express {
    export interface Request {
      user?: {
        id: string;
        role: Role;
      };
      file?: any; // For Multer
    }
  }
}