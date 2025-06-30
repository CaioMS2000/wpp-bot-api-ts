import fastifyCors from '@fastify/cors'
import { fastify } from 'fastify'
import {
    ZodTypeProvider,
    jsonSchemaTransform,
    serializerCompiler,
    validatorCompiler,
} from 'fastify-type-provider-zod'
import { ConsoleFontColors, logger } from '@/core/logger'
import { findProjectRoot } from '@/utils/files'
import path from 'node:path'
import fs from 'node:fs'

const app = fastify()

app.setValidatorCompiler(validatorCompiler)
app.setSerializerCompiler(serializerCompiler)
app.register(fastifyCors)

const projectRoot = findProjectRoot(__dirname)
const requestLogPath = path.join(projectRoot, 'request-logs.json')

app.addHook('preHandler', async (request, reply) => {
    const small = {
        timestamp: new Date().toISOString(),
        method: request.method,
        url: request.url,
        headers: request.headers,
        query: request.query,
        params: request.params,
        body: "body in 'request-logs.json'",
    }
    const requestData = {
        timestamp: new Date().toISOString(),
        method: request.method,
        url: request.url,
        headers: request.headers,
        query: request.query,
        params: request.params,
        body: request.body,
    }

    logger.info(
        `${ConsoleFontColors.SoftBlue}MIDDLEWARE${ConsoleFontColors.Reset}\n${request.method} ${request.url}`,
        small
    )

    const logData = fs.existsSync(requestLogPath)
        ? JSON.parse(fs.readFileSync(requestLogPath, 'utf-8'))
        : { requests: [] }

    logData.requests.push(requestData)
    fs.writeFileSync(requestLogPath, JSON.stringify(logData, null, 2), 'utf-8')
})

app.addHook('onResponse', async (request, reply) => {
    logger.info(
        `Response: ${reply.statusCode} for ${request.method} ${request.url}`
    )
})

export { app }
