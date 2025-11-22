"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Vehicle } from "@/data/vehicles"

// ✅ Função para aplicar máscara de moeda (BRL)
function formatCurrencyBR(value: string | number) {
    if (!value) return ""
    const numeric = value.toString().replace(/\D/g, "")
    return new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
    }).format(Number(numeric) / 100)
}

// ✅ Função para extrair valor numérico da máscara
function extractNumericValue(formatted: string): number {
    return Number(formatted.replace(/\D/g, "")) / 100
}

interface VehicleEditDialogProps {
    vehicle: Vehicle | null
    open: boolean
    onClose: () => void
    onSave: (vehicle: Vehicle) => void
}

export default function VehicleEditDialog({ vehicle, open, onClose, onSave }: VehicleEditDialogProps) {
    const [form, setForm] = useState({
        brand: "",
        model: "",
        year: "",
        purchasePrice: "",
        expectedSalePrice: "",
    })

    useEffect(() => {
        if (vehicle) {
            setForm({
                brand: vehicle.brand,
                model: vehicle.model,
                year: String(vehicle.year),
                purchasePrice: formatCurrencyBR(vehicle.purchasePrice),
                expectedSalePrice: vehicle.expectedSalePrice != null
                    ? formatCurrencyBR(vehicle.expectedSalePrice)
                    : "",

            })
        }
    }, [vehicle])

    const handleSave = () => {
        if (!vehicle) return

        const updatedVehicle: Vehicle = {
            ...vehicle,
            brand: form.brand,
            model: form.model,
            year: Number(form.year),
            purchasePrice: extractNumericValue(form.purchasePrice),
            expectedSalePrice: extractNumericValue(form.expectedSalePrice),
        }

        onSave(updatedVehicle)
        onClose()
    }

    if (!vehicle) return null

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Editar Veículo</DialogTitle>
                </DialogHeader>

                <div className="space-y-4 py-2">
                    <div>
                        <Label>Marca</Label>
                        <Input
                            value={form.brand}
                            onChange={(e) => setForm({ ...form, brand: e.target.value })}
                        />
                    </div>

                    <div>
                        <Label>Modelo</Label>
                        <Input
                            value={form.model}
                            onChange={(e) => setForm({ ...form, model: e.target.value })}
                        />
                    </div>

                    <div>
                        <Label>Ano</Label>
                        <Input
                            type="text"
                            inputMode="numeric"
                            placeholder="Ex: 2022"
                            value={form.year}
                            onChange={(e) => setForm({ ...form, year: e.target.value.replace(/\D/g, "") })}
                        />
                    </div>

                    <div>
                        <Label>Preço de Compra</Label>
                        <Input
                            type="text"
                            inputMode="numeric"
                            placeholder="R$ 65.000,00"
                            value={form.purchasePrice}
                            onChange={(e) => {
                                const numericValue = e.target.value.replace(/\D/g, "")
                                setForm({ ...form, purchasePrice: formatCurrencyBR(numericValue) })
                            }}
                        />
                    </div>

                    <div>
                        <Label>Preço Esperado</Label>
                        <Input
                            type="text"
                            inputMode="numeric"
                            placeholder="R$ 75.000,00"
                            value={form.expectedSalePrice}
                            onChange={(e) => {
                                const numericValue = e.target.value.replace(/\D/g, "")
                                setForm({ ...form, expectedSalePrice: formatCurrencyBR(numericValue) })
                            }}
                        />
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>Cancelar</Button>
                    <Button onClick={handleSave}>Salvar</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
