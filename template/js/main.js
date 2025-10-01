import NotificationSystem from "./notifications.js";
import { ConnectWallet } from "./connect.js";
import Copy from "./copy.js";

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
      NotificationSystem.show(
        `Please switch to a supported network. Chain ${chainId} is not supported.`,
        "danger",
        { duration: 0 },
      );
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

  // Demo transaction tracker
  document.querySelector("#demo-tx")?.addEventListener("click", async () => {
    if (!wallet.isConnected()) {
      NotificationSystem.show("Please connect your wallet first", "warning");
      return;
    }

    try {
      const provider = wallet.getEthersProvider();
      const signer = await provider.getSigner();
      const chainId = await wallet.getChainId();

      // Demo transaction (send 0 ETH to self)
      const account = await wallet.getAccount();
      const tx = await signer.sendTransaction({
        to: account,
        value: 0,
      });

      const rpcUrl = Object.values(wallet.networkConfigs).find(
        (n) => n.chainIdHex === chainId,
      )?.rpcUrl;

      NotificationSystem.track(tx.hash, parseInt(chainId, 16), rpcUrl, {
        label: "Demo Transaction",
      });
    } catch (error) {
      NotificationSystem.show("Transaction failed: " + error.message, "danger");
    }
  });
});

window.ConnectWallet = wallet;
window.NotificationSystem = NotificationSystem;
window.Copy = Copy;
