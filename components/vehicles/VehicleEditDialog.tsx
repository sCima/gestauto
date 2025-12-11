"use client"

import { useEffect, useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Vehicle, VehicleExpense } from "@/data/vehicles"
import VehicleExpensesManager from "@/components/vehicles/VehicleExpensesManager"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface VehicleEditDialogProps {
    open: boolean
    vehicle: Vehicle | null
    onClose: () => void
    onSave: (vehicle: Vehicle) => void
}

export default function VehicleEditDialog({
    open,
    vehicle,
    onClose,
    onSave
}: VehicleEditDialogProps) {
    const [brand, setBrand] = useState("")
    const [model, setModel] = useState("")
    const [year, setYear] = useState("")
    const [color, setColor] = useState("")
    const [purchasePrice, setPurchasePrice] = useState("")
    const [expectedSalePrice, setExpectedSalePrice] = useState("")
    const [minimumSalePrice, setMinimumSalePrice] = useState("")
    const [expenses, setExpenses] = useState<VehicleExpense[]>([])
    const [notes, setNotes] = useState("")

    useEffect(() => {
        if (vehicle) {
            setBrand(vehicle.brand)
            setModel(vehicle.model)
            setYear(String(vehicle.year))
            setColor(vehicle.color || "")
            setPurchasePrice(String(vehicle.purchasePrice))
            setExpectedSalePrice(String(vehicle.expectedSalePrice || ""))
            setMinimumSalePrice(String(vehicle.minimumSalePrice || ""))
            setExpenses(vehicle.expenses || [])
            setNotes(vehicle.notes || "")
        }
    }, [vehicle])

    function handleSave() {
        if (!vehicle) return

        const totalExpenses = expenses.reduce((sum, exp) => sum + exp.valor, 0)
        const purchasePriceNum = parseFloat(purchasePrice) || 0
        const expectedSalePriceNum = parseFloat(expectedSalePrice) || 0
        const totalCost = purchasePriceNum + totalExpenses
        const calculatedProfit = expectedSalePriceNum - totalCost

        const updated: Vehicle = {
            ...vehicle,
            brand,
            model,
            year: parseInt(year),
            color,
            purchasePrice: purchasePriceNum,
            expectedSalePrice: expectedSalePriceNum,
            minimumSalePrice: parseFloat(minimumSalePrice) || undefined,
            expectedProfit: calculatedProfit,
            expenses,
            notes
        }

        onSave(updated)
        onClose()
    }

    if (!vehicle) return null

    const totalExpenses = expenses.reduce((sum, exp) => sum + exp.valor, 0)
    const purchasePriceNum = parseFloat(purchasePrice) || 0
    const totalCost = purchasePriceNum + totalExpenses
    const expectedSalePriceNum = parseFloat(expectedSalePrice) || 0
    const calculatedProfit = expectedSalePriceNum - totalCost

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Editar Veículo</DialogTitle>
                </DialogHeader>

                <Tabs defaultValue="dados" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="dados">Dados Básicos</TabsTrigger>
                        <TabsTrigger value="despesas">Despesas Adicionais</TabsTrigger>
                    </TabsList>

                    <TabsContent value="dados" className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="brand">Marca</Label>
                                <Input
                                    id="brand"
                                    value={brand}
                                    onChange={(e) => setBrand(e.target.value)}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="model">Modelo</Label>
                                <Input
                                    id="model"
                                    value={model}
                                    onChange={(e) => setModel(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="year">Ano</Label>
                                <Input
                                    id="year"
                                    type="number"
                                    value={year}
                                    onChange={(e) => setYear(e.target.value)}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="color">Cor</Label>
                                <Input
                                    id="color"
                                    value={color}
                                    onChange={(e) => setColor(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="purchasePrice">Valor de Compra (R$)</Label>
                                <Input
                                    id="purchasePrice"
                                    type="number"
                                    step="0.01"
                                    value={purchasePrice}
                                    onChange={(e) => setPurchasePrice(e.target.value)}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="totalCost">Custo Total (com despesas)</Label>
                                <Input
                                    id="totalCost"
                                    value={totalCost.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                    disabled
                                    className="bg-muted"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="expectedSalePrice">Preço de Venda Esperado (R$)</Label>
                                <Input
                                    id="expectedSalePrice"
                                    type="number"
                                    step="0.01"
                                    value={expectedSalePrice}
                                    onChange={(e) => setExpectedSalePrice(e.target.value)}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="minimumSalePrice">Preço Mínimo de Venda (R$)</Label>
                                <Input
                                    id="minimumSalePrice"
                                    type="number"
                                    step="0.01"
                                    value={minimumSalePrice}
                                    onChange={(e) => setMinimumSalePrice(e.target.value)}
                                    placeholder="Opcional"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>Lucro Esperado</Label>
                            <div className={`p-3 rounded-md font-semibold text-lg ${calculatedProfit >= 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                {calculatedProfit.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Margem: {totalCost > 0 ? ((calculatedProfit / totalCost) * 100).toFixed(1) : 0}%
                            </p>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="notes">Observações</Label>
                            <textarea
                                id="notes"
                                className="w-full min-h-[80px] px-3 py-2 text-sm rounded-md border border-input bg-background"
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                placeholder="Anotações sobre o veículo..."
                            />
                        </div>
                    </TabsContent>

                    <TabsContent value="despesas">
                        <VehicleExpensesManager
                            expenses={expenses}
                            onUpdate={setExpenses}
                            purchasePrice={purchasePriceNum}
                        />
                    </TabsContent>
                </Tabs>

                <div className="flex justify-end gap-2 mt-4">
                    <Button variant="outline" onClick={onClose}>
                        Cancelar
                    </Button>
                    <Button onClick={handleSave}>
                        Salvar Alterações
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}