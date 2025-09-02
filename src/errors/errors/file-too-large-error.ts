import { ApplicationError } from '@/errors/application-case-error'

export class FileTooLargeError extends Error implements ApplicationError {
	constructor(message = 'File exceeds allowed size') {
		super(message)
	}
}
