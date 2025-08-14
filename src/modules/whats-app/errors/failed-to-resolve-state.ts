export class FailedToResolveStateError extends Error {
	constructor(message = 'State not resolved') {
		super(message)
	}
}
