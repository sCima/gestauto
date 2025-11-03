"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { User } from "@/data/users"

interface LoginFormProps {
    users: User[]
}

export default function LoginForm({ users }: LoginFormProps) {
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const router = useRouter()

    const handleLogin = () => {
        // Owner: senha obrigatória
        if (email === "theo.binari@gmail.com" && password === "T!b20582058") {
            const owner = users.find(user => user.email === email)
            if (owner) {
                localStorage.setItem("gestauto_user", JSON.stringify(owner))
                router.push("/dashboard")
                return
            }
        }

        // Outros usuários: qualquer senha
        const user = users.find(user => user.email === email)
        if (user) {
            localStorage.setItem("gestauto_user", JSON.stringify(user))
            router.push("/dashboard")
        } else {
            alert("Usuário não encontrado.")
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
            <Card className="w-full max-w-sm shadow-md">
                <CardHeader>
                    <CardTitle className="text-center text-xl font-bold">GestAuto</CardTitle>
                    <CardDescription className="text-center">Faça login para continuar</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div>
                        <Label>Email</Label>
                        <Input
                            type="email"
                            placeholder="seu@email.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </div>
                    <div>
                        <Label>Senha</Label>
                        <Input
                            type="password"
                            placeholder="•••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </div>
                    <Button className="w-full" onClick={handleLogin}>
                        Entrar
                    </Button>

                    <div className="text-xs text-muted-foreground mt-4 bg-secondary p-2 rounded">
                        <strong>Contas de exemplo:</strong><br />
                        🏪 Dono: <code>dono@autocenterpremium.com</code><br />
                        👤 Vendedor: <code>vendedor@autocenterpremium.com</code><br />
                        <span>(senhas livres exceto owner)</span>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
