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
// src/routes/upload.routes.ts
const express_1 = require("express");
const client_1 = require("@Prisma/client");
const auth_1 = require("../middleware/auth");
const multer_1 = require("../config/multer");
const router = (0, express_1.Router)();
const prisma = new client_1.PrismaClient();
// POST /api/v1/upload/resume
router.post("/resume", auth_1.authMiddleware, multer_1.upload.single('resume'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: "No file uploaded." });
    }
    const resumeUrl = req.file.location;
    res.status(201).json({ message: "Resume uploaded successfully", url: resumeUrl });
});
// POST /api/v1/upload/profile
router.post("/profile", auth_1.authMiddleware, multer_1.upload.single('profileImage'), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    if (!req.file) {
        return res.status(400).json({ message: "No file uploaded." });
    }
    const profileUrl = req.file.location;
    const { id: userId } = req.user; // Get the logged-in user's ID
    try {
        // --- THIS IS THE LOGIC YOU WERE MISSING ---
        const updatedUser = yield prisma.user.update({
            where: { id: userId },
            data: { profileImageUrl: profileUrl }
        });
        // ------------------------------------------
        res.status(201).json({
            message: "Profile image uploaded and saved successfully",
            url: profileUrl,
            user: updatedUser
        });
    }
    catch (error) {
        console.error("Error saving profile image URL:", error);
        res.status(500).json({ message: "File uploaded but failed to save to user profile" });
    }
}));
exports.default = router;
