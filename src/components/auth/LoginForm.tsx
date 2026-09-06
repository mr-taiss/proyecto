import { useState } from "react";
import type { FormEventHandler } from "react";
import type { LoginCredentials } from "../../types/auth";

interface LoginFormProps {
  error?: string;
  onSubmit: (credentials: LoginCredentials) => void;
}

function LoginForm({ error, onSubmit }: LoginFormProps) {
  const [name, setName] = useState("");

  const handleSubmit: FormEventHandler<HTMLFormElement> = (event) => {
    event.preventDefault();

    const normalizedName = name.trim();

    if (!normalizedName) {
      return;
    }

    onSubmit({ name: normalizedName });
  };

  return (
    <form onSubmit={handleSubmit}>
      <h1>Iniciar sesión</h1>

      <div>
        <label htmlFor="name">Nombre completo</label>

        <input
          id="name"
          name="name"
          type="text"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Ingrese su nombre completo"
          autoComplete="name"
          required
        />
      </div>

      {error && (
        <p role="alert" aria-live="polite">
          {error}
        </p>
      )}

      <button type="submit">Ingresar</button>
    </form>
  );
}

export default LoginForm;
