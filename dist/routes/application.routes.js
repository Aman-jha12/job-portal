"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const client_1 = require("@Prisma/client");
const auth_1 = require("../middleware/auth");
const checkRole_1 = require("../middleware/checkRole");
const multer_1 = require("../config/multer");
const notificationQueue_1 = require("../queues/notificationQueue");
const router = (0, express_1.Router)();
const prisma = new client_1.PrismaClient();
// POST /api/v1/applications/:jobId
router.post("/:jobId", auth_1.authMiddleware, (0, checkRole_1.checkRole)([client_1.Role.APPLICANT]), multer_1.upload.single('resume'), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { jobId } = req.params;
    const { id: applicantId } = req.user;
    const { coverLetter } = req.body;
    if (!req.file) {
        return res.status(400).json({ message: 'Resume file is required' });
    }
    const resumeUrl = req.file.location; // Get S3 URL
    try {
        // Check if user already applied
        const existing = yield prisma.application.findFirst({ where: { applicantId, jobId } });
        if (existing) {
            return res.status(409).json({ message: "You have already applied for this job" });
        }
        const application = yield prisma.application.create({
            data: {
                applicantId,
                jobId,
                resumeUrl,
                coverLetter
            }
        });
        // Find job poster to send notification
        const job = yield prisma.job.findUnique({
            where: { id: jobId },
            select: { postedById: true, title: true }
        });
        // Add notification job to the queue
        if (job) {
            yield notificationQueue_1.notificationQueue.add({
                userId: job.postedById,
                message: `You have a new application for your job: ${job.title}`
            });
        }
        res.status(201).json(application);
    }
    catch (error) {
        res.status(500).json({ "message": "Error while creating application", error });
    }
}));
// GET /api/v1/applications (for the applicant)
router.get("/", auth_1.authMiddleware, (0, checkRole_1.checkRole)([client_1.Role.APPLICANT]), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id: applicantId } = req.user;
    try {
        const applications = yield prisma.application.findMany({
            where: { applicantId },
            include: { job: { include: { company: true } } }
        });
        res.status(200).json(applications);
    }
    catch (error) {
        res.status(500).json({ "message": "Error while fetching applications", error });
    }
}));
// GET /api/v1/applications/job/:jobId (for the recruiter)
router.get("/job/:jobId", auth_1.authMiddleware, (0, checkRole_1.checkRole)([client_1.Role.RECRUITER, client_1.Role.ADMIN]), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { jobId } = req.params;
    const { id: recruiterId } = req.user;
    try {
        // Security check: Make sure the recruiter posted this job
        const job = yield prisma.job.findFirst({
            where: { id: jobId, postedById: recruiterId }
        });
        if (!job && req.user.role !== client_1.Role.ADMIN) {
            return res.status(403).json({ message: "Forbidden: You did not post this job" });
        }
        const applications = yield prisma.application.findMany({
            where: { jobId },
            include: { applicant: { select: { id: true, name: true, email: true } } }
        });
        res.status(200).json(applications);
    }
    catch (error) {
        res.status(500).json({ "message": "Error while fetching applications", error });
    }
}));
// PATCH /api/v1/applications/:id/status (for the recruiter)
router.patch("/:id/status", auth_1.authMiddleware, (0, checkRole_1.checkRole)([client_1.Role.RECRUITER, client_1.Role.ADMIN]), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const { status } = req.body;
    const { id: recruiterId } = req.user;
    if (!status || !Object.values(client_1.ApplicationStatus).includes(status)) {
        return res.status(400).json({ message: "Invalid status provided" });
    }
    try {
        // Security Check: Find app, check if recruiter owns the job
        const application = yield prisma.application.findFirst({
            where: { id },
            include: { job: true }
        });
        if (!application) {
            return res.status(404).json({ message: "Application not found" });
        }
        if (application.job.postedById !== recruiterId && req.user.role !== client_1.Role.ADMIN) {
            return res.status(403).json({ message: "Forbidden: You do not own this job" });
        }
        const updatedApplication = yield prisma.application.update({
            where: { id },
            data: { status: status }
        });
        // Send notification to applicant
        yield notificationQueue_1.notificationQueue.add({
            userId: application.applicantId,
            message: `Your application status for "${application.job.title}" was updated to ${status}`
        });
        res.status(200).json(updatedApplication);
    }
    catch (error) {
        res.status(500).json({ "message": "Error while updating application", error });
    }
}));
// DELETE /api/v1/applications/:id (for the applicant)
router.delete("/:id", auth_1.authMiddleware, (0, checkRole_1.checkRole)([client_1.Role.APPLICANT]), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const { id: applicantId } = req.user;
    try {
        // Security Check: Make sure applicant owns this application
        const application = yield prisma.application.findFirst({
            where: { id, applicantId }
        });
        if (!application) {
            return res.status(404).json({ message: "Application not found or you do not own it" });
        }
        yield prisma.application.delete({ where: { id } });
        res.status(200).json({ message: "Application successfully withdrawn" });
    }
    catch (error) {
        res.status(500).json({ "message": "Error while deleting application", error });
    }
}));
exports.default = router;
