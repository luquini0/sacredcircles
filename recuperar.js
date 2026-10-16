/* Recuperar una compra con email + numero de pedido (sin cuentas ni contraseñas). */
(function () {
  const { t, api } = SCU;
  const $ = (s) => document.querySelector(s);
  SCU.init({
    r_h1: "Recover my purchase", r_sub: "Enter the email you bought with and your order number. We give you back your books with the same licence.",
    r_email: "Purchase email", r_order: "Order number", r_go: "Recover",
    r_hint: "Can't find your order number? Message us on Instagram at @sacred.circles.art with your email and we'll sort it out.",
    f_terms: "Terms & licence", f_priv: "Privacy",
  });
  const ERR = {
    not_found: ["No encontramos una compra con esos datos. Revisá el email y el número.", "We couldn't find a purchase with those details. Check the email and number."],
    too_many: ["Demasiados intentos. Probá de nuevo en una hora.", "Too many attempts. Please try again in an hour."],
    server: ["Algo falló. Probá de nuevo en un momento.", "Something went wrong. Please try again shortly."],
  };
  const NAMES = { kids: ["Niños", "Kids"], teens: ["Adolescentes", "Teens"], adults: ["Adultos", "Adults"] };

  // pedidos recordados en este mismo navegador
  try {
    const saved = JSON.parse(localStorage.getItem("sc_orders") || "[]");
    if (saved.length) {
      $("#saved").innerHTML = `<div class="msg ok" style="text-align:left"><b>${t("En este dispositivo:", "On this device:")}</b><br>` +
        saved.map((s) => `<a href="descargar.html?o=${encodeURIComponent(s.o)}&t=${encodeURIComponent(s.t)}">${s.o.toUpperCase()}</a> · ${s.items.map((k) => NAMES[k][SCU.lang() === "en" ? 1 : 0]).join(", ")}`).join("<br>") + `</div>`;
    }
  } catch (_) { /* sin almacenamiento */ }

  async function go() {
    const err = $("#rErr"), btn = $("#rGo"); err.textContent = "";
    const email = $("#rEmail").value.trim(), order = $("#rOrder").value.trim();
    if (!email || !order) { err.textContent = t(...ERR.not_found); return; }
    btn.disabled = true;
    try {
      const r = await api("/api/recover", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, order }) });
      if (r.ok) { location.href = `descargar.html?o=${r.data.orderId}&t=${r.data.token}`; return; }
      err.textContent = t(...(ERR[r.data && r.data.error] || ERR.server));
    } catch (_) { err.textContent = t(...ERR.server); }
    finally { btn.disabled = false; }
  }
  $("#rGo").addEventListener("click", go);
  addEventListener("keydown", (e) => { if (e.key === "Enter") go(); });
})();
