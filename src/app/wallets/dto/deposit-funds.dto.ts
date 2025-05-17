import z from "zod";

export const depositFundsSchema = z.object({
  walletId: z.string(),
  amount: z.number(),
});

export type DepositFundsDto = z.infer<typeof depositFundsSchema>;
