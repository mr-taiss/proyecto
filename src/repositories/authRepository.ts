import { encontrarNombreAutorizado } from "../data/nombresAutorizados";
import { storageService } from "../services/storageService";
import type { LoginCredentials, User } from "../types/auth";

const SESSION_KEY = "app_session";

export const authRepository = {
  login(credentials: LoginCredentials): User | null {
    const nombreAutorizado = encontrarNombreAutorizado(credentials.name);

    if (!nombreAutorizado) {
      return null;
    }

    const sessionUser: User = {
      id: `usuario-${nombreAutorizado}`,
      name: nombreAutorizado,
      role: "USUARIO",
    };

    storageService.set<User>(SESSION_KEY, sessionUser);
    return sessionUser;
  },

  logout(): void {
    storageService.remove(SESSION_KEY);
  },

  getCurrentUser(): User | null {
    return storageService.get<User>(SESSION_KEY);
  },

  isAuthenticated(): boolean {
    return this.getCurrentUser() !== null;
  },
};
