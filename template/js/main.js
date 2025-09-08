import NotificationSystem from "./notifications.js";
import { ConnectWallet } from "./connect.js";
import { networkConfigs } from "./connect-config.js";

const wallet = new ConnectWallet();

// Build a lookup of supported chainIds
const SUPPORTED_CHAINS = Object.values(networkConfigs)
  .filter((net) => net.showInUI) // only those you want to allow
  .map((net) => String(net.chainId)); // ensure string comparison

document.addEventListener("DOMContentLoaded", () => {
  const elements = {
    connectBtn: document.querySelector("#connect-btn"),
    connectChainList: document.querySelector("#connect-chain-list"),
    connectWalletList: document.querySelector("#connect-wallet-list"),
    connectWallets: document.querySelector("#connect-wallets"),
  };

  if (!elements.connectBtn || !elements.connectWalletList) {
    throw new Error(
      "Missing required DOM elements: #connect-btn or #connect-wallet-list",
    );
  }

  wallet.setElements(elements);

  elements.connectBtn.addEventListener("click", (event) => {
    event.stopPropagation();
    wallet.toggleWalletList();
  });

  elements.connectWalletList.addEventListener("click", (event) => {
    event.stopPropagation();
  });

  document.addEventListener("click", () => {
    wallet.hideWalletList();
  });

  wallet.onConnect((data) => {
    const account = data.accounts[0];
    const shortAccount = `${account.slice(0, 6)}...${account.slice(-4)}`;
    NotificationSystem.show(`Connected to ${shortAccount}`, "success");

    // check network immediately
    checkNetwork(data.chainId);
  });

  wallet.onDisconnect(() => {
    NotificationSystem.show("Wallet disconnected", "danger");
  });

  wallet.onChainChange((chainId) => {
    NotificationSystem.show(`Switched to network ${chainId}`, "info");
    checkNetwork(chainId);
  });

  // Demo notification buttons
  document.querySelectorAll("button[data-type]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const type = btn.getAttribute("data-type");
      NotificationSystem.show(`This is a ${type} notification.`, type);
    });
  });

  NotificationSystem.show(
    "Welcome! Theme switcher is in the top-right.",
    "success",
  );
});

window.walletConnect = wallet;

// --- Helpers ---
function checkNetwork(chainIds) {
  // Normalize to array (in case we get a single ID)
  const chainArray = Array.isArray(chainIds) ? chainIds : [chainIds];

  // Convert to decimal strings (handles both hex like "0x1" and decimal like "1")
  const chainStrs = chainArray.map((id) => {
    const numericId =
      typeof id === "string" && id.startsWith("0x")
        ? parseInt(id, 16)
        : parseInt(id, 10);
    return String(numericId);
  });

  console.log("Normalized chain IDs:", chainStrs);
  console.log("Supported chains:", SUPPORTED_CHAINS);

  // Check if any connected chain is supported
  const isSupported = chainStrs.some((id) => SUPPORTED_CHAINS.includes(id));

  console.log("Is supported:", isSupported);

  if (!isSupported) {
    // Get supported network names from the config
    const supportedNames = Object.values(networkConfigs)
      .filter((net) => net.showInUI)
      .map((net) => net.name)
      .join(", ");

    NotificationSystem.show(
      `Unsupported network detected. Please switch to one of: ${supportedNames}.`,
      "danger",
      { duration: 0 },
    );
  }
}
