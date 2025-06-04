import type { RequestHandler } from 'express';
import multer from 'multer';

// Multer configuration
const storage = multer.memoryStorage();
export const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024,
    files: 10,
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  },
});

// Image processing middleware
export const processImageUploads: RequestHandler = (req, res, next) => {
  if (
    !req.files ||
    (Array.isArray(req.files) && req.files.length === 0) ||
    (!Array.isArray(req.files) && Object.keys(req.files).length === 0)
  )
    return next();

  const images = (req.files as Express.Multer.File[]).map((file) => {
    const base64 = file.buffer.toString('base64');
    return `data:${file.mimetype};base64,${base64}`;
  });

  req.body.images = [...(req.body.images || []), ...images];
  next();
};
