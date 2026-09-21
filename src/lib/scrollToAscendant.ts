export function scrollToAscendantSection() {
  if (typeof window === "undefined") return;

  // Use the same focus/highlight path as every other clickable chart item.
  window.dispatchEvent(new CustomEvent("focus-interpretation", { detail: { type: "angle", key: "ASC" } }));

  // Dispatch custom event to expand the section if it is managed by React state
  window.dispatchEvent(new CustomEvent("scroll-to-ascendant"));

  setTimeout(() => {
    const el = document.getElementById("ascendant-section");
    if (el) {
      if (el instanceof HTMLDetailsElement && !el.open) {
        el.open = true;
      }
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, 30);
}
