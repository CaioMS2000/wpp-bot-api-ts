export class AgentNotCompatibleError extends Error {
	constructor(message = 'This agent is not compatible') {
		super(message)
	}
}
