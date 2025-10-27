import { Role } from '@Prisma/client';

// This 'declare global' is the magic part.
// It merges this definition with the original 'express' definitions.
declare global {
  namespace Express {
    export interface Request {
      // This tells TypeScript that the 'user' property can exist
      // on the Request object.
      user?: {
        id: string;
        role: Role;
      };
    }
  }
}