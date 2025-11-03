"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Vehicle } from "@/data/vehicles"
import { formatCurrency, getStatusColor, getStatusLabel } from "@/lib/utils"
import { Pencil, Trash, RefreshCw } from "lucide-react"
import { useToast } from "../ui/use-toast"

// ✅ Máscara de moeda BRL
function formatCurrencyBR(value: string | number) {
    if (!value) return ""
    const numeric = value.toString().replace(/\D/g, "")
    return new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
    }).format(Number(numeric) / 100)
}

// ✅ Extrair valor numérico da máscara
function extractNumericValue(formatted: string): number {
    return Number(formatted.replace(/\D/g, "")) / 100
}

interface VehicleCardProps {
    vehicle: Vehicle
    onDelete: () => void
    onEdit: () => void
    onStatusChange: (status: Vehicle["status"], salePrice?: number) => void
}

export default function VehicleCard({ vehicle, onDelete, onEdit, onStatusChange }: VehicleCardProps) {
    const { toast } = useToast()
    const [selectedStatus, setSelectedStatus] = useState<Vehicle["status"]>(vehicle.status)
    const [salePrice, setSalePrice] = useState<string>(vehicle.salePrice ? formatCurrencyBR(vehicle.salePrice) : "")
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [pendingStatus, setPendingStatus] = useState<Vehicle["status"] | null>(null)
    const [error, setError] = useState("")

    useEffect(() => {
        setSelectedStatus(vehicle.status)
    }, [vehicle.status])

    const profit = vehicle.status === "vendido"
        ? (vehicle.salePrice || 0) - vehicle.purchasePrice
        : vehicle.expectedSalePrice - vehicle.purchasePrice

    const handleStatusSelect = (status: Vehicle["status"]) => {
        setPendingStatus(status)
        setIsDialogOpen(true)
    }

    const handleConfirmStatus = () => {
        if (!pendingStatus) return

        if (pendingStatus === "vendido") {
            const value = extractNumericValue(salePrice)
            if (!value || isNaN(value) || value <= 0) {
                setError("Informe um valor válido para a venda.")
                toast.error("Valor inválido. Digite um valor maior que zero.")
                return
            }
            onStatusChange("vendido", value)
            toast.success(`Veículo vendido por ${formatCurrency(value)}`)
        } else {
            onStatusChange(pendingStatus)
            toast.success(`Status alterado para ${getStatusLabel(pendingStatus)}`)
        }

        setSelectedStatus(pendingStatus)
        setError("")
        setIsDialogOpen(false)
    }

    const handleCancelStatus = () => {
        setPendingStatus(null)
        setSalePrice(vehicle.salePrice ? formatCurrencyBR(vehicle.salePrice) : "")
        setIsDialogOpen(false)
    }

    return (
        <>
            <Card className="shadow-sm border border-gray-200 bg-white">
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-lg font-semibold">{vehicle.brand} {vehicle.model}</CardTitle>
                        <Badge className={getStatusColor(vehicle.status)}>
                            {getStatusLabel(vehicle.status)}
                        </Badge>
                    </div>
                    <CardDescription className="text-gray-500">Ano {vehicle.year}</CardDescription>
                </CardHeader>

                <CardContent className="space-y-4">
                    <div className="flex justify-between text-sm">
                        <span>Compra:</span>
                        <span>{formatCurrency(vehicle.purchasePrice)}</span>
                    </div>

                    {vehicle.status === "vendido" && vehicle.salePrice ? (
                        <div className="flex justify-between text-sm">
                            <span>Venda:</span>
                            <span className="text-green-600 font-semibold">{formatCurrency(vehicle.salePrice)}</span>
                        </div>
                    ) : (
                        <div className="flex justify-between text-sm">
                            <span>Esperado:</span>
                            <span>{formatCurrency(vehicle.expectedSalePrice)}</span>
                        </div>
                    )}

                    <div className="flex justify-between text-sm">
                        <span>{vehicle.status === "vendido" ? "Lucro Real:" : "Lucro Estimado:"}</span>
                        <span className={profit >= 0 ? "text-green-600 font-bold" : "text-red-600 font-bold"}>
                            {formatCurrency(profit)}
                        </span>
                    </div>

                    {/* Alterar status */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Alterar status:</label>
                        <Select value={selectedStatus} onValueChange={handleStatusSelect}>
                            <SelectTrigger>
                                <SelectValue placeholder="Selecione um status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="preparacao">Em Preparação</SelectItem>
                                <SelectItem value="pronto">Disponível</SelectItem>
                                <SelectItem value="vendido">Vendido</SelectItem>
                                <SelectItem value="finalizado">Finalizado</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="flex justify-between pt-4">
                        <Button size="sm" variant="outline" onClick={onEdit}>
                            <Pencil className="h-4 w-4 mr-1" /> Editar
                        </Button>
                        <Button size="sm" variant="destructive" onClick={onDelete}>
                            <Trash className="h-4 w-4 mr-1" /> Excluir
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Modal tema claro premium */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="bg-white border border-gray-200 shadow-xl rounded-xl">
                    <DialogHeader className="text-center space-y-2">
                        <div className="flex justify-center">
                            <RefreshCw className="h-10 w-10 text-[#4CAF50]" />
                        </div>
                        <DialogTitle className="text-xl font-semibold text-gray-900">
                            Confirmar alteração de status
                        </DialogTitle>
                        <p className="text-sm text-gray-600">
                            Você está alterando o status do veículo:
                        </p>
                        <p className="text-base font-medium text-gray-800">
                            {vehicle.brand} {vehicle.model} ({vehicle.year})
                        </p>
                        <p className="text-sm text-gray-600">
                            Novo status: <span className="font-semibold text-[#4CAF50]">{pendingStatus && getStatusLabel(pendingStatus)}</span>
                        </p>
                    </DialogHeader>

                    {pendingStatus === "vendido" && (
                        <div className="space-y-2 mt-4">
                            <label className="text-sm font-medium text-gray-700">Informe o valor da venda:</label>
                            <Input
                                className="bg-gray-50 border-gray-300"
                                placeholder="R$ 80.000,00"
                                value={salePrice}
                                onChange={(e) => {
                                    const raw = e.target.value.replace(/\D/g, "")
                                    setSalePrice(formatCurrencyBR(raw))
                                    setError("")
                                }}
                            />
                            {error && <p className="text-red-600 text-sm">{error}</p>}
                        </div>
                    )}

                    <DialogFooter className="mt-6 flex justify-end space-x-3">
                        <Button
                            variant="outline"
                            className="border-gray-300 text-gray-700 hover:bg-gray-100"
                            onClick={handleCancelStatus}
                        >
                            Cancelar
                        </Button>
                        <Button
                            className="bg-[#4CAF50] hover:bg-[#43a047] text-white font-semibold"
                            onClick={handleConfirmStatus}
                        >
                            Confirmar
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    )
}
