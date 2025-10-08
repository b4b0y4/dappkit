import Notification from "./notifications.js";
import { ConnectWallet } from "./connect.js";
import Copy from "./copy.js";

const wallet = new ConnectWallet();

document.addEventListener("DOMContentLoaded", () => {
  wallet.onConnect((data) => {
    const account = data.accounts[0];
    const shortAccount = `${account.slice(0, 6)}...${account.slice(-4)}`;
    Notification.show(
      `Connected to ${wallet.getLastWallet()} with account ${shortAccount}`,
      "success",
    );
  });

  wallet.onDisconnect(() => {
    Notification.show("Wallet disconnected", "warning");
  });

  wallet.onChainChange(({ chainId, name, allowed }) => {
    if (!allowed) {
      Notification.show(
        `Please switch to a supported network. Chain ${chainId} is not supported.`,
        "danger",
        { duration: 0 },
      );
      return;
    }
    Notification.show(`Switched to ${name}`, "info");
  });

  // Demo notification buttons
  document.querySelectorAll("button[data-type]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const type = btn.getAttribute("data-type");
      Notification.show(`This is a ${type} notification.`, type);
    });
  });

  Notification.show("Welcome to dappkit!", "success");

  // Demo transaction tracker
  document.querySelector("#demo-tx")?.addEventListener("click", async () => {
    if (!wallet.isConnected()) {
      Notification.show("Please connect your wallet first", "warning");
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
        (n) => n.chainId === chainId,
      )?.rpcUrl;

      Notification.track(tx.hash, chainId, rpcUrl, {
        label: "Demo Transaction",
      });
    } catch (error) {
      Notification.show("Transaction failed: " + error.message, "danger");
    }
  });
});
