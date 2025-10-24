import { Router, Request, Response } from 'express';
import { PrismaClient, Role, ApplicationStatus } from '@Prisma/client';
import { authMiddleware } from '../middleware/auth';
import { checkRole } from '../middleware/checkRole';
import { upload } from '../config/multer';
import { notificationQueue } from '../queues/notificationQueue';

const router = Router();
const prisma = new PrismaClient();

// POST /api/v1/applications/:jobId
router.post("/:jobId", authMiddleware, checkRole([Role.APPLICANT]), upload.single('resume'), async (req: Request, res: Response) => {
  const { jobId } = req.params;
  const { id: applicantId } = req.user!;
  const { coverLetter } = req.body;

  if (!req.file) {
    return res.status(400).json({ message: 'Resume file is required' });
  }

  const resumeUrl = (req.file as any).location; // Get S3 URL

  try {
    // Check if user already applied
    const existing = await prisma.application.findFirst({ where: { applicantId, jobId } });
    if (existing) {
      return res.status(409).json({ message: "You have already applied for this job" });
    }

    const application = await prisma.application.create({
      data: {
        applicantId,
        jobId,
        resumeUrl,
        coverLetter
      }
    });

    // Find job poster to send notification
    const job = await prisma.job.findUnique({
      where: { id: jobId },
      select: { postedById: true, title: true }
    });

    // Add notification job to the queue
    if (job) {
      await notificationQueue.add({
        userId: job.postedById,
        message: `You have a new application for your job: ${job.title}`
      });
    }

    res.status(201).json(application);
  } catch (error) {
    res.status(500).json({ "message": "Error while creating application", error });
  }
});

// GET /api/v1/applications (for the applicant)
router.get("/", authMiddleware, checkRole([Role.APPLICANT]), async (req: Request, res: Response) => {
  const { id: applicantId } = req.user!;
  try {
    const applications = await prisma.application.findMany({
      where: { applicantId },
      include: { job: { include: { company: true } } }
    });
    res.status(200).json(applications);
  } catch (error) {
    res.status(500).json({ "message": "Error while fetching applications", error });
  }
});

// GET /api/v1/applications/job/:jobId (for the recruiter)
router.get("/job/:jobId", authMiddleware, checkRole([Role.RECRUITER, Role.ADMIN]), async (req: Request, res: Response) => {
  const { jobId } = req.params;
  const { id: recruiterId } = req.user!;

  try {
    // Security check: Make sure the recruiter posted this job
    const job = await prisma.job.findFirst({
      where: { id: jobId, postedById: recruiterId }
    });
    if (!job && req.user!.role !== Role.ADMIN) {
      return res.status(403).json({ message: "Forbidden: You did not post this job" });
    }

    const applications = await prisma.application.findMany({
      where: { jobId },
      include: { applicant: { select: { id: true, name: true, email: true } } }
    });
    res.status(200).json(applications);
  } catch (error) {
    res.status(500).json({ "message": "Error while fetching applications", error });
  }
});

// PATCH /api/v1/applications/:id/status (for the recruiter)
router.patch("/:id/status", authMiddleware, checkRole([Role.RECRUITER, Role.ADMIN]), async (req: Request, res: Response) => {
  const { id } = req.params;
  const { status } = req.body;
  const { id: recruiterId } = req.user!;

  if (!status || !Object.values(ApplicationStatus).includes(status)) {
    return res.status(400).json({ message: "Invalid status provided" });
  }

  try {
    // Security Check: Find app, check if recruiter owns the job
    const application = await prisma.application.findFirst({
      where: { id },
      include: { job: true }
    });
    
    if (!application) {
      return res.status(404).json({ message: "Application not found" });
    }
    
    if (application.job.postedById !== recruiterId && req.user!.role !== Role.ADMIN) {
       return res.status(403).json({ message: "Forbidden: You do not own this job" });
    }

    const updatedApplication = await prisma.application.update({
      where: { id },
      data: { status: status as ApplicationStatus }
    });

    // Send notification to applicant
    await notificationQueue.add({
      userId: application.applicantId,
      message: `Your application status for "${application.job.title}" was updated to ${status}`
    });

    res.status(200).json(updatedApplication);
  } catch (error) {
    res.status(500).json({ "message": "Error while updating application", error });
  }
});

// DELETE /api/v1/applications/:id (for the applicant)
router.delete("/:id", authMiddleware, checkRole([Role.APPLICANT]), async (req: Request, res: Response) => {
  const { id } = req.params;
  const { id: applicantId } = req.user!;
  try {
    // Security Check: Make sure applicant owns this application
    const application = await prisma.application.findFirst({
      where: { id, applicantId }
    });
    if (!application) {
      return res.status(404).json({ message: "Application not found or you do not own it" });
    }

    await prisma.application.delete({ where: { id } });
    res.status(200).json({ message: "Application successfully withdrawn" });
  } catch (error) {
    res.status(500).json({ "message": "Error while deleting application", error });
  }
});

export default router;