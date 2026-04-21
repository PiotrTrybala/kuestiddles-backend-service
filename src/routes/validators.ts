import z from "zod";

const UPLOAD_MAX_SIZE = 3 * 1024 * 1024;
const ACCEPTED_TYPES = ["image/png", "image/jpeg"];

export const uploadSchema = z.instanceof(File)
    .refine((file) => file.size <= UPLOAD_MAX_SIZE, "File is too large (max is 3MB)")
    .refine((file) => ACCEPTED_TYPES.includes(file.type), "Invalid file type");

export const avatarSchema = z.object({
    avatar: uploadSchema,
});

export const uploadsSchema = z.object({
    uploads: z.preprocess((value) => {
        if (Array.isArray(value)) return value;
        if (value instanceof File) return [value];
        return [];
    }, z.array(uploadSchema).min(1, "At least one file is required")),
});