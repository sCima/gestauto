"use client"

import { useState, useEffect } from "react"
import { toast } from "sonner"
import ProtectedRoute from "@/components/layout/ProtectedRoute"
import Header from "@/components/layout/Header"
import VehicleCard from "@/components/vehicles/VehicleCard"
import VehicleForm from "@/components/vehicles/VehicleForm"
import VehicleEditDialog from "@/components/vehicles/VehicleEditDialog"
import { Vehicle, initialVehicles } from "@/data/vehicles"
import { v4 as uuidv4 } from "uuid"

interface VehicleFormData {
    brand: string;
    model: string;
    year: string;
    purchasePrice: string;
    status: string;
    entryDate: string;
    fipePrice?: string;
    expectedSalePrice?: string  // VEM do form como moeda formatada
    expectedProfit?: string

}

export default function EstoquePage() {
    const [vehicles, setVehicles] = useState<Vehicle[]>([])
    const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null)
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
    const [currentUser, setCurrentUser] = useState<any>(null)

    useEffect(() => {
        const user = localStorage.getItem("gestauto_user")
        if (user) setCurrentUser(JSON.parse(user))

        const savedVehicles = localStorage.getItem("gestauto_vehicles")
        if (savedVehicles) {
            try {
                const parsed = JSON.parse(savedVehicles)
                setVehicles(Array.isArray(parsed) && parsed.length > 0 ? parsed : initialVehicles)
            } catch {
                setVehicles(initialVehicles)
            }
        } else {
            setVehicles(initialVehicles)
        }
    }, [])

    useEffect(() => {
        if (vehicles.length > 0) {
            localStorage.setItem("gestauto_vehicles", JSON.stringify(vehicles))
        }
    }, [vehicles])

    const handleAddVehicle = (data: VehicleFormData) => {
        const numericYear = parseInt(data.year, 10)

        const purchasePriceClean =
            typeof data.purchasePrice === "string"
                ? Number(data.purchasePrice.replace(/\D/g, "")) / 100
                : Number(data.purchasePrice)

        const fipePriceClean =
            data.fipePrice
                ? Number(data.fipePrice.replace(/\D/g, "")) / 100
                : undefined

        const expectedSalePrice = data.expectedSalePrice
            ? Number(data.expectedSalePrice.replace(/\D/g, "")) / 100
            : undefined

        const expectedProfit = data.expectedProfit
            ? Number(data.expectedProfit.replace(/\D/g, "")) / 100
            : undefined


        if (
            !data.brand ||
            !data.model ||
            !data.year ||
            Number.isNaN(numericYear) ||
            !data.purchasePrice ||
            !purchasePriceClean
        ) {
            toast("Não foi possível cadastrar", {
                description:
                    "Marca, Modelo, Ano e Valor de Compra são obrigatórios e precisam ser válidos.",
            })
            return
        }

        const newVehicle: Vehicle = {
            id: uuidv4(),
            brand: data.brand,
            model: data.model,
            year: numericYear,
            purchasePrice: purchasePriceClean,
            fipePrice: fipePriceClean,
            expectedSalePrice,
            expectedProfit,
            status: data.status as Vehicle["status"],
            responsavelEmail: currentUser?.email || "",
            entryDate: data.entryDate || new Date().toISOString().slice(0, 10),
        }

        setVehicles(prev => [...prev, newVehicle])

        toast("Veículo cadastrado", {
            description: `${data.brand} ${data.model} foi adicionado ao estoque.`,
        })
    }


    const handleDeleteVehicle = (id: string) => {
        setVehicles(prev => prev.filter(v => v.id !== id))
    }

    const handleEditVehicle = (vehicle: Vehicle) => {
        setEditingVehicle(vehicle)
        setIsEditDialogOpen(true)
    }

    const handleSaveVehicle = (updatedVehicle: Vehicle) => {
        setVehicles(prev => prev.map(v => (v.id === updatedVehicle.id ? updatedVehicle : v)))
    }

    const handleStatusChange = (id: string, newStatus: Vehicle["status"], salePrice?: number) => {
        setVehicles(prev =>
            prev.map(v =>
                v.id === id
                    ? { ...v, status: newStatus, salePrice: newStatus === "vendido" ? salePrice : undefined }
                    : v
            )
        )
    }

    const handleLogout = () => {
        localStorage.removeItem("gestauto_user")
        window.location.href = "/"
    }

    if (!currentUser) return null

    return (
        <ProtectedRoute>
            <Header currentPage="estoque" currentUser={currentUser} onLogout={handleLogout} />

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <h2 className="text-2xl font-bold mb-6">Gestão de Estoque</h2>

                {/* ✅ Aqui corrigido */}
                <VehicleForm onSubmit={handleAddVehicle} />

                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 mt-6">
                    {vehicles.length > 0 ? (
                        vehicles.map(vehicle => (
                            <VehicleCard
                                key={vehicle.id}
                                vehicle={vehicle}
                                onDelete={() => handleDeleteVehicle(vehicle.id)}
                                onEdit={() => handleEditVehicle(vehicle)}
                                onStatusChange={(status, price) => handleStatusChange(vehicle.id, status, price)}
                            />
                        ))
                    ) : (
                        <p className="text-muted-foreground text-center col-span-full">
                            Nenhum veículo encontrado.
                        </p>
                    )}
                </div>

                {/* Modal de edição */}
                <VehicleEditDialog
                    open={isEditDialogOpen}
                    vehicle={editingVehicle}
                    onClose={() => {
                        setIsEditDialogOpen(false)
                        setEditingVehicle(null)
                    }}
                    onSave={handleSaveVehicle}
                />
            </main>
        </ProtectedRoute>
    )
}


