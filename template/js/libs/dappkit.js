import { ethers } from "./ethers.min.js";

/* ============================================================
   CONFIG
   ============================================================ */

const NAMING_ABI = [
  {
    inputs: [{ internalType: "address", name: "addr", type: "address" }],
    name: "reverseResolve",
    outputs: [{ internalType: "string", name: "", type: "string" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "string", name: "name", type: "string" }],
    name: "resolve",
    outputs: [{ internalType: "address", name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
];
const WNS_CONTRACT_ADDRESS = "0x0000000000696760E15f265e828DB644A0c242EB";
const GNS_CONTRACT_ADDRESS = "0x9D51D507BC7264d4fE8Ad1cf7Fe191933A0a81d6";

const STORAGE_KEYS = {
  CHAIN_ID: "connectCurrentChainId",
  LAST_WALLET: "connectLastWallet",
  IS_CONNECTED: "connectConnected",
};
const TIMINGS = {
  NOTIFICATION_DURATION: 5000,
  NOTIFICATION_HIDE_DELAY: 400,
  TRANSACTION_REMOVE_DELAY: 5000,
  COPY_FEEDBACK_DURATION: 2000,
};
const PROVIDER_EVENTS = ["accountsChanged", "chainChanged", "disconnect"];
const CONNECT_STATE_KEYS = Object.values(STORAGE_KEYS);
const ENS_EMPTY_RESULT = { name: null, avatar: null };
const COPY_ICONS = {
  copy: `<svg class="copy-icon-svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>`,
  success: '<polyline points="20 6 9 17 4 12"/>',
  error:
    '<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>',
};

export const networkConfigs = {
  ethereum: {
    name: "Ethereum",
    rpcUrl: "https://ethereum-rpc.publicnode.com",
    chainId: 1,
    icon: "./assets/img/eth.png",
    explorerUrl: "https://etherscan.io/tx/",
    showInUI: true,
    rpcConfigurable: true,
  },
  arbitrum: {
    name: "Arbitrum",
    rpcUrl: "https://1rpc.io/arb",
    chainId: 42161,
    icon: "./assets/img/arb.png",
    explorerUrl: "https://arbiscan.io/tx/",
    showInUI: true,
    rpcConfigurable: false,
  },
  optimism: {
    name: "Optimism",
    rpcUrl: "https://mainnet.optimism.io",
    chainId: 10,
    icon: "./assets/img/op.png",
    explorerUrl: "https://optimistic.etherscan.io/tx/",
    showInUI: true,
    rpcConfigurable: false,
  },
  base: {
    name: "Base",
    rpcUrl: "https://base-rpc.publicnode.com",
    chainId: 8453,
    icon: "./assets/img/base.png",
    explorerUrl: "https://basescan.org/tx/",
    showInUI: true,
    rpcConfigurable: false,
  },
  zksync: {
    name: "ZKsync",
    rpcUrl: "https://mainnet.era.zksync.io",
    chainId: 324,
    icon: "./assets/img/zksync.png",
    explorerUrl: "https://explorer.zksync.io/tx/",
    showInUI: false,
    rpcConfigurable: false,
  },
  scroll: {
    name: "Scroll",
    rpcUrl: "https://rpc.scroll.io",
    chainId: 534352,
    icon: "./assets/img/scroll.png",
    explorerUrl: "https://scrollscan.com/tx/",
    showInUI: false,
    rpcConfigurable: false,
  },
  sepolia: {
    name: "Sepolia",
    rpcUrl: "https://rpc.sepolia.org",
    chainId: 11155111,
    icon: "./assets/img/sepolia.png",
    explorerUrl: "https://sepolia.etherscan.io/tx/",
    showInUI: false,
    rpcConfigurable: false,
  },
};

/* ============================================================
   UTILITIES
   ============================================================ */

const normalizeChainId = (chainId) => {
  if (typeof chainId === "string") chainId = chainId.trim();
  const parsed = Number(chainId);
  return Number.isFinite(parsed) ? parsed : NaN;
};
const chainIdToHex = (chainId) => {
  const n = normalizeChainId(chainId);
  return Number.isFinite(n) ? `0x${n.toString(16)}` : null;
};
const shortenMiddle = (value, s, e) =>
  value
    ? `${value.substring(0, s)}...${value.substring(value.length - e)}`
    : "";
const shortenAddress = (addr, s = 5, e = 4) => shortenMiddle(addr, s, e);
const shortenHash = (hash, s = 6, e = 4) => shortenMiddle(hash, s, e);
const escapeHtml = (text) => {
  const d = document.createElement("div");
  d.textContent = text;
  return d.innerHTML;
};
const getVisibleNetworks = () =>
  Object.entries(networkConfigs).filter(([, config]) => config.showInUI);
const getRpcConfigurableNetworks = () =>
  getVisibleNetworks().filter(([, config]) => config.rpcConfigurable);
const getNetworkByChainId = (chainId) =>
  Object.values(networkConfigs).find(
    (network) => network.chainId === normalizeChainId(chainId),
  );
const hasChainChanged = (prev, next) => {
  const n = normalizeChainId(next);
  return Number.isFinite(n) && n !== normalizeChainId(prev);
};
export const getRpcUrl = (network) =>
  localStorage.getItem(`${network}-rpc`) || networkConfigs[network].rpcUrl;
const getEthereumProvider = () =>
  new ethers.JsonRpcProvider(getRpcUrl("ethereum"));
const removeElementWithDelay = (el, delay, onRemove) => {
  el.classList.add("hide");
  setTimeout(() => {
    el?.parentNode?.removeChild(el);
    onRemove?.();
  }, delay);
};
const onReady = (cb) =>
  document.readyState === "loading"
    ? document.addEventListener("DOMContentLoaded", cb)
    : cb();

const notify = (message, type = "info", options = {}) => {
  if (
    typeof Notification === "undefined" ||
    typeof Notification.show !== "function"
  )
    return null;
  return Notification.show(message, type, options);
};

const openDropdowns = new Set();
class Dropdown {
  constructor(button, menu) {
    this.button = button;
    this.menu = menu;
    this.open = false;
    openDropdowns.add(this);
    button?.addEventListener("click", (event) => {
      event.stopPropagation();
      this.toggle();
    });
    menu?.addEventListener("click", (event) => event.stopPropagation());
    document.addEventListener("click", () => this.close());
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") this.close();
    });
  }
  toggle() {
    this.open ? this.close() : this.show();
  }
  show() {
    openDropdowns.forEach((dropdown) => {
      if (dropdown !== this) dropdown.close();
    });
    this.open = true;
    this.menu?.classList.add("show");
    this.button?.setAttribute("aria-expanded", "true");
  }
  close() {
    if (!this.open) return;
    this.open = false;
    this.menu?.classList.remove("show");
    this.button?.setAttribute("aria-expanded", "false");
  }
}

/* ============================================================
   COMPONENT: Copy
   Remove this block, its CSS section and `Copy.mount()` in app.js
   ============================================================ */

export class Copy {
  static initialized = false;
  static elements = new WeakSet();

  static mount() {
    if (this.initialized) return;
    this.initialized = true;
    document.addEventListener("click", this.handleClick.bind(this), true);
    this.observer = new MutationObserver((mutations) =>
      mutations.forEach((m) =>
        m.addedNodes.forEach((node) => {
          if (node.nodeType !== 1) return;
          if (node.matches?.("[data-copy]")) this.enhance(node);
          node
            .querySelectorAll?.("[data-copy]")
            ?.forEach((el) => this.enhance(el));
        }),
      ),
    );
    this.observer.observe(document.body, { childList: true, subtree: true });
    document.querySelectorAll("[data-copy]").forEach((el) => this.enhance(el));
  }

  static enhance(el) {
    if (this.elements.has(el)) return;
    el.title ||= "Click to copy";
    if (!el.querySelector(".copy-icon-svg"))
      el.insertAdjacentHTML("beforeend", COPY_ICONS.copy);
    this.elements.add(el);
  }

  static handleClick(e) {
    const el = e.target.closest("[data-copy]");
    if (!el) return;
    e.preventDefault();
    e.stopPropagation();
    this.copy(el.getAttribute("data-copy"), el);
  }

  static async copy(text, el) {
    const success = await navigator.clipboard
      .writeText(text)
      .then(() => true)
      .catch(() => false);
    if (!el) return success;
    const svg = el.querySelector("svg");
    if (!svg) return success;
    const [prevInner, prevTitle] = [svg.innerHTML, el.title];
    svg.innerHTML = success ? COPY_ICONS.success : COPY_ICONS.error;
    el.title = success ? "Copied!" : "Copy failed";
    el.classList.add(success ? "copy-success" : "copy-error");
    setTimeout(() => {
      svg.innerHTML = prevInner;
      el.title = prevTitle || "Click to copy";
      el.classList.remove("copy-success", "copy-error");
    }, TIMINGS.COPY_FEEDBACK_DURATION);
    return success;
  }

  static destroy() {
    this.observer?.disconnect();
    this.initialized = false;
  }
}

/* ============================================================
   COMPONENT: Notification
   Remove this block, its CSS section and the `<div id="notificationContainer">`
   ============================================================ */

export class Notification {
  static container = null;
  static notifications = new Map();
  static transactions = new Map();
  static idCounter = 0;
  static initialized = false;

  static init() {
    if (this.initialized) return;
    this.container =
      document.getElementById("notificationContainer") ||
      (() => {
        const el = document.createElement("div");
        el.id = "notificationContainer";
        document.body.appendChild(el);
        return el;
      })();
    this.initialized = true;
  }

  static show(message, type = "info", options = {}) {
    this.init();
    const config = {
      duration: TIMINGS.NOTIFICATION_DURATION,
      closable: true,
      showProgress: true,
      html: false,
      ...options,
    };
    const id = ++this.idCounter;
    const el = document.createElement("div");
    el.className = `notification ${type}`;
    el.setAttribute("data-id", id);
    const safeMessage = config.html ? message : escapeHtml(message);
    el.innerHTML = `<div class="notif-content"><div class="notif-message"><span>${safeMessage}</span></div>${config.closable ? `<button class="notif-close">&times;</button>` : ""}${config.showProgress && config.duration > 0 ? `<div class="progress-bar" style="animation-duration: ${config.duration}ms"></div>` : ""}</div>`;
    if (config.closable)
      el.querySelector(".notif-close").addEventListener("click", () =>
        this.hide(id),
      );
    this.notifications.set(id, { element: el, config, timeoutId: null });
    this.container.appendChild(el);
    requestAnimationFrame(() => el.classList.add("show"));
    if (config.duration > 0) this.scheduleHide(id, config.duration);
    return id;
  }

  static track(tx, options = {}) {
    this.init();
    const config = {
      label: "Transaction",
      onPending: null,
      onSuccess: null,
      onError: null,
      autoRemove: true,
      removeDelay: TIMINGS.TRANSACTION_REMOVE_DELAY,
      ...options,
    };
    const id = tx.hash;
    if (this.transactions.has(id)) return id;
    const chainId = Number(tx.chainId);
    const explorerUrl =
      getNetworkByChainId(chainId)?.explorerUrl ?? "https://etherscan.io/tx/";
    const el = document.createElement("div");
    el.className = "notification tx-notification pending";
    el.setAttribute("data-id", id);
    el.innerHTML = `<div class="notif-content"><div class="tx-icon"><div class="tx-spinner"></div></div><div class="tx-details"><div class="tx-label">${escapeHtml(config.label)}</div><div class="tx-hash"><a href="${explorerUrl}${tx.hash}" target="_blank" rel="noopener noreferrer">${shortenHash(tx.hash)}</a></div></div><div class="tx-status">Pending</div><button class="notif-close">&times;</button></div>`;
    el.querySelector(".notif-close").addEventListener("click", () =>
      this.removeTransaction(id),
    );
    this.transactions.set(id, { element: el, config, status: "pending", tx });
    this.container.appendChild(el);
    requestAnimationFrame(() => el.classList.add("show"));
    this.watchTransaction(id, config);
    return id;
  }

  static async watchTransaction(id, config) {
    const txData = this.transactions.get(id);
    if (!txData) return;
    try {
      config.onPending?.(txData.tx.hash);
      const receipt = await txData.tx.wait();
      if (!this.transactions.has(id)) return;
      const ok = receipt.status === 1;
      this.updateTransactionStatus(
        id,
        ok ? "success" : "failed",
        ok ? "Confirmed" : "Failed",
      );
      ok
        ? config.onSuccess?.(receipt)
        : config.onError?.(new Error("Transaction failed"));
    } catch (error) {
      if (this.transactions.has(id)) {
        this.updateTransactionStatus(id, "failed", "Failed");
        config.onError?.(error);
      }
    } finally {
      if (config.autoRemove && this.transactions.has(id))
        setTimeout(() => this.removeTransaction(id), config.removeDelay);
    }
  }

  static updateTransactionStatus(id, status, statusText) {
    const txData = this.transactions.get(id);
    if (!txData) return;
    txData.status = status;
    txData.element.classList.remove("pending", "success", "failed");
    txData.element.classList.add(status);
    const statusEl = txData.element.querySelector(".tx-status");
    if (statusEl) statusEl.textContent = statusText;
    if (status !== "pending")
      txData.element.querySelector(".tx-spinner")?.remove();
  }

  static removeTransaction(id) {
    const txData = this.transactions.get(id);
    if (txData)
      removeElementWithDelay(
        txData.element,
        TIMINGS.NOTIFICATION_HIDE_DELAY,
        () => this.transactions.delete(id),
      );
  }

  static hide(id) {
    const notif = this.notifications.get(id);
    if (!notif) return;
    if (notif.timeoutId) clearTimeout(notif.timeoutId);
    removeElementWithDelay(notif.element, TIMINGS.NOTIFICATION_HIDE_DELAY, () =>
      this.notifications.delete(id),
    );
  }

  static scheduleHide(id, delay) {
    const notif = this.notifications.get(id);
    if (notif) notif.timeoutId = setTimeout(() => this.hide(id), delay);
  }

  static clearTransactions() {
    this.transactions.forEach((_, id) => this.removeTransaction(id));
  }
  static clearAll() {
    this.notifications.forEach((_, id) => this.hide(id));
    this.transactions.forEach((_, id) => this.removeTransaction(id));
  }
}

/* ============================================================
   COMPONENT: Theme
   Remove this block, the settings theme segment, `Theme.mount()`
   and (optionally) the inline theme script in index.html
   ============================================================ */

export class Theme {
  static media = null;
  static buttons = [];
  static mounted = false;
  static modes = ["system", "light", "dark"];

  static mount() {
    if (this.mounted) return this;
    this.mounted = true;
    this.media = matchMedia("(prefers-color-scheme: dark)");
    this.buttons = [...document.querySelectorAll("[data-theme-mode]")];
    this.buttons.forEach((button) => {
      button.addEventListener("click", () =>
        this.set(button.dataset.themeMode),
      );
    });
    this.media.addEventListener("change", () => {
      if (this.get() === "system") this.apply();
    });
    this.apply();
    return this;
  }

  static get() {
    return localStorage.themeMode || "system";
  }

  static set(mode) {
    if (!this.modes.includes(mode)) return;
    localStorage.themeMode = mode;
    this.apply();
  }

  static cycle() {
    this.set(
      this.modes[(this.modes.indexOf(this.get()) + 1) % this.modes.length],
    );
  }

  static apply() {
    const mode = this.get();
    const prefersDark = this.media
      ? this.media.matches
      : matchMedia("(prefers-color-scheme: dark)").matches;
    const resolved = mode === "system" ? (prefersDark ? "dark" : "light") : mode;
    Object.assign(document.documentElement.dataset, {
      theme: resolved,
      themeSource: mode,
      selectedTheme: mode === "system" ? "" : mode,
    });
    this.buttons.forEach((button) => {
      const active = button.dataset.themeMode === mode;
      button.classList.toggle("active", active);
      button.setAttribute("aria-checked", String(active));
    });
  }
}

/* ============================================================
   COMPONENT: ChainSelect
   Remove this block, the chain dropdown HTML, its CSS section
   and `ChainSelect.mount(wallet)` in app.js
   ============================================================ */

export class ChainSelect {
  static wallet = null;
  static button = null;
  static icon = null;
  static label = null;
  static menu = null;
  static dropdown = null;

  static mount(wallet) {
    this.wallet = wallet;
    this.button = document.querySelector("#chain-btn");
    this.icon = document.querySelector("#chain-btn-icon");
    this.label = document.querySelector("#chain-btn-label");
    this.menu = document.querySelector("#chain-menu");
    if (!this.button || !this.menu) return this;
    this.dropdown = new Dropdown(this.button, this.menu);
    this.render();
    wallet.subscribe(() => this.render());
    return this;
  }

  static render() {
    if (!this.wallet || !this.menu) return;
    const networks = this.wallet.getVisibleNetworks();
    const currentChainId = normalizeChainId(this.wallet.getCurrentChainId());
    const current =
      networks.find(([, config]) => config.chainId === currentChainId) ||
      networks[0];

    if (current) {
      if (this.icon) {
        this.icon.src = current[1].icon;
        this.icon.alt = current[1].name;
      }
      if (this.label) this.label.textContent = current[1].name;
    }

    this.menu.innerHTML = "";
    networks.forEach(([, config]) => {
      const active = config.chainId === currentChainId;
      const button = document.createElement("button");
      button.type = "button";
      button.className = "dk-menu-item dk-chain-item";
      button.setAttribute("role", "option");
      button.setAttribute("aria-selected", String(active));
      button.classList.toggle("active", active);
      button.innerHTML = `<img src="${config.icon}" alt="" /><span class="dk-item-label">${escapeHtml(config.name)}</span><span class="dk-dot" aria-hidden="true"></span>`;
      button.addEventListener("click", async () => {
        this.dropdown?.close();
        if (active) return;
        if (!this.wallet.isConnected()) {
          notify("Connect a wallet to switch networks.", "warning");
          return;
        }
        try {
          await this.wallet.switchNetwork(config);
        } catch (error) {
          notify(
            error?.message || `Failed to switch to ${config.name}`,
            "error",
          );
        }
      });
      this.menu.appendChild(button);
    });
  }
}

/* ============================================================
   COMPONENT: WalletConnect
   Remove this block, the connect dropdown HTML, its CSS section
   and `WalletConnect.mount(wallet)` in app.js
   ============================================================ */

export class WalletConnect {
  static wallet = null;
  static button = null;
  static menu = null;
  static list = null;
  static getWallet = null;
  static copyBtn = null;
  static disconnectBtn = null;
  static dropdown = null;
  static resolveToken = 0;
  static cache = new Map()

  static mount(wallet) {
    this.wallet = wallet;
    this.button = document.querySelector("#connect-btn");
    this.menu = document.querySelector("#connect-menu");
    this.list = document.querySelector("#connect-wallet-list");
    this.getWallet = document.querySelector("#connect-get-wallet");
    this.copyBtn = document.querySelector("#copy-address-btn");
    this.disconnectBtn = document.querySelector("#disconnect-btn");
    if (!this.button || !this.menu) return this;
    this.dropdown = new Dropdown(this.button, this.menu);
    this.disconnectBtn?.addEventListener("click", async () => {
      this.dropdown?.close();
      await wallet.disconnect();
    });
    this.render();
    wallet.subscribe(() => this.render());
    return this;
  }

  static render() {
    if (!this.wallet) return;
    const connected = this.wallet.isConnected() && this.wallet.getAddress();
    this.renderButton(connected);
    this.renderWallets(connected);
    this.renderActions(connected);
  }

  static paintName(resolved) {
    const avatar = resolved.avatar
      ? `<img src="${resolved.avatar}" alt="" />`
      : "";
    this.button.innerHTML = `<span class="resolved-name">${escapeHtml(resolved.name)}</span>${avatar}`;
    this.button.classList.add("name-resolved");
    this.button.setAttribute("data-resolution-source", resolved.source);
  }

  static renderButton(connected) {
    const button = this.button;
    if (!button) return;

    if (!connected) {
      this.resolveToken++;
      button.innerHTML = `<span class="dk-connect-label">Connect</span>`;
      button.classList.remove("connected", "name-resolved");
      button.removeAttribute("data-address");
      button.removeAttribute("data-resolution-source");
      return;
    }

    const address = this.wallet.getAddress();
    const key = address.toLowerCase();
    button.classList.add("connected");
    button.setAttribute("data-address", address);

    if (this.cache.has(key)) {
      const cached = this.cache.get(key);
      if (cached?.name) {
        this.paintName(cached);
      } else {
        button.innerHTML = `<span class="dk-connect-label">${shortenAddress(address)}</span>`;
        button.classList.remove("name-resolved");
        button.removeAttribute("data-resolution-source");
      }
      return;
    }

    button.innerHTML = `<span class="dk-connect-label">${shortenAddress(address)}</span>`;
    button.classList.remove("name-resolved");
    button.removeAttribute("data-resolution-source");

    const token = ++this.resolveToken;
    this.wallet
      .resolveName(address)
      .then((resolved) => {
        this.cache.set(key, resolved || { name: null });
        if (
          !resolved?.name ||
          token !== this.resolveToken ||
          this.wallet.getAddress() !== address
        )
          return;
        this.paintName(resolved);
      })
      .catch(() => {});
  }

  static renderWallets(connected) {
    if (!this.list) return;
    this.list.innerHTML = "";
    const providers = this.wallet.getProviders();
    providers.forEach((provider) => {
      const active =
        connected && provider.info.name === this.wallet.getLastWallet();
      const button = document.createElement("button");
      button.type = "button";
      button.className = "dk-menu-item dk-wallet-item";
      button.classList.toggle("active", active);
      button.setAttribute("role", "menuitem");
      button.innerHTML = `<img src="${provider.info.icon}" alt="" /><span class="dk-item-label">${escapeHtml(provider.info.name)}</span><span class="dk-dot" aria-hidden="true"></span>`;
      button.querySelector(".dk-dot").style.display = active
        ? "block"
        : "none";
      button.addEventListener("click", async () => {
        this.dropdown?.close();
        if (active) return;
        try {
          await this.wallet.connectWallet(provider.info.name);
        } catch (error) {
          notify(error?.message || "Failed to connect wallet.", "error");
        }
      });
      this.list.appendChild(button);
    });
    if (this.getWallet)
      this.getWallet.style.display = providers.length ? "none" : "block";
  }

  static renderActions(connected) {
    const address = this.wallet.getAddress();
    if (this.copyBtn) {
      this.copyBtn.hidden = !connected;
      if (connected && address) {
        this.copyBtn.setAttribute("data-copy", address);
        if (typeof Copy !== "undefined" && Copy?.enhance)
          Copy.enhance(this.copyBtn);
      } else {
        this.copyBtn.removeAttribute("data-copy");
      }
    }
    if (this.disconnectBtn) this.disconnectBtn.hidden = !connected;
  }
}

/* ============================================================
   COMPONENT: Settings
   Remove this block, the settings dropdown HTML, its CSS section
   and `Settings.mount()` in app.js
   ============================================================ */

   export class Settings {
     static button = null;
     static menu = null;
     static inputs = null;
     static dropdown = null;
     static toggle = null;
     static panel = null;

     static mount() {
       this.button = document.querySelector("#settings-btn");
       this.menu = document.querySelector("#settings-menu");
       this.inputs = document.querySelector("#rpc-inputs");
       this.toggle = document.querySelector("#rpc-toggle");
       this.panel = document.querySelector("#rpc-panel");
       if (!this.button || !this.menu) return this;
       this.dropdown = new Dropdown(this.button, this.menu);
       this.renderRpcInputs();
       this.toggle?.addEventListener("click", () =>
         this.setRpcOpen(!this.panel.classList.contains("open")),
       );
       this.setRpcOpen(false);
       document
         .getElementById("save-rpc-btn")
         ?.addEventListener("click", () => this.saveRpc());
       return this;
     }

     static setRpcOpen(open) {
       if (!this.panel || !this.toggle) return;
       this.panel.classList.toggle("open", open);
       this.panel.inert = !open;
       this.toggle.setAttribute("aria-expanded", String(open));
     }

     static renderRpcInputs() {
       if (!this.inputs) return;
       this.inputs.innerHTML = "";
       getRpcConfigurableNetworks().forEach(([network, config]) => {
         const field = document.createElement("div");
         const label = document.createElement("label");
         label.textContent = config.name;
         label.htmlFor = `${network}-rpc`;
         const input = Object.assign(document.createElement("input"), {
           id: `${network}-rpc`,
           type: "url",
           placeholder: "Enter custom RPC URL",
           value: localStorage.getItem(`${network}-rpc`) || "",
         });
         field.append(label, input);
         this.inputs.appendChild(field);
       });
     }

     static saveRpc() {
       getRpcConfigurableNetworks().forEach(([network]) => {
         const input = document.getElementById(`${network}-rpc`);
         if (!input) return;
         input.value.trim()
           ? localStorage.setItem(`${network}-rpc`, input.value.trim())
           : localStorage.removeItem(`${network}-rpc`);
       });
       this.dropdown?.close();
       this.setRpcOpen(false);
       notify("RPC settings saved.", "success");
     }
   }

/* ============================================================
   CORE: ConnectWallet (headless)
   No DOM here. UI components above subscribe to state changes.
   ============================================================ */

export class ConnectWallet {
  constructor(options = {}) {
    this.networkConfigs = options.networkConfigs || networkConfigs;
    this.providers = [];
    this.storage = options.storage || window.localStorage;
    this.currentProvider = null;
    this.providerListeners = null;
    this.autoConnect = options.autoConnect !== false;
    this.nameResolutionOrder = options.nameResolutionOrder || [
      "ens",
      "gns",
      "wns",
    ];
    this.showUnsupportedNetworkNotification =
      options.showUnsupportedNetworkNotification !== false;
    this.unsupportedNetworkNotificationId = null;
    this.address = null;
    this.stateListeners = new Set();

    const networks = Object.values(this.networkConfigs);
    this.chainIdToName = Object.fromEntries(
      networks.map((config) => [config.chainId, config.name]),
    );
    this.allowedChains = networks
      .filter((config) => config.showInUI)
      .map((config) => config.chainId);

    onReady(() => this.init());
  }

  init() {
    this.bindEvents();
    this.requestProviders();
    this.initializing = true;
    this.restoreState();
    this.emitState();
    setTimeout(async () => {
      await this.verifyConnectionState({
        allowUiDisconnect: true,
        retries: 2,
        retryDelayMs: 500,
      });
      this.initializing = false;
      this.emitState();
    }, 300);
  }

  isAllowed(chainId) {
    return this.allowedChains.includes(normalizeChainId(chainId));
  }

  bindEvents() {
    window.addEventListener("eip6963:announceProvider", (event) =>
      this.handleProviderAnnounce(event),
    );
    const onVisible = () =>
      setTimeout(
        () =>
          this.verifyConnectionState({
            allowUiDisconnect: true,
            retries: 2,
            retryDelayMs: 500,
          }),
        300,
      );
    window.addEventListener("focus", onVisible);
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible") onVisible();
    });
  }

  subscribe(listener) {
    this.stateListeners.add(listener);
    return () => this.stateListeners.delete(listener);
  }

  emitState() {
    this.stateListeners.forEach((listener) => {
      try {
        listener(this);
      } catch (error) {
        console.error(error);
      }
    });
  }

  requestProviders() {
    window.dispatchEvent(new Event("eip6963:requestProvider"));
  }

  setStorageState(key, value) {
    value === null || value === undefined || value === ""
      ? this.storage.removeItem(key)
      : this.storage.setItem(key, value);
  }

  handleProviderAnnounce({ detail }) {
    if (this.providers.some((p) => p.info.name === detail.info.name)) return;
    this.providers.push(detail);
    this.emitState();
    if (this.isConnected() && this.getLastWallet() === detail.info.name)
      this.syncConnectedProviderState(detail);
    else if (this.autoConnect && !this.isConnected())
      this.connectWallet(detail.info.name).catch(() => {});
  }

  requestProviderState(provider, method = "eth_accounts") {
    return Promise.all([
      provider.request({ method }),
      provider.request({ method: "eth_chainId" }),
    ]);
  }

  async connectWallet(name) {
    const provider = this.getProviderDetail(name);
    if (!provider) return;
    try {
      const [accounts, chainId] = await this.requestProviderState(
        provider.provider,
        "eth_requestAccounts",
      );
      this.setupProviderEvents(provider);
      this.applyConnectedState({
        accounts,
        chainId,
        providerName: provider.info.name,
      });
      this.onConnectCallback?.({
        accounts,
        chainId,
        provider: provider.info.name,
      });
      return { accounts, chainId, provider: provider.provider };
    } catch (error) {
      console.error("Connection failed:", error);
      throw error;
    }
  }

  setupProviderEvents(provider) {
    if (this.currentProvider === provider.provider) return;
    this.removeProviderEvents();
    this.currentProvider = provider.provider;
    const recover = () =>
      this.verifyConnectionState({ allowUiDisconnect: true, retries: 2 });
    this.providerListeners = {
      accountsChanged: (accounts) =>
        accounts.length > 0 ? this.updateAddress(accounts[0]) : recover(),
      chainChanged: (chainId) => this.handleChainChanged(chainId),
      disconnect: recover,
    };
    if (typeof this.currentProvider?.on !== "function") return;
    PROVIDER_EVENTS.forEach((event) =>
      this.currentProvider.on(event, this.providerListeners[event]),
    );
  }

  removeProviderEvents() {
    if (!this.currentProvider || !this.providerListeners) return;
    if (typeof this.currentProvider.removeListener === "function") {
      PROVIDER_EVENTS.forEach((event) =>
        this.currentProvider.removeListener(
          event,
          this.providerListeners[event],
        ),
      );
    } else {
      this.currentProvider.removeAllListeners?.();
    }
  }

  async syncConnectedProviderState(providerDetail) {
    if (!providerDetail?.provider) return;
    this.setupProviderEvents(providerDetail);
    try {
      const [accounts, chainId] = await this.requestProviderState(
        providerDetail.provider,
      );
      this.applyConnectedState({
        accounts,
        chainId,
        providerName: providerDetail.info.name,
      });
    } catch {
      this.emitState();
    }
  }

  applyDisconnectedState() {
    const hadState =
      this.storage.getItem(STORAGE_KEYS.IS_CONNECTED) === "true" ||
      Boolean(this.getLastWallet()) ||
      Boolean(this.getCurrentChainId());
    if (!hadState) return;
    this.removeProviderEvents();
    this.currentProvider = null;
    this.providerListeners = null;
    this.address = null;
    CONNECT_STATE_KEYS.forEach((key) => this.storage.removeItem(key));
    this.hideUnsupportedNetworkNotice();
    this.onDisconnectCallback?.();
    this.emitState();
  }

  async verifyConnectionState({
    allowUiDisconnect = false,
    retries = 0,
    retryDelayMs = 250,
  } = {}) {
    const provider = this.currentProvider || this.getConnectedProvider();
    if (!provider) return;
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const [accounts, chainId] = await this.requestProviderState(provider);
        if (Array.isArray(accounts) && accounts.length > 0) {
          const prevChainId = this.getCurrentChainId();
          this.applyConnectedState({
            accounts,
            chainId,
            providerName: this.getLastWallet(),
          });
          if (hasChainChanged(prevChainId, chainId))
            this.emitChainChange(chainId);
          this.emitState();
          return;
        }
      } catch {}
      if (attempt < retries) {
        await new Promise((resolve) => setTimeout(resolve, retryDelayMs));
        continue;
      }
      if (allowUiDisconnect) this.applyDisconnectedState();
    }
  }

  handleChainChanged(chainId) {
    const prev = this.getCurrentChainId();
    this.updateNetworkStatus(chainId);
    this.syncUnsupportedNetworkNotice(chainId);
    if (hasChainChanged(prev, chainId)) this.emitChainChange(chainId);
    this.emitState();
  }

  emitChainChange(chainId) {
    if (!this.onChainChangeCallback) return;
    const normalized = normalizeChainId(chainId);
    this.onChainChangeCallback({
      chainId: normalized,
      hexChainId: chainIdToHex(normalized),
      name: this.chainIdToName[normalized] || `Unknown (${chainId})`,
      allowed: this.isAllowed(chainId),
    });
  }

  applyConnectedState({ accounts, chainId, providerName }) {
    const account = Array.isArray(accounts) ? accounts[0] : null;
    if (!account) return;
    this.address = account;
    this.setStorageState(STORAGE_KEYS.IS_CONNECTED, "true");
    this.setStorageState(STORAGE_KEYS.LAST_WALLET, providerName);
    this.updateNetworkStatus(chainId);
    this.syncUnsupportedNetworkNotice(chainId);
    this.emitState();
  }

  showUnsupportedNetworkNotice() {
    if (!this.showUnsupportedNetworkNotification || this.initializing) return;
    this.hideUnsupportedNetworkNotice();
    this.unsupportedNetworkNotificationId = notify(
      "Please switch to a supported network.",
      "error",
      { duration: 0 },
    );
  }

  hideUnsupportedNetworkNotice() {
    if (!this.unsupportedNetworkNotificationId) return;
    if (
      typeof Notification !== "undefined" &&
      typeof Notification.hide === "function"
    )
      Notification.hide(this.unsupportedNetworkNotificationId);
    this.unsupportedNetworkNotificationId = null;
  }

  syncUnsupportedNetworkNotice(chainId) {
    const normalized = normalizeChainId(chainId);
    if (!Number.isFinite(normalized)) return;
    this.isAllowed(normalized)
      ? this.hideUnsupportedNetworkNotice()
      : this.showUnsupportedNetworkNotice();
  }

  updateAddress(address) {
    this.address = address;
    this.emitState();
  }

  async resolveWNS(address) {
    return this.resolveNamedContract(address, WNS_CONTRACT_ADDRESS);
  }

  async resolveGNS(address) {
    return this.resolveNamedContract(address, GNS_CONTRACT_ADDRESS, ".gwei");
  }

  async resolveNamedContract(address, contractAddress, suffix) {
    try {
      const name = await new ethers.Contract(
        contractAddress,
        NAMING_ABI,
        getEthereumProvider(),
      ).reverseResolve(address);
      if (!name) return null;
      return suffix && !name.endsWith(suffix) ? `${name}${suffix}` : name;
    } catch {
      return null;
    }
  }

  async resolveENS(address) {
    try {
      const provider = getEthereumProvider();
      const ensName = await provider.lookupAddress(address);
      if (!ensName) return ENS_EMPTY_RESULT;
      return { name: ensName, avatar: await provider.getAvatar(ensName) };
    } catch {
      return ENS_EMPTY_RESULT;
    }
  }

  async resolveOrdered(address) {
    const resolvers = {
      wns: async () => {
        const name = await this.resolveWNS(address);
        return name ? { name, avatar: null, source: "wns" } : null;
      },
      gns: async () => {
        const name = await this.resolveGNS(address);
        return name ? { name, avatar: null, source: "gns" } : null;
      },
      ens: async () => {
        const { name, avatar } = await this.resolveENS(address);
        return name ? { name, avatar, source: "ens" } : null;
      },
    };
    for (const source of this.nameResolutionOrder) {
      const resolved = await resolvers[source]();
      if (resolved) return resolved;
    }
    return null;
  }

  async resolveName(address) {
    if (!address) return null;
    try {
      return await this.resolveOrdered(address);
    } catch {
      return null;
    }
  }

  async switchNetwork(networkConfig) {
    const provider = this.getConnectedProvider();
    if (!provider) return false;
    try {
      await provider.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: chainIdToHex(networkConfig.chainId) }],
      });
      this.updateNetworkStatus(networkConfig.chainId);
      this.emitState();
      return true;
    } catch (error) {
      console.error("Network switch failed:", error);
      throw error;
    }
  }

  updateNetworkStatus(chainId) {
    const normalized = normalizeChainId(chainId);
    if (Number.isFinite(normalized))
      this.setStorageState(STORAGE_KEYS.CHAIN_ID, chainIdToHex(normalized));
  }

  async disconnect() {
    try {
      await this.getConnectedProvider()?.request({
        method: "wallet_revokePermissions",
        params: [{ eth_accounts: {} }],
      });
    } catch (error) {
      console.error("Disconnect failed:", error);
    }
    this.applyDisconnectedState();
  }

  restoreState() {
    const storedChainId =
      this.getCurrentChainId() ||
      chainIdToHex(this.networkConfigs.ethereum.chainId);
    this.updateNetworkStatus(storedChainId);
    this.syncUnsupportedNetworkNotice(storedChainId);
    const providerDetail =
      this.isConnected() && this.getProviderDetail(this.getLastWallet());
    if (providerDetail) this.syncConnectedProviderState(providerDetail);
  }

  isConnected() {
    return this.storage.getItem(STORAGE_KEYS.IS_CONNECTED) === "true";
  }
  getCurrentChainId() {
    return this.storage.getItem(STORAGE_KEYS.CHAIN_ID);
  }
  getLastWallet() {
    return this.storage.getItem(STORAGE_KEYS.LAST_WALLET);
  }
  getAddress() {
    return this.address;
  }
  getProviders() {
    return this.providers;
  }
  getVisibleNetworks() {
    return Object.entries(this.networkConfigs).filter(
      ([, config]) => config.showInUI,
    );
  }
  getProviderDetail(name) {
    return name
      ? this.providers.find((p) => p.info.name === name) || null
      : null;
  }
  getConnectedProvider() {
    return this.getProviderDetail(this.getLastWallet())?.provider;
  }

  async getAccount() {
    try {
      const accounts = await this.getConnectedProvider()?.request({
        method: "eth_accounts",
      });
      return accounts?.[0] || null;
    } catch (error) {
      console.error("Failed to get account:", error);
      return null;
    }
  }

  async getChainId() {
    try {
      return normalizeChainId(
        await this.getConnectedProvider()?.request({ method: "eth_chainId" }),
      );
    } catch (error) {
      console.error("Failed to get chain ID:", error);
      return null;
    }
  }

  getProvider() {
    return this.getConnectedProvider();
  }
  getEthersProvider() {
    const provider = this.getConnectedProvider();
    return provider ? new ethers.BrowserProvider(provider) : null;
  }
  getShortAddr(address) {
    return address ? shortenAddress(address) : "";
  }
  async getResolvedName(address) {
    if (!address) return "";
    try {
      const resolved = await this.resolveOrdered(address);
      if (resolved?.name) return resolved.name;
    } catch {}
    return this.getShortAddr(address);
  }
  onConnect(cb) {
    this.onConnectCallback = cb;
  }
  onDisconnect(cb) {
    this.onDisconnectCallback = cb;
  }
  onChainChange(cb) {
    this.onChainChangeCallback = cb;
  }

  setNameResolutionOrder(order) {
    if (!Array.isArray(order) || order.length === 0) {
      console.warn(
        "Invalid name resolution order. Pass an array like ['ens', 'gns', 'wns']",
      );
      return;
    }
    this.nameResolutionOrder = order;
    if (this.isConnected()) this.emitState();
  }

  getNameResolutionOrder() {
    return this.nameResolutionOrder;
  }
}
