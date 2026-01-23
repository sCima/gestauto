export type UserRole = "owner" | "seller"

export interface AuthUser {
  id: string
  name: string
  email: string
  role: UserRole
}

export function getMockUser(): AuthUser {
  return {
    id: "00000000-0000-0000-0000-000000000001",
    name: "Usuário Teste",
    email: "teste@gestauto.com",
    role: "owner", // troca pra "seller" se quiser testar
  }
}
