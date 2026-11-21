import {
  ChainSelect,
  ConnectWallet,
  Copy,
  Notification,
  Settings,
  Theme,
  WalletConnect,
} from "./libs/dappkit.js";

const wallet = new ConnectWallet({ autoConnect: true });

document.addEventListener("DOMContentLoaded", () => {
  Copy.mount();
  Theme.mount();
  ChainSelect.mount(wallet);
  WalletConnect.mount(wallet);
  Settings.mount();

  wallet.setNameResolutionOrder(["ens", "gns", "wns"]);

  wallet.onConnect(async ({ accounts }) => {
    const name = await wallet.getResolvedName(accounts[0]);
    Notification.show(`Connected to ${wallet.getLastWallet()}: ${name}`, "info");
  });
  wallet.onDisconnect(() => Notification.show("Wallet disconnected", "warning"));
  wallet.onChainChange(({ name, allowed }) => {
    if (allowed) Notification.show(`Switched to ${name}`, "info");
  });

  // Demo notification buttons
  document.querySelectorAll("button[data-type]").forEach((btn) =>
    btn.addEventListener("click", () => {
      const { type } = btn.dataset;
      Notification.show(`This is a ${type} notification.`, type);
    }),
  );

  Notification.show("Welcome to dappkit!", "success");

  // Demo transaction tracker (send 0 ETH to self)
  document.querySelector("#demo-tx")?.addEventListener("click", async () => {
    if (!wallet.isConnected())
      return Notification.show("Please connect your wallet first", "warning");

    try {
      const signer = await wallet.getEthersProvider().getSigner();
      const tx = await signer.sendTransaction({ to: await signer.getAddress(), value: 0 });
      Notification.track(tx, { label: "Demo Transaction" });
    } catch (error) {
      Notification.show(error.message, "error");
    }
  });
});
