export class ConflictError extends Error {
	constructor(message = 'Operation got a conflict') {
		super(message)
	}
}
