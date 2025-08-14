import { ApplicationError } from '@/errors/application-case-error'

export class NotImplementedError extends Error implements ApplicationError {
	constructor(message = 'Invalid type') {
		super(message)
	}
}
