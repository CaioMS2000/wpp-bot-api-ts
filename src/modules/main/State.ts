export interface State {
	/**
	 * Process the client message and optionally transition to another state.
	 *
	 * @param message - Raw text received from the client.
	 */
	handle(message: string): Promise<void>
	getName(): string
	getSnapshot?(): unknown
}
