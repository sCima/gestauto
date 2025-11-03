export interface User {
    id: string
    name: string
    email: string
    profile: 'owner' | 'dono' | 'vendedor'
}

export const initialUsers: User[] = [
    {
        id: '1',
        name: 'Theo Binari',
        email: 'theo.binari@gmail.com',
        profile: 'owner'
    },
    {
        id: '2',
        name: 'João Silva',
        email: 'dono@autocenterpremium.com',
        profile: 'dono'
    },
    {
        id: '3',
        name: 'Maria Santos',
        email: 'vendedor@autocenterpremium.com',
        profile: 'vendedor'
    }
]
