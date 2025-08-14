import { ApplicationError } from '@/errors/application-case-error'

export class InvalidTypeError extends Error implements ApplicationError {
	constructor(message = 'Invalid type') {
		super(message)
	}
}
