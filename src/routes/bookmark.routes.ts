import { Router, Request, Response } from 'express';
import { PrismaClient } from '@Prisma/client';
import { authMiddleware } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// POST /api/v1/bookmarks/:jobId
router.post("/:jobId", authMiddleware, async (req: Request, res: Response) => {
  const { jobId } = req.params;
  const { id: userId } = req.user!;

  try {
    // Check if already bookmarked
    const existing = await prisma.bookmark.findFirst({ where: { userId, jobId } });
    if (existing) {
      return res.status(409).json({ message: "Job already bookmarked" });
    }

    const bookmark = await prisma.bookmark.create({
      data: { jobId, userId }
    });
    res.status(201).json(bookmark);
  } catch (error) {
    res.status(500).json({ "message": "Error while creating bookmark", error });
  }
});

// GET /api/v1/bookmarks
router.get("/", authMiddleware, async (req: Request, res: Response) => {
  const { id: userId } = req.user!;
  try {
    const bookmarks = await prisma.bookmark.findMany({
      where: { userId },
      include: { job: { include: { company: true } } }
    });
    res.status(200).json(bookmarks);
  } catch (error) {
    res.status(500).json({ "message": "Error while fetching bookmarks", error });
  }
});

// DELETE /api/v1/bookmarks/:jobId
router.delete("/:jobId", authMiddleware, async (req: Request, res: Response) => {
  const { jobId } = req.params;
  const { id: userId } = req.user!;

  try {
    // Find the bookmark by the composite key (userId + jobId)
    const bookmark = await prisma.bookmark.findFirst({
      where: { jobId, userId }
    });

    if (!bookmark) {
      return res.status(404).json({ message: "Bookmark not found" });
    }

    // Delete by its actual unique ID
    await prisma.bookmark.delete({
      where: { id: bookmark.id }
    });
    res.status(200).json({ message: "Bookmark removed" });
  } catch (error) {
    res.status(500).json({ "message": "Error while deleting bookmark", error });
  }
});

export default router;