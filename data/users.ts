export interface User {
    id: string
    name: string
    email: string
    profile: 'owner' | 'dono' | 'vendedor'
}

export const initialUsers: User[] = [
    {
        id: '1',
        name: 'João Silva',
        email: 'dono@autocenterpremium.com',
        profile: 'dono'
    },
    {
        id: '2',
        name: 'Maria Santos',
        email: 'vendedor@autocenterpremium.com',
        profile: 'vendedor'
    }
]
