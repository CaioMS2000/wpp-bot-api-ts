export const parseOrigins = (raw?: string) =>
	(raw ?? '')
		.split(/[;,]/) // suporta ";" ou ","
		.map(s => s.trim())
		.filter(Boolean)
