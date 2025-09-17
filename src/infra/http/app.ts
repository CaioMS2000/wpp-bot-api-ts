import { env } from '@/config/env'
import fastifyCookie from '@fastify/cookie'
import fastifyCors from '@fastify/cors'
import fastifyJwt from '@fastify/jwt'
import fastifyMultipart from '@fastify/multipart'
import swagger from '@fastify/swagger'
import swaggerUI from '@fastify/swagger-ui'
import ScalarApiReference from '@scalar/fastify-api-reference'
import { fastify } from 'fastify'
import {
	jsonSchemaTransform,
	serializerCompiler,
	validatorCompiler,
} from 'fastify-type-provider-zod'
import { SwaggerTheme, SwaggerThemeNameEnum } from 'swagger-themes'
import { parseOrigins } from '@/utils/cors'
import { requestLogger } from './routes/middlewares/plugins/request-logger'
import { errorHandler } from './routes/middlewares/error-handler'

const app = fastify({ trustProxy: true })
const allowedOrigins = parseOrigins(env.CORS_ORIGINS)

// third-party resources
app.setValidatorCompiler(validatorCompiler)
app.setSerializerCompiler(serializerCompiler)

// zod -> JSON Schema transform com fallback para esquemas já em JSON Schema
const safeTransform: typeof jsonSchemaTransform = input => {
	try {
		return jsonSchemaTransform(input)
	} catch {
		return input.schema as any
	}
}

app.register(swagger, {
	openapi: {
		openapi: '3.1.0',
		info: { title: 'WPP Bot API', version: '1.0.0' },
		components: {
			securitySchemes: {
				cookieAuth: {
					type: 'apiKey',
					in: 'cookie',
					name: env.HTTP_COOKIE_NAME,
				},
			},
		},
		security: [{ cookieAuth: [] }],
	},
	transform: safeTransform,
})

const theme = new SwaggerTheme()
const content = theme.getBuffer(SwaggerThemeNameEnum.DARK)

app.register(swaggerUI, {
	routePrefix: '/docs/swagger',
	theme: {
		css: [
			{
				filename: 'theme.css',
				content,
			},
		],
	},
})
app.register(ScalarApiReference, {
	routePrefix: '/docs',
})

app.register(fastifyCors, {
	origin: allowedOrigins,
	credentials: true,
	methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
	allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
})
app.register(fastifyCookie)
app.register(fastifyJwt, {
	secret: env.HTTP_TOKEN_SECRET,
	cookie: {
		cookieName: env.HTTP_COOKIE_NAME,
		signed: false,
	},
})
app.register(fastifyMultipart, {
	attachFieldsToBody: true,
	limits: {
		fileSize: 1024 * 1024 * env.UPLOAD_FILE_SIZE_LIMIT,
		files: env.UPLOAD_FILES_LIMIT,
	},
	async onFile(part) {
		const buf = await part.toBuffer()

		part.value = {
			buffer: buf,
			filename: part.filename,
			mimetype: part.mimetype,
			encoding: part.encoding,
		}
	},
})

// custom resources
app.register(requestLogger)
app.setErrorHandler(errorHandler)

export { app }
