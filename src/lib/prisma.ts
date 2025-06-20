import { PrismaClient } from 'ROOT/prisma/generated'

declare global {
    var cachedPrism: PrismaClient
}

let prisma: PrismaClient
if (process.env.NODE_ENV === 'production') {
    prisma = new PrismaClient()
} else {
    if (!global.cachedPrism) {
        global.cachedPrism = new PrismaClient()
    }
    prisma = global.cachedPrism
}

export { prisma }
