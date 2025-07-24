import { FunctionRegistry } from '../../types'
import {
	collectUserDataArgsSchema,
	saveUserDataFn,
	saveUserDataTool,
} from './collect-user-data'

export const functionRegistry = {
	[saveUserDataTool.name]: {
		fn: saveUserDataFn,
		schema: collectUserDataArgsSchema,
	},
} satisfies Record<string, FunctionRegistry>
