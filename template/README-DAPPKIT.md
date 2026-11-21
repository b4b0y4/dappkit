# Dappkit Starter Template

A minimal dependency template for decentralized applications. No build tools required — just serve the folder and open `index.html`.

## Features

- **Chain switcher**: dropdown with the networks marked `showInUI`
- **Wallet connect**: EIP-6963 wallet discovery with a dropdown of browser extensions
- **Settings menu**: System / Light / Dark theme and an inline custom RPC URL field
- **Notifications**: toast notifications with transaction tracking
- **Copy**: one-click copy with visual feedback
- **Headless core**: `ConnectWallet` handles wallet state; each UI component is removable

## Quick Start

```javascript
import {
  ConnectWallet,
  ChainSelect,
  WalletConnect,
  Settings,
  Theme,
  Copy,
  Notification,
} from "./js/libs/dappkit.js";

const wallet = new ConnectWallet({ autoConnect: true });

document.addEventListener("DOMContentLoaded", () => {
  Copy.mount();
  Theme.mount();
  ChainSelect.mount(wallet);
  WalletConnect.mount(wallet);
  Settings.mount();

  wallet.onConnect(() => Notification.show("Connected!", "success"));
});
```

## File Structure

```
template/
├─ index.html
├─ assets/
│  ├─ css/styleKit.css     ← sectioned per component
│  └─ img/                 ← network and wallet icons
└─ js/
   ├─ app.js               ← mount components + demo code
   └─ libs/
      ├─ dappkit.js        ← all components in removable blocks
      └─ ethers.min.js
```

## UI Components

The widget is three independent dropdowns:

```html
<div class="dk-widget">
  <!-- Chain select -->
  <div class="dk-dropdown">
    <button id="chain-btn" class="dk-btn dk-chain-btn" aria-expanded="false">
      <img id="chain-btn-icon" src="./assets/img/eth.png" alt="" />
      <span id="chain-btn-label">Ethereum</span>
      <svg class="dk-chevron">…</svg>
    </button>
    <div id="chain-menu" class="dk-menu dk-chain-menu" role="listbox"></div>
  </div>

  <!-- Wallet connect -->
  <div class="dk-dropdown">
    <button id="connect-btn" class="dk-btn dk-connect-btn" aria-expanded="false">
      <span class="dk-connect-label">Connect</span>
    </button>
    <div id="connect-menu" class="dk-menu dk-wallet-menu" role="menu">
      <div id="connect-wallet-list" class="dk-wallet-list"></div>
      <div id="connect-get-wallet" class="dk-get-wallet">
        <a href="https://ethereum.org/en/wallets/" target="_blank">Get a Wallet!</a>
      </div>
      <button id="copy-address-btn" class="dk-menu-item" hidden>Copy Address</button>
      <button id="disconnect-btn" class="dk-menu-item" hidden>Disconnect</button>
    </div>
  </div>

  <!-- Settings -->
  <div class="dk-dropdown">
    <button id="settings-btn" class="dk-btn dk-icon-btn" aria-expanded="false">
      <svg>…</svg>
    </button>
    <div id="settings-menu" class="dk-menu dk-settings-menu" role="menu">
      <div class="dk-theme-segment" role="radiogroup">
        <button data-theme-mode="system">System</button>
        <button data-theme-mode="light">Light</button>
        <button data-theme-mode="dark">Dark</button>
      </div>
      <div class="dk-settings-block">
        <div class="dk-settings-label">Add RPC URL</div>
        <div id="rpc-inputs"></div>
        <button id="save-rpc-btn" class="dk-save-btn">Save RPC</button>
      </div>
    </div>
  </div>
</div>
```

- Only one dropdown is open at a time. Outside click and `Escape` close it.
- The chain button shows the active network. Switching requires a connected wallet.
- Once connected, the connect button shows the address, then upgrades to the resolved ENS / GNS / WNS name.
- When connected, the wallet dropdown lists all detected wallets so you can switch, plus Copy Address and Disconnect.

## Removing Components

Each component lives in its own block in `js/libs/dappkit.js`, marked with a banner:

```javascript
/* ============================================================
   COMPONENT: ChainSelect
   Remove this block, the chain dropdown HTML, its CSS section
   and `ChainSelect.mount(wallet)` in app.js
   ============================================================ */
```

To delete a feature, remove:

1. Its block in `js/libs/dappkit.js`
2. Its markup in `index.html`
3. Its section in `assets/css/styleKit.css`
4. Its `*.mount(...)` line in `js/app.js`

`ConnectWallet` is headless and has no DOM dependencies. Shared helpers (`Dropdown`, `notify`, formatting) live in the utilities section.

## Notifications

```javascript
Notification.show("Message", "success"); // success, info, warning, error

Notification.show("Message", "info", {
  duration: 5000,      // ms (0 = never hide)
  closable: true,      // show the close button
  showProgress: true,  // show the progress bar
  html: false,         // allow HTML
});

// Track an ethers transaction
const tx = await signer.sendTransaction({ to, value: 0 });
Notification.track(tx, {
  label: "Send ETH",
  onSuccess: (receipt) => console.log("Done!", receipt),
  onError: (error) => console.error(error),
});

Notification.clearAll();
Notification.clearTransactions();
```

## Wallet API

```javascript
const wallet = new ConnectWallet({ autoConnect: true });

wallet.onConnect(({ accounts, chainId, provider }) => {});
wallet.onDisconnect(() => {});
wallet.onChainChange(({ chainId, name, allowed }) => {});

wallet.isConnected();                 // boolean
wallet.getAddress();                  // cached connected address
wallet.getLastWallet();               // wallet name
wallet.getProviders();                // EIP-6963 provider details
wallet.getVisibleNetworks();          // [[key, config], ...]
wallet.getCurrentChainId();           // stored chain id (hex)

await wallet.connectWallet(name);
await wallet.disconnect();
await wallet.switchNetwork(config);

await wallet.getAccount();            // address or null
await wallet.getChainId();            // numeric id
wallet.getProvider();                 // EIP-1193 provider
wallet.getEthersProvider();           // ethers BrowserProvider
wallet.getShortAddr(address);         // 0x1234...abcd
await wallet.getResolvedName(address); // name or short address
await wallet.resolveName(address);     // { name, avatar, source } or null

wallet.setNameResolutionOrder(["ens", "gns", "wns"]);
wallet.subscribe(() => {
  // called whenever connection, chain or provider state changes
});
```

## Theme

The page sets the initial theme inline in `<head>` to avoid a flash. `Theme.mount()` handles runtime changes:

```javascript
Theme.mount();
Theme.set("system"); // "system" | "light" | "dark"
Theme.get();
Theme.cycle();
```

Theme state is stored in `localStorage.themeMode`. The page should define:

```css
:root {
  --color-bg: #f5f5f5;
  --color-txt: #17202a;
}

[data-theme="dark"] {
  --color-bg: #17202a;
  --color-txt: #f5f5f5;
}
```

## RPC Settings

The settings dropdown renders an input for each network with `rpcConfigurable: true` (Ethereum by default).

```javascript
// Read the RPC URL in use (custom or default)
import { getRpcUrl } from "./js/libs/dappkit.js";
const url = getRpcUrl("ethereum");
```

Custom URLs are saved to `localStorage` as `<network>-rpc`.

## Networks

```javascript
export const networkConfigs = {
  ethereum: {
    name: "Ethereum",
    chainId: 1,
    rpcUrl: "https://ethereum-rpc.publicnode.com",
    icon: "./assets/img/eth.png",
    explorerUrl: "https://etherscan.io/tx/",
    showInUI: true,
    rpcConfigurable: true,
  },
};
```

- `showInUI: true` adds the network to the chain dropdown.
- `rpcConfigurable: true` adds it to the RPC form.

## Copy to Clipboard

```html
<button data-copy="0x742d35Cc...">Copy Address</button>
```

```javascript
Copy.mount();                       // enables [data-copy] elements
await Copy.copy("text", element);   // programmatic copy
```

## Browser Support

- Chrome / Edge 90+
- Firefox 88+
- Safari 14+

## License

MIT License — see the [license](../license) file for details.
