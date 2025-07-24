import fastifyCors from '@fastify/cors'
import fastifyJwt from '@fastify/jwt'
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
app.register(fastifyJwt, {
	secret: 'some secret',
})
app.register(requestLogger)

export { app }
