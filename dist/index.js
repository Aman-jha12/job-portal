"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const prisma_1 = require("../src/generated/prisma"); 
const app = (0, express_1.default)();
const prisma = new prisma_1.PrismaClient();
const port = process.env.PORT || 3000;
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
app.get("/", (req, res) => {
    res.send("Welcome to Job Portal API");
});
app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});
