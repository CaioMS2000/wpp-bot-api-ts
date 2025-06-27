export const fromPrismaToDomain = (
    from: 'CLIENT' | 'EMPLOYEE' | 'AI'
): 'client' | 'employee' | 'AI' => {
    return from.toLowerCase() as 'client' | 'employee' | 'AI'
}
export const fromDomainToPrisma = (
    from: 'client' | 'employee' | 'AI'
): 'CLIENT' | 'EMPLOYEE' | 'AI' => {
    return from.toUpperCase() as 'CLIENT' | 'EMPLOYEE' | 'AI'
}
