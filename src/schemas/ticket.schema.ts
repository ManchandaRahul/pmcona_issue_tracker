import { z } from "zod";

export const ticketSchema = z.object({
  businessUnit: z.string().min(1, "Required"),
  module: z.string().min(1, "Required"),
  supportType: z.string().min(1, "Required"),
  description: z.string().min(5, "Min 5 chars"),
});
