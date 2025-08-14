export class StateNotSupportedError extends Error {
	constructor(message = 'This state is not supported') {
		super(message)
	}
}
