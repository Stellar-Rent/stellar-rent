// types/express/index.d.ts
import type { User } from '@supabase/supabase-js';

declare module 'express-serve-static-core' {
  interface Request {
    user?: User;
    file?: Express.Multer.File;
  }
}
