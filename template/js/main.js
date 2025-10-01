import NotificationSystem from "./notifications.js";
import { ConnectWallet } from "./connect.js";

const wallet = new ConnectWallet();

document.addEventListener("DOMContentLoaded", () => {
  wallet.onConnect((data) => {
    const account = data.accounts[0];
    const shortAccount = `${account.slice(0, 6)}...${account.slice(-4)}`;
    NotificationSystem.show(
      `Connected to ${wallet.getLastWallet()} with account ${shortAccount}`,
      "success",
    );
  });

  wallet.onDisconnect(() => {
    NotificationSystem.show("Wallet disconnected", "warning");
  });

  wallet.onChainChange(({ chainId, name, allowed }) => {
    if (!allowed) {
      NotificationSystem.show(`Chain ${chainId} is not allowed`, "danger");
      return;
    }
    NotificationSystem.show(`Switched to ${name}`, "info");
  });

  // Demo notification buttons
  document.querySelectorAll("button[data-type]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const type = btn.getAttribute("data-type");
      NotificationSystem.show(`This is a ${type} notification.`, type);
    });
  });

  NotificationSystem.show("Welcome to dappkit!", "success");
});

window.walletConnect = wallet;
