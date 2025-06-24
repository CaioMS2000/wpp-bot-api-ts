import { z } from 'zod'
import { faqItemSchema } from '../schema/faqItem'

export const faqCategoryValidatorSchema = z
    .record(z.string(), z.array(faqItemSchema))
    .refine(
        obj => Object.keys(obj).length === 1,
        'Object must have exactly one key'
    )
