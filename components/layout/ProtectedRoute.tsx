"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
    const router = useRouter()
    const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)

    useEffect(() => {
        const user = localStorage.getItem("gestauto_user")
        if (!user) {
            router.push("/")
        } else {
            setIsAuthenticated(true)
        }
    }, [router])

    if (!isAuthenticated) {
        return <div className="p-6 text-center">Carregando...</div>
    }

    return <>{children}</>
}
