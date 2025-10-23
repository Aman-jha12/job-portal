// src/config/multer.ts
import multer from 'multer';
import multerS3 from 'multer-s3';
import { s3 } from './s3';
import path from 'path';

export const upload = multer({
  storage: multerS3({
    s3: s3,
    bucket: process.env.AWS_S3_BUCKET_NAME!,
    contentType: multerS3.AUTO_CONTENT_TYPE,
    key: (req, file, cb) => {
      // Create a unique filename
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const ext = path.extname(file.originalname);
      
      // Sort files into different folders based on the "key" (fieldname)
      let folder = 'other';
      if (file.fieldname === 'resume') folder = 'resumes';
      if (file.fieldname === 'profileImage') folder = 'profiles';

      const filename = `${folder}/${req.user?.id || 'public'}/${uniqueSuffix}${ext}`;
      cb(null, filename);
    },
  }),
  // Updated file filter to check fieldname
  fileFilter: (req, file, cb) => {
    // Check for profile images
    if (file.fieldname === 'profileImage') {
      if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/png') {
        cb(null, true);
      } else {
        cb(new Error('Invalid file type, only JPG and PNG are allowed!'));
      }
    } 
    // Check for resumes
    else if (file.fieldname === 'resume') {
      if (file.mimetype === 'application/pdf' || file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        cb(null, true);
      } else {
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