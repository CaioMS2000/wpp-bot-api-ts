import 'fastify'
import { Manager } from "@/entities/manager"
import { Company } from "@/entities/company"
import { type AuthService } from '@/modules/web-api/services/auth-service'

declare  module 'fastify' {
	interface FastifyRequest {
		getCurrentUserID: () => Promise<string>
		getUserMembership: (cnpj: string) => Promise<{
			manager: Manager
			company: Company
		}>
		authService: AuthService
	}
}