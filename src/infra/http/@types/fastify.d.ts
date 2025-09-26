import 'fastify'
import { type AuthService } from '@/modules/web-api/services/auth-service'
import { type Tenant } from '@/modules/web-api/@types/tenant';
import { type User } from '@/modules/web-api/@types/user';

declare  module 'fastify' {
	interface FastifyRequest {
		getCurrentUserID: () => Promise<string>
		getManagerMembership: (cnpj: string) => Promise<{
			tenant: Tenant;
			manager: User;
		}>
		getPlatformAdmin: () => Promise<User>
		authService: AuthService
	}
}
