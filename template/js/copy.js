export default class Copy {
  static initialized = false;
  static elements = new WeakSet();
  static icon = `<svg class="copy-icon-svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>`;
  static successIcon = '<polyline points="20 6 9 17 4 12"/>';
  static errorIcon =
    '<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>';

  static init() {
    if (this.initialized) return;
    this.initialized = true;

    document.addEventListener("click", this.handleClick.bind(this), true);

    this.observer = new MutationObserver(this.handleMutations.bind(this));
    this.observer.observe(document.body, { childList: true, subtree: true });

    document.querySelectorAll("[data-copy]").forEach((el) => this.enhance(el));
  }

  static handleClick(e) {
    const el = e.target.closest("[data-copy]");
    if (!el) return;

    e.preventDefault();
    e.stopPropagation();

    const text = el.getAttribute("data-copy");
    this.copy(text, el);
  }

  static handleMutations(mutations) {
    for (const mutation of mutations) {
      for (const node of mutation.addedNodes) {
        if (node.nodeType !== 1) continue;

        if (node.matches?.("[data-copy]")) {
          this.enhance(node);
        }
        node
          .querySelectorAll?.("[data-copy]")
          ?.forEach((el) => this.enhance(el));
      }
    }
  }

  static enhance(el) {
    if (this.elements.has(el)) return;

    el.title ||= "Click to copy";

    if (!el.querySelector(".copy-icon-svg")) {
      el.insertAdjacentHTML("beforeend", this.icon);
    }

    this.elements.add(el);
  }

  static async copy(text, el) {
    try {
      await navigator.clipboard.writeText(text);
      this.feedback(el, true);
      return true;
    } catch (err) {
      console.warn("Copy failed:", err);
      this.feedback(el, false);
      return false;
    }
  }

  static feedback(el, success) {
    if (!el) return;

    const svg = el.querySelector("svg");
    if (!svg) return;

    const prevInner = svg.innerHTML;
    const prevTitle = el.title;

    svg.innerHTML = success ? this.successIcon : this.errorIcon;
    el.title = success ? "Copied!" : "Copy failed";
    el.classList.add(success ? "copy-success" : "copy-error");

    setTimeout(() => {
      svg.innerHTML = prevInner;
      el.title = prevTitle || "Click to copy";
      el.classList.remove("copy-success", "copy-error");
    }, 2000);
  }

  static destroy() {
    this.observer?.disconnect();
    this.initialized = false;
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => Copy.init());
} else {
  Copy.init();
}
