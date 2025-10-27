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
const router = (0, express_1.Router)();
const prisma = new client_1.PrismaClient();
// POST /api/v1/bookmarks/:jobId
router.post("/:jobId", auth_1.authMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { jobId } = req.params;
    const { id: userId } = req.user;
    try {
        // Check if already bookmarked
        const existing = yield prisma.bookmark.findFirst({ where: { userId, jobId } });
        if (existing) {
            return res.status(409).json({ message: "Job already bookmarked" });
        }
        const bookmark = yield prisma.bookmark.create({
            data: { jobId, userId }
        });
        res.status(201).json(bookmark);
    }
    catch (error) {
        res.status(500).json({ "message": "Error while creating bookmark", error });
    }
}));
// GET /api/v1/bookmarks
router.get("/", auth_1.authMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id: userId } = req.user;
    try {
        const bookmarks = yield prisma.bookmark.findMany({
            where: { userId },
            include: { job: { include: { company: true } } }
        });
        res.status(200).json(bookmarks);
    }
    catch (error) {
        res.status(500).json({ "message": "Error while fetching bookmarks", error });
    }
}));
// DELETE /api/v1/bookmarks/:jobId
router.delete("/:jobId", auth_1.authMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { jobId } = req.params;
    const { id: userId } = req.user;
    try {
        // Find the bookmark by the composite key (userId + jobId)
        const bookmark = yield prisma.bookmark.findFirst({
            where: { jobId, userId }
        });
        if (!bookmark) {
            return res.status(404).json({ message: "Bookmark not found" });
        }
        // Delete by its actual unique ID
        yield prisma.bookmark.delete({
            where: { id: bookmark.id }
        });
        res.status(200).json({ message: "Bookmark removed" });
    }
    catch (error) {
        res.status(500).json({ "message": "Error while deleting bookmark", error });
    }
}));
exports.default = router;
