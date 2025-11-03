export interface Vehicle {
    id: string
    brand: string
    model: string
    year: number
    purchasePrice: number
    expectedSalePrice: number
    status: "preparacao" | "pronto" | "vendido" | "finalizado"
    salePrice?: number
    fipePrice?: number
    responsavelEmail: string 
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
        responsavelEmail: "vendedor1@gmail.com"
    }
]
