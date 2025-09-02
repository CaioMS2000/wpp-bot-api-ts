import { ApplicationError } from '@/errors/application-case-error'

export class StateNotSupportedError extends Error implements ApplicationError {
	constructor(message = 'This state is not supported') {
		super(message)
	}
}
