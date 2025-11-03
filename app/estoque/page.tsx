"use client"

import { useState, useEffect } from "react"
import ProtectedRoute from "@/components/layout/ProtectedRoute"
import Header from "@/components/layout/Header"
import VehicleCard from "@/components/vehicles/VehicleCard"
import VehicleForm from "@/components/vehicles/VehicleForm"
import VehicleEditDialog from "@/components/vehicles/VehicleEditDialog"
import { Vehicle, initialVehicles } from "@/data/vehicles"

export default function EstoquePage() {
    const [vehicles, setVehicles] = useState<Vehicle[]>([])
    const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null)
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
    const [currentUser, setCurrentUser] = useState<any>(null)

    // ✅ Carregar dados do usuário e dos veículos com fallback inteligente
    useEffect(() => {
        const user = localStorage.getItem("gestauto_user")
        if (user) {
            setCurrentUser(JSON.parse(user))
        }

        const savedVehicles = localStorage.getItem("gestauto_vehicles")

        if (savedVehicles) {
            try {
                const parsed = JSON.parse(savedVehicles)
                // Se o localStorage estiver vazio ou inválido, carrega os mocados iniciais
                if (Array.isArray(parsed) && parsed.length > 0) {
                    setVehicles(parsed)
                } else {
                    setVehicles(initialVehicles)
                }
            } catch {
                // Em caso de erro ao ler localStorage, usar fallback
                setVehicles(initialVehicles)
            }
        } else {
            // Primeira vez: carregar mocados
            setVehicles(initialVehicles)
        }
    }, [])

    // 💾 Persistência automática, mas apenas se houver veículos
    useEffect(() => {
        if (vehicles.length > 0) {
            localStorage.setItem("gestauto_vehicles", JSON.stringify(vehicles))
        }
    }, [vehicles])

    // ➕ Adicionar veículo
    const handleAddVehicle = (vehicle: Vehicle) => {
        setVehicles(prev => [...prev, vehicle])
    }

    // 🗑 Excluir veículo
    const handleDeleteVehicle = (id: string) => {
        setVehicles(prev => prev.filter(v => v.id !== id))
    }

    // ✏️ Editar veículo (abrir modal)
    const handleEditVehicle = (vehicle: Vehicle) => {
        setEditingVehicle(vehicle)
        setIsEditDialogOpen(true)
    }

    // 💾 Salvar edição
    const handleSaveVehicle = (updatedVehicle: Vehicle) => {
        setVehicles(prev => prev.map(v => (v.id === updatedVehicle.id ? updatedVehicle : v)))
    }

    // 🔄 Alterar status do veículo
    const handleStatusChange = (id: string, newStatus: Vehicle["status"], salePrice?: number) => {
        setVehicles(prev =>
            prev.map(v =>
                v.id === id
                    ? { ...v, status: newStatus, salePrice: newStatus === "vendido" ? salePrice : undefined }
                    : v
            )
        )
    }

    // 🚪 Logout
    const handleLogout = () => {
        localStorage.removeItem("gestauto_user")
        window.location.href = "/"
    }

    // Bloqueia renderização enquanto usuário não é carregado
    if (!currentUser) return null

    return (
        <ProtectedRoute>
            <Header currentPage="estoque" currentUser={currentUser} onLogout={handleLogout} />

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <h2 className="text-2xl font-bold mb-6">Gestão de Estoque</h2>

                {/* Formulário para adicionar veículos */}
                <VehicleForm onAddVehicle={handleAddVehicle} currentUser={currentUser} />

                {/* Lista de veículos */}
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
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
