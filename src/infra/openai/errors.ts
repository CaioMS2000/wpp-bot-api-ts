export class TenantOpenAIKeyMissingError extends Error {
	constructor(public tenantId: string) {
		super(
			`[TenantOpenAIKeyMissing] Tenant ${tenantId} has no OpenAI API key configured`
		)
	}
}
