export type UserRole = "ADMIN" | "USUARIO";

export interface User {
  id: string;
  name: string;
  role: UserRole;
}

export interface LoginCredentials {
  name: string;
}
