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
const router = (0, express_1.Router)();
const prisma = new client_1.PrismaClient();
// POST /api/v1/jobs
router.post("/", auth_1.authMiddleware, (0, checkRole_1.checkRole)([client_1.Role.RECRUITER, client_1.Role.ADMIN]), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id: postedById } = req.user;
    const { title, description, location, companyId, jobType, salaryRange, skillsRequired } = req.body;
    if (!title || !description || !location || !companyId || !jobType || !skillsRequired) {
        return res.status(400).json({ message: "Title, desc, location, companyId, jobType, and skillsRequired are required" });
    }
    // TODO: Add check to ensure req.user.id owns the companyId
    try {
        const newJob = yield prisma.job.create({
            data: {
                title,
                description,
                location,
                type: jobType,
                salaryRange,
                skillsRequired,
                company: { connect: { id: companyId } },
                postedBy: { connect: { id: postedById } }
            }
        });
        res.status(201).json(newJob);
    }
    catch (error) {
        console.error("Error creating job:", error);
        res.status(500).json({ "message": "Error while creating a new job", error });
    }
}));
// GET /api/v1/jobs
router.get("/", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { location, type, skills } = req.query;
    try {
        const where = {
            status: client_1.JobStatus.OPEN // Default to only showing OPEN jobs
        };
        if (location) {
            where.location = { equals: location, mode: 'insensitive' };
        }
        if (type) {
            where.type = { equals: type };
        }
        if (skills) {
            const skillsArray = Array.isArray(skills) ? skills : [skills];
            where.skillsRequired = { hasSome: skillsArray };
        }
        const jobs = yield prisma.job.findMany({
            where: where,
            include: {
                company: { select: { id: true, name: true, location: true } },
                postedBy: { select: { id: true, name: true } }
            },
            orderBy: { createdAt: 'desc' }
        });
        res.status(200).json(jobs);
    }
    catch (error) {
        console.error("Error fetching jobs:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
}));
// GET /api/v1/jobs/:id
router.get("/:id", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    try {
        const job = yield prisma.job.findUnique({
            where: { id: id },
            include: {
                company: true,
                postedBy: { select: { id: true, name: true, email: true } }
            }
        });
        if (!job) {
            return res.status(404).json({ message: "Job not found" });
        }
        res.status(200).json(job);
    }
    catch (error) {
        console.error("Error fetching job:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
}));
exports.default = router;
