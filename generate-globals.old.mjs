// generate-globals.ts

import fs from 'node:fs'
import path from 'node:path'

// Você define aqui os tipos exportados de cada módulo, com informações completas
const exportsMap = {
    TsUtils: {
        types: [
            { name: 'Optional', generics: 'T, K extends keyof T' },
            { name: 'NotDefined', generics: 'T' },
            { name: 'Nullable', generics: 'T' },
        ],
        interfaces: [],
    },
    NextjsUtils: {
        types: [
            { name: 'Params', generics: '' },
            { name: 'SearchParams', generics: '' },
        ],
        interfaces: [{ name: 'PageProps', generics: '' }],
    },
}

const modules = [
    { importName: 'TsUtils', path: '@caioms/ts-utils' },
    { importName: 'NextjsUtils', path: '@caioms/ts-utils/nextjs' },
]

const outputFile = path.resolve('src/globals.d.ts')

// 🔧 Gera os imports
let fileContent = modules
    .map(m => `import type * as ${m.importName} from '${m.path}';`)
    .join('\n')

fileContent += `

declare global {
`

for (const { importName } of modules) {
    const { types, interfaces } = exportsMap[importName]

    for (const { name, generics } of types) {
        const genericParams = generics ? `<${generics}>` : ''
        fileContent += `  type ${name}${genericParams} = ${importName}.${name}${genericParams};\n`
    }

    for (const { name, generics } of interfaces) {
        const genericParams = generics ? `<${generics}>` : ''
        fileContent += `  interface ${name}${genericParams} extends ${importName}.${name}${genericParams} {}\n`
    }
}

fileContent += `}

export {};
`

// 📝 Escreve o arquivo
console.log('conteudo gerado:')
console.log(fileContent)
fs.writeFileSync(outputFile, fileContent, 'utf-8')
console.log(`✅ 'globals.d.ts' gerado com sucesso em: ${outputFile}`)
