import { MenuOption } from '@/domain/whats-app/@types'

export function formatMenuOptions(options: MenuOption[]): string {
    return options.map(opt => `${opt.key} - ${opt.label}`).join('\n')
}
