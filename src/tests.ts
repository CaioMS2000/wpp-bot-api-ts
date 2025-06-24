import { prisma } from './lib/prisma'

async function main() {
    const result = await prisma.department.findMany({
        include: { queue: true },
    })
    console.log(result)
}

main()
