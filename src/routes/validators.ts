import z from "zod";

const UPLOAD_MAX_SIZE = 3 * 1024 * 1024; // 3MB
const ACCEPTED_TYPES = ["image/png", "image/jpeg"];

// Single file validation schema
export const uploadSchema = z
  .instanceof(File, { message: "Invalid file object" })
  .refine((file) => file.size <= UPLOAD_MAX_SIZE, "File is too large (max is 3MB)")
  .refine((file) => ACCEPTED_TYPES.includes(file.type), "Only PNG and JPEG are accepted");

// Multiple files validation schema
export const uploadsSchema = z.object({
  uploads: z
    .preprocess((value) => {

      if (Array.isArray(value)) return value;

      if (value instanceof File) return [value];
      // If it's empty, falsy, or a blank string from FormData, return undefined
      if (!value || value === "") return undefined;
      
      return [value];
    }, z.array(uploadSchema).min(1, "At least one file is required")),
});

export const avatarSchema = z.object({
    avatar: uploadSchema,
});

export const createLandmark = z.object({
  name: z.string().min(1, "Name is required"),
  slug: z.string().min(1, "Slug is required"),
  description: z.string(),
  labels: z.array(z.string()),
  
  thumbnail: z.string(),
  
  assets: z.string().array(),
  
  position: z.object({
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
  }),
});