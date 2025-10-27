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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.notificationQueue = void 0;
const bull_1 = __importDefault(require("bull"));
const client_1 = require("@Prisma/client");
const prisma = new client_1.PrismaClient();
exports.notificationQueue = new bull_1.default('notifications', {
    redis: {
        host: process.env.REDIS_HOST || '127.0.0.1',
        port: parseInt(process.env.REDIS_PORT || '6379'),
        password: process.env.REDIS_PASSWORD || undefined,
    },
});
// The "worker" that processes jobs
exports.notificationQueue.process((job) => __awaiter(void 0, void 0, void 0, function* () {
    const { userId, message } = job.data;
    try {
        yield prisma.notification.create({
            data: {
                userId,
                message,
            },
        });
        console.log(`[Queue] Processed notification for user ${userId}`);
    }
    catch (error) {
        console.error('[Queue] Error processing notification job:', error);
    }
}));
exports.notificationQueue.on('completed', (job) => {
    console.log(`[Queue] Job ${job.id} (notification) completed`);
});
exports.notificationQueue.on('failed', (job, err) => {
    console.log(`[Queue] Job ${job.id} (notification) failed with error ${err.message}`);
});
console.log('[Queue] Notification queue worker started.');
