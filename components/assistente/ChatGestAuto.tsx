"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Loader2, Send } from "lucide-react"

type ChatMessage = {
    role: "user" | "assistant"
    content: string
}

const EXEMPLO_PERGUNTAS = [
    "Quanto eu lucrei em 10/2025?",
    "Quais veículos mais antigos eu tenho parado?",
    "Qual foi minha maior entrada no faturamento?",
    "Qual o carro mais caro tenho na loja?",
]

export default function ChatGestAuto() {
    const [messages, setMessages] = useState<ChatMessage[]>([])
    const [input, setInput] = useState("")
    const [loading, setLoading] = useState(false)
    const messagesEndRef = useRef<HTMLDivElement>(null)
    const messagesContainerRef = useRef<HTMLDivElement>(null)

    // Auto-scroll para última mensagem
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }

    useEffect(() => {
        scrollToBottom()
    }, [messages])

    async function handleSend() {
        const text = input.trim()
        if (!text || loading) return

        const newMessages: ChatMessage[] = [
            ...messages,
            { role: "user", content: text },
        ]

        setMessages(newMessages)
        setInput("")
        setLoading(true)

        try {
            const res = await fetch("/api/assistente", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ messages: newMessages }),
            })

            if (!res.ok) {
                throw new Error("Erro na resposta da API")
            }

            const data = await res.json()

            if (data.reply) {
                setMessages((prev) => [
                    ...prev,
                    { role: "assistant", content: data.reply as string },
                ])
            } else if (data.error) {
                throw new Error(data.error)
            }
        } catch (err) {
            console.error("Erro no chat:", err)
            setMessages((prev) => [
                ...prev,
                {
                    role: "assistant",
                    content:
                        "Desculpe, tive um problema ao processar sua pergunta. Tente novamente em alguns segundos.",
                },
            ])
        } finally {
            setLoading(false)
        }
    }

    function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault()
            handleSend()
        }
    }

    function handleExemploClick(pergunta: string) {
        setInput(pergunta)
    }

    return (
        <Card className="flex flex-col h-[600px] max-w-4xl mx-auto shadow-lg">
            <CardHeader className="border-b pb-4">
                <CardTitle className="text-lg font-semibold">
                    🤖 Assistente GestAuto (IA)
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                    Pergunte sobre estoque, faturamento, carros parados, lucro por mês e mais...
                </p>
            </CardHeader>

            <CardContent className="flex flex-col flex-1 p-4 overflow-hidden">
                {/* Área de mensagens */}
                <div
                    ref={messagesContainerRef}
                    className="flex-1 overflow-y-auto space-y-3 mb-4 pr-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100"
                >
                    {messages.length === 0 && (
                        <div className="space-y-4">
                            <div className="text-center text-muted-foreground py-8">
                                <p className="text-sm mb-4">
                                    👋 Olá! Estou aqui para ajudar com informações sobre o seu negócio.
                                </p>
                                <p className="text-xs mb-4 font-semibold">
                                    Experimente perguntar:
                                </p>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 px-4">
                                {EXEMPLO_PERGUNTAS.map((pergunta, i) => (
                                    <button
                                        key={i}
                                        onClick={() => handleExemploClick(pergunta)}
                                        className="text-left text-xs p-3 rounded-lg border border-gray-200 hover:border-blue-400 hover:bg-blue-50 transition-colors dark:border-gray-700 dark:hover:bg-blue-950"
                                    >
                                        💬 {pergunta}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {messages.map((m, i) => (
                        <div
                            key={i}
                            className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
                        >
                            <div
                                className={`max-w-[85%] rounded-2xl px-4 py-2.5 shadow-sm ${m.role === "user"
                                        ? "bg-blue-600 text-white"
                                        : "bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-gray-100"
                                    }`}
                            >
                                <p className="text-sm whitespace-pre-wrap break-words">
                                    {m.content}
                                </p>
                            </div>
                        </div>
                    ))}

                    {loading && (
                        <div className="flex justify-start">
                            <div className="bg-gray-100 dark:bg-gray-800 rounded-2xl px-4 py-2.5 shadow-sm">
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    <span>Pensando...</span>
                                </div>
                            </div>
                        </div>
                    )}

                    <div ref={messagesEndRef} />
                </div>

                {/* Input de mensagem */}
                <div className="flex gap-2 border-t pt-4">
                    <Input
                        placeholder="Digite sua pergunta..."
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        disabled={loading}
                        className="flex-1"
                    />
                    <Button
                        onClick={handleSend}
                        disabled={loading || !input.trim()}
                        size="icon"
                        className="shrink-0"
                    >
                        {loading ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <Send className="h-4 w-4" />
                        )}
                    </Button>
                </div>
            </CardContent>
        </Card>
    )
}