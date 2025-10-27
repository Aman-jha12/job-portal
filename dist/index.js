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
const express_1 = __importDefault(require("express"));
const client_1 = require("@Prisma/client");
const dotenv_1 = __importDefault(require("dotenv"));
// Load .env variables
dotenv_1.default.config();
// Import all your new routers
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const company_routes_1 = __importDefault(require("./routes/company.routes"));
const job_routes_1 = __importDefault(require("./routes/job.routes"));
const application_routes_1 = __importDefault(require("./routes/application.routes"));
const bookmark_routes_1 = __importDefault(require("./routes/bookmark.routes"));
const notification_routes_1 = __importDefault(require("./routes/notification.routes"));
const admin_routes_1 = __importDefault(require("./routes/admin.routes"));
const upload_routes_1 = __importDefault(require("./routes/upload.routes"));
// Import middleware
const auth_1 = require("./middleware/auth");
const app = (0, express_1.default)();
const prisma = new client_1.PrismaClient(); // You can remove this if no routes use it directly
const port = process.env.PORT || 3000;
// --- Global Middlewares ---
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
// --- Test Route ---
app.get("/api/v1", (req, res) => {
    res.send("Welcome to Job Portal API v1");
});
// --- API Routes ---
app.use('/api/v1/auth', auth_routes_1.default);
app.use('/api/v1/companies', company_routes_1.default); // Public GET, protected POST/PUT/DELETE inside
app.use('/api/v1/jobs', job_routes_1.default); // Public GET, protected POST inside
app.use('/api/v1/applications', auth_1.authMiddleware, application_routes_1.default); // Protect all application routes
app.use('/api/v1/bookmarks', auth_1.authMiddleware, bookmark_routes_1.default); // Protect all bookmark routes
app.use('/api/v1/notifications', auth_1.authMiddleware, notification_routes_1.default); // Protect all notification routes
app.use('/api/v1/admin', admin_routes_1.default); // All admin routes are protected inside the file
app.use('/api/v1/upload', upload_routes_1.default); // Upload routes are protected inside
app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});
// Graceful shutdown
process.on('SIGINT', () => __awaiter(void 0, void 0, void 0, function* () {
    yield prisma.$disconnect();
    process.exit(0);
}));
