import { ApplicationError } from '@/errors/application-case-error'

export class NotAllowedError extends Error implements ApplicationError {
	constructor(message = 'Not allowed') {
		super(message)
	}
}
