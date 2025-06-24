import { z } from 'zod'
import { faqItemSchema } from '../schema/faqItem'

export const faqCategoriesStateDataValidatorSchema = z.record(
    z.string(),
    z.array(faqItemSchema)
)
