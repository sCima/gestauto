export interface Vehicle {
    id: string
    brand: string
    model: string
    year: number
    purchasePrice: number
    expectedSalePrice?: number
    expectedProfit?: number
    status: "preparacao" | "pronto" | "vendido" | "finalizado"
    fipePrice?: number
    salePrice?: number
    responsavelEmail?: string
    entryDate?: string // "YYYY-MM-DD"
}

export const initialVehicles: Vehicle[] = [
    {
        id: '1',
        brand: 'Toyota',
        model: 'Corolla',
        year: 2020,
        purchasePrice: 65000,
        expectedSalePrice: 75000,
        status: 'pronto',
        entryDate: "2025-08-10",
        responsavelEmail: "vendedor1@gmail.com"
    },
    {
        id: '2',
        brand: 'Honda',
        model: 'Civic',
        year: 2019,
        purchasePrice: 58000,
        expectedSalePrice: 68000,
        status: 'preparacao',
        entryDate: "2025-08-10",
        responsavelEmail: "vendedor1@gmail.com"
    },
    {
        id: '3',
        brand: 'Volkswagen',
        model: 'Jetta',
        year: 2021,
        purchasePrice: 72000,
        expectedSalePrice: 82000,
        status: 'vendido',
        salePrice: 80000,
        entryDate: "2025-08-10",
        responsavelEmail: "vendedor1@gmail.com"
    }
]
