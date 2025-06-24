import { z } from 'zod'
import { faqCategorySchema } from '../schema/faqCategory'

export const faqCategoriesStateDataValidatorSchema = z.array(faqCategorySchema)
