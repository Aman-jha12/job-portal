import express, { Request, Response } from 'express';
import { PrismaClient } from '@Prisma/client';
import dotenv from 'dotenv';

// Load .env variables
dotenv.config();

// Import all your new routers
import authRoutes from './routes/auth.routes';
import companyRoutes from './routes/company.routes';
import jobRoutes from './routes/job.routes';
import applicationRoutes from './routes/application.routes';
import bookmarkRoutes from './routes/bookmark.routes';
import notificationRoutes from './routes/notification.routes';
import adminRoutes from './routes/admin.routes';
import uploadRoutes from './routes/upload.routes';

// Import middleware
import { authMiddleware } from './middleware/auth';

const app = express();
const prisma = new PrismaClient(); // You can remove this if no routes use it directly
const port = process.env.PORT || 3000;

// --- Global Middlewares ---
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --- Test Route ---
app.get("/api/v1", (req: Request, res: Response) => {
  res.send("Welcome to Job Portal API v1");
});

// --- API Routes ---
// Use the imported routers with a base path
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/companies', companyRoutes); // Public GET, protected POST/PUT/DELETE inside
app.use('/api/v1/jobs', jobRoutes); // Public GET, protected POST inside
app.use('/api/v1/applications', authMiddleware, applicationRoutes); // Protect all application routes
app.use('/api/v1/bookmarks', authMiddleware, bookmarkRoutes); // Protect all bookmark routes
app.use('/api/v1/notifications', authMiddleware, notificationRoutes); // Protect all notification routes
app.use('/api/v1/admin', adminRoutes); // All admin routes are protected inside the file
app.use('/api/v1/upload', uploadRoutes); // Upload routes are protected inside

// --- Start Server ---
app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  await prisma.$disconnect();
  process.exit(0);
});