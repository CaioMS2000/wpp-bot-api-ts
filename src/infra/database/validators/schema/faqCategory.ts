import { z } from 'zod'
import { faqItemSchema } from '../schema/faqItem'

export const faqCategorySchema = z.object({
    name: z.string(),
    items: z.array(faqItemSchema),
})
