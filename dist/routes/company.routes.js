"use strict";
/// <reference path="../types/express.d.ts" />
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
// GET /api/v1/companies
router.get("/", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const companies = yield prisma.company.findMany();
        res.status(200).json(companies);
    }
    catch (error) {
        res.status(500).json({ "message": "Error while fetching companies", error });
    }
}));
// POST /api/v1/companies
router.post("/", auth_1.authMiddleware, (0, checkRole_1.checkRole)([client_1.Role.RECRUITER, client_1.Role.ADMIN]), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { name, description, location } = req.body;
    const ownerId = req.user.id; // Get owner ID from logged-in user
    if (!name || !description || !location) {
        return res.status(400).json({ message: "All fields are required" });
    }
    try {
        const existingCompany = yield prisma.company.findUnique({ where: { name } });
        if (existingCompany) {
            return res.status(409).json({ message: "Company already exists" });
        }
        const newCompany = yield prisma.company.create({
            data: {
                name,
                description,
                location,
                owner: { connect: { id: ownerId } } // Connect to the user who made the request
            }
        });
        res.status(201).json({ message: "Successfully created a new company", newCompany });
    }
    catch (error) {
        console.error("Error while creating a new company:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
}));
// GET /api/v1/companies/:id
router.get("/:id", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    try {
        const company = yield prisma.company.findUnique({ where: { id } });
        if (!company) {
            return res.status(404).json({ message: "Company not found" });
        }
        res.status(200).json(company);
    }
    catch (error) {
        res.status(500).json({ "message": "Error while fetching company", error });
    }
}));
// PUT /api/v1/companies/:id
router.put("/:id", auth_1.authMiddleware, (0, checkRole_1.checkRole)([client_1.Role.RECRUITER, client_1.Role.ADMIN]), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const { name, description, location } = req.body;
    try {
        const company = yield prisma.company.findUnique({ where: { id } });
        if (!company) {
            return res.status(404).json({ message: "Company not found" });
        }
        // Security Check: Only owner or admin can update
        if (company.ownerId !== req.user.id && req.user.role !== client_1.Role.ADMIN) {
            return res.status(403).json({ message: "Forbidden: You do not own this company" });
        }
        const updatedCompany = yield prisma.company.update({
            where: { id },
            data: { name, description, location }
        });
        res.status(200).json(updatedCompany);
    }
    catch (error) {
        res.status(500).json({ "message": "Error while updating company", error });
    }
}));
// DELETE /api/v1/companies/:id
router.delete("/:id", auth_1.authMiddleware, (0, checkRole_1.checkRole)([client_1.Role.RECRUITER, client_1.Role.ADMIN]), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    try {
        const company = yield prisma.company.findUnique({ where: { id } });
        if (!company) {
            return res.status(404).json({ message: "Company not found" });
        }
        // Security Check: Only owner or admin can delete
        if (company.ownerId !== req.user.id && req.user.role !== client_1.Role.ADMIN) {
            return res.status(403).json({ message: "Forbidden: You do not own this company" });
        }
        const deletedCompany = yield prisma.company.delete({ where: { id } });
        res.status(200).json(deletedCompany);
    }
    catch (error) {
        res.status(500).json({ "message": "Error while deleting company", error });
    }
}));
exports.default = router;
