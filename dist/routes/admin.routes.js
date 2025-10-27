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
// All routes in this file are protected by auth AND admin role
router.use(auth_1.authMiddleware);
router.use((0, checkRole_1.checkRole)([client_1.Role.ADMIN]));
// GET /api/v1/admin/users
router.get("/users", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const users = yield prisma.user.findMany({
            // Exclude passwords from the response
            select: { id: true, name: true, email: true, role: true, createdAt: true }
        });
        res.status(200).json(users);
    }
    catch (error) {
        res.status(500).json({ message: "Error while fetching users", error });
    }
}));
// DELETE /api/v1/admin/users/:id
router.delete("/users/:id", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    try {
        yield prisma.user.delete({ where: { id } });
        res.status(200).json({ message: "User deleted" });
    }
    catch (error) {
        res.status(500).json({ "message": "Error while deleting user", error });
    }
}));
// GET /api/v1/admin/companies
router.get("/companies", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const companies = yield prisma.company.findMany({ include: { owner: true } });
        res.status(200).json(companies);
    }
    catch (error) {
        res.status(500).json({ message: "Error while fetching companies", error });
    }
}));
// GET /api/v1/admin/jobs
router.get("/jobs", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const jobs = yield prisma.job.findMany({ include: { company: true, postedBy: true } });
        res.status(200).json(jobs);
    }
    catch (error) {
        res.status(500).json({ "message": "Error while fetching jobs", error });
    }
}));
exports.default = router;
