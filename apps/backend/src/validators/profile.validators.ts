// validation/profile.schema.ts
import { z } from 'zod';

export const updateProfileSchema = z.object({
  name: z.string().optional(),
  phone: z.string().optional(),
  address: z
    .object({
      street: z.string(),
      city: z.string(),
      country: z.string(),
      postal_code: z.string(),
    })
    .optional(),
  preferences: z
    .object({
      notifications: z.boolean(),
      newsletter: z.boolean(),
      language: z.string(),
    })
    .optional(),
  social_links: z
    .object({
      facebook: z.string().url().optional(),
      twitter: z.string().url().optional(),
      instagram: z.string().url().optional(),
    })
    .optional(),
});
