// El mismo comando abre la página y, cuando hay credencial, el servicio administrativo.
if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
  await import('./admin-server.mjs');
} else {
  const {createServer} = await import('vite');
  const vite = await createServer({server:{host:'127.0.0.1',port:5173,strictPort:true}});
  await vite.listen();
  vite.printUrls();
  console.log('Para restablecer contraseñas de alumnos, configura la credencial administrativa en .env.local.');
}
