import NotificationSystem from "./notifications.js";
import { ConnectWallet } from "./connect.js";
import { networkConfigs } from "./connect-config.js";

const wallet = new ConnectWallet();

// Convert hex or number to a decimal number
const normalizeChainId = (chainId) => {
  if (typeof chainId === "string" && chainId.startsWith("0x")) {
    return parseInt(chainId, 16);
  }
  return Number(chainId);
};

// ✅ Build list of allowed chain IDs (only showInUI: true)
const allowedChains = Object.values(networkConfigs)
  .filter((cfg) => cfg.showInUI)
  .map((cfg) => cfg.chainId);

// ✅ Small utility to guard function calls
const onlyAllowed = (chainId, fn) => {
  const normalized = normalizeChainId(chainId);
  if (!allowedChains.includes(normalized)) {
    throw new Error(`Chain ${chainId} is not allowed`);
  }
  return fn();
};

document.addEventListener("DOMContentLoaded", () => {
  const elements = {
    connectBtn: document.querySelector("#connect-btn"),
    connectChainList: document.querySelector("#connect-chain-list"),
    connectWalletList: document.querySelector("#connect-wallet-list"),
    connectWallets: document.querySelector("#connect-wallets"),
  };

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
  });

  wallet.onDisconnect(() => {
    NotificationSystem.show("Wallet disconnected", "warning");
  });

  wallet.onChainChange((chainId) => {
    try {
      onlyAllowed(chainId, () => {
        NotificationSystem.show(`Switched to network ${chainId}`, "info");
      });
    } catch (err) {
      NotificationSystem.show(err.message, "danger", { duration: 0 });
    }
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
