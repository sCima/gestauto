"use client"

import { Crown, Shield, User as UserIcon } from "lucide-react"
import { User as UserType } from "@/data/users"
import { cn } from "@/lib/utils"

interface UserInfoProps {
    user: UserType
    className?: string
}

export function getProfileIcon(profile: string) {
    switch (profile) {
        case "owner":
            return <Crown className="h-4 w-4 text-green-500" aria-label="Owner" />
        case "dono":
            return <Shield className="h-4 w-4 text-blue-500" aria-label="Dono da loja" />
        case "vendedor":
            return <UserIcon className="h-4 w-4 text-gray-600" aria-label="Vendedor" />
        default:
            return <UserIcon className="h-4 w-4 text-gray-600" aria-label="Usuário" />
    }
}

export function getProfileLabel(profile: string) {
    switch (profile) {
        case "owner":
            return "Owner do Sistema"
        case "dono":
            return "Dono da Loja"
        case "vendedor":
            return "Vendedor"
        default:
            return profile
    }
}

export default function UserInfo({ user, className }: UserInfoProps) {
    return (
        <div className={cn("flex items-center space-x-2", className)}>
            {getProfileIcon(user.profile)}
            <div className="leading-tight">
                <div className="font-medium text-foreground text-sm">{user.name}</div>
                <div className="text-xs text-muted-foreground">{getProfileLabel(user.profile)}</div>
            </div>
        </div>
    )
}
