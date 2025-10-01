export default class Copy {
  static initialized = false;
  static copyElements = new Set();

  static init() {
    if (this.initialized) return;

    this.setupGlobalListener();
    this.observeDOM();

    this.initialized = true;
  }

  static setupGlobalListener() {
    document.addEventListener("click", (e) => {
      const copyBtn = e.target.closest("[data-copy]");
      if (!copyBtn) return;

      e.preventDefault();
      const text = copyBtn.getAttribute("data-copy");
      this.copyToClipboard(text, copyBtn);
    });
  }

  static observeDOM() {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === 1) {
            const copyElements = node.querySelectorAll?.("[data-copy]") || [];
            copyElements.forEach((el) => this.enhanceElement(el));
          }
        });
      });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    document.querySelectorAll("[data-copy]").forEach((el) => {
      this.enhanceElement(el);
    });
  }

  static enhanceElement(element) {
    if (this.copyElements.has(element)) return;

    element.style.cursor = "pointer";
    element.setAttribute("title", "Click to copy");

    this.copyElements.add(element);
  }

  static async copyToClipboard(text, element = null) {
    try {
      await navigator.clipboard.writeText(text);
      this.showFeedback(element, true);
      return true;
    } catch (error) {
      console.error("Copy failed:", error);
      this.showFeedback(element, false);
      return false;
    }
  }

  static showFeedback(element, success) {
    if (!element) return;

    const svg = element.querySelector("svg");
    if (!svg) return;

    const originalSvg = svg.outerHTML;
    const originalTitle = element.getAttribute("title");

    // Replace with check or X icon
    if (success) {
      svg.innerHTML =
        '<polyline points="20 6 9 17 4 12" stroke="currentColor" stroke-width="2" fill="none"></polyline>';
      element.classList.add("copy-success");
      element.setAttribute("title", "Copied!");
    } else {
      svg.innerHTML =
        '<line x1="18" y1="6" x2="6" y2="18" stroke="currentColor" stroke-width="2"></line><line x1="6" y1="6" x2="18" y2="18" stroke="currentColor" stroke-width="2"></line>';
      element.classList.add("copy-error");
      element.setAttribute("title", "Copy failed");
    }

    setTimeout(() => {
      const currentSvg = element.querySelector("svg");
      if (currentSvg) {
        currentSvg.outerHTML = originalSvg;
      }
      element.classList.remove("copy-success", "copy-error");
      element.setAttribute("title", originalTitle || "Click to copy");
    }, 2000);
  }

  static copy(text) {
    return this.copyToClipboard(text);
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => Copy.init());
} else {
  Copy.init();
}
