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
// GET /api/v1/notifications
router.get("/", auth_1.authMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id: userId } = req.user;
    try {
        const notifications = yield prisma.notification.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' }
        });
        res.status(200).json(notifications);
    }
    catch (error) {
        res.status(500).json({ "message": "Error while fetching notifications", error });
    }
}));
// PATCH /api/v1/notifications/:id/read
router.patch("/:id/read", auth_1.authMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const { id: userId } = req.user;
    try {
        // Security check
        const notification = yield prisma.notification.findFirst({
            where: { id, userId }
        });
        if (!notification) {
            return res.status(404).json({ message: "Notification not found or you do not own it" });
        }
        const updatedNotification = yield prisma.notification.update({
            where: { id },
            data: { isRead: true }
        });
        res.status(200).json(updatedNotification);
    }
    catch (error) {
        res.status(500).json({ "message": "Error while updating notification", error });
    }
}));
// DELETE /api/v1/notifications/:id
router.delete("/:id", auth_1.authMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const { id: userId } = req.user;
    try {
        // Security check
        const notification = yield prisma.notification.findFirst({
            where: { id, userId }
        });
        if (!notification) {
            return res.status(404).json({ message: "Notification not found or you do not own it" });
        }
        yield prisma.notification.delete({ where: { id } });
        res.status(200).json({ message: "Notification deleted" });
    }
    catch (error) {
        res.status(500).json({ "message": "Error while deleting notification", error });
    }
}));
exports.default = router;
