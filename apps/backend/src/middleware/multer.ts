import multer from 'multer';

const storage = multer.memoryStorage(); // store in memory before upload to Supabase
export const upload = multer({ storage });
