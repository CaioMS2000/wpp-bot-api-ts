import { ApplicationError } from '@/errors/application-case-error'

export class UnsupportedMessageTypeError
	extends Error
	implements ApplicationError
{
	constructor(message = 'Unsupported message type') {
		super(message)
	}
}
