/* Pagina de descargas: estado del pedido, elegir tamano, bajar PDF (o todos en un ZIP armado aca, en el navegador). */
(function () {
  const { t, api } = SCU;
  const q = new URLSearchParams(location.search);
  const O = q.get("o") || "", T = q.get("t") || "";
  const card = document.getElementById("card");
  SCU.init({ f_terms: "Terms & licence", f_priv: "Privacy", f_recover: "Recover my purchase" });

  const NAMES = { kids: ["Niños", "Kids", "portada-ninos"], teens: ["Adolescentes", "Teens", "portada-adolescentes"], adults: ["Adultos", "Adults", "portada-adultos"] };
  const SIZES = [["A5", "148×210 mm"], ["A4", "210×297 mm"], ["LETTER", "8.5×11 in"], ["A3", "297×420 mm"], ["A2", "420×594 mm"]];
  const ERR = {
    limit: ["Alcanzaste el máximo de descargas de este pedido. Escribinos por Instagram y lo resolvemos.", "You reached this order's download limit. Message us on Instagram and we'll sort it out."],
    expired: ["El link venció. Escribinos por Instagram con tu email y número de pedido.", "The link has expired. Message us on Instagram with your email and order number."],
    server: ["No pudimos preparar el archivo. Probá de nuevo en un minuto.", "We couldn't prepare the file. Please try again in a minute."],
  };
  let order = null, size = "A4", timer = null, busy = false, mail = false;
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const L = () => (SCU.lang() === "en" ? 1 : 0);

  function remember() { // guarda el pedido en este navegador para volver rapido
    try {
      const all = JSON.parse(localStorage.getItem("sc_orders") || "[]").filter((x) => x.o !== O);
      all.unshift({ o: O, t: T, email: order.email, items: order.items });
      localStorage.setItem("sc_orders", JSON.stringify(all.slice(0, 10)));
    } catch (_) { /* sin almacenamiento */ }
  }

  async function load() {
    if (!O || !T) return fail();
    api("/api/config").then((r) => { mail = !!(r.ok && r.data.email); if (order && order.status === "paid") draw(); }).catch(() => {});
    const r = await api(`/api/order?o=${encodeURIComponent(O)}&t=${encodeURIComponent(T)}`).catch(() => null);
    if (!r || !r.ok) return fail(!r);
    order = r.data;
    draw();
    if (order.status === "pending" && !timer) timer = setInterval(async () => {
      const x = await api(`/api/order?o=${O}&t=${T}`).catch(() => null);
      if (x && x.ok && x.data.status !== "pending") { clearInterval(timer); timer = null; order = x.data; draw(); }
    }, 5000);
  }
  function fail(net) {
    card.innerHTML = `<h1>${net ? t("Sin conexión", "No connection") : t("Link no válido", "Invalid link")}</h1><p class="sub">${net ? t("No pudimos conectar con la tienda. Reintentá en un momento.", "We couldn't reach the store. Please retry shortly.") : t("Revisá que hayas abierto el link completo, o recuperá tu compra con tu email y número de pedido.", "Make sure you opened the full link, or recover your purchase with your email and order number.")}</p><p style="text-align:center"><a class="btn primary" href="recuperar.html">${t("Recuperar mi compra", "Recover my purchase")}</a></p>`;
  }

  function draw() {
    if (order.status === "pending") {
      const u = order.usdt;
      card.innerHTML = `<h1>${t("Confirmando tu pago…", "Confirming your payment…")}</h1>
        <p class="sub">${u ? t("Enviá exactamente este monto en la red TRON (TRC20):", "Send exactly this amount on the TRON (TRC20) network:") : t("Esto suele tardar unos segundos. No cierres esta página.", "This usually takes a few seconds. Please keep this page open.")}</p>
        ${u ? `<div class="usdt"><div class="amt">${esc(u.amount)} USDT</div><div class="copy"><code>${esc(u.address)}</code></div></div>` : ""}
        <p style="text-align:center"><span class="wait"><span class="spin"></span>${t("Esperando confirmación", "Waiting for confirmation")}</span></p>
        <p class="hint" style="text-align:center">${t("Tu número de pedido", "Your order number")}: <b style="color:var(--ink)">${esc(O.toUpperCase())}</b></p>`;
      return;
    }
    if (order.status !== "paid") {
      card.innerHTML = `<h1>${t("Pedido vencido", "Order expired")}</h1><p class="sub">${t("El pago no se registró a tiempo. Podés volver a intentarlo cuando quieras.", "The payment wasn't registered in time. You can try again any time.")}</p><p style="text-align:center"><a class="btn primary" href="./#libros">${t("Volver a los libros", "Back to the books")}</a></p>`;
      return;
    }
    remember();
    const multi = order.items.length > 1;
    card.innerHTML = `<h1>${t("¡Gracias! Tus libros están listos", "Thank you! Your books are ready")}</h1>
      <p class="sub">${t("Elegí el tamaño de papel y descargá.", "Pick your paper size and download.")}</p>
      <div class="msg ok" style="margin-top:0;text-align:left"><b>${t("Guardá tu número de pedido", "Save your order number")}:</b> <span style="font-family:var(--display);font-size:20px;letter-spacing:.05em">${esc(O.toUpperCase())}</span><br><span style="font-size:13.5px;opacity:.9">${t("Con tu email y este número podés volver a bajar tus libros cuando quieras, desde “Recuperar mi compra”.", "With your email and this number you can download your books again any time from “Recover my purchase”.")}</span></div>
      <label class="f">${t("Tamaño", "Size")}</label>
      <div class="sizes" id="sizes">${SIZES.map(([k, d]) => `<button type="button" data-s="${k}" aria-pressed="${k === size}">${k === "LETTER" ? t("Carta", "Letter") : k}<small>${d}</small></button>`).join("")}</div>
      <p class="hint">${t("Son vectoriales: se ven nítidos en cualquier tamaño. A4 es el predeterminado.", "They are vector files: crisp at any size. A4 is the default.")}</p>
      ${order.items.map((k) => `<div class="dl"><img src="images/${NAMES[k][2]}.webp" alt=""><div class="nm"><b>${NAMES[k][L()]}</b><span>${t("25 mandalas · PDF", "25 mandalas · PDF")}</span></div><button class="btn ghost small" type="button" data-book="${k}">${t("Descargar", "Download")}</button></div>`).join("")}
      ${multi ? `<button class="btn primary" type="button" data-book="all" style="width:100%;margin-top:6px">${t("Descargar todo en ZIP", "Download all as ZIP")}</button>` : ""}
      <div id="status" role="status"></div>
      <p class="hint" style="text-align:center;margin-top:18px">${t("Te quedan", "You have")} <b style="color:var(--ink)">${order.downloadsLeft}</b> ${t("descargas. Tu copia lleva tu email y número de pedido como licencia personal.", "downloads left. Your copy carries your email and order number as a personal licence.")}</p>
      ${mail ? `<p style="text-align:center;margin:6px 0 0"><button class="btn ghost small" type="button" id="resend">${t("Enviarme el link por email", "Email me this link")}</button></p>` : ""}
      <div class="treeline" style="margin-top:22px"><span>🌱</span><span>${t("Gracias: el 30% de tu compra planta árboles nativos.", "Thank you: 30% of your purchase plants native trees.")}</span></div>`;
    card.querySelectorAll("[data-s]").forEach((b) => b.addEventListener("click", () => { size = b.dataset.s; card.querySelectorAll("[data-s]").forEach((x) => x.setAttribute("aria-pressed", String(x === b))); }));
    card.querySelectorAll("[data-book]").forEach((b) => b.addEventListener("click", () => download(b.dataset.book)));
    const rs = document.getElementById("resend"); if (rs) rs.addEventListener("click", resend);
  }

  const status = (cls, txt) => { const s = document.getElementById("status"); if (s) s.innerHTML = txt ? `<div class="msg ${cls}">${txt}</div>` : ""; };
  const save = (blob, name) => {
    const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = name;
    document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 60000);
  };

  async function fetchBook(book) {
    const r = await fetch(`${window.SC.API}/api/download?o=${encodeURIComponent(O)}&t=${encodeURIComponent(T)}&book=${book}&size=${size}`);
    if (!r.ok) { let code = "server"; try { code = (await r.json()).error; } catch (_) {} const e = new Error(code); e.code = code; throw e; }
    const name = (/filename="([^"]+)"/.exec(r.headers.get("Content-Disposition") || "") || [])[1] || "mandalas.pdf";
    return { name, buf: new Uint8Array(await r.arrayBuffer()) };
  }

  async function download(book) {
    if (busy) return; busy = true;
    card.querySelectorAll("[data-book]").forEach((b) => (b.disabled = true));
    status("ok", `<span class="spin" style="vertical-align:-3px;margin-right:8px"></span>${t("Preparando tu archivo personalizado…", "Preparing your personalised file…")}`);
    try {
      if (book === "all") {
        const files = {};
        for (const k of order.items) { const f = await fetchBook(k); files[f.name] = f.buf; }
        if (!window.fflate) throw new Error("server");
        save(new Blob([window.fflate.zipSync(files, { level: 0 })], { type: "application/zip" }), `Sacred_Circles_Mandalas_${size}.zip`);
        order.downloadsLeft = Math.max(0, order.downloadsLeft - order.items.length);
      } else {
        const f = await fetchBook(book);
        save(new Blob([f.buf], { type: "application/pdf" }), f.name);
        order.downloadsLeft = Math.max(0, order.downloadsLeft - 1);
      }
      draw(); status("ok", t("¡Listo! Revisá tu carpeta de descargas.", "Done! Check your downloads folder."));
    } catch (e) { status("bad", t(...(ERR[e.code] || ERR.server))); }
    finally { busy = false; card.querySelectorAll("[data-book]").forEach((b) => (b.disabled = false)); }
  }

  async function resend() {
    const b = document.getElementById("resend"); b.disabled = true;
    await api("/api/send-link", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: order.email }) }).catch(() => null);
    status("ok", t("Si el email coincide con una compra, te enviamos el link. Revisá también el spam.", "If the email matches a purchase, we've sent you the link. Check spam too."));
  }

  SCU.onLang(() => order && draw());
  load();
})();
