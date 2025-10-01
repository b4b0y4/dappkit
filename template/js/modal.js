export default class Modal {
  static modals = new Map();
  static container = null;
  static idCounter = 0;
  static initialized = false;

  static init() {
    if (this.initialized) return;

    this.container = document.getElementById("modalContainer");

    if (!this.container) {
      this.container = document.createElement("div");
      this.container.id = "modalContainer";
      document.body.appendChild(this.container);
    }

    this.initialized = true;
  }

  static show(options = {}) {
    this.init();

    const config = {
      title: "",
      content: "",
      html: false,
      confirmText: "Confirm",
      cancelText: "Cancel",
      showCancel: true,
      showConfirm: true,
      onConfirm: null,
      onCancel: null,
      onClose: null,
      closeOnOverlay: true,
      ...options,
    };

    const id = ++this.idCounter;
    const modal = this.create(id, config);

    this.modals.set(id, {
      element: modal,
      config,
    });

    this.container.appendChild(modal);

    requestAnimationFrame(() => {
      modal.classList.add("show");
      const firstInput = modal.querySelector("input, textarea, button");
      if (firstInput) {
        firstInput.focus();
      }
    });

    return id;
  }

  static create(id, config) {
    const modal = document.createElement("div");
    modal.className = "modal-overlay";
    modal.setAttribute("data-id", id);

    const safeTitle = config.html ? config.title : this.escapeHtml(config.title);
    const safeContent = config.html ? config.content : this.escapeHtml(config.content);

    modal.innerHTML = `
      <div class="modal-dialog">
        <div class="modal-header">
          <h3 class="modal-title">${safeTitle}</h3>
          <button class="modal-close">&times;</button>
        </div>
        <div class="modal-body">
          ${safeContent}
        </div>
        <div class="modal-footer">
          ${config.showCancel ? `<button class="modal-btn modal-btn-cancel">${config.cancelText}</button>` : ""}
          ${config.showConfirm ? `<button class="modal-btn modal-btn-confirm">${config.confirmText}</button>` : ""}
        </div>
      </div>
    `;

    const dialog = modal.querySelector(".modal-dialog");
    const closeBtn = modal.querySelector(".modal-close");
    const cancelBtn = modal.querySelector(".modal-btn-cancel");
    const confirmBtn = modal.querySelector(".modal-btn-confirm");

    closeBtn?.addEventListener("click", () => this.close(id));

    cancelBtn?.addEventListener("click", () => {
      if (config.onCancel) {
        config.onCancel();
      }
      this.close(id);
    });

    confirmBtn?.addEventListener("click", () => {
      if (config.onConfirm) {
        config.onConfirm();
      }
      this.close(id);
    });

    if (config.closeOnOverlay) {
      modal.addEventListener("click", (e) => {
        if (e.target === modal) {
          this.close(id);
        }
      });
    }

    dialog.addEventListener("click", (e) => {
      e.stopPropagation();
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && this.modals.has(id)) {
        this.close(id);
      }
    });

    return modal;
  }

  static close(id) {
    const modalData = this.modals.get(id);
    if (!modalData) return;

    if (modalData.config.onClose) {
      modalData.config.onClose();
    }

    modalData.element.classList.add("hide");

    setTimeout(() => {
      modalData.element?.parentNode?.removeChild(modalData.element);
      this.modals.delete(id);
    }, 300);
  }

  static confirm(message, options = {}) {
    return new Promise((resolve) => {
      this.show({
        title: "Confirm",
        content: message,
        showCancel: true,
        showConfirm: true,
        onConfirm: () => resolve(true),
        onCancel: () => resolve(false),
        onClose: () => resolve(false),
        ...options,
      });
    });
  }

  static alert(message, options = {}) {
    return new Promise((resolve) => {
      this.show({
        title: "Alert",
        content: message,
        showCancel: false,
        showConfirm: true,
        confirmText: "OK",
        onConfirm: () => resolve(true),
        onClose: () => resolve(true),
        ...options,
      });
    });
  }

  static closeAll() {
    this.modals.forEach((_, id) => this.close(id));
  }

  static escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }
}
