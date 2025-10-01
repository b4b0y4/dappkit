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
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
      } else {
        this.fallbackCopy(text);
      }

      this.showFeedback(element, true);
      return true;
    } catch (error) {
      console.error("Copy failed:", error);
      this.showFeedback(element, false);
      return false;
    }
  }

  static fallbackCopy(text) {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.style.position = "fixed";
    textArea.style.left = "-999999px";
    textArea.style.top = "-999999px";
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();

    try {
      document.execCommand("copy");
      textArea.remove();
    } catch (error) {
      textArea.remove();
      throw error;
    }
  }

  static showFeedback(element, success) {
    if (!element) return;

    const originalTitle = element.getAttribute("title");
    const originalContent = element.innerHTML;

    element.classList.add(success ? "copy-success" : "copy-error");
    element.setAttribute("title", success ? "Copied!" : "Copy failed");

    // Hide original content and show feedback
    const contentWrapper = document.createElement("span");
    contentWrapper.className = "copy-original-content";
    contentWrapper.innerHTML = originalContent;
    contentWrapper.style.visibility = "hidden";

    const checkmark = document.createElement("span");
    checkmark.className = "copy-feedback";
    checkmark.textContent = success ? "✓ Copied!" : "✗ Failed";

    element.innerHTML = "";
    element.appendChild(contentWrapper);
    element.appendChild(checkmark);

    setTimeout(() => {
      element.classList.remove("copy-success", "copy-error");
      element.setAttribute("title", originalTitle || "Click to copy");
      element.innerHTML = originalContent;
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
