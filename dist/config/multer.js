"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.upload = void 0;
// src/config/multer.ts
const multer_1 = __importDefault(require("multer"));
const multer_s3_1 = __importDefault(require("multer-s3"));
const s3_1 = require("./s3");
const path_1 = __importDefault(require("path"));
exports.upload = (0, multer_1.default)({
    storage: (0, multer_s3_1.default)({
        s3: s3_1.s3,
        bucket: process.env.AWS_S3_BUCKET_NAME,
        contentType: multer_s3_1.default.AUTO_CONTENT_TYPE,
        key: (req, file, cb) => {
            var _a;
            // Create a unique filename
            const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
            const ext = path_1.default.extname(file.originalname);
            // Sort files into different folders based on the "key" (fieldname)
            let folder = 'other';
            if (file.fieldname === 'resume')
                folder = 'resumes';
            if (file.fieldname === 'profileImage')
                folder = 'profiles';
            const filename = `${folder}/${((_a = req.user) === null || _a === void 0 ? void 0 : _a.id) || 'public'}/${uniqueSuffix}${ext}`;
            cb(null, filename);
        },
    }),
    // Updated file filter to check fieldname
    fileFilter: (req, file, cb) => {
        // Check for profile images
        if (file.fieldname === 'profileImage') {
            if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/png') {
                cb(null, true);
            }
            else {
                cb(new Error('Invalid file type, only JPG and PNG are allowed!'));
            }
        }
        // Check for resumes
        else if (file.fieldname === 'resume') {
            if (file.mimetype === 'application/pdf' || file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
                cb(null, true);
            }
            else {
                cb(new Error('Invalid file type, only PDF and DOCX are allowed!'));
            }
        }
        // Reject anything else
        else {
            cb(new Error('Unexpected file field!'));
        }
    },
    limits: {
        fileSize: 1024 * 1024 * 5 // 5MB limit
    }
});
