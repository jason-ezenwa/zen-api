import { z } from "zod";

export const getUserRecordsSchema = z.object({
  userId: z.string(),
  page: z.coerce.number().optional(),
});

export type GetUserRecordsDto = z.infer<typeof getUserRecordsSchema>;
