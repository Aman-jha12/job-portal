import { Router, Request, Response } from 'express';
import { PrismaClient } from '@Prisma/client';
import bcrypt from 'bcryptjs';
import jsonwebtoken from 'jsonwebtoken';
import { authMiddleware } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// POST /api/v1/auth/register
router.post("/register", async (req: Request, res: Response) => {
  const { username, email, password } = req.body;
  if (!username || !email || !password) {
    return res.status(400).json({ message: "All fields are required" });
  }
  try {
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(409).json({ message: "User already exists" });
    }

    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await prisma.user.create({
      data: { 
        name: username, 
        email, 
        password: hashedPassword 
      }
    });

    const token = jsonwebtoken.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET as string,
      { expiresIn: '1d' }
    );
    
    res.status(201).json({ "message": "Successfully created a new user", user, token });
  } catch (error) { 
    res.status(500).json({ "message": "Error while registering a new user", error }); 
  }
});

// POST /api/v1/auth/login
router.post("/login", async (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required" });
  }

  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = jsonwebtoken.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET as string,
      { expiresIn: '1d' }
    );

    res.status(200).json({ message: "Login successful", token, user });
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error", error });
  }
});




// GET /api/v1/auth/me
// Gets the profile of the currently logged-in user
router.get("/me", authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id; // Get the ID from the token

    const user = await prisma.user.findUnique({
      where: { id: userId },
      // Select only the data you want to send back (NEVER send the password)
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        profileImageUrl: true, // <-- HERE'S THE IMAGE
        createdAt: true
      }
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json(user);

  } catch (error) {
    res.status(500).json({ message: "Internal Server Error" });
  }
});

export default router;