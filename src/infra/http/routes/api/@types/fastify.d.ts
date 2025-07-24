import 'fastify'
import { Manager } from "@/domain/entities/manager"
import { Company } from "@/domain/entities/company"
import { type AuthService } from '@/domain/web-api/services/auth-service'

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