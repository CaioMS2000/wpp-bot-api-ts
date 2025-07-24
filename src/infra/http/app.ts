import fastifyCors from '@fastify/cors'
import fastifyJwt from '@fastify/jwt'
import fastifyCookie from '@fastify/cookie'
import { fastify } from 'fastify'
import {
	serializerCompiler,
	validatorCompiler,
} from 'fastify-type-provider-zod'
import { requestLogger } from './routes/api/middlewares/plugins/request-logger'

const app = fastify()

app.setValidatorCompiler(validatorCompiler)
app.setSerializerCompiler(serializerCompiler)
app.register(fastifyCors)
app.register(fastifyCookie)
app.register(fastifyJwt, {
	secret: 'some secret',
	cookie: {
		cookieName: 'token',
		signed: false,
	},
})
app.register(requestLogger)

export { app }
