"use client"

import { useEffect, useState } from "react"
import { toast } from "sonner"
import ProtectedRoute from "@/components/layout/ProtectedRoute"
import Header from "@/components/layout/Header"
import VehicleCard from "@/components/vehicles/VehicleCard"
import VehicleForm from "@/components/vehicles/VehicleForm"
import VehicleEditDialog from "@/components/vehicles/VehicleEditDialog"
import { Vehicle } from "@/data/vehicles"

interface VehicleFormData {
  brand: string
  model: string
  year: string
  purchasePrice: string
  fipePrice?: string
  expectedSalePrice?: string
  status: string
  entryDate: string
  color: string
  notes: string
}

export default function EstoquePage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  // 🔹 Usuário mockado (DEV)
  useEffect(() => {
    setCurrentUser({
      name: "Usuário Teste",
      email: "owner@gestauto.dev",
      role: "owner",
    })
  }, [])

  // 🔹 Carregar veículos do Postgres
  async function loadVehicles() {
    setLoading(true)
    try {
      const res = await fetch("/api/vehicles")
      const data = await res.json()
      setVehicles(data)
    } catch {
      toast.error("Erro ao carregar veículos")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadVehicles()
  }, [])

  // 🔹 Cadastro de veículo
  async function handleAddVehicle(data: VehicleFormData) {
    const year = Number(data.year)
    const purchasePrice =
      Number(data.purchasePrice.replace(/\D/g, "")) / 100

    if (
      !data.brand ||
      !data.model ||
      !year ||
      !purchasePrice
    ) {
      toast.error("Preencha Marca, Modelo, Ano e Valor de Compra")
      return
    }

    const payload = {
      brand: data.brand,
      model: data.model,
      year,
      color: data.color || null,
      purchasePrice,
      fipePrice: data.fipePrice
        ? Number(data.fipePrice.replace(/\D/g, "")) / 100
        : null,
      expectedSalePrice: data.expectedSalePrice
        ? Number(data.expectedSalePrice.replace(/\D/g, "")) / 100
        : null,
      expectedProfit: data.expectedSalePrice
        ? Number(data.expectedSalePrice.replace(/\D/g, "")) / 100 - purchasePrice
        : null,
      status: data.status,
      entryDate: data.entryDate || new Date().toISOString().slice(0, 10),
      notes: data.notes || null,
    }

    try {
      const res = await fetch("/api/vehicles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (!res.ok) throw new Error()

      toast.success("Veículo cadastrado com sucesso")
      loadVehicles()
    } catch {
      toast.error("Erro ao cadastrar veículo")
    }
  }

  // 🔹 Vender veículo (gera lucro + transação automaticamente)
  async function handleStatusChange(
    id: string,
    newStatus: Vehicle["status"],
    salePrice?: number
  ) {
    if (newStatus !== "vendido") return

    if (!salePrice || salePrice <= 0) {
      toast.error("Informe o valor de venda")
      return
    }

    try {
      const res = await fetch(`/api/vehicles/${id}/sell`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ salePrice }),
      })

      if (!res.ok) throw new Error()

      toast.success("Veículo vendido com sucesso")
      loadVehicles()
    } catch {
      toast.error("Erro ao registrar venda")
    }
  }

  // 🔹 Editar veículo (abre modal)
  function handleEditVehicle(vehicle: Vehicle) {
    setEditingVehicle(vehicle)
    setIsEditDialogOpen(true)
  }

  // 🔹 Salvar edição (PATCH)
  async function handleSaveVehicle(updated: Vehicle) {
    try {
      const res = await fetch(`/api/vehicles/${updated.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updated),
      })

      if (!res.ok) throw new Error()

      toast.success("Veículo atualizado")
      setIsEditDialogOpen(false)
      setEditingVehicle(null)
      loadVehicles()
    } catch {
      toast.error("Erro ao atualizar veículo")
    }
  }

  // 🔹 Remover veículo
  async function handleDeleteVehicle(id: string) {
    try {
      const res = await fetch(`/api/vehicles/${id}`, {
        method: "DELETE",
      })

      if (!res.ok) throw new Error()

      toast.success("Veículo removido")
      loadVehicles()
    } catch {
      toast.error("Erro ao remover veículo")
    }
  }

  if (!currentUser) return null

  return (
    <ProtectedRoute>
      <Header
        currentPage="estoque"
        currentUser={currentUser}
        onLogout={() => window.location.href = "/"}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h2 className="text-2xl font-bold mb-6">Gestão de Estoque</h2>

        <VehicleForm onSubmit={handleAddVehicle} />

        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 mt-6">
          {!loading && vehicles.length > 0 ? (
            vehicles.map(vehicle => (
              <VehicleCard
                key={vehicle.id}
                vehicle={vehicle}
                onDelete={() => handleDeleteVehicle(vehicle.id)}
                onEdit={() => handleEditVehicle(vehicle)}
                onStatusChange={(status, price) =>
                  handleStatusChange(vehicle.id, status, price)
                }
              />
            ))
          ) : (
            <p className="text-muted-foreground text-center col-span-full">
              {loading ? "Carregando veículos..." : "Nenhum veículo encontrado."}
            </p>
          )}
        </div>

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
