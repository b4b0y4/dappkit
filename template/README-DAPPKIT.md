# Dappkit Starter Template

A minimal dependency template for decentralized applications. No build tools required—just open `index.html` in your browser.

## Features

- **Theme Switcher**: Light/dark mode with system preference
- **Notifications**: Toast notifications with transaction tracking
- **Wallet Connect**: EIP-6963 compatible with multi-network support
- **Modal**: Alerts and confirmations
- **Copy**: One-click copy with visual feedback

## Quick Start

```javascript
import NotificationSystem from './js/notifications.js';
import { ConnectWallet } from './js/connect.js';
import Modal from './js/modal.js';
import Copy from './js/copy.js';

const wallet = new ConnectWallet();

wallet.onConnect((data) => {
  NotificationSystem.show('Connected!', 'success');
});

wallet.onChainChange(({ allowed }) => {
  if (!allowed) {
    Modal.alert('Please switch to a supported network', {
      title: 'Wrong Network'
    });
  }
});
```

## Components

### Notifications

```javascript
// Basic
NotificationSystem.show('Message', 'success'); // success, info, warning, danger

// Options
NotificationSystem.show('Message', 'info', {
  duration: 5000,      // ms (0 = never hide)
  closable: true,      // show X button
  showProgress: true,  // show progress bar
  html: false         // allow HTML
});

// Track transactions
NotificationSystem.track(txHash, chainId, rpcUrl, {
  label: 'Swap Tokens',
  onSuccess: (receipt) => console.log('Done!'),
  onError: (error) => console.error('Failed!')
});

// Clear
NotificationSystem.clearAll();
NotificationSystem.clearTransactions();
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
await wallet.getChainId();         // hex string
wallet.getProvider();              // EIP-1193 provider
wallet.getEthersProvider();        // ethers BrowserProvider
await wallet.disconnect();
```

### Modal

```javascript
// Alert (blocking)
await Modal.alert('Wrong network!', { title: 'Error' });

// Confirm (yes/no)
const confirmed = await Modal.confirm('Send ETH?', { title: 'Confirm' });

// Custom
Modal.show({
  title: 'Title',
  content: 'Content here',
  html: false,
  confirmText: 'OK',
  cancelText: 'Cancel',
  showCancel: true,
  showConfirm: true,
  onConfirm: () => {},
  onCancel: () => {}
});
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
import NotificationSystem from './js/notifications.js';
import { ConnectWallet } from './js/connect.js';
import Modal from './js/modal.js';

const wallet = new ConnectWallet();

wallet.onConnect(() => {
  NotificationSystem.show('Connected!', 'success');
});

wallet.onChainChange(({ allowed }) => {
  if (!allowed) {
    Modal.alert('Please switch to a supported network', {
      title: 'Wrong Network'
    });
  }
});

async function sendETH(to, amount) {
  const confirmed = await Modal.confirm(
    `Send ${amount} ETH to ${to}?`,
    { title: 'Confirm Transaction' }
  );

  if (!confirmed) return;

  try {
    const provider = wallet.getEthersProvider();
    const signer = await provider.getSigner();
    
    const tx = await signer.sendTransaction({
      to,
      value: ethers.parseEther(amount)
    });

    const chainId = await wallet.getChainId();
    const rpcUrl = Object.values(wallet.networkConfigs).find(
      n => n.chainId === parseInt(chainId, 16)
    )?.rpcUrl;

    NotificationSystem.track(tx.hash, parseInt(chainId, 16), rpcUrl, {
      label: `Send ${amount} ETH`
    });
  } catch (error) {
    NotificationSystem.show(error.message, 'danger');
  }
}
```

## HTML Setup

```html
<!-- CSS -->
<link rel="stylesheet" href="./assets/css/theme.css" />
<link rel="stylesheet" href="./assets/css/notifications.css" />
<link rel="stylesheet" href="./assets/css/connect.css" />
<link rel="stylesheet" href="./assets/css/modal.css" />
<link rel="stylesheet" href="./assets/css/copy.css" />

<!-- Containers (auto-inject if missing) -->
<div id="notificationContainer"></div>
<div id="modalContainer"></div>

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