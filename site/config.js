// Direccion del backend (Cloudflare Worker). Cambiar tras el deploy.
window.SC = {
  API: /^(localhost|127\.0\.0\.1)$/.test(location.hostname)
    ? "http://localhost:8787"
    : "https://sacred-circles-tienda.luquini0-work.workers.dev",
};
