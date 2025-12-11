"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Plus, Trash2 } from "lucide-react"
import { VehicleExpense } from "@/data/vehicles"
import { v4 as uuidv4 } from "uuid"

interface VehicleExpensesManagerProps {
    expenses: VehicleExpense[]
    onUpdate: (expenses: VehicleExpense[]) => void
    purchasePrice: number
}

const EXPENSE_TYPES = [
    { value: "ipva", label: "IPVA" },
    { value: "manutencao", label: "Manutenção" },
    { value: "multas", label: "Multas" },
    { value: "preparacao", label: "Preparação" },
    { value: "outros", label: "Outros" },
]

export default function VehicleExpensesManager({
    expenses = [],
    onUpdate,
    purchasePrice
}: VehicleExpensesManagerProps) {
    const [tipo, setTipo] = useState("ipva")
    const [valor, setValor] = useState("")
    const [descricao, setDescricao] = useState("")
    const [data, setData] = useState(new Date().toISOString().slice(0, 10))

    const totalExpenses = expenses.reduce((sum, exp) => sum + exp.valor, 0)
    const totalCost = purchasePrice + totalExpenses

    function handleAdd() {
        const valorNum = parseFloat(valor.replace(/[^\d,]/g, '').replace(',', '.'))

        if (!valorNum || valorNum <= 0) {
            alert("Digite um valor válido")
            return
        }

        const newExpense: VehicleExpense = {
            id: uuidv4(),
            tipo,
            valor: valorNum,
            descricao: descricao || EXPENSE_TYPES.find(t => t.value === tipo)?.label || "Despesa",
            data
        }

        onUpdate([...expenses, newExpense])

        // Reset form
        setValor("")
        setDescricao("")
        setData(new Date().toISOString().slice(0, 10))
    }

    function handleDelete(id: string) {
        onUpdate(expenses.filter(exp => exp.id !== id))
    }

    function formatCurrency(value: number) {
        return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-base">Despesas Adicionais</CardTitle>
                <div className="text-sm text-muted-foreground space-y-1">
                    <p>Valor de compra: <span className="font-semibold">{formatCurrency(purchasePrice)}</span></p>
                    <p>Total de despesas: <span className="font-semibold text-red-600">{formatCurrency(totalExpenses)}</span></p>
                    <p className="text-base">Custo total: <span className="font-bold">{formatCurrency(totalCost)}</span></p>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Form para adicionar despesa */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3 p-3 border rounded-lg bg-muted/50">
                    <div className="space-y-1">
                        <Label htmlFor="tipo" className="text-xs">Tipo</Label>
                        <Select value={tipo} onValueChange={setTipo}>
                            <SelectTrigger id="tipo">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {EXPENSE_TYPES.map(t => (
                                    <SelectItem key={t.value} value={t.value}>
                                        {t.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-1">
                        <Label htmlFor="valor" className="text-xs">Valor (R$)</Label>
                        <Input
                            id="valor"
                            type="text"
                            placeholder="0,00"
                            value={valor}
                            onChange={(e) => setValor(e.target.value)}
                        />
                    </div>

                    <div className="space-y-1">
                        <Label htmlFor="descricao" className="text-xs">Descrição</Label>
                        <Input
                            id="descricao"
                            placeholder="Ex: IPVA 2024"
                            value={descricao}
                            onChange={(e) => setDescricao(e.target.value)}
                        />
                    </div>

                    <div className="space-y-1">
                        <Label htmlFor="data" className="text-xs">Data</Label>
                        <Input
                            id="data"
                            type="date"
                            value={data}
                            onChange={(e) => setData(e.target.value)}
                        />
                    </div>

                    <div className="flex items-end">
                        <Button onClick={handleAdd} className="w-full" size="sm">
                            <Plus className="h-4 w-4 mr-1" />
                            Adicionar
                        </Button>
                    </div>
                </div>

                {/* Lista de despesas */}
                {expenses.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                        Nenhuma despesa adicional registrada
                    </p>
                ) : (
                    <div className="space-y-2">
                        {expenses.map(exp => (
                            <div
                                key={exp.id}
                                className="flex items-center justify-between p-3 border rounded-md hover:bg-muted/50 transition-colors"
                            >
                                <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs font-medium px-2 py-1 bg-blue-100 text-blue-700 rounded">
                                            {EXPENSE_TYPES.find(t => t.value === exp.tipo)?.label}
                                        </span>
                                        <span className="font-medium">{formatCurrency(exp.valor)}</span>
                                    </div>
                                    <p className="text-sm text-muted-foreground mt-1">
                                        {exp.descricao} • {new Date(exp.data).toLocaleDateString('pt-BR')}
                                    </p>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleDelete(exp.id)}
                                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    )
}