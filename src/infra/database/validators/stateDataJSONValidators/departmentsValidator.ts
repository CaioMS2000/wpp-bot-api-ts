import { z } from 'zod'
import { departmentSchema } from '../schema/department'

export const departmentsValidatorSchema = z.array(departmentSchema)
