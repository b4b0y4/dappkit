# Dappkit Starter Template

Minimal, dependency-free template for dapps. No build step — serve the folder and open `index.html`.

## Features

- **Chain switcher** for networks marked `showInUI`
- **Wallet connect** via EIP-6963, with ENS / GNS / WNS name resolution
- **Settings**: System / Light / Dark theme and custom RPC URLs
- **Notifications** with transaction tracking
- **Copy** to clipboard with feedback
- **Headless core**: `ConnectWallet` has no DOM dependencies; every UI component is removable

## Quick Start

```javascript
import {
  ConnectWallet, ChainSelect, WalletConnect,
  Settings, Theme, Copy, Notification,
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

## UI Markup

Three independent dropdowns inside `.dk-widget`. Each needs a button, a menu, and the IDs below:

| Component | Button | Menu | Other IDs |
|---|---|---|---|
| Chain | `#chain-btn` | `#chain-menu` | `#chain-btn-icon`, `#chain-btn-label` |
| Wallet | `#connect-btn` | `#connect-menu` | `#connect-wallet-list`, `#connect-get-wallet`, `#copy-address-btn`, `#disconnect-btn` |
| Settings | `#settings-btn` | `#settings-menu` | `#rpc-inputs`, `#save-rpc-btn`, `[data-theme-mode]` buttons |

```html
<div class="dk-dropdown">
  <button id="chain-btn" class="dk-btn dk-chain-btn" aria-expanded="false">
    <img id="chain-btn-icon" src="./assets/img/eth.png" alt="" />
    <span id="chain-btn-label">Ethereum</span>
    <svg class="dk-chevron">…</svg>
  </button>
  <div id="chain-menu" class="dk-menu dk-chain-menu" role="listbox"></div>
</div>
```

One dropdown is open at a time; outside click and `Escape` close it. Switching chains requires a connected wallet.

## Removing Components

Each component is a banner-marked block in `dappkit.js`. To remove one, delete:

1. Its block in `js/libs/dappkit.js`
2. Its markup in `index.html`
3. Its section in `assets/css/styleKit.css`
4. Its `*.mount(...)` line in `js/app.js`

`Notification` and `Copy` are optional for the other components; they degrade silently without them.

## Notifications

```javascript
const id = Notification.show("Message", "success"); // success | info | warning | error
Notification.hide(id);

Notification.show("Message", "info", {
  duration: 5000,     // ms, 0 = never hide
  closable: true,
  showProgress: true,
  html: false,
});

Notification.track(tx, {          // ethers transaction
  label: "Send ETH",
  onSuccess: (receipt) => {},
  onError: (error) => {},
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
wallet.subscribe(() => {});           // any state change

wallet.isConnected();
wallet.getAddress();
wallet.getLastWallet();
wallet.getProviders();                // EIP-6963 details
wallet.getVisibleNetworks();          // [[key, config], ...]
wallet.getCurrentChainId();           // hex

await wallet.connectWallet(name);     // throws on failure
await wallet.switchNetwork(config);   // throws on failure
await wallet.disconnect();

await wallet.getAccount();
await wallet.getChainId();
wallet.getProvider();                 // EIP-1193
wallet.getEthersProvider();           // ethers BrowserProvider
wallet.getShortAddr(address);         // 0x123...abcd
await wallet.getResolvedName(address); // name or short address
await wallet.resolveName(address);     // { name, avatar, source } | null

wallet.setNameResolutionOrder(["ens", "gns", "wns"]);
wallet.getNameResolutionOrder();
```

## Theme

The page sets the initial theme inline in `<head>` to avoid a flash; `Theme.mount()` handles changes. State is stored in `localStorage.themeMode`.

```javascript
Theme.set("system"); // "system" | "light" | "dark"
Theme.get();
Theme.cycle();
```

Define the page colors:

```css
:root { --color-bg: #f5f5f5; --color-txt: #17202a; }
[data-theme="dark"] { --color-bg: #17202a; --color-txt: #f5f5f5; }
```

## Networks & RPC

```javascript
export const networkConfigs = {
  ethereum: network({
    name: "Ethereum",
    chainId: 1,
    rpcUrl: "https://ethereum-rpc.publicnode.com",
    icon: "./assets/img/eth.png",
    explorerUrl: "https://etherscan.io/tx/",
    showInUI: true,          // show in chain dropdown
    rpcConfigurable: true,   // show in RPC form
  }),
};
```

`network()` defaults both flags to `false`. Custom RPCs are saved in `localStorage` as `<network>-rpc`:

```javascript
import { getRpcUrl } from "./js/libs/dappkit.js";
const url = getRpcUrl("ethereum"); // custom or default
```

Optional: add `#rpc-toggle` and `#rpc-panel` (`.dk-accordion-panel`) to make the RPC form collapsible.

## Copy to Clipboard

```html
<button data-copy="0x742d35Cc...">Copy Address</button>
```

```javascript
Copy.mount();                      // enables [data-copy]
await Copy.copy("text", element);  // programmatic
```

## Browser Support

Chrome / Edge 90+, Firefox 88+, Safari 14+

## License

MIT — see the [license](../license) file.
