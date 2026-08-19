import multer from 'multer';
import path from 'path';
import crypto from 'crypto';
import fs from 'fs';
import { config } from '../config/env';
import { ValidationError } from '../utils/errors';

// Ensure upload directories exist
const uploadDir = config.storagePath;
const cvUploadDir = path.join(uploadDir, 'cvs');
const imageUploadDir = path.join(uploadDir, 'images');

[uploadDir, cvUploadDir, imageUploadDir].forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

const cvStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, cvUploadDir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const uniqueName = `${Date.now()}-${crypto.randomBytes(8).toString('hex')}${ext}`;
    cb(null, uniqueName);
  },
});

const cvFileFilter = (_req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedExtensions = ['.pdf', '.docx', '.doc', '.txt'];
  const allowedMimeTypes = [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/msword',
    'text/plain',
  ];

  const ext = path.extname(file.originalname).toLowerCase();
  if (allowedExtensions.includes(ext) || allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new ValidationError('Invalid file type. Only PDF, DOCX, DOC, and TXT files are allowed.'));
  }
};

export const cvUpload = multer({
  storage: cvStorage,
  limits: { fileSize: config.maxCvSize },
  fileFilter: cvFileFilter,
});

const imageStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, imageUploadDir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const uniqueName = `${Date.now()}-${crypto.randomBytes(8).toString('hex')}${ext}`;
    cb(null, uniqueName);
  },
});

const imageFileFilter = (_req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  // Accept all image/* MIME types (JPEG, PNG, WEBP, GIF, SVG, HEIC, AVIF, BMP, TIFF, etc.)
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    // Fallback: accept by extension for formats browsers may send as octet-stream
    const ext = path.extname(file.originalname).toLowerCase();
    const knownImageExts = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.svg', '.heic', '.heif', '.avif', '.bmp', '.tiff', '.tif', '.ico'];
    if (knownImageExts.includes(ext)) {
      cb(null, true);
    } else {
      cb(new ValidationError('Invalid file type. Please upload an image file (JPG, PNG, WEBP, GIF, SVG, HEIC, AVIF, BMP, TIFF, etc.).'));
    }
  }
};

export const imageUpload = multer({
  storage: imageStorage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit for images
  fileFilter: imageFileFilter,
});

const certificateFileFilter = (_req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const ext = path.extname(file.originalname).toLowerCase();
  const allowedDocExts = ['.pdf', '.jpg', '.jpeg', '.png', '.webp', '.gif', '.svg', '.heic', '.avif', '.bmp'];
  
  if (file.mimetype.startsWith('image/') || file.mimetype === 'application/pdf' || allowedDocExts.includes(ext)) {
    cb(null, true);
  } else {
    cb(new ValidationError('Invalid file type. Only PDF documents and image files (JPG, PNG, WEBP, SVG) are allowed for certificates.'));
  }
};

export const certificateUpload = multer({
  storage: imageStorage,
  limits: { fileSize: 15 * 1024 * 1024 }, // 15MB limit
  fileFilter: certificateFileFilter,
});
