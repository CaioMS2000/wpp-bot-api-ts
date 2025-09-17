import 'fastify'
import { type AuthService } from '@/modules/web-api/services/auth-service'
import { type Tenant } from '@/modules/web-api/@types/tenant';
import { type User } from '@/modules/web-api/@types/user';

declare  module 'fastify' {
	interface FastifyRequest {
		getCurrentUserID: () => Promise<string>
		getAdminMembership: (cnpj: string) => Promise<{
			tenant: Tenant;
			admin: User;
		}>
		authService: AuthService
	}
}