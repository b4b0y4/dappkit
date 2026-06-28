import { ethers } from "./libs/ethers.min.js";
import { ConnectWallet, Notification, getRpcUrl } from "./libs/dappkit.js";

const wallet = new ConnectWallet();

document.addEventListener("DOMContentLoaded", () => {
  wallet.onConnect((data) => {
    const account = data.accounts[0];
    wallet
      .getResolvedName(account)
      .then((displayName) =>
        Notification.show(
          `Connected to ${wallet.getLastWallet()}: ${displayName}`,
          "info",
        ),
      )
      .catch(() => {});
  });

  wallet.onDisconnect(() => {
    Notification.show("Wallet disconnected", "warning");
  });

  wallet.onChainChange(({ name, allowed }) => {
    if (allowed) Notification.show(`Switched to ${name}`, "info");
  });

  // Name resolution order: default is ["ens", "gns", "wns"]
  wallet.setNameResolutionOrder(["ens", "gns", "wns"]);

  // Demo notification buttons
  document.querySelectorAll("button[data-type]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const type = btn.getAttribute("data-type");
      Notification.show(`This is a ${type} notification.`, type);
    });
  });

  Notification.show("Welcome to dappkit!", "success");

  // Demo transaction tracker (send 0 ETH to self)
  document.querySelector("#demo-tx")?.addEventListener("click", async () => {
    if (!wallet.isConnected()) {
      Notification.show("Please connect your wallet first", "warning");
      return;
    }

    try {
      const provider = wallet.getEthersProvider();
      const signer = await provider.getSigner();
      const account = await wallet.getAccount();
      const tx = await signer.sendTransaction({
        to: account,
        value: 0,
      });

      Notification.track(tx, {
        label: "Demo Transaction",
      });
    } catch (error) {
      Notification.show(error.message, "error");
    }
  });
});
