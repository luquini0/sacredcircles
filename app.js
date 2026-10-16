/* Efectos de la portada: nav, cinta de mandalas y leve parallax del hero. Sin dependencias. */
(function () {
  const nav = document.querySelector(".nav");
  const onScroll = () => nav && nav.classList.toggle("solid", scrollY > 40);
  addEventListener("scroll", onScroll, { passive: true }); onScroll();

  // Cinta: mandalas coloreados + frase, duplicada para un bucle continuo
  const track = document.getElementById("track");
  if (track) {
    const imgs = ["ninos-1", "adolescentes-1", "adultos-1", "ninos-3", "adolescentes-3", "adultos-3", "ninos-2", "adolescentes-2", "adultos-2"];
    const phrase = "<span>sacred circles</span>";
    const one = imgs.map((n, i) => `<img src="images/deco-${n}.webp" alt="" width="64" height="64" loading="lazy">${i % 3 === 2 ? phrase : ""}`).join("");
    track.innerHTML = one + one;
  }

  // Parallax suave del arte del hero (solo con mouse y sin "reducir movimiento")
  const art = document.querySelector(".art");
  if (art && !matchMedia("(prefers-reduced-motion: reduce)").matches && matchMedia("(hover:hover)").matches) {
    addEventListener("mousemove", (e) => {
      const x = e.clientX / innerWidth - 0.5, y = e.clientY / innerHeight - 0.5;
      art.style.transform = `translate(${x * -14}px, ${y * -14}px)`;
    });
    art.style.transition = "transform .3s ease-out";
  }
})();
