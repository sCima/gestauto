"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Vehicle } from "@/data/vehicles";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatCurrency, getStatusColor, getStatusLabel } from "@/lib/utils";

interface VehicleCardProps {
    vehicle: Vehicle;
    onDelete: () => void;
    onEdit: () => void;
    onStatusChange: (status: Vehicle["status"], salePrice?: number) => void;
}

export default function VehicleCard({ vehicle, onDelete, onEdit, onStatusChange }: VehicleCardProps) {
    const [statusToChange, setStatusToChange] = useState<Vehicle["status"] | "">("");
    const [salePrice, setSalePrice] = useState("");
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    const handleStatusSelect = (status: Vehicle["status"]) => {
        if (status === vehicle.status) return;
        setStatusToChange(status);
        setIsDialogOpen(true);
    };

    const confirmStatusChange = () => {
        if (statusToChange === "vendido" && !salePrice) {
            alert("Informe o valor da venda.");
            return;
        }
        const numericValue =
            statusToChange === "vendido"
                ? Number(salePrice.replace(/\D/g, "")) / 100
                : undefined;
        onStatusChange(statusToChange as Vehicle["status"], numericValue);
        setIsDialogOpen(false);
    };

    return (
        <>
            <Card className="shadow-sm border border-gray-200 bg-white">
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <CardTitle>
                            {vehicle.brand} {vehicle.model}
                        </CardTitle>
                        <span
                            className={`px-5 py-2 mx-auto rounded-full text-xs font-medium whitespace-nowrap ${getStatusColor(vehicle.status)}`}
                        >
                            {getStatusLabel(vehicle.status)}
                        </span>
                        
                    </div>
                </CardHeader>

                <CardContent className="space-y-2 text-sm">
                    <p><strong>Ano:</strong> {vehicle.year}</p>
                    <p>
                        <strong>Entrada:</strong>{" "}
                        {vehicle.entryDate
                            ? new Date(vehicle.entryDate).toLocaleDateString("pt-BR")
                            : "—"}
                    </p>
                    <p><strong>Compra:</strong> {formatCurrency(vehicle.purchasePrice)}</p>

                    {typeof vehicle.expectedSalePrice === "number" && (
                        <p>
                            <strong>Valor esperado:</strong> {formatCurrency(vehicle.expectedSalePrice)}
                        </p>
                    )}

                    {typeof vehicle.expectedProfit === "number" && (
                        <p>
                            <strong>Lucro esperado:</strong> {formatCurrency(vehicle.expectedProfit)}
                        </p>
                    )}

                    {vehicle.status === "vendido" && typeof vehicle.salePrice === "number" && (
                        <>
                            <p>
                                <strong>Valor vendido:</strong> {formatCurrency(vehicle.salePrice)}
                            </p>
                            <p>
                                <strong>Lucro real:</strong>{" "}
                                {formatCurrency(
                                    (vehicle.salePrice ?? 0) - (vehicle.purchasePrice ?? 0)
                                )}
                            </p>
                        </>
                    )}

                    {vehicle.color && (
                        <p><strong>Cor:</strong> {vehicle.color}</p>
                    )}

                    {vehicle.notes && (
                        <p className="text-sm">
                            <strong>Obs.:</strong> {vehicle.notes}
                        </p>
                    )}



                    {/* Ações */}
                    <div className="flex gap-2 mt-4">
                        <Button variant="outline" size="sm" onClick={onEdit}>Editar</Button>
                        <Button variant="destructive" size="sm" onClick={onDelete}>Excluir</Button>
                    </div>

                    {/* Alterar status */}
                    <div className="mt-3">
                        <label className="text-xs text-gray-600">Alterar status:</label>
                        <Select onValueChange={(v) => handleStatusSelect(v as Vehicle["status"])}>
                            <SelectTrigger>
                                <SelectValue placeholder="Selecione..." />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="preparacao">Em preparação</SelectItem>
                                <SelectItem value="pronto">Disponível</SelectItem>
                                <SelectItem value="vendido">Vendido</SelectItem>
                                <SelectItem value="finalizado">Finalizado</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            {/* Modal de confirmação */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Confirmar alteração</DialogTitle>
                    </DialogHeader>
                    <p>Confirmar mudança de status para <strong>{getStatusLabel(statusToChange as any)}</strong>?</p>

                    {statusToChange === "vendido" && (
                        <div className="mt-3">
                            <label className="text-sm">Valor da venda:</label>
                            <Input
                                placeholder="R$ 0,00"
                                value={salePrice}
                                onChange={(e) => {
                                    const raw = e.target.value.replace(/\D/g, "");
                                    setSalePrice((Number(raw) / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" }));
                                }}
                            />
                        </div>
                    )}

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
                        <Button onClick={confirmStatusChange}>Confirmar</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
