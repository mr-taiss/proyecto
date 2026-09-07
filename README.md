# SISGOP — Sistema de Gestión de Objetos Perdidos

Aplicación web para el registro, búsqueda y recuperación de objetos perdidos del 6to B del Colegio Don Bosco.

## Funciones principales

- Inicio de sesión mediante nombre autorizado y contraseña.
- 37 estudiantes autorizados.
- Cambio de contraseña después del primer acceso.
- Cierre de sesión independiente del cambio de contraseña.
- Registro de objetos perdidos o encontrados.
- Clasificación por tipo de objeto.
- Selección del lugar donde se perdió o encontró.
- Búsqueda y filtrado por estado.
- Avisos de objetos encontrados.
- Historial de cambios.
- Fotografía opcional del objeto.
- Permisos: cada estudiante puede modificar únicamente los objetos que registró.
- Los demás estudiantes pueden consultar los objetos registrados.

## Ejecución

```bash
npm install
npm run dev
```

Para una compilación de producción:

```bash
npm run build
```

## Estructura funcional

La interfaz que se ejecuta desde Vite utiliza `index.html`, `style.css`, `script.js`, `auth.js` y `permissions.js`. Los archivos antiguos de autenticación fueron retirados para evitar conflictos y duplicaciones.

> Nota: las credenciales y los cambios de contraseña del prototipo se gestionan localmente en el navegador mediante `localStorage`. Para una versión real multiusuario se recomienda implementar autenticación y almacenamiento en un backend con base de datos.
