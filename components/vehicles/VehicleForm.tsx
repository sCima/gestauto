"use client"

import { useState } from "react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Vehicle } from "@/data/vehicles"
import { useToast } from "@/components/ui/use-toast"

interface VehicleFormProps {
    onAddVehicle: (vehicle: Vehicle) => void
    currentUser: { email: string }
}

/** ✅ Formata número para BRL */
function formatCurrency(value: number): string {
    return value.toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL",
        minimumFractionDigits: 2,
    })
}

/** ✅ Máscara dinâmica de moeda (exibe e formata conforme o usuário digita) */
function maskCurrency(input: string): string {
    const digits = input.replace(/\D/g, "").slice(0, 9) // Máx. 9 dígitos → R$ 9.999.999,99
    const number = parseFloat((parseInt(digits || "0") / 100).toFixed(2))
    return formatCurrency(number)
}

/** ✅ Converte string "R$ 75.000,00" → 75000 */
function parseCurrency(value: string): number {
    return Number(value.replace(/[R$\s.]/g, "").replace(",", ".")) || 0
}

export default function VehicleForm({ onAddVehicle, currentUser }: VehicleFormProps) {
    const { toast } = useToast()
    const [form, setForm] = useState({
        brand: "",
        model: "",
        year: "",
        purchasePrice: "R$ 0,00",
        expectedSalePrice: "R$ 0,00",
    })

    /** Atualiza e formata os campos de moeda */
    const handleCurrencyChange = (key: "purchasePrice" | "expectedSalePrice", value: string) => {
        setForm((prev) => ({ ...prev, [key]: maskCurrency(value) }))
    }

    /** Valida e adiciona veículo */
    const handleSubmit = () => {
        const purchasePrice = parseCurrency(form.purchasePrice)
        const expectedSalePrice = parseCurrency(form.expectedSalePrice)

        if (!form.brand.trim() || !form.model.trim() || !form.year.trim()) {
            toast.error("Preencha todos os campos obrigatórios.")
            return
        }

        if (purchasePrice <= 0 || expectedSalePrice <= 0) {
            toast.error("Os valores devem ser maiores que zero.")
            return
        }

        const newVehicle: Vehicle = {
            id: String(Date.now()),
            brand: form.brand,
            model: form.model,
            year: Number(form.year),
            purchasePrice,
            expectedSalePrice,
            status: "preparacao",
            responsavelEmail: currentUser.email,
        }

        onAddVehicle(newVehicle)
        toast.success(`Veículo ${form.brand} ${form.model} adicionado com sucesso!`)

        setForm({
            brand: "",
            model: "",
            year: "",
            purchasePrice: "R$ 0,00",
            expectedSalePrice: "R$ 0,00",
        })
    }

    return (
        <Card className="mb-8">
            <CardHeader>
                <CardTitle>Adicionar Veículo</CardTitle>
            </CardHeader>

            <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
                <div>
                    <Label>Marca</Label>
                    <input
                        value={form.brand}
                        onChange={(e) => setForm({ ...form, brand: e.target.value })}
                        placeholder="Ex: Toyota"
                        className="w-full p-2 border rounded-md"
                    />
                </div>

                <div>
                    <Label>Modelo</Label>
                    <input
                        value={form.model}
                        onChange={(e) => setForm({ ...form, model: e.target.value })}
                        placeholder="Ex: Corolla"
                        className="w-full p-2 border rounded-md"
                    />
                </div>

                <div>
                    <Label>Ano</Label>
                    <input
                        type="number"
                        value={form.year}
                        onChange={(e) => setForm({ ...form, year: e.target.value })}
                        placeholder="2024"
                        min="1900"
                        max={new Date().getFullYear() + 1}
                        className="w-full p-2 border rounded-md"
                    />
                </div>

                <div>
                    <Label>Preço de Compra</Label>
                    <input
                        value={form.purchasePrice}
                        onChange={(e) => handleCurrencyChange("purchasePrice", e.target.value)}
                        className="w-full p-2 border rounded-md text-right"
                    />
                </div>

                <div>
                    <Label>Preço Esperado</Label>
                    <input
                        value={form.expectedSalePrice}
                        onChange={(e) => handleCurrencyChange("expectedSalePrice", e.target.value)}
                        className="w-full p-2 border rounded-md text-right"
                    />
                </div>

                <div className="flex items-end">
                    <Button className="w-full" onClick={handleSubmit}>
                        Adicionar
                    </Button>
                </div>
            </CardContent>
        </Card>
    )
}
