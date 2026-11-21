
import { ethers } from "./ethers.min.js";

/* ============================================================
   CONFIG
   ============================================================ */

const NAMING_ABI = [
  "function reverseResolve(address addr) view returns (string)",
];
const WNS_CONTRACT_ADDRESS = "0x0000000000696760E15f265e828DB644A0c242EB";
const GNS_CONTRACT_ADDRESS = "0x9D51D507BC7264d4fE8Ad1cf7Fe191933A0a81d6";

const STORAGE_KEYS = {
  CHAIN_ID: "connectCurrentChainId",
  LAST_WALLET: "connectLastWallet",
  IS_CONNECTED: "connectConnected",
};
const CONNECT_STATE_KEYS = Object.values(STORAGE_KEYS);
const TIMINGS = {
  NOTIFICATION_DURATION: 5000,
  NOTIFICATION_HIDE_DELAY: 400,
  TRANSACTION_REMOVE_DELAY: 5000,
  COPY_FEEDBACK_DURATION: 2000,
};
const EMPTY_NAME = { name: null, avatar: null };

const COPY_ICONS = {
  copy: '<rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>',
  success: '<polyline points="20 6 9 17 4 12"/>',
  error:
    '<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>',
};
const COPY_SVG = `<svg class="copy-icon-svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${COPY_ICONS.copy}</svg>`;

const network = (config) => ({
  showInUI: false,
  rpcConfigurable: false,
  ...config,
});

export const networkConfigs = {
  ethereum: network({
    name: "Ethereum",
    rpcUrl: "https://ethereum-rpc.publicnode.com",
    chainId: 1,
    icon: "./assets/img/eth.png",
    explorerUrl: "https://etherscan.io/tx/",
    showInUI: true,
    rpcConfigurable: true,
  }),
  arbitrum: network({
    name: "Arbitrum",
    rpcUrl: "https://1rpc.io/arb",
    chainId: 42161,
    icon: "./assets/img/arb.png",
    explorerUrl: "https://arbiscan.io/tx/",
    showInUI: true,
  }),
  optimism: network({
    name: "Optimism",
    rpcUrl: "https://mainnet.optimism.io",
    chainId: 10,
    icon: "./assets/img/op.png",
    explorerUrl: "https://optimistic.etherscan.io/tx/",
    showInUI: true,
  }),
  base: network({
    name: "Base",
    rpcUrl: "https://base-rpc.publicnode.com",
    chainId: 8453,
    icon: "./assets/img/base.png",
    explorerUrl: "https://basescan.org/tx/",
    showInUI: true,
  }),
  zksync: network({
    name: "ZKsync",
    rpcUrl: "https://mainnet.era.zksync.io",
    chainId: 324,
    icon: "./assets/img/zksync.png",
    explorerUrl: "https://explorer.zksync.io/tx/",
  }),
  scroll: network({
    name: "Scroll",
    rpcUrl: "https://rpc.scroll.io",
    chainId: 534352,
    icon: "./assets/img/scroll.png",
    explorerUrl: "https://scrollscan.com/tx/",
  }),
  sepolia: network({
    name: "Sepolia",
    rpcUrl: "https://rpc.sepolia.org",
    chainId: 11155111,
    icon: "./assets/img/sepolia.png",
    explorerUrl: "https://sepolia.etherscan.io/tx/",
  }),
};

/* ============================================================
   UTILITIES
   ============================================================ */

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const create = (tag, props = {}, ...children) => {
  const el = Object.assign(document.createElement(tag), props);
  el.append(...children);
  return el;
};

const escapeHtml = (text) => create("div", { textContent: text }).innerHTML;

const normalizeChainId = (chainId) => {
  const n = Number(chainId);
  return Number.isFinite(n) ? n : NaN;
};
const chainIdToHex = (chainId) => {
  const n = normalizeChainId(chainId);
  return Number.isFinite(n) ? `0x${n.toString(16)}` : null;
};
const hasChainChanged = (prev, next) => {
  const n = normalizeChainId(next);
  return Number.isFinite(n) && n !== normalizeChainId(prev);
};

const shorten = (value, start, end) =>
  value ? `${value.substring(0, start)}...${value.substring(value.length - end)}` : "";
const shortenAddress = (addr) => shorten(addr, 5, 4);
const shortenHash = (hash) => shorten(hash, 6, 4);

const getVisibleNetworks = (configs = networkConfigs) =>
  Object.entries(configs).filter(([, config]) => config.showInUI);
const getRpcConfigurableNetworks = () =>
  getVisibleNetworks().filter(([, config]) => config.rpcConfigurable);
const getNetworkByChainId = (chainId) =>
  Object.values(networkConfigs).find(
    (n) => n.chainId === normalizeChainId(chainId),
  );

export const getRpcUrl = (name) =>
  localStorage.getItem(`${name}-rpc`) || networkConfigs[name].rpcUrl;
const getEthereumProvider = () =>
  new ethers.JsonRpcProvider(getRpcUrl("ethereum"));

const removeElementWithDelay = (el, delay, onRemove) => {
  el.classList.add("hide");
  setTimeout(() => {
    el.remove();
    onRemove?.();
  }, delay);
};
const onReady = (cb) =>
  document.readyState === "loading"
    ? document.addEventListener("DOMContentLoaded", cb)
    : cb();

// Safe no-op if the Notification component is removed (falls back to the browser global).
const notify = (message, type, options) =>
  Notification.show?.(message, type, options);

/* ============================================================
   SHARED UI: Dropdown + menu item
   ============================================================ */

const dropdowns = new Set();
const closeAllDropdowns = (except) =>
  dropdowns.forEach((d) => d !== except && d.close());
document.addEventListener("click", () => closeAllDropdowns());
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") closeAllDropdowns();
});

class Dropdown {
  constructor(button, menu) {
    this.button = button;
    this.menu = menu;
    this.open = false;
    dropdowns.add(this);
    button?.addEventListener("click", (e) => {
      e.stopPropagation();
      this.open ? this.close() : this.show();
    });
    menu?.addEventListener("click", (e) => e.stopPropagation());
  }
  show() {
    closeAllDropdowns(this);
    this.#set(true);
  }
  close() {
    if (this.open) this.#set(false);
  }
  #set(open) {
    this.open = open;
    this.menu?.classList.toggle("show", open);
    this.button?.setAttribute("aria-expanded", String(open));
  }
}

// Icon + label + status dot; closes the dropdown, skips if active, reports errors.
const menuItem = ({ kind, role, icon, label, active, dropdown, action, errorMessage }) => {
  const item = create(
    "button",
    {
      type: "button",
      className: `dk-menu-item dk-${kind}-item`,
      onclick: async () => {
        dropdown?.close();
        if (active) return;
        try {
          await action();
        } catch (error) {
          notify(error?.message || errorMessage, "error");
        }
      },
    },
    create("img", { src: icon, alt: "" }),
    create("span", { className: "dk-item-label", textContent: label }),
    create("span", { className: "dk-dot" }),
  );
  item.classList.toggle("active", active);
  item.setAttribute("role", role);
  if (role === "option") item.setAttribute("aria-selected", String(active));
  return item;
};

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
    document.addEventListener("click", (e) => this.handleClick(e), true);
    this.observer = new MutationObserver((mutations) =>
      mutations.forEach((m) =>
        m.addedNodes.forEach((node) => {
          if (node.nodeType !== 1) return;
          if (node.matches("[data-copy]")) this.enhance(node);
          node.querySelectorAll("[data-copy]").forEach((el) => this.enhance(el));
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
      el.insertAdjacentHTML("beforeend", COPY_SVG);
    this.elements.add(el);
  }

  static handleClick(e) {
    const el = e.target.closest("[data-copy]");
    if (!el) return;
    e.preventDefault();
    e.stopPropagation();
    this.copy(el.dataset.copy, el);
  }

  static async copy(text, el) {
    const success = await navigator.clipboard
      .writeText(text)
      .then(() => true)
      .catch(() => false);
    const svg = el?.querySelector("svg");
    if (!svg) return success;
    const prevTitle = el.title;
    const state = success ? "success" : "error";
    svg.innerHTML = COPY_ICONS[state];
    el.title = success ? "Copied!" : "Copy failed";
    el.classList.add(`copy-${state}`);
    setTimeout(() => {
      svg.innerHTML = COPY_ICONS.copy;
      el.title = prevTitle || "Click to copy";
      el.classList.remove(`copy-${state}`);
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

const CLOSE_BUTTON = '<button class="notif-close">&times;</button>';

export class Notification {
  static container = null;
  static notifications = new Map();
  static transactions = new Map();
  static idCounter = 0;

  static init() {
    this.container ??=
      document.getElementById("notificationContainer") ||
      document.body.appendChild(create("div", { id: "notificationContainer" }));
  }

  // Create, append and animate in a notification element.
  static render(className, id, html) {
    this.init();
    const el = create("div", { className, innerHTML: html });
    el.dataset.id = id;
    this.container.appendChild(el);
    requestAnimationFrame(() => el.classList.add("show"));
    return el;
  }

  static show(message, type = "info", options = {}) {
    const { duration, closable, showProgress, html } = {
      duration: TIMINGS.NOTIFICATION_DURATION,
      closable: true,
      showProgress: true,
      html: false,
      ...options,
    };
    const id = ++this.idCounter;
    const progress =
      showProgress && duration > 0
        ? `<div class="progress-bar" style="animation-duration: ${duration}ms"></div>`
        : "";
    const el = this.render(
      `notification ${type}`,
      id,
      `<div class="notif-content"><div class="notif-message"><span>${html ? message : escapeHtml(message)}</span></div>${closable ? CLOSE_BUTTON : ""}${progress}</div>`,
    );
    el.querySelector(".notif-close")?.addEventListener("click", () => this.hide(id));
    this.notifications.set(id, {
      element: el,
      timeoutId: duration > 0 ? setTimeout(() => this.hide(id), duration) : null,
    });
    return id;
  }

  static hide(id) {
    const notif = this.notifications.get(id);
    if (!notif) return;
    clearTimeout(notif.timeoutId);
    removeElementWithDelay(notif.element, TIMINGS.NOTIFICATION_HIDE_DELAY, () =>
      this.notifications.delete(id),
    );
  }

  static track(tx, options = {}) {
    const id = tx.hash;
    if (this.transactions.has(id)) return id;
    const config = {
      label: "Transaction",
      onPending: null,
      onSuccess: null,
      onError: null,
      autoRemove: true,
      removeDelay: TIMINGS.TRANSACTION_REMOVE_DELAY,
      ...options,
    };
    const explorerUrl =
      getNetworkByChainId(tx.chainId)?.explorerUrl ?? "https://etherscan.io/tx/";
    const el = this.render(
      "notification tx-notification pending",
      id,
      `<div class="notif-content"><div class="tx-icon"><div class="tx-spinner"></div></div><div class="tx-details"><div class="tx-label">${escapeHtml(config.label)}</div><div class="tx-hash"><a href="${explorerUrl}${tx.hash}" target="_blank" rel="noopener noreferrer">${shortenHash(tx.hash)}</a></div></div><div class="tx-status">Pending</div>${CLOSE_BUTTON}</div>`,
    );
    el.querySelector(".notif-close").addEventListener("click", () =>
      this.removeTransaction(id),
    );
    this.transactions.set(id, { element: el });
    this.watchTransaction(tx, config);
    return id;
  }

  static async watchTransaction(tx, config) {
    const id = tx.hash;
    try {
      config.onPending?.(id);
      const receipt = await tx.wait();
      if (!this.transactions.has(id)) return;
      if (receipt.status === 1) {
        this.updateTransactionStatus(id, "success", "Confirmed");
        config.onSuccess?.(receipt);
      } else {
        this.updateTransactionStatus(id, "failed", "Failed");
        config.onError?.(new Error("Transaction failed"));
      }
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
    const el = this.transactions.get(id)?.element;
    if (!el) return;
    el.classList.remove("pending", "success", "failed");
    el.classList.add(status);
    el.querySelector(".tx-status").textContent = statusText;
    el.querySelector(".tx-spinner")?.remove();
  }

  static removeTransaction(id) {
    const tx = this.transactions.get(id);
    if (tx)
      removeElementWithDelay(tx.element, TIMINGS.NOTIFICATION_HIDE_DELAY, () =>
        this.transactions.delete(id),
      );
  }

  static clearTransactions() {
    this.transactions.forEach((_, id) => this.removeTransaction(id));
  }

  static clearAll() {
    this.notifications.forEach((_, id) => this.hide(id));
    this.clearTransactions();
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
    this.buttons.forEach((button) =>
      button.addEventListener("click", () => this.set(button.dataset.themeMode)),
    );
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
    this.set(this.modes[(this.modes.indexOf(this.get()) + 1) % this.modes.length]);
  }

  static apply() {
    const mode = this.get();
    const prefersDark = (this.media ?? matchMedia("(prefers-color-scheme: dark)")).matches;
    Object.assign(document.documentElement.dataset, {
      theme: mode === "system" ? (prefersDark ? "dark" : "light") : mode,
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
  static icon = null;
  static label = null;
  static menu = null;
  static dropdown = null;

  static mount(wallet) {
    this.wallet = wallet;
    const button = document.querySelector("#chain-btn");
    this.icon = document.querySelector("#chain-btn-icon");
    this.label = document.querySelector("#chain-btn-label");
    this.menu = document.querySelector("#chain-menu");
    if (!button || !this.menu) return this;
    this.dropdown = new Dropdown(button, this.menu);
    this.render();
    wallet.subscribe(() => this.render());
    return this;
  }

  static render() {
    if (!this.wallet || !this.menu) return;
    const networks = this.wallet.getVisibleNetworks();
    const currentId = normalizeChainId(this.wallet.getCurrentChainId());
    const current = (networks.find(([, c]) => c.chainId === currentId) || networks[0])?.[1];

    if (current) {
      if (this.icon) Object.assign(this.icon, { src: current.icon, alt: current.name });
      if (this.label) this.label.textContent = current.name;
    }

    this.menu.replaceChildren(
      ...networks.map(([, config]) =>
        menuItem({
          kind: "chain",
          role: "option",
          icon: config.icon,
          label: config.name,
          active: config.chainId === currentId,
          dropdown: this.dropdown,
          errorMessage: `Failed to switch to ${config.name}`,
          action: async () => {
            if (!this.wallet.isConnected())
              return notify("Connect a wallet to switch networks.", "warning");
            await this.wallet.switchNetwork(config);
          },
        }),
      ),
    );
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
  static list = null;
  static getWallet = null;
  static copyBtn = null;
  static disconnectBtn = null;
  static dropdown = null;
  static resolveToken = 0;
  static cache = new Map();

  static mount(wallet) {
    this.wallet = wallet;
    this.button = document.querySelector("#connect-btn");
    const menu = document.querySelector("#connect-menu");
    this.list = document.querySelector("#connect-wallet-list");
    this.getWallet = document.querySelector("#connect-get-wallet");
    this.copyBtn = document.querySelector("#copy-address-btn");
    this.disconnectBtn = document.querySelector("#disconnect-btn");
    if (!this.button || !menu) return this;
    this.dropdown = new Dropdown(this.button, menu);
    this.disconnectBtn?.addEventListener("click", async () => {
      this.dropdown.close();
      await wallet.disconnect();
    });
    this.render();
    wallet.subscribe(() => this.render());
    return this;
  }

  static render() {
    if (!this.wallet) return;
    const connected = Boolean(this.wallet.isConnected() && this.wallet.getAddress());
    this.renderButton(connected);
    this.renderWallets(connected);
    this.renderActions(connected);
  }

  static setLabel(text) {
    this.button.replaceChildren(create("span", { className: "dk-connect-label", textContent: text }));
    this.button.classList.remove("name-resolved");
    delete this.button.dataset.resolutionSource;
  }

  static paintName({ name, avatar, source }) {
    this.button.replaceChildren(
      create("span", { className: "resolved-name", textContent: name }),
      ...(avatar ? [create("img", { src: avatar, alt: "" })] : []),
    );
    this.button.classList.add("name-resolved");
    this.button.dataset.resolutionSource = source;
  }

  static renderButton(connected) {
    const { button } = this;
    if (!button) return;

    if (!connected) {
      this.resolveToken++;
      this.setLabel("Connect");
      button.classList.remove("connected");
      delete button.dataset.address;
      return;
    }

    const address = this.wallet.getAddress();
    const key = address.toLowerCase();
    const cached = this.cache.get(key);
    button.classList.add("connected");
    button.dataset.address = address;
    if (cached?.name) this.paintName(cached);
    else this.setLabel(shortenAddress(address));
    if (cached) return;

    const token = ++this.resolveToken;
    this.wallet.resolveName(address).then((resolved) => {
      this.cache.set(key, resolved || { name: null });
      if (resolved?.name && token === this.resolveToken && this.wallet.getAddress() === address)
        this.paintName(resolved);
    });
  }

  static renderWallets(connected) {
    if (!this.list) return;
    const providers = this.wallet.getProviders();
    this.list.replaceChildren(
      ...providers.map(({ info }) =>
        menuItem({
          kind: "wallet",
          role: "menuitem",
          icon: info.icon,
          label: info.name,
          active: connected && info.name === this.wallet.getLastWallet(),
          dropdown: this.dropdown,
          errorMessage: "Failed to connect wallet.",
          action: () => this.wallet.connectWallet(info.name),
        }),
      ),
    );
    if (this.getWallet) this.getWallet.style.display = providers.length ? "none" : "block";
  }

  static renderActions(connected) {
    const address = this.wallet.getAddress();
    if (this.copyBtn) {
      this.copyBtn.hidden = !connected;
      if (connected && address) {
        this.copyBtn.dataset.copy = address;
        if (typeof Copy !== "undefined") Copy.enhance(this.copyBtn);
      } else {
        delete this.copyBtn.dataset.copy;
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
  static inputs = null;
  static toggle = null;
  static panel = null;
  static dropdown = null;

  static mount() {
    const button = document.querySelector("#settings-btn");
    const menu = document.querySelector("#settings-menu");
    this.inputs = document.querySelector("#rpc-inputs");
    this.toggle = document.querySelector("#rpc-toggle");
    this.panel = document.querySelector("#rpc-panel");
    if (!button || !menu) return this;
    this.dropdown = new Dropdown(button, menu);
    this.renderRpcInputs();
    this.toggle?.addEventListener("click", () =>
      this.setRpcOpen(!this.panel.classList.contains("open")),
    );
    this.setRpcOpen(false);
    document.getElementById("save-rpc-btn")?.addEventListener("click", () => this.saveRpc());
    return this;
  }

  static setRpcOpen(open) {
    if (!this.panel || !this.toggle) return;
    this.panel.classList.toggle("open", open);
    this.panel.inert = !open;
    this.toggle.setAttribute("aria-expanded", String(open));
  }

  static renderRpcInputs() {
    this.inputs?.replaceChildren(
      ...getRpcConfigurableNetworks().map(([name, config]) =>
        create(
          "div",
          {},
          create("label", { textContent: config.name, htmlFor: `${name}-rpc` }),
          create("input", {
            id: `${name}-rpc`,
            type: "url",
            placeholder: "Enter custom RPC URL",
            value: localStorage.getItem(`${name}-rpc`) || "",
          }),
        ),
      ),
    );
  }

  static saveRpc() {
    getRpcConfigurableNetworks().forEach(([name]) => {
      const input = document.getElementById(`${name}-rpc`);
      if (!input) return;
      const value = input.value.trim();
      value ? localStorage.setItem(`${name}-rpc`, value) : localStorage.removeItem(`${name}-rpc`);
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
    this.storage = options.storage || window.localStorage;
    this.autoConnect = options.autoConnect !== false;
    this.nameResolutionOrder = options.nameResolutionOrder || ["ens", "gns", "wns"];
    this.showUnsupportedNetworkNotification =
      options.showUnsupportedNetworkNotification !== false;

    this.providers = [];
    this.currentProvider = null;
    this.providerListeners = null;
    this.unsupportedNetworkNotificationId = null;
    this.address = null;
    this.initializing = false;
    this.stateListeners = new Set();

    this.chainIdToName = Object.fromEntries(
      Object.values(this.networkConfigs).map((c) => [c.chainId, c.name]),
    );
    this.allowedChains = this.getVisibleNetworks().map(([, c]) => c.chainId);

    onReady(() => this.init());
  }

  /* ---------- lifecycle ---------- */

  init() {
    this.bindEvents();
    this.requestProviders();
    this.initializing = true;
    this.restoreState();
    this.emitState();
    setTimeout(async () => {
      await this.verifyConnectionState({ retryDelayMs: 500 });
      this.initializing = false;
      this.emitState();
    }, 300);
  }

  bindEvents() {
    window.addEventListener("eip6963:announceProvider", (e) => this.handleProviderAnnounce(e));
    const recheck = () =>
      setTimeout(() => this.verifyConnectionState({ retryDelayMs: 500 }), 300);
    window.addEventListener("focus", recheck);
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible") recheck();
    });
  }

  requestProviders() {
    window.dispatchEvent(new Event("eip6963:requestProvider"));
  }

  restoreState() {
    this.updateNetworkStatus(
      this.getCurrentChainId() || chainIdToHex(this.networkConfigs.ethereum.chainId),
    );
    const providerDetail = this.isConnected() && this.getProviderDetail(this.getLastWallet());
    if (providerDetail) this.syncConnectedProviderState(providerDetail);
  }

  /* ---------- state + subscriptions ---------- */

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

  setStorageState(key, value) {
    value ? this.storage.setItem(key, value) : this.storage.removeItem(key);
  }

  isAllowed(chainId) {
    return this.allowedChains.includes(normalizeChainId(chainId));
  }

  /* ---------- providers ---------- */

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
    const detail = this.getProviderDetail(name);
    if (!detail) return;
    const [accounts, chainId] = await this.requestProviderState(
      detail.provider,
      "eth_requestAccounts",
    );
    this.setupProviderEvents(detail);
    this.applyConnectedState({ accounts, chainId, providerName: detail.info.name });
    this.onConnectCallback?.({ accounts, chainId, provider: detail.info.name });
    return { accounts, chainId, provider: detail.provider };
  }

  async syncConnectedProviderState(detail) {
    if (!detail?.provider) return;
    this.setupProviderEvents(detail);
    try {
      const [accounts, chainId] = await this.requestProviderState(detail.provider);
      this.applyConnectedState({ accounts, chainId, providerName: detail.info.name });
    } catch {
      this.emitState();
    }
  }

  setupProviderEvents({ provider }) {
    if (this.currentProvider === provider) return;
    this.removeProviderEvents();
    this.currentProvider = provider;
    this.providerListeners = {
      accountsChanged: (accounts) =>
        accounts.length > 0 ? this.updateAddress(accounts[0]) : this.verifyConnectionState(),
      chainChanged: (chainId) => this.handleChainChanged(chainId),
      disconnect: () => this.verifyConnectionState(),
    };
    if (typeof provider?.on !== "function") return;
    Object.entries(this.providerListeners).forEach(([event, fn]) => provider.on(event, fn));
  }

  removeProviderEvents() {
    const provider = this.currentProvider;
    if (!provider || !this.providerListeners) return;
    if (typeof provider.removeListener === "function")
      Object.entries(this.providerListeners).forEach(([event, fn]) =>
        provider.removeListener(event, fn),
      );
    else provider.removeAllListeners?.();
  }

  /* ---------- connect / disconnect / verify ---------- */

  applyConnectedState({ accounts, chainId, providerName }) {
    const account = Array.isArray(accounts) ? accounts[0] : null;
    if (!account) return;
    this.address = account;
    this.setStorageState(STORAGE_KEYS.IS_CONNECTED, "true");
    this.setStorageState(STORAGE_KEYS.LAST_WALLET, providerName);
    this.updateNetworkStatus(chainId);
    this.emitState();
  }

  applyDisconnectedState() {
    const hadState =
      this.isConnected() || Boolean(this.getLastWallet()) || Boolean(this.getCurrentChainId());
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

  // Re-reads the wallet's accounts/chain; marks us disconnected if it keeps failing.
  async verifyConnectionState({ retries = 2, retryDelayMs = 250 } = {}) {
    const provider = this.currentProvider || this.getConnectedProvider();
    if (!provider) return;
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const [accounts, chainId] = await this.requestProviderState(provider);
        if (Array.isArray(accounts) && accounts.length > 0) {
          const prevChainId = this.getCurrentChainId();
          this.applyConnectedState({ accounts, chainId, providerName: this.getLastWallet() });
          if (hasChainChanged(prevChainId, chainId)) this.emitChainChange(chainId);
          return;
        }
      } catch {}
      if (attempt < retries) await sleep(retryDelayMs);
    }
    this.applyDisconnectedState();
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

  updateAddress(address) {
    this.address = address;
    this.emitState();
  }

  /* ---------- networks ---------- */

  handleChainChanged(chainId) {
    const prev = this.getCurrentChainId();
    this.updateNetworkStatus(chainId);
    if (hasChainChanged(prev, chainId)) this.emitChainChange(chainId);
    this.emitState();
  }

  emitChainChange(chainId) {
    const normalized = normalizeChainId(chainId);
    this.onChainChangeCallback?.({
      chainId: normalized,
      hexChainId: chainIdToHex(normalized),
      name: this.chainIdToName[normalized] || `Unknown (${chainId})`,
      allowed: this.isAllowed(chainId),
    });
  }

  // Persists the chain id and shows/hides the "unsupported network" notice.
  updateNetworkStatus(chainId) {
    const normalized = normalizeChainId(chainId);
    if (!Number.isFinite(normalized)) return;
    this.setStorageState(STORAGE_KEYS.CHAIN_ID, chainIdToHex(normalized));
    if (this.isAllowed(normalized)) this.hideUnsupportedNetworkNotice();
    else this.showUnsupportedNetworkNotice();
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
    Notification.hide?.(this.unsupportedNetworkNotificationId);
    this.unsupportedNetworkNotificationId = null;
  }

  async switchNetwork(networkConfig) {
    const provider = this.getConnectedProvider();
    if (!provider) return false;
    await provider.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: chainIdToHex(networkConfig.chainId) }],
    });
    this.updateNetworkStatus(networkConfig.chainId);
    this.emitState();
    return true;
  }

  /* ---------- name resolution ---------- */

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

  resolveWNS(address) {
    return this.resolveNamedContract(address, WNS_CONTRACT_ADDRESS);
  }

  resolveGNS(address) {
    return this.resolveNamedContract(address, GNS_CONTRACT_ADDRESS, ".gwei");
  }

  async resolveENS(address) {
    try {
      const provider = getEthereumProvider();
      const name = await provider.lookupAddress(address);
      return name ? { name, avatar: await provider.getAvatar(name) } : EMPTY_NAME;
    } catch {
      return EMPTY_NAME;
    }
  }

  async resolveSource(source, address) {
    if (source === "ens") return this.resolveENS(address);
    const resolvers = {
      wns: () => this.resolveWNS(address),
      gns: () => this.resolveGNS(address),
    };
    return { name: (await resolvers[source]?.()) ?? null, avatar: null };
  }

  async resolveOrdered(address) {
    for (const source of this.nameResolutionOrder) {
      const resolved = await this.resolveSource(source, address);
      if (resolved.name) return { ...resolved, source };
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

  async getResolvedName(address) {
    return (await this.resolveName(address))?.name || this.getShortAddr(address);
  }

  setNameResolutionOrder(order) {
    if (!Array.isArray(order) || order.length === 0) {
      console.warn("Invalid name resolution order. Pass an array like ['ens', 'gns', 'wns']");
      return;
    }
    this.nameResolutionOrder = order;
    if (this.isConnected()) this.emitState();
  }

  getNameResolutionOrder() {
    return this.nameResolutionOrder;
  }

  /* ---------- getters ---------- */

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
    return getVisibleNetworks(this.networkConfigs);
  }
  getProviderDetail(name) {
    return name ? this.providers.find((p) => p.info.name === name) || null : null;
  }
  getConnectedProvider() {
    return this.getProviderDetail(this.getLastWallet())?.provider;
  }
  getProvider() {
    return this.getConnectedProvider();
  }
  getEthersProvider() {
    const provider = this.getConnectedProvider();
    return provider ? new ethers.BrowserProvider(provider) : null;
  }
  getShortAddr(address) {
    return shortenAddress(address);
  }

  async getAccount() {
    try {
      const accounts = await this.getConnectedProvider()?.request({ method: "eth_accounts" });
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

  /* ---------- callbacks ---------- */

  onConnect(cb) {
    this.onConnectCallback = cb;
  }
  onDisconnect(cb) {
    this.onDisconnectCallback = cb;
  }
  onChainChange(cb) {
    this.onChainChangeCallback = cb;
  }
}
