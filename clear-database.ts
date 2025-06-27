import { fileURLToPath } from 'node:url'
import { PrismaClient, Prisma } from './prisma/generated'
import { prisma } from '@/lib/prisma'

export async function clearDatabase(
    prisma: PrismaClient | Prisma.TransactionClient,
    modelsList: string[] = []
) {
    let models: Nullable<string[]> = null
    // Ordem importa! Do mais dependente → ao mais independente
    const orderedModels = [
        'message',
        'conversation',
        'client',
        'employee',
        'department',
        'fAQItem',
        'fAQCategory',
        'businessHour',
        'company',
        'manager',
    ]

    if (modelsList.length > 0) {
        console.log('using modelsList')
        models = modelsList
    } else {
        console.log('using orderedModels')
        models = orderedModels
    }

    console.log(`Deleting models: ${models.join(', ')}`)

    for (const modelName of models) {
        const model = prisma[modelName as keyof typeof prisma] as any
        if (typeof model?.deleteMany === 'function') {
            console.log(`Deleting ${modelName}...`)
            await model.deleteMany({})
        }
    }
}

async function main() {
    await prisma.$transaction(async tx => {
        await clearDatabase(tx)
    })
}

// @ts-ignore
const isMainModule = process.argv[1] === fileURLToPath(import.meta.url)

if (isMainModule) {
    console.clear()
    console.log('Script de limpeza de banco de dados')
    main()
        .then(() => {
            console.log('Clear concluído com sucesso')
        })
        .catch(e => {
            console.error(e)
            process.exit(1)
        })
        .finally(async () => {
            await prisma.$disconnect()
        })
}
