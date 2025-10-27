"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authMiddleware = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const authMiddleware = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Authentication invalid: No token provided' });
    }
    const token = authHeader.split(' ')[1];
    try {
        const payload = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET); // Cast the decoded payload
        // Attach the user to the request object
        req.user = { id: payload.id, role: payload.role };
        next(); // Move to the next middleware/route handler
    }
    catch (error) {
        return res.status(401).json({ message: 'Authentication invalid: Token verification failed' });
    }
};
exports.authMiddleware = authMiddleware;
