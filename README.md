# SISGOP — Sistema de Gestión de Objetos Perdidos

Proyecto escolar para secundaria del Colegio Don Bosco. Esta copia parte de `integrar-visual`, commit `afca87a`, y conserva el diseño, las fotografías y el proyecto Firebase existente. No requiere alojamiento de pago para las pruebas locales.

## Preparar la computadora

Si ya tienes el repositorio en otra computadora, detén el servidor y actualiza desde `integrar-visual`:

```powershell
git switch integrar-visual
git pull --ff-only origin integrar-visual
npm.cmd install
npm.cmd run dev
```

Si Git informa que hay cambios locales, consérvalos antes de actualizar; no utilices comandos para descartarlos. La configuración original `dev/firebase-config.local.js` permanece local. Para el restablecimiento administrativo, copia `.env.example` como `.env.local` y comprueba que su ruta apunte a la credencial que ya descargaste en esa computadora. No se comparten credenciales mediante GitHub.

La configuración de Vercel desactiva las publicaciones automáticas de `integrar-visual`. El flujo de GitHub Pages existente solo se ejecuta por envíos a `main` o por activación manual.

1. Instalar Node.js de la rama 24, versión 24.15 o posterior (esta copia se probó con 24.22).
2. En la carpeta del proyecto, ejecutar `npm install`.
3. Copiar **el archivo original de Camila** a `dev/firebase-config.local.js`. No sustituirlo por los valores del ejemplo: debe seguir identificando el mismo proyecto Firebase.
4. Si se usaban cuentas ficticias con correos especiales, copiar también el archivo original `dev/sisgop-firebase-accounts.local.js`.
5. Ejecutar `npm run dev` y abrir la dirección que indique.

Sin el archivo de configuración la portada se puede ver, pero el sistema avisa que no puede conectar con Firebase. No se genera una configuración ficticia ni se intenta modificar datos reales.

## Mejoras de esta copia

- Padrón de 659 estudiantes, separado por curso, con sugerencias mientras se escribe el nombre. No contiene contraseñas. El acceso sigue usando los mismos identificadores de Firebase.
- Registro libre de alumnos cerrado: se utilizan las cuentas que ya fueron asignadas. No se eliminan las cuentas duplicadas que pudieran existir; requieren revisión manual.
- Objetos ordenados por fecha de registro, del más reciente al más antiguo. La fecha del evento se conserva separadamente.
- Consulta sin sesión con filtros de Perdido, Encontrado y Recuperado, conforme a la autorización del responsable del proyecto.
- Curso del registrante visible en los detalles. El administrador registra sin curso de estudiante ni asignación automática de 6B.
- Vista previa de fotografías visible y limpia al comenzar otro registro; se mantiene la compresión JPEG y el almacenamiento actual en Firestore.
- Cambio personal desde la pantalla de acceso y desde el perfil: contraseña actual, nueva y confirmación. Se actualiza la cuenta real de Firebase Authentication, sin guardar claves en el navegador.
- Lista de administradores: se pueden agregar cuentas y retirar el acceso de otra persona. Retirar acceso conserva sus registros y su cuenta; no borra su usuario de Authentication. Un administrador no se puede retirar a sí mismo.
- Botón administrativo para restablecer contraseñas olvidadas, con el servicio local descrito abajo. Conserva el UID del alumno y exige cambio de la clave temporal al volver a ingresar.

## Reglas de Firestore: paso pendiente en el proyecto real

`REGLAS_FIRESTORE_CONSOLIDADO.txt` contiene los ajustes propuestos para cerrar el alta libre de perfiles, consultar los tres estados, listar administradores y retirarles el acceso. **El archivo local no actualiza Firebase por sí solo.**

Antes de probar esas funciones con datos reales, el responsable debe comparar estas reglas con las que estén publicadas, conservar una copia de las anteriores y autorizar su aplicación. No se han publicado reglas desde esta copia.

La consulta pública permite leer los documentos completos de objetos en los tres estados, incluidas las fotos, curso y datos del registrante que estén guardados en ellos. Esto fue autorizado expresamente durante la revisión. Las colecciones de perfiles y contraseñas no se hacen públicas.

## Contraseñas olvidadas: servicio local gratuito

Firebase permite cambiar la contraseña propia desde el navegador. Para asignar una contraseña a **otra cuenta** utiliza su SDK administrativo, que se ejecuta en la computadora del administrador, fuera del navegador.

Preparación única por el responsable del proyecto:

1. Obtener una credencial administrativa del **mismo proyecto Firebase**, con los permisos necesarios de Authentication y Firestore.
2. Guardarla **fuera de la carpeta del proyecto y de cualquier carpeta que se publique**. Esta credencial es diferente de `firebase-config.local.js`; no se envía por chat ni se incorpora a GitHub.
3. Crear un archivo local `.env.local` en la carpeta del proyecto con la ruta de esa credencial. Se admite una ruta relativa a la carpeta del proyecto, por ejemplo:

```text
GOOGLE_APPLICATION_CREDENTIALS=../credencial-administrativa.json
```

El archivo `.env.local` está excluido de GitHub y solo guarda la ruta; la clave privada permanece fuera del proyecto. En esta computadora ya está configurado. No se debe copiar la credencial a `dev/` ni a `dist/`.

4. Cerrar el servidor anterior con Ctrl+C e iniciar con `npm run dev` (o `npm.cmd run dev` en PowerShell). Este mismo comando inicia la página y el servicio administrativo cuando encuentra la configuración local. Sin credencial inicia la página, pero no habilita el restablecimiento administrativo.

Abrir `http://localhost:5173` (también se admite `http://127.0.0.1:5173`), ingresar como administrador y elegir **Cambiar contraseñas**. Seleccionar curso y nombre completo, escribir una contraseña temporal y confirmarla. El mensaje de éxito aparece solo si el servicio confirma la actualización en Authentication y completa el perfil. Cerrar la sesión del alumno y probar un ingreso nuevo con la contraseña temporal; una sesión que ya estaba abierta no sirve para comprobar la contraseña. Entregarla al alumno por el medio habitual del colegio. Este servicio funciona solamente en esa computadora; la contraseña actualizada sirve después en todos los dispositivos conectados al mismo Firebase.

No se necesita activar Cloud Functions ni contratar un servidor para este uso local. En otra computadora se debe preparar su configuración local; no se publica este servicio en Internet.

Si existen dos perfiles con el mismo nombre completo y curso, el restablecimiento se detiene y solicita revisión; no escoge una cuenta al azar ni borra ninguna. Si cambia la clave pero falla la actualización del perfil, informa que la clave nueva ya está asignada.

Referencias oficiales: [cambio personal](https://firebase.google.com/docs/auth/web/manage-users), [gestión administrativa](https://firebase.google.com/docs/auth/admin/manage-users).

## Comprobaciones

```bash
npm test
npm run build
npm run lint
```

Las pruebas usan cuentas, fotografías y respuestas simuladas. No conectan con Firebase ni necesitan credenciales. Comprueban el padrón, orden, fechas, formularios, contraseña actual incorrecta, cambios de contraseña, curso, retiro de administradores y ausencia de cuentas duplicadas creadas por los formularios.

La compilación copia la configuración del cliente a `dist/dev/` **solo cuando el archivo original está presente**. No copia ninguna credencial administrativa. Compilar no publica la aplicación. Las advertencias de funciones sin uso de `auth.js`, `script.js` y `dev/sisgop-firebase.js` corresponden al código anterior conservado.

## Arquitectura

- `index.html` y `style.css`: interfaz original y fotografías.
- `dev/sisgop-bootstrap.js`: inicio y aviso de configuración ausente.
- `dev/sisgop-original-firebase.js`: pantallas y operaciones con el mismo SDK Firebase 12.4.0 y las mismas colecciones.
- `dev/sisgop-students.js`: nombres y cursos recuperados del padrón anterior.
- `dev/sisgop-domain.js`: reconocimiento, fechas, orden y filtros.
- `tools/admin-server.mjs` y `tools/admin-password.js`: servicio local opcional para restablecer contraseñas mediante Firebase Admin.
- `tests/`: pruebas con datos simulados.

Colecciones conservadas: `perfiles_prueba`, `objetos_compartidos_prueba`, `firebase_diagnostico` y `objetos_prueba`. Los objetos anteriores no se migran ni se sobrescriben.

`src/` conserva la estructura React anterior; `auth.js`, `script.js`, `permissions.js` y `dev/sisgop-firebase.js` conservan las versiones anteriores. No se conectan a la página activa para evitar mezclar las cuentas locales antiguas con las de Firebase. La edición por propietario y el historial de aquellas versiones requieren una integración posterior; no forman parte de esta corrección de observaciones.

La compilación y las pruebas automáticas no publican el sitio ni modifican cuentas reales. Las reglas de Firebase se aplican por separado; subir este código a GitHub no las actualiza.
