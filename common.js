/* Utilidades compartidas: idioma (ES por defecto, EN) y llamadas a la API. */
window.SCU = (function () {
  const store = {
    get(k) { try { return localStorage.getItem(k); } catch (_) { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch (_) {} },
  };
  let lang = store.get("sc_lang") || ((navigator.language || "es").toLowerCase().startsWith("es") ? "es" : "en");
  let en = {}, listeners = [];
  const es = new Map();

  function apply() {
    document.documentElement.lang = lang;
    document.querySelectorAll("[data-i18n]").forEach((el) => {
      const k = el.dataset.i18n;
      if (!es.has(el)) es.set(el, el.innerHTML);
      el.innerHTML = lang === "en" && en[k] != null ? en[k] : es.get(el);
    });
    const b = document.getElementById("lang");
    if (b) b.textContent = lang === "es" ? "EN" : "ES";
    listeners.forEach((f) => f(lang));
  }
  function init(enDict) {
    en = enDict || {};
    const b = document.getElementById("lang");
    if (b) b.addEventListener("click", () => { lang = lang === "es" ? "en" : "es"; store.set("sc_lang", lang); apply(); });
    apply();
  }
  const t = (esText, enText) => (lang === "en" ? enText : esText);
  async function api(path, opts) {
    const r = await fetch(window.SC.API + path, opts);
    let data = null;
    try { data = await r.json(); } catch (_) { /* binario u otro */ }
    return { ok: r.ok, status: r.status, data, res: r };
  }
  return { init, t, api, lang: () => lang, onLang: (f) => listeners.push(f), store };
})();
