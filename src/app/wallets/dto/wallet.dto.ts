import { z } from "zod";

export const getWalletSchema = z.object({
  walletId: z.string(),
});

export type GetWalletDto = z.infer<typeof getWalletSchema>;
