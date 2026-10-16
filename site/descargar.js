/* Pagina de descargas.
   - Al confirmarse el pago la descarga arranca sola (tamaño elegido en el checkout).
   - Despues: 1 descarga por semana, contada desde la primera, con email + numero de pedido.
   - Varios libros = un solo ZIP armado aca, en el navegador. */
(function () {
  const { t, api } = SCU;
  const q = new URLSearchParams(location.search);
  const O = q.get("o") || "", T = q.get("t") || "";
  const card = document.getElementById("card");
  SCU.init({ f_terms: "Terms & licence", f_priv: "Privacy", f_recover: "Recover my purchase" });

  const NAMES = { kids: ["Niños", "Kids", "portada-ninos"], teens: ["Adolescentes", "Teens", "portada-adolescentes"], adults: ["Adultos", "Adults", "portada-adultos"] };
  const SIZES = [["A5", "148×210 mm"], ["A4", "210×297 mm"], ["LETTER", "8.5×11 in"], ["A3", "297×420 mm"], ["A2", "420×594 mm"]];
  let order = null, size = "A4", timer = null, busy = false, started = false, last = null, confirmTimer = null;
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const L = () => (SCU.lang() === "en" ? 1 : 0);
  const when = (ts) => new Date(ts * 1000).toLocaleString(SCU.lang() === "en" ? "en-US" : "es-AR", { day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" });
  const sizeName = (k) => (k === "LETTER" ? t("Carta", "Letter") : k);

  function remember() {
    try {
      const all = JSON.parse(localStorage.getItem("sc_orders") || "[]").filter((x) => x.o !== O);
      all.unshift({ o: O, t: T, email: order.email, items: order.items });
      localStorage.setItem("sc_orders", JSON.stringify(all.slice(0, 10)));
    } catch (_) { /* sin almacenamiento */ }
  }

  async function refresh() {
    const r = await api(`/api/order?o=${encodeURIComponent(O)}&t=${encodeURIComponent(T)}`).catch(() => ({ net: true }));
    if (r.net) return "net";
    if (!r.ok) return null;
    order = r.data; size = order.size || size; return order;
  }

  async function load() {
    if (!O || !T) return fail();
    const r = await refresh();
    if (r === "net") return fail(true);
    if (!r) return fail(false);
    draw();
    if (order.status === "pending") timer = setInterval(async () => {
      const x = await refresh(); if (!x || x === "net" || order.status === "pending") return;
      clearInterval(timer); timer = null; draw();
    }, 5000);
  }
  function fail(net) {
    card.innerHTML = `<h1>${net ? t("Sin conexión", "No connection") : t("Link no válido", "Invalid link")}</h1><p class="sub">${net ? t("No pudimos conectar con la tienda. Reintentá en un momento.", "We couldn't reach the store. Please retry shortly.") : t("Revisá que hayas abierto el link completo, o recuperá tu compra con tu email y número de pedido.", "Make sure you opened the full link, or recover your purchase with your email and order number.")}</p><p style="text-align:center"><a class="btn primary" href="recuperar.html">${t("Recuperar mi compra", "Recover my purchase")}</a></p>`;
  }

  const orderBox = () => `<div class="msg ok" style="text-align:left"><b>${t("Tu número de pedido (licencia)", "Your order number (licence)")}:</b> <span style="font-family:var(--display);font-size:20px;letter-spacing:.05em">${esc(O.toUpperCase())}</span><br><span style="font-size:13.5px;opacity:.9">${t("Guardalo: con tu email te permite volver a bajar tus libros, una vez por semana, desde “Recuperar mi compra”.", "Keep it: with your email it lets you download your books again, once a week, from “Recover my purchase”.")}</span></div>`;
  const books = () => order.items.map((k) => `<div class="dl"><img src="images/${NAMES[k][2]}.webp" alt=""><div class="nm"><b>${NAMES[k][L()]}</b><span>${t("25 mandalas · PDF", "25 mandalas · PDF")}</span></div></div>`).join("");
  const tree = () => `<div class="treeline" style="margin-top:22px"><span>🌱</span><span>${t("Gracias: el 30% de tu compra planta árboles nativos.", "Thank you: 30% of your purchase plants native trees.")}</span></div>`;
  const status = (cls, txt) => { const s = document.getElementById("status"); if (s) s.innerHTML = txt ? `<div class="msg ${cls}">${txt}</div>` : ""; };

  function draw() {
    if (order.status === "pending") {
      const u = order.usdt;
      card.innerHTML = `<h1>${t("Confirmando tu pago…", "Confirming your payment…")}</h1>
        <p class="sub">${u ? t("Enviá exactamente este monto en la red TRON (TRC20):", "Send exactly this amount on the TRON (TRC20) network:") : t("Esto suele tardar unos segundos. Tu descarga empezará sola.", "This usually takes a few seconds. Your download will start by itself.")}</p>
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
    if (order.firstPending && !started) { started = true; deliver(order.size || "A4", true); return; }
    if (last) return drawDelivered();
    if (!order.canDownload) return drawLocked();
    drawChooser();
  }

  // Puede volver a bajar (semana cumplida o entrega anterior sin confirmar)
  function drawChooser() {
    card.innerHTML = `<h1>${order.retry ? t("Terminemos tu descarga", "Let's finish your download") : t("Tus libros están listos", "Your books are ready")}</h1>
      <p class="sub">${order.retry ? t("Tu descarga anterior no se completó. Podés reintentar.", "Your previous download didn't complete. You can retry.") : t("Ya podés volver a bajarlos. Después podrás repetirlo dentro de una semana.", "You can download them again now. You'll be able to repeat it in a week.")}</p>
      ${orderBox()}
      <label class="f">${t("Tamaño", "Size")}</label>
      <div class="sizes" id="sizes">${SIZES.map(([k, d]) => `<button type="button" data-s="${k}" aria-pressed="${k === size}">${sizeName(k)}<small>${d}</small></button>`).join("")}</div>
      <p class="hint">${t("Vectoriales: nítidos en cualquier tamaño. Si elegís otro tamaño, esa será tu descarga de la semana.", "Vector files: crisp at any size. If you choose another size, that will be your download for the week.")}</p>
      ${books()}
      <button class="btn primary" id="go" type="button" style="width:100%;margin-top:6px">${order.items.length > 1 ? t("Descargar (ZIP)", "Download (ZIP)") : t("Descargar PDF", "Download PDF")}</button>
      <div id="status" role="status"></div>${tree()}`;
    card.querySelectorAll("[data-s]").forEach((b) => b.addEventListener("click", () => { size = b.dataset.s; card.querySelectorAll("[data-s]").forEach((x) => x.setAttribute("aria-pressed", String(x === b))); }));
    document.getElementById("go").addEventListener("click", () => deliver(size, false));
  }

  function drawLocked() {
    card.innerHTML = `<h1>${t("Tu descarga ya se realizó", "Your download is done")}</h1>
      <p class="sub">${order.lastAt ? t("La hiciste el ", "You made it on ") + when(order.lastAt) + ". " : ""}${t("Podrás volver a bajar tus libros a partir del", "You'll be able to download your books again from")} <b style="color:var(--ink)">${order.nextAt ? when(order.nextAt) : "—"}</b>.</p>
      ${orderBox()}${books()}
      <p class="hint" style="text-align:center">${t("¿Se perdió el archivo y necesitás ayuda? Escribinos por Instagram a @sacred.circles.art con tu email y número de pedido.", "Lost the file and need help? Message us on Instagram at @sacred.circles.art with your email and order number.")}</p>${tree()}`;
  }

  function drawDelivered() {
    card.innerHTML = `<h1>${t("¡Descarga lista!", "Download ready!")}</h1>
      <p class="sub">${t("Tu archivo", "Your file")} <b style="color:var(--ink)">${esc(last.name)}</b> ${t("se descargó en tu dispositivo.", "was saved to your device.")}</p>
      <div id="status" role="status"></div>
      <p style="text-align:center;margin:6px 0 16px"><button class="btn ghost small" id="again" type="button">${t("¿No lo ves? Guardar de nuevo", "Can't see it? Save again")}</button></p>
      ${orderBox()}${books()}
      <p class="hint" style="text-align:center">${t("Podrás volver a bajarlos dentro de una semana, con tu email y tu número de pedido.", "You'll be able to download them again in a week, with your email and order number.")}</p>${tree()}`;
    document.getElementById("again").addEventListener("click", () => { save(last.blob, last.name); status("ok", t("Listo, volvimos a guardarlo.", "Done, saved again.")); });
  }

  const save = (blob, name) => {
    const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = name;
    document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 120000);
  };

  async function deliver(sz, auto) {
    if (busy) return; busy = true;
    card.innerHTML = `<h1>${auto ? t("¡Pago confirmado!", "Payment confirmed!") : t("Preparando tu descarga", "Preparing your download")}</h1>
      <p class="sub">${t("Estamos preparando tus libros con tu licencia personal. Tu descarga empieza sola.", "We're preparing your books with your personal licence. Your download starts by itself.")}</p>
      <p style="text-align:center"><span class="wait"><span class="spin"></span><span id="prog">${t("Un momento…", "One moment…")}</span></span></p><div id="status" role="status"></div>${orderBox()}`;
    const prog = (m) => { const p = document.getElementById("prog"); if (p) p.textContent = m; };
    try {
      const g = await api("/api/grant", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ o: O, t: T, size: sz }) });
      if (!g.ok) {
        if (g.data && g.data.error === "wait") { await refresh(); busy = false; return drawLocked(); }
        throw new Error("grant");
      }
      const files = {}; let n = 0;
      for (const k of g.data.books) {
        prog(`${t("Preparando", "Preparing")} ${NAMES[k][L()]} (${++n}/${g.data.books.length})`);
        const r = await fetch(`${window.SC.API}/api/download?o=${encodeURIComponent(O)}&t=${encodeURIComponent(T)}&book=${k}&size=${g.data.size}&g=${encodeURIComponent(g.data.grant)}`);
        if (!r.ok) throw new Error("download");
        files[((/filename="([^"]+)"/.exec(r.headers.get("Content-Disposition") || "") || [])[1]) || k + ".pdf"] = new Uint8Array(await r.arrayBuffer());
      }
      const names = Object.keys(files);
      let blob, name;
      if (names.length === 1) { blob = new Blob([files[names[0]]], { type: "application/pdf" }); name = names[0]; }
      else { if (!window.fflate) throw new Error("zip"); blob = new Blob([window.fflate.zipSync(files, { level: 0 })], { type: "application/zip" }); name = `Sacred_Circles_Mandalas_${g.data.size}.zip`; }
      last = { blob, name };
      save(blob, name);
      drawDelivered();
      // cierra la entrega: con el boton o solo tras 90 s con la pagina abierta (da tiempo a "Guardar de nuevo")
      const confirm = () => { clearTimeout(confirmTimer); api("/api/confirm", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ o: O, t: T, size: g.data.size, grant: g.data.grant }) }).catch(() => {}); };
      confirmTimer = setTimeout(confirm, 90000);
    } catch (e) {
      busy = false; started = false;
      card.innerHTML = `<h1>${t("No pudimos completar la descarga", "We couldn't complete the download")}</h1><p class="sub">${t("No se gastó tu descarga. Probá de nuevo.", "Your download wasn't used. Please try again.")}</p><p style="text-align:center"><button class="btn primary" id="retry" type="button">${t("Reintentar", "Retry")}</button></p>`;
      document.getElementById("retry").addEventListener("click", async () => { await refresh(); started = true; deliver(sz, false); });
      return;
    }
    busy = false;
  }

  SCU.onLang(() => { if (order && !busy) draw(); });
  load();
})();
