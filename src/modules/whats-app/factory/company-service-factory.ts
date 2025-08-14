import { CompanyService } from '../services/company-service'

export class CompanyServiceFactory {
	getService(): CompanyService {
		return new CompanyService()
	}
}
