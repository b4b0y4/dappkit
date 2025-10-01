import { ethers } from "./libs/ethers.min.js";
import { networkConfigs } from "./connect-config.js";
import Copy from "./copy.js";

export class ConnectWallet {
  constructor(options = {}) {
    this.networkConfigs = options.networkConfigs || networkConfigs;
    this.providers = [];
    this.storage = options.storage || window.localStorage;
    this.currentProvider = null;

    // Precompute lookups
    this.chainIdToName = {};
    this.allowedChains = [];
    Object.values(this.networkConfigs).forEach((cfg) => {
      this.chainIdToName[cfg.chainId] = cfg.name;
      if (cfg.showInUI) {
        this.allowedChains.push(cfg.chainId);
      }
    });

    // Auto-discover elements (deferred until DOM is ready)
    this.elements = {};
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", () => this.init());
    } else {
      this.init();
    }
  }

  init() {
    this.discoverElements();
    this.bindEvents();
    this.setupUIEvents();
    this.requestProviders();
    this.restoreState();
  }

  discoverElements() {
    this.elements = {
      connectBtn: document.querySelector("#connect-btn"),
      connectChainList: document.querySelector("#connect-chain-list"),
      connectWalletList: document.querySelector("#connect-wallet-list"),
      connectWallets: document.querySelector("#connect-wallets"),
    };
  }

  normalizeChainId(chainId) {
    if (typeof chainId === "string" && chainId.startsWith("0x")) {
      return parseInt(chainId, 16);
    }
    return Number(chainId);
  }

  isAllowed(chainId) {
    const normalized = this.normalizeChainId(chainId);
    return this.allowedChains.includes(normalized);
  }

  bindEvents() {
    window.addEventListener("eip6963:announceProvider", (event) => {
      this.handleProviderAnnounce(event);
    });
  }

  setupUIEvents() {
    if (this.elements.connectBtn) {
      this.elements.connectBtn.addEventListener("click", (event) => {
        event.stopPropagation();
        this.toggleWalletList();
      });
    }

    if (this.elements.connectWalletList) {
      this.elements.connectWalletList.addEventListener("click", (event) => {
        event.stopPropagation();
      });
    }

    document.addEventListener("click", () => {
      this.hideWalletList();
    });
  }

  requestProviders() {
    window.dispatchEvent(new Event("eip6963:requestProvider"));
  }

  handleProviderAnnounce(event) {
    const { detail: providerDetail } = event;
    const providerName = providerDetail.info.name;

    if (!this.providers.some((p) => p.info.name === providerName)) {
      this.providers.push(providerDetail);
      this.render();

      if (this.isConnected() && this.getLastWallet() === providerName) {
        this.connectWallet(this.getLastWallet());
      }
    }
  }

  createButton(config, onClick) {
    const button = document.createElement("button");
    button.innerHTML = `<img src="${config.icon}">${config.name}<span class="connect-indicator" style="display: none"></span>`;
    button.onclick = onClick;
    return button;
  }

  async connectWallet(name) {
    const provider = this.providers.find((p) => p.info.name === name);
    if (!provider) return;

    try {
      const [accounts, chainId] = await Promise.all([
        provider.provider.request({ method: "eth_requestAccounts" }),
        provider.provider.request({ method: "eth_chainId" }),
      ]);

      this.storage.setItem("connectCurrentChainId", chainId);
      this.storage.setItem("connectLastWallet", name);
      this.storage.setItem("connectConnected", "true");

      this.setupProviderEvents(provider);
      this.updateAddress(accounts[0]);
      this.updateNetworkStatus(chainId);
      this.render();

      if (this.onConnectCallback) {
        this.onConnectCallback({
          accounts,
          chainId,
          provider: provider.info.name,
        });
      }

      return { accounts, chainId, provider: provider.provider };
    } catch (error) {
      console.error("Connection failed:", error);
      throw error;
    }
  }

  setupProviderEvents(provider) {
    if (this.currentProvider === provider.provider) {
      return;
    }

    if (this.currentProvider) {
      this.currentProvider.removeAllListeners?.();
    }

    this.currentProvider = provider.provider;

    provider.provider
      .on("accountsChanged", (accounts) => {
        accounts.length > 0
          ? this.updateAddress(accounts[0])
          : this.disconnect();
      })
      .on("chainChanged", (chainId) => {
        this.updateNetworkStatus(chainId);
        if (this.onChainChangeCallback) {
          const normalized = this.normalizeChainId(chainId);
          const name = this.chainIdToName[normalized] || `Unknown (${chainId})`;
          const allowed = this.isAllowed(chainId);

          this.onChainChangeCallback({
            chainId: normalized,
            hexChainId: chainId,
            name,
            allowed,
          });
        }
        this.render();
      })
      .on("disconnect", () => this.disconnect());
  }

  updateAddress(address) {
    if (this.elements.connectBtn) {
      const short = `${address.substring(0, 5)}...${address.substring(address.length - 4)}`;
      this.elements.connectBtn.innerHTML = `
        <span class="connect-address-text">${short}</span>
        <span class="connect-copy-icon" title="Copy address">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
          </svg>
        </span>
      `;
      this.elements.connectBtn.classList.add("connected");
      this.elements.connectBtn.classList.remove("ens-resolved");
      this.elements.connectBtn.setAttribute("data-address", address);
      this.setupCopyIcon();
      this.resolveENS(address);
    }
  }

  setupCopyIcon() {
    const copyIcon =
      this.elements.connectBtn.querySelector(".connect-copy-icon");
    if (copyIcon) {
      copyIcon.addEventListener("click", async (event) => {
        event.stopPropagation();
        const address = this.elements.connectBtn.getAttribute("data-address");
        if (address) {
          await Copy.copyToClipboard(address, copyIcon);
        }
      });
    }
  }

  async resolveENS(address) {
    if (!this.elements.connectBtn) return;

    try {
      const mainnetProvider = new ethers.JsonRpcProvider(
        this.networkConfigs.ethereum.rpcUrl,
      );
      const ensName = await mainnetProvider.lookupAddress(address);
      if (!ensName) return;

      const ensAvatar = await mainnetProvider.getAvatar(ensName);
      const short = `${address.substring(0, 5)}...${address.substring(
        address.length - 4,
      )}`;

      let buttonContent = `
        <div class="ens-details">
          <div class="ens-name">${ensName}</div>
          <div class="ens-address-row">
            <span class="ens-address">${short}</span>
            <span class="connect-copy-icon" title="Copy address">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
              </svg>
            </span>
          </div>
        </div>
      `;
      if (ensAvatar) {
        buttonContent += `<img src="${ensAvatar}" style="border-radius: 50%">`;
      }

      this.elements.connectBtn.innerHTML = buttonContent;
      this.elements.connectBtn.classList.add("ens-resolved");
      this.elements.connectBtn.setAttribute("data-address", address);
      this.setupCopyIcon();
    } catch (error) {
      console.log("ENS resolution failed:", error);
    }
  }

  async switchNetwork(networkConfig) {
    const provider = this.getConnectedProvider();
    if (!provider) return;

    try {
      await provider.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: networkConfig.chainIdHex }],
      });
      this.hideWalletList();
      this.storage.setItem("connectCurrentChainId", networkConfig.chainIdHex);
      this.updateNetworkStatus(networkConfig.chainIdHex);
      this.render();
    } catch (error) {
      console.error("Network switch failed:", error);
      throw error;
    }
  }

  updateNetworkStatus(chainId) {
    const normalized = this.normalizeChainId(chainId);
    const network = Object.values(this.networkConfigs).find(
      (net) => net.chainId === normalized || net.chainIdHex === chainId,
    );

    if (network?.showInUI) {
      this.storage.setItem("connectCurrentChainId", chainId);
    } else {
      this.storage.removeItem("connectCurrentChainId");
    }
  }

  async disconnect() {
    const provider = this.getConnectedProvider();

    try {
      await provider?.request({
        method: "wallet_revokePermissions",
        params: [{ eth_accounts: {} }],
      });
    } catch (error) {
      console.error("Disconnect failed:", error);
    }

    if (this.currentProvider) {
      this.currentProvider.removeAllListeners?.();
      this.currentProvider = null;
    }

    ["connectCurrentChainId", "connectLastWallet", "connectConnected"].forEach(
      (key) => this.storage.removeItem(key),
    );

    if (this.onDisconnectCallback) {
      this.onDisconnectCallback();
    }

    if (this.elements.connectBtn) {
      this.elements.connectBtn.innerHTML = "Connect";
      this.elements.connectBtn.classList.remove("connected", "ens-resolved");
    }

    if (this.elements.connectWalletList) {
      this.elements.connectWalletList.classList.remove("show");
    }

    this.updateNetworkStatus(this.networkConfigs.ethereum.chainIdHex);
    this.render();
  }

  toggleWalletList() {
    if (this.elements.connectWalletList) {
      this.elements.connectWalletList.classList.toggle("show");
    }
  }

  hideWalletList() {
    if (this.elements.connectWalletList) {
      this.elements.connectWalletList.classList.remove("show");
    }
  }

  render() {
    this.renderWalletProviders();
    this.renderChainList();
    this.renderGetWallet();
  }

  renderWalletProviders() {
    if (!this.elements.connectWallets) return;

    this.elements.connectWallets.innerHTML = "";
    const connectedWallet = this.getLastWallet();

    this.providers.forEach((provider) => {
      const button = this.createButton(provider.info, () => {
        this.hideWalletList();
        this.connectWallet(provider.info.name);
      });

      const isConnected = provider.info.name === connectedWallet;
      button.querySelector(".connect-indicator").style.display = isConnected
        ? "inline-block"
        : "none";

      this.elements.connectWallets.appendChild(button);
    });
  }

  renderChainList() {
    if (!this.elements.connectChainList) return;

    this.elements.connectChainList.innerHTML = "";
    const currentChainId = this.getCurrentChainId();
    const isConnected = this.isConnected();

    Object.entries(this.networkConfigs)
      .filter(([, config]) => config.showInUI)
      .forEach(([networkName, networkConfig]) => {
        const button = document.createElement("button");
        button.id = `connect-${networkName}`;
        button.title = networkConfig.name;
        button.innerHTML = `<img src="${networkConfig.icon}" alt="${networkConfig.name}">`;
        button.onclick = () => this.switchNetwork(networkConfig);

        const indicator = document.createElement("span");
        indicator.className = "connect-indicator";
        indicator.style.display =
          isConnected && networkConfig.chainIdHex === currentChainId
            ? "inline-block"
            : "none";

        button.appendChild(indicator);
        this.elements.connectChainList.appendChild(button);
      });
  }

  renderGetWallet() {
    const getWalletEl = document.querySelector("#connect-get-wallet");
    if (getWalletEl) {
      getWalletEl.style.display = this.providers.length ? "none" : "block";
    }
  }

  restoreState() {
    const storedChainId =
      this.getCurrentChainId() || this.networkConfigs.ethereum.chainIdHex;
    this.updateNetworkStatus(storedChainId);

    if (this.isConnected()) {
      const provider = this.getConnectedProvider();
      if (provider) {
        const providerDetail = this.providers.find(
          (p) => p.info.name === this.getLastWallet(),
        );
        if (providerDetail) {
          this.setupProviderEvents(providerDetail);
        }
      }
    }
  }

  isConnected() {
    return this.storage.getItem("connectConnected") === "true";
  }

  getCurrentChainId() {
    return this.storage.getItem("connectCurrentChainId");
  }

  getLastWallet() {
    return this.storage.getItem("connectLastWallet");
  }

  getConnectedProvider() {
    const walletName = this.getLastWallet();
    const provider = this.providers.find((p) => p.info.name === walletName);
    return provider?.provider;
  }

  async getAccount() {
    const provider = this.getConnectedProvider();
    if (!provider) return null;

    try {
      const accounts = await provider.request({ method: "eth_accounts" });
      return accounts[0] || null;
    } catch (error) {
      console.error("Failed to get account:", error);
      return null;
    }
  }

  async getChainId() {
    const provider = this.getConnectedProvider();
    if (!provider) return null;

    try {
      return await provider.request({ method: "eth_chainId" });
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

  onConnect(callback) {
    this.onConnectCallback = callback;
  }

  onDisconnect(callback) {
    this.onDisconnectCallback = callback;
  }

  onChainChange(callback) {
    this.onChainChangeCallback = callback;
  }
}

export default ConnectWallet;
