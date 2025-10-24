import { Router, Request, Response } from 'express';
import { PrismaClient, Role } from '@Prisma/client';
import { authMiddleware } from '../middleware/auth';
import { checkRole } from '../middleware/checkRole';

const router = Router();
const prisma = new PrismaClient();

// All routes in this file are protected by auth AND admin role
router.use(authMiddleware);
router.use(checkRole([Role.ADMIN]));

// GET /api/v1/admin/users
router.get("/users", async (req: Request, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      // Exclude passwords from the response
      select: { id: true, name: true, email: true, role: true, createdAt: true }
    });
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ message: "Error while fetching users", error });
  }
});

// DELETE /api/v1/admin/users/:id
router.delete("/users/:id", async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    await prisma.user.delete({ where: { id } });
    res.status(200).json({ message: "User deleted" });
  } catch (error) {
    res.status(500).json({ "message": "Error while deleting user", error });
  }
});

// GET /api/v1/admin/companies
router.get("/companies", async (req: Request, res: Response) => {
  try {
    const companies = await prisma.company.findMany({ include: { owner: true } });
    res.status(200).json(companies);
  } catch (error) {
    res.status(500).json({ message: "Error while fetching companies", error });
  }
});

// GET /api/v1/admin/jobs
router.get("/jobs", async (req: Request, res: Response) => {
  try {
    const jobs = await prisma.job.findMany({ include: { company: true, postedBy: true } });
    res.status(200).json(jobs);
  } catch (error) {
    res.status(500).json({ "message": "Error while fetching jobs", error });
  }
});

export default router;