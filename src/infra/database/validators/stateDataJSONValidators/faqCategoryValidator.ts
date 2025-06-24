import { z } from 'zod'
import { faqItemSchema } from '../schema/faqItem'

export const faqCategoryValidatorSchema = z.object({
    categoryName: z.string(),
    items: z.array(faqItemSchema),
})
