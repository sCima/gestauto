// data/vehicles.ts

export interface VehicleExpense {
    id: string
    tipo: string // "ipva", "manutenção", "multas", "preparação", "outros"
    valor: number
    descricao: string
    data: string // YYYY-MM-DD
}

export interface Vehicle {
    id: string
    brand: string
    model: string
    year: number
    color?: string
    purchasePrice: number
    expenses?: VehicleExpense[] // NOVO: despesas adicionais
    expectedSalePrice?: number
    expectedProfit?: number
    minimumSalePrice?: number // NOVO: preço mínimo definido pelo dono
    salePrice?: number
    saleDate?: string // YYYY-MM-DD
    status: "preparacao" | "pronto" | "vendido" // REMOVIDO "finalizado"
    responsavelEmail?: string
    entryDate?: string // YYYY-MM-DD
    fipePrice?: number
    notes?: string
}

export const initialVehicles: Vehicle[] = [
    {
        id: "1",
        brand: "Honda",
        model: "Civic",
        year: 2019,
        color: "Preto",
        purchasePrice: 58000,
        expenses: [
            { id: "e1", tipo: "ipva", valor: 1200, descricao: "IPVA 2024", data: "2024-01-15" },
            { id: "e2", tipo: "manutenção", valor: 800, descricao: "Troca de óleo e filtros", data: "2024-02-10" }
        ],
        expectedSalePrice: 68000,
        expectedProfit: 8000,
        minimumSalePrice: 65000,
        status: "pronto",
        responsavelEmail: "vendedor@gestauto.com",
        entryDate: "2024-06-10",
        fipePrice: 67000,
    },
    {
        id: "2",
        brand: "Toyota",
        model: "Corolla",
        year: 2020,
        color: "Prata",
        purchasePrice: 65000,
        expenses: [
            { id: "e3", tipo: "ipva", valor: 1400, descricao: "IPVA 2024", data: "2024-01-20" },
            { id: "e4", tipo: "preparação", valor: 2000, descricao: "Polimento e higienização", data: "2024-07-05" },
            { id: "e5", tipo: "multas", valor: 500, descricao: "Multa de trânsito anterior", data: "2024-07-10" }
        ],
        expectedSalePrice: 78000,
        expectedProfit: 9100,
        minimumSalePrice: 75000,
        status: "pronto",
        responsavelEmail: "vendedor@gestauto.com",
        entryDate: "2024-07-01",
        fipePrice: 76000,
    },
]