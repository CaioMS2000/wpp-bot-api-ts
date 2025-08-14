import { StateContextService } from '../services/state-context-service'

export class StateContextServiceFactory {
	getService() {
		return new StateContextService()
	}
}
