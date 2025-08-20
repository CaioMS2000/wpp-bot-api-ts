import { FunctionRegistry } from '../../types'
import {
	saveUserDataArgsSchema,
	saveUserDataFn,
	saveUserDataTool,
} from './save-user-data'

export const functionRegistry: FunctionRegistry = {
	[saveUserDataTool.name]: {
		schema: saveUserDataArgsSchema,
		fn: saveUserDataFn,
	},
}
