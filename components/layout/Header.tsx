"use client"

import { Button } from "@/components/ui/button"
import { Car, BarChart3, Package, DollarSign, LogOut } from "lucide-react"
import { User } from "@/data/users"
import { useRouter, usePathname } from "next/navigation"

interface HeaderProps {
    currentPage?: string
    setCurrentPage?: (page: string) => void
    currentUser: User
    onLogout: () => void
}

export default function Header({ currentPage, setCurrentPage, currentUser, onLogout }: HeaderProps) {
    const router = useRouter()
    const pathname = usePathname()
    const isActive = (path: string) => pathname === path

    const canAccessFaturamento = ["owner", "dono"].includes(currentUser.profile)

    const handleNavigate = (path: string) => {
        if (setCurrentPage) setCurrentPage(path as any)
        router.push(path)
    }

    return (
        <header className="bg-white shadow-sm border-b">
            <div className="max-w-7xl mx-auto px-4 flex justify-between items-center h-16">
                {/* Logo e nome */}
                <div className="flex items-center space-x-2 cursor-pointer" onClick={() => handleNavigate("/dashboard")}>
                    <Car className="h-8 w-8 text-green-500" />
                    <h1 className="text-xl font-bold text-gray-900">GestAuto</h1>
                </div>

                {/* Navegação */}
                <nav className="flex space-x-2">
                    <Button
                        variant={isActive("/dashboard") ? "default" : "ghost"}
                        onClick={() => handleNavigate("/dashboard")}
                    >
                        <BarChart3 className="h-4 w-4 mr-1" /> Dashboard
                    </Button>

                    <Button
                        variant={isActive("/estoque") ? "default" : "ghost"}
                        onClick={() => handleNavigate("/estoque")}
                    >
                        <Package className="h-4 w-4 mr-1" /> Estoque
                    </Button>

                    {canAccessFaturamento && (
                        <Button
                            variant={isActive("/faturamento") ? "default" : "ghost"}
                            onClick={() => handleNavigate("/faturamento")}
                        >
                            <DollarSign className="h-4 w-4 mr-1" /> Faturamento
                        </Button>
                    )}
                </nav>

                {/* Usuário e logout */}
                <div className="flex items-center space-x-4">
                    <span className="text-sm text-gray-600">{currentUser.name}</span>
                    <Button variant="ghost" onClick={onLogout}>
                        <LogOut className="h-4 w-4" />
                    </Button>
                </div>
            </div>
        </header>
    )
}
