try {
  await import('./sisgop-original-firebase.js');
} catch {
  const status = document.getElementById('fbGlobalStatus');
  const report = () => {
    status.textContent = 'No se pudo iniciar la conexión con Firebase. Comprueba la conexión y la configuración local de este proyecto.';
    status.style.display = 'block';
  };
  window.showSISGOPLogin = report;
  window.openAdminAccess = report;
  window.openPublicSearch = report;
  report();
}
