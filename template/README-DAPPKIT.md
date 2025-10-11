# Dappkit Starter Template

A minimal dependency template for decentralized applications. No build tools required—just open `index.html` in your browser.

## Features

- **Theme Switcher**: Light/dark mode with system preference
- **Notifications**: Toast notifications with transaction tracking
- **Wallet Connect**: EIP-6963 compatible with multi-network support
- **RPC Modal**: View, add, and manage custom RPC URLs
- **Copy**: One-click copy with visual feedback

## Quick Start

```javascript
import { ethers } from "./libs/ethers.min.js";
import { networkConfigs } from "./networkConfigs.js";
import Notification from './js/notifications.js';
import { ConnectWallet } from './js/connect.js';
import Copy from './js/copy.js';
import { getRpcUrl } from './js/rpcmodal.js';

const wallet = new ConnectWallet();

wallet.onConnect((data) => {
  Notification.show('Connected!', 'success');
});

wallet.onChainChange(({ chainId, allowed }) => {
  if (!allowed) {
    Notification.show(
      `Chain ${chainId} is not supported`,
      'danger'
    );
  }
});
```

## Components

### Notifications

```javascript
// Basic
Notification.show('Message', 'success'); // success, info, warning, danger

// Options
Notification.show('Message', 'info', {
  duration: 5000,      // ms (0 = never hide)
  closable: true,      // show X button
  showProgress: true,  // show progress bar
  html: false         // allow HTML
});

// Track transactions
Notification.track(txHash, chainId, rpcUrl, {
  label: 'Swap Tokens',
  onSuccess: (receipt) => console.log('Done!'),
  onError: (error) => console.error('Failed!')
});

// Clear
Notification.clearAll();
Notification.clearTransactions();
```

### Wallet Connection

```javascript
const wallet = new ConnectWallet();

// Callbacks
wallet.onConnect((data) => console.log(data));
wallet.onDisconnect(() => console.log('Disconnected'));
wallet.onChainChange(({ chainId, name, allowed }) => {});

// API
wallet.isConnected();              // boolean
await wallet.getAccount();         // address or null
await wallet.getChainId();         // numeric id
wallet.getProvider();              // EIP-1193 provider
wallet.getEthersProvider();        // ethers BrowserProvider
await wallet.disconnect();
```

### RPC Modal

```javascript
import { getRpcUrl } from './js/rpcmodal.js';

// Get RPC URL (custom or default)
const rpcUrl = getRpcUrl('ethereum');

// Modal opens automatically via settings button
// Custom URLs saved to localStorage
```

### Copy to Clipboard

```html
<!-- HTML (automatic) -->
<button data-copy="0x742d35Cc...">
  <svg>...</svg>
  Copy Address
</button>
```

```javascript
// JavaScript
await Copy.copy('Text to copy');
await Copy.copyToClipboard('Text', element);
```

## Complete Example

```javascript
import Notification from './js/notifications.js';
import { ConnectWallet } from './js/connect.js';
import { getRpcUrl } from './js/rpcmodal.js';

const wallet = new ConnectWallet();

wallet.onConnect(() => {
  Notification.show('Connected!', 'success');
});

wallet.onChainChange(({ chainId, allowed }) => {
  if (!allowed) {
    Notification.show(
      `Chain ${chainId} is not supported`,
      'danger'
    );
  }
});

async function sendETH(to, amount) {

  try {
    const provider = wallet.getEthersProvider();
    const signer = await provider.getSigner();

    const tx = await signer.sendTransaction({
      to,
      value: ethers.parseEther(amount)
    });

    const chainId = await wallet.getChainId();
    const network = Object.keys(wallet.networkConfigs).find(
      key => wallet.networkConfigs[key].chainId === chainId
    );
    const rpcUrl = getRpcUrl(network);

    Notification.track(tx.hash, chainId, rpcUrl, {
      label: `Send ${amount} ETH`
    });
  } catch (error) {
    Notification.show(error.message, 'danger');
  }
}
```

## HTML Setup

```html
<!-- CSS -->
<link rel="stylesheet" href="./assets/css/theme.css" />
<link rel="stylesheet" href="./assets/css/notifications.css" />
<link rel="stylesheet" href="./assets/css/connect.css" />
<link rel="stylesheet" href="./assets/css/rpcmodal.css" />
<link rel="stylesheet" href="./assets/css/copy.css" />

<!-- Containers (auto-inject if missing) -->
<div id="notificationContainer"></div>

<!-- Wallet Widget -->
<div class="connect-wrapper">
  <div class="connect-widget">
    <button id="connect-btn" class="connect-btn">Connect</button>
    <div id="connect-wallet-list" class="connect-wallet-list">
      <div class="connect-chain-list" id="connect-chain-list"></div>
      <div id="connect-get-wallet" class="connect-get-wallet">
        <a href="https://ethereum.org/en/wallets/" target="_blank">Get a Wallet!</a>
      </div>
      <div id="connect-wallets" class="connect-wallets"></div>
    </div>
  </div>
</div>

<!-- RPC Modal -->
<div id="rpc-modal" class="rpc-modal">
  <div class="rpc-modal-content">
    <span class="rpc-close-btn">&times;</span>
    <h2>RPC Settings</h2>
    <div id="rpc-inputs"></div>
    <button id="save-rpc-btn">Save</button>
  </div>
</div>

<!-- Settings Button -->
<button id="settings-btn" aria-label="RPC Settings">
  <svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.33">
    <circle cx="8" cy="8" r="2" />
    <path d="M8 1v2M8 13v2M13.66 4.34l-1.41 1.41M3.76 11.24l-1.41 1.41M15 8h-2M3 8H1M13.66 11.66l-1.41-1.41M3.76 4.76L2.34 3.34" />
  </svg>
</button>

<!-- Theme Button -->
<button id="theme-btn" aria-label="Toggle theme">
  <svg
    id="theme-light"
    xmlns="http://www.w3.org/2000/svg"
    width="26"
    height="26"
    viewBox="0 0 16 16"
    fill="none"
    stroke="currentColor"
    stroke-width="1.33"
  >
    <circle cx="8" cy="8" r="3.33" />
    <path
      d="M8 0.67v1.33M8 14v1.33M2.81 2.81l0.95 0.95M12.24 12.24l0.95 0.95M0.67 8h1.33M14 8h1.33M2.81 13.19l0.95-0.95M12.24 3.76l0.95-0.95"
    />
  </svg>
  <svg
    id="theme-dark"
    xmlns="http://www.w3.org/2000/svg"
    width="26"
    height="26"
    viewBox="0 0 16 16"
    fill="none"
    stroke="currentColor"
    stroke-width="1.33"
  >
    <path d="M14 8.53A6 6 0 1 1 7.47 2 4.67 4.67 0 0 0 14 8.53z" />
  </svg>
  <svg
    id="theme-system"
    xmlns="http://www.w3.org/2000/svg"
    width="26"
    height="26"
    viewBox="0 0 16 16"
    fill="none"
    stroke="currentColor"
    stroke-width="1.33"
  >
    <rect
      x="1.33"
      y="2"
      width="13.33"
      height="9.33"
      rx="1.33"
      ry="1.33"
    />
    <line x1="5.33" y1="14" x2="10.67" y2="14" />
    <line x1="8" y1="11.33" x2="8" y2="14" />
  </svg>
</button>

<!-- Scripts -->
<script src="./js/theme.js" defer></script>
<script type="module" src="./js/rpcmodal.js"></script>
<script type="module" src="./js/main.js"></script>
```

## Configuration

### Networks

Edit `connect-config.js`:

```javascript
export const networkConfigs = {
  ethereum: {
    name: "Ethereum",
    chainId: 1,
    chainIdHex: "0x1",
    rpcUrl: "https://ethereum-rpc.publicnode.com",
    icon: "./assets/img/eth.png",
    explorerUrl: "https://etherscan.io/tx/",
    showInUI: true
  }
};
```

### Theme

Edit CSS variables:

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

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+

## License

MIT License - See [license](../license) file for details.
