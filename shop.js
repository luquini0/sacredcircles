/* Portada de la tienda: idioma, carrito, checkout, muestras y barra de reforestacion. */
(function () {
  const { t, api } = SCU;
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => [...(r || document).querySelectorAll(s)];

  const EN = {
    nav_books: "Books", nav_samples: "Samples", nav_trees: "Trees", nav_faq: "FAQ",
    hero_eyebrow: "Sacred geometry to colour", hero_h1: "A circle to <em>come back to yourself</em>",
    hero_lead: "Three books of 25 symmetrical mandalas, from simple to intricate. Vector PDF to print at any size. And 30% of every sale plants native trees.",
    hero_cta: "See the books", hero_cta2: "Our forest",
    books_h2: "Choose your book", books_sub: "Each book has 25 mandalas of rising difficulty, elegant from the very first. Pay once and download in the size you need.",
    b_kids: "Kids", b_kids_age: "To start painting", b_kids_p: "Large rounded shapes, clear lines and plenty of room to try every colour.",
    b_teens: "Teens", b_teens_age: "Layers and rhythm", b_teens_p: "Double lines, layers and patterns with more movement. A stylish challenge to test palettes and gradients.",
    b_adults: "Adults", b_adults_age: "Calm and detail", b_adults_p: "Fine curves and intricate geometry, made to be coloured slowly, one layer at a time.",
    b_25: "25 mandalas", add: "Add", added: "Added ✓",
    pack_h: "Pack of all 3 books", pack_p: "75 mandalas for the whole community. You save and we plant more.", buy_pack: "Buy the pack",
    samples_h2: "See what's inside", samples_sub: "Three pages from each book. Drawn with vector curves: total symmetry and clean lines that never pixelate at any size.",
    samples_note: "Reduced preview. In the book every mandala fills a full page.",
    how_h2: "Easy to buy, made to print", how_sub: "Pay, get your link, download. No accounts, no passwords.",
    s1_h: "Choose", s1_p: "One, two or all three books.", s2_h: "Pay", s2_p: "Mercado Pago from Argentina, or USDT from anywhere in the world.",
    s3_h: "Get your link", s3_p: "It appears instantly and also arrives by email.", s4_h: "Download & print", s4_p: "PDF or ZIP, in A5, A4, Letter, A3 or A2.",
    f1_h: "Vector", f1_p: "Prints crisp from 10 to 50 cm.", f2_h: "Total symmetry", f2_p: "Every petal in its place, no overlaps.",
    f3_h: "Binding on top", f3_p: "A top strip to bind without touching the drawing.", f4_h: "Your artwork", f4_p: "Room for name, signature and date on every page.",
    tree_h2: "Every book plants trees",
    tree_p1: "of every sale goes to planting native trees and plants in burned or deforested areas of Latin America. Then we will continue on other continents.",
    tree_p2: "Our goal is to reforest <strong>1 km² (100 hectares)</strong>. The bar fills with every book sold; we don't publish the exact amount, but we do share every milestone.",
    tree_fine: "Reforesting one hectare in Latin America costs between USD 1,500 and 5,000. When the fund reaches the first investment we will announce it on our social media with photos and location.",
    faq_h2: "Frequently asked questions",
    q1: "How do I get my books?", a1: "As soon as the payment is confirmed you see your downloads page and we email you the same link. There you choose the size and download each book or everything in one ZIP.",
    q2: "How can I pay?", a2: "With Mercado Pago (card, transfer or cash in Argentina; the price is converted to pesos at checkout) or with USDT on the TRON network (TRC20) from any country.",
    q3: "Can I print at any size?", a3: "Yes. The mandalas are vector: pick A5, A4, Letter, A3 or A2 and they stay crisp. For special sizes (for example 40 × 40 cm) message us on Instagram.",
    q4: "Can I share it with others?", a4: "We think of each book as one purchase for a small community: your family, classroom, workshop or close group. Print it and photocopy the pages as often as you like for that circle, but please don't resell or publish the digital file. Your copy carries your email as the licence.",
    q5: "Where exactly does the 30% go?", a5: "To a dedicated fund for reforestation with native species in burned or deforested areas of Latin America. We will show every milestone on Instagram.",
    q6: "I had a problem with my download", a6: "Message us on Instagram at @sacred.circles.art with your purchase email and we'll fix it. You can also have the link re-sent from the downloads page.",
    f_terms: "Terms & licence", f_priv: "Privacy", pay: "Pay",
    m_title: "Checkout", m_email: "Your email (your link arrives here)", m_method: "Payment method", m_mp: "Argentina · pesos", m_usdt: "Worldwide · TRC20",
    m_terms: "I accept the <a href=\"legal.html#terminos\" target=\"_blank\" rel=\"noopener\">terms and personal licence</a>.", m_go: "Continue to payment",
    m_tree: "30% of your purchase plants native trees.",
    u_title: "Pay with USDT", u_p: "Send exactly this amount on the <b>TRON (TRC20)</b> network. The extra decimals identify your order.",
    copy: "COPY", u_wait: "Waiting for your payment… it confirms automatically (1–3 min).",
    u_warn: "Other networks or different amounts are not credited. You can close this window: we'll email you once it's confirmed.",
    d_title: "Payment confirmed!", d_p: "Thank you for being part of this. Your books are ready.", d_btn: "Go to my downloads",
  };
  SCU.init(EN);

  /* ---- precios ---- */
  const P = { book: 4, bundle: 10 };
  const NAMES = { kids: ["Niños", "Kids"], teens: ["Adolescentes", "Teens"], adults: ["Adultos", "Adults"] };
  const bookName = (k) => t(NAMES[k][0], NAMES[k][1]);
  const priceOf = (n) => (n === 3 ? P.bundle : n * P.book);
  const usd = (n) => "USD " + n;
  function paintPrices() {
    $$('[data-price="book"]').forEach((e) => (e.textContent = usd(P.book)));
    $$('[data-price="bundle"]').forEach((e) => (e.textContent = usd(P.bundle)));
    $$('[data-price="three"]').forEach((e) => (e.textContent = usd(P.book * 3)));
  }
  paintPrices();
  api("/api/config").then((r) => { if (r.ok) { P.book = r.data.priceBookUsd; P.bundle = r.data.priceBundleUsd; paintPrices(); render(); } }).catch(() => {});

  /* ---- carrito ---- */
  const sel = new Set();
  function render() {
    $$(".book").forEach((b) => {
      const on = sel.has(b.dataset.book);
      b.classList.toggle("picked", on);
      const btn = $(".add", b); btn.textContent = on ? t("Agregado ✓", "Added ✓") : t("Agregar", "Add");
      btn.classList.toggle("primary", on); btn.classList.toggle("ghost", !on);
    });
    const n = sel.size;
    $("#cartbar").classList.toggle("show", n > 0);
    $("#cartN").textContent = n === 1 ? t("1 libro", "1 book") : t(n + " libros", n + " books");
    $("#cartTotal").textContent = usd(priceOf(n));
  }
  SCU.onLang(() => { render(); if (!$("#modal").classList.contains("open")) return; renderSummary(); });
  $$(".book .add").forEach((b) => b.addEventListener("click", () => {
    const k = b.closest(".book").dataset.book;
    sel.has(k) ? sel.delete(k) : sel.add(k); render();
  }));
  $("#buyPack").addEventListener("click", () => { ["kids", "teens", "adults"].forEach((k) => sel.add(k)); render(); openModal(); });
  $("#goPay").addEventListener("click", openModal);

  /* ---- checkout ---- */
  let method = "mp", pollTimer = null;
  function renderSummary() {
    const items = [...sel];
    const rows = items.map((k) => `<div><span>${bookName(k)} · 25 mandalas</span><span>${usd(P.book)}</span></div>`);
    if (items.length === 3) rows.push(`<div><span>${t("Descuento pack", "Pack discount")}</span><span>− ${usd(P.book * 3 - P.bundle)}</span></div>`);
    $("#mSum").innerHTML = rows.join("") + `<div class="tot"><span>Total</span><b>${usd(priceOf(items.length))}</b></div>`;
  }
  function show(id) { ["mForm", "mUsdt", "mDone"].forEach((x) => ($("#" + x).hidden = x !== id)); }
  function openModal() {
    if (!sel.size) return;
    renderSummary(); show("mForm"); $("#mErr").textContent = ""; $("#modal").classList.add("open"); document.body.style.overflow = "hidden";
    setTimeout(() => $("#mEmail").focus(), 50);
  }
  function closeModal() { $("#modal").classList.remove("open"); document.body.style.overflow = ""; clearInterval(pollTimer); }
  $("#mClose").addEventListener("click", closeModal);
  $("#modal").addEventListener("click", (e) => { if (e.target.id === "modal") closeModal(); });
  addEventListener("keydown", (e) => { if (e.key === "Escape") closeModal(); });
  $$(".pay button").forEach((b) => b.addEventListener("click", () => {
    method = b.dataset.method; $$(".pay button").forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
  }));

  const ERR = {
    bad_email: ["Revisá tu email.", "Please check your email."],
    method_unavailable: ["Este medio de pago no está disponible por ahora. Probá con el otro.", "This payment method is unavailable right now. Try the other one."],
    payment_provider: ["No pudimos iniciar el pago. Probá de nuevo en un momento.", "We couldn't start the payment. Please try again shortly."],
  };
  $("#mPay").addEventListener("click", async () => {
    const err = $("#mErr"), btn = $("#mPay"); err.textContent = "";
    const email = $("#mEmail").value.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) { err.textContent = t(...ERR.bad_email); return; }
    if (!$("#mTerms").checked) { err.textContent = t("Aceptá los términos para continuar.", "Please accept the terms to continue."); return; }
    btn.disabled = true; btn.textContent = t("Un momento…", "One moment…");
    try {
      const r = await api("/api/checkout", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ items: [...sel], email, method, lang: SCU.lang() }) });
      if (!r.ok) { err.textContent = t(...(ERR[r.data && r.data.error] || ERR.payment_provider)); return; }
      const d = r.data;
      if (d.redirect) { location.href = d.redirect; return; }
      showUsdt(d);
    } catch (_) { err.textContent = t(...ERR.payment_provider); }
    finally { btn.disabled = false; btn.textContent = t("Continuar al pago", "Continue to payment"); }
  });

  function showUsdt(d) {
    show("mUsdt");
    $("#uAmt").textContent = d.usdt.amount; $("#uAddr").textContent = d.usdt.address;
    try { const q = qrcode(0, "M"); q.addData(d.usdt.address); q.make(); $("#uQr").innerHTML = q.createSvgTag({ scale: 4, margin: 0 }); } catch (_) { $("#uQr").style.display = "none"; }
    $("#uCopy").onclick = () => { navigator.clipboard && navigator.clipboard.writeText(d.usdt.address); $("#uCopy").textContent = t("¡COPIADO!", "COPIED!"); setTimeout(() => ($("#uCopy").textContent = t("COPIAR", "COPY")), 1600); };
    clearInterval(pollTimer);
    pollTimer = setInterval(async () => {
      const r = await api(`/api/order?o=${d.orderId}&t=${d.token}`).catch(() => null);
      if (r && r.ok && r.data.status === "paid") { clearInterval(pollTimer); $("#dLink").href = `descargar.html?o=${d.orderId}&t=${d.token}`; show("mDone"); }
    }, 6000);
  }

  /* ---- muestras ---- */
  const grid = $("#samples");
  function samples(book) {
    grid.innerHTML = [4, 13, 22].map((n) => `<figure class="sample" style="margin:0"><img src="images/muestra-${book}-${String(n).padStart(2, "0")}.webp" alt="${t("Mandala de muestra", "Sample mandala")} ${n}" loading="lazy" draggable="false"><span>${t("Mandala", "Mandala")} ${n}</span></figure>`).join("");
  }
  let curTab = "ninos";
  $$(".tab").forEach((b) => b.addEventListener("click", () => {
    curTab = b.dataset.tab; $$(".tab").forEach((x) => x.setAttribute("aria-selected", String(x === b))); samples(curTab);
  }));
  samples(curTab); SCU.onLang(() => samples(curTab));

  /* ---- barra de reforestacion: solo avance, sin cifras ---- */
  api("/api/fund").then((r) => {
    if (!r.ok) return;
    const f = Math.max(0, Math.min(1, r.data.fraction || 0));
    const bar = $("#bar"), fill = $("#fill");
    const go = () => { fill.style.width = (f * 100).toFixed(2) + "%"; };
    "IntersectionObserver" in window ? new IntersectionObserver((es, o) => { if (es[0].isIntersecting) { go(); o.disconnect(); } }, { threshold: 0.4 }).observe(bar) : go();
  }).catch(() => {});

  /* ---- aparicion suave ---- */
  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } }), { threshold: 0.12 });
    $$(".reveal").forEach((e) => io.observe(e));
  } else $$(".reveal").forEach((e) => e.classList.add("in"));

  if (/pago=fallido/.test(location.search)) history.replaceState(null, "", location.pathname);
  render();
})();
