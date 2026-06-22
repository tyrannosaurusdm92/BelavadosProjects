(function(){
function initLayoutNavigation(){
  const pageContent = document.querySelector(".page-content");
  const footer = document.querySelector(".site-footer");

  if (!pageContent || !footer) return;

  document.querySelectorAll([
    ".jump-bubble",
    ".footer-scroll-wrap",
    ".page-scrollbar",
    ".scrollbar",
    "[data-scroll-nav]",
    "[data-page-scroll]"
  ].join(",")).forEach((node) => node.remove());

  /* =========================
     FILL SYSTEM
  ========================= */

  const sections = document.querySelectorAll(".overlay-section");

  function getSection(n) {
    return document.querySelector(`.overlay-section--${n}`);
  }

  function setSectionFilled(n, state = true) {
    const section = getSection(n);
    if (section) section.classList.toggle("is-filled", !!state);
  }

  function toggleSectionFilled(n) {
    const section = getSection(n);
    if (section) section.classList.toggle("is-filled");
  }

  function applyFillState(map) {
    Object.entries(map).forEach(([n, v]) => {
      setSectionFilled(n, v);
    });
  }

  sections.forEach((section) => {
    section.addEventListener("click", () => {
      section.classList.toggle("is-filled");
    });
  });

  window.setSectionFilled = setSectionFilled;
  window.toggleSectionFilled = toggleSectionFilled;
  window.applyFillState = applyFillState;

  /* =========================
     FOOTER HORIZONTAL SCROLL
     Uses normal document scrolling
  ========================= */

  footer.innerHTML = `
    <div class="footer-scroll-wrap">
      <label for="footerScroll">Horizontal</label>
      <input class="footer-scroll" id="footerScroll" type="range" min="0" max="100" value="0">
    </div>
  `;

  const footerScroll = footer.querySelector(".footer-scroll");

  function getMaxScrollLeft() {
    return Math.max(0, document.documentElement.scrollWidth - document.documentElement.clientWidth);
  }

  function updateSlider() {
    footerScroll.max = String(getMaxScrollLeft());
    footerScroll.value = String(window.scrollX);
  }

  footerScroll.addEventListener("input", () => {
    window.scrollTo({
      left: Number(footerScroll.value || 0),
      behavior: "auto",
    });
  });

  footer.addEventListener(
    "wheel",
    (e) => {
      e.preventDefault();
      window.scrollBy({
        left: e.deltaY,
        top: 0,
        behavior: "auto",
      });
      updateSlider();
    },
    { passive: false }
  );

  window.addEventListener("scroll", updateSlider, { passive: true });
  window.addEventListener("resize", updateSlider);

  /* =========================
     JUMP MENU
  ========================= */

  const bubble = document.createElement("div");
  bubble.className = "jump-bubble";
  bubble.innerHTML = `
    <button class="jump-bubble__toggle" type="button" aria-expanded="false">
      Jump
    </button>

    <div class="jump-panel" aria-hidden="true">
      <select class="jump-target">
        <option value="header">Header</option>
        <option value="footer">Footer</option>
        ${[1,2,3,4,5,6,7,8,9,10,11]
          .map((n) => `<option value="${n}">Section ${n}</option>`)
          .join("")}
      </select>

      <input class="zoom-range" type="range" min="25" max="150" value="100">
      <div class="zoom-readout">100%</div>

      <div class="jump-panel__buttons">
        <button class="zoom-out" type="button">-</button>
        <button class="zoom-reset" type="button">Reset</button>
        <button class="zoom-in" type="button">+</button>
      </div>
    </div>
  `;
  document.body.appendChild(bubble);

  const bubbleToggle = bubble.querySelector(".jump-bubble__toggle");
  const jumpPanel = bubble.querySelector(".jump-panel");
  const target = bubble.querySelector(".jump-target");
  const range = bubble.querySelector(".zoom-range");
  const readout = bubble.querySelector(".zoom-readout");

  function setBubbleOpen(open) {
    bubble.classList.toggle("is-open", open);
    bubbleToggle.setAttribute("aria-expanded", String(open));
    jumpPanel.setAttribute("aria-hidden", String(!open));
  }

  bubbleToggle.addEventListener("click", (e) => {
    e.stopPropagation();
    setBubbleOpen(!bubble.classList.contains("is-open"));
  });

  bubble.addEventListener("click", (e) => {
    e.stopPropagation();
  });

  document.addEventListener("click", () => {
    setBubbleOpen(false);
  });

  function jumpToTarget(value) {
    if (value === "header") {
      window.scrollTo({
        top: 0,
        left: window.scrollX,
        behavior: "smooth",
      });
      return;
    }

    if (value === "footer") {
      window.scrollTo({
        top: Math.max(0, document.documentElement.scrollHeight - document.documentElement.clientHeight),
        left: window.scrollX,
        behavior: "smooth",
      });
      return;
    }

    const section = getSection(Number(value));
    if (!section) return;

    const rect = section.getBoundingClientRect();
    const left = window.scrollX + rect.left - (document.documentElement.clientWidth - rect.width) / 2;
    const top = window.scrollY + rect.top - (document.documentElement.clientHeight - rect.height) / 2;

    window.scrollTo({
      left: Math.max(0, left),
      top: Math.max(0, top),
      behavior: "smooth",
    });
  }

  target.addEventListener("change", () => {
    jumpToTarget(target.value);
  });

  range.addEventListener("input", () => {
    readout.textContent = `${range.value}%`;
  });

  bubble.querySelector(".zoom-in").addEventListener("click", () => {
    range.value = String(Math.min(150, Number(range.value) + 5));
    readout.textContent = `${range.value}%`;
  });

  bubble.querySelector(".zoom-out").addEventListener("click", () => {
    range.value = String(Math.max(25, Number(range.value) - 5));
    readout.textContent = `${range.value}%`;
  });

  bubble.querySelector(".zoom-reset").addEventListener("click", () => {
    range.value = "100";
    readout.textContent = "100%";
  });

  updateSlider();

}
if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initLayoutNavigation); else initLayoutNavigation();
})();
