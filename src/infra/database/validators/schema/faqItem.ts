import { z } from 'zod'

export const faqItemSchema = z.object({
    question: z.string(),
    answer: z.string(),
})
