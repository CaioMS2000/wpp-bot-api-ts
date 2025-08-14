import { ManagerService } from '../services/manager-service'

export class ManagerServiceFactory {
	getService() {
		return new ManagerService()
	}
}
