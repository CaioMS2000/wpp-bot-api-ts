import { ApplicationError } from '@/errors/application-case-error'

export class UnsupportedFileTypeError
	extends Error
	implements ApplicationError
{
	constructor(message = 'Unsupported file type') {
		super(message)
	}
}
