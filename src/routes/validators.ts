import z from "zod";

const UPLOAD_MAX_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_TYPES = ["image/png", "image/jpeg"];

// Single file validation schema
export const uploadSchema = z
  .instanceof(File, { message: "Invalid file object" })
  .refine((file) => file.size <= UPLOAD_MAX_SIZE, "File is too large (max is 3MB)")
  .refine((file) => ACCEPTED_TYPES.includes(file.type), "Only PNG and JPEG are accepted");

export const avatarUploadSchema = z.object({
  avatar: z.preprocess((value) => {
      if (value instanceof File) return [value];
      if (!value || value === "") return undefined;
  }, uploadSchema),
})

// Multiple files validation schema
export const imagesSchema = z.object({
  images: z
    .preprocess((value) => {

      if (Array.isArray(value)) return value;

      if (value instanceof File) return [value];
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