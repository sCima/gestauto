"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import LoginForm from "@/components/users/LoginForm"
import { initialUsers } from "@/data/users"

export default function HomePage() {
  const router = useRouter()

  useEffect(() => {
    const savedUser = localStorage.getItem("gestauto_user")
    if (savedUser) {
      router.push("/dashboard")
    }
  }, [router])

  return <LoginForm users={initialUsers} />
}
