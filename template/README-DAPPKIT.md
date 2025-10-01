# Dappkit Starter Template

A minimal dependency template for decentralized applications with essential UI components. No build tools required—just open `index.html` in your browser.

## Features

- **Theme Switcher**: Seamless light/dark mode toggle with system preference support
- **Notification System**: Modern toast notifications with transaction tracking
- **Wallet Connection**: EIP-6963 compatible wallet connection with multi-network support
- **Modal System**: Customizable modals for confirmations, alerts, and dialogs
- **Copy to Clipboard**: One-click copy functionality with visual feedback

## File Structure

```
.
├── index.html
├── README-DAPPKIT.md
├── assets/
│   ├── css/
│   │   ├── connect.css
│   │   ├── copy.css
│   │   ├── modal.css
│   │   ├── notifications.css
│   │   └── theme.css
│   └── img/
└── js/
    ├── connect.js
    ├── connect-config.js
    ├── copy.js
    ├── main.js
    ├── modal.js
    ├── notifications.js
    ├── theme.js
    └── libs/
        └── ethers.min.js
```

## Quick Start

1. Open `index.html` in your browser
2. Click the sun/moon icon to toggle theme
3. Connect your Web3 wallet using the connect button
4. Try the demo buttons to see all components in action

## Components

### 1. Theme Switcher

Automatically initialized theme switcher with persistence.

**Features:**
- Single-click: Toggle between light and dark mode
- Double-click: Reset to system preference
- Persists across sessions

**Usage:**
```javascript
// Works automatically once included
// No setup required
```

---

### 2. Notification System

Beautiful slide-in toast notifications with transaction tracking capabilities.

**Import:**
```javascript
import NotificationSystem from './js/notifications.js';
```

**Basic Notifications:**
```javascript
// Simple notifications
NotificationSystem.show('Operation completed!', 'success');
NotificationSystem.show('Please check your input', 'warning');
NotificationSystem.show('Something went wrong!', 'danger');
NotificationSystem.show('Here is some information', 'info');
```

**Advanced Options:**
```javascript
// Persistent notification (won't auto-hide)
NotificationSystem.show('Important message', 'info', { 
  duration: 0 
});

// Custom duration (7 seconds)
NotificationSystem.show('Custom timing', 'success', { 
  duration: 7000 
});

// No close button or progress bar
NotificationSystem.show('Clean message', 'warning', {
  closable: false,
  showProgress: false
});

// HTML content
NotificationSystem.show('<strong>Bold</strong> message', 'info', {
  html: true
});
```

**Transaction Tracking:**
```javascript
// Track a transaction
NotificationSystem.track(txHash, chainId, rpcUrl, {
  label: 'Token Swap',
  onPending: () => {
    console.log('Transaction submitted');
  },
  onSuccess: (receipt) => {
    console.log('Transaction confirmed:', receipt);
  },
  onError: (error) => {
    console.error('Transaction failed:', error);
  }
});
```

**Full Transaction Example:**
```javascript
async function sendTransaction() {
  const provider = wallet.getEthersProvider();
  const signer = await provider.getSigner();
  
  const tx = await signer.sendTransaction({
    to: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
    value: ethers.parseEther('0.1')
  });

  const chainId = await wallet.getChainId();
  const rpcUrl = Object.values(wallet.networkConfigs).find(
    n => n.chainId === parseInt(chainId, 16)
  )?.rpcUrl;

  NotificationSystem.track(tx.hash, parseInt(chainId, 16), rpcUrl, {
    label: 'Send ETH'
  });
}
```

**Notification Types:**
- `success` - Green (successful operations)
- `info` - Blue (informational messages)
- `warning` - Orange (warnings)
- `danger` - Red (errors)

**Notification Options:**
| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `duration` | number | `5000` | Auto-hide delay in ms (0 = persistent) |
| `closable` | boolean | `true` | Show close button |
| `showProgress` | boolean | `true` | Show progress bar |
| `html` | boolean | `false` | Allow HTML content |

**Transaction Options:**
| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `label` | string | `'Transaction'` | Display label for the transaction |
| `onPending` | function | `null` | Called when transaction is pending |
| `onSuccess` | function | `null` | Called when transaction succeeds |
| `onError` | function | `null` | Called when transaction fails |
| `autoRemove` | boolean | `true` | Auto-remove after completion |
| `removeDelay` | number | `5000` | Delay before auto-removal (ms) |

**Methods:**
```javascript
// Clear all notifications
NotificationSystem.clearAll();

// Clear only transaction notifications
NotificationSystem.clearTransactions();
```

---

### 3. Connect Wallet

EIP-6963 compatible wallet connection with multi-network support.

**Import:**
```javascript
import { ConnectWallet } from './js/connect.js';
```

**Setup:**
```javascript
const wallet = new ConnectWallet();

// Hook up callbacks
wallet.onConnect((data) => {
  console.log('Connected:', data.accounts, data.chainId);
});

wallet.onDisconnect(() => {
  console.log('Disconnected');
});

wallet.onChainChange(({ chainId, name, allowed }) => {
  console.log(`Chain changed to ${name}`, allowed);
});
```

**HTML Structure:**
```html
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

**API Methods:**
```javascript
// Check connection status
wallet.isConnected(); // returns boolean

// Get current account
const account = await wallet.getAccount(); // returns address or null

// Get chain ID
const chainId = await wallet.getChainId(); // returns hex string

// Get provider instances
const provider = wallet.getProvider(); // raw EIP-1193 provider
const ethersProvider = wallet.getEthersProvider(); // ethers.js BrowserProvider

// Disconnect wallet
await wallet.disconnect();
```

**Features:**
- 🔗 EIP-6963 wallet discovery
- 🌐 Multi-network support
- 💾 Persistent state
- 👤 ENS resolution
- 📋 Copy address functionality
- 📱 Responsive design

---

### 4. Modal System

Customizable modals for confirmations, alerts, and custom content.

**Import:**
```javascript
import Modal from './js/modal.js';
```

**Confirm Dialog:**
```javascript
const confirmed = await Modal.confirm(
  'Are you sure you want to proceed?',
  { title: 'Confirm Action' }
);

if (confirmed) {
  // User clicked confirm
} else {
  // User clicked cancel or closed modal
}
```

**Alert Dialog:**
```javascript
await Modal.alert('Operation completed successfully!', {
  title: 'Success'
});
```

**Custom Modal:**
```javascript
Modal.show({
  title: 'Custom Modal',
  content: 'Your custom content here',
  confirmText: 'OK',
  cancelText: 'Cancel',
  showCancel: true,
  showConfirm: true,
  onConfirm: () => {
    console.log('Confirmed');
  },
  onCancel: () => {
    console.log('Cancelled');
  },
  onClose: () => {
    console.log('Modal closed');
  }
});
```

**HTML Content:**
```javascript
Modal.show({
  title: 'Rich Content',
  content: `
    <div>
      <p>This supports <strong>HTML</strong> content!</p>
      <input type="text" placeholder="Enter something..." />
    </div>
  `,
  html: true
});
```

**Options:**
| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `title` | string | `''` | Modal title |
| `content` | string | `''` | Modal content |
| `html` | boolean | `false` | Allow HTML in content |
| `confirmText` | string | `'Confirm'` | Confirm button text |
| `cancelText` | string | `'Cancel'` | Cancel button text |
| `showCancel` | boolean | `true` | Show cancel button |
| `showConfirm` | boolean | `true` | Show confirm button |
| `onConfirm` | function | `null` | Called on confirm |
| `onCancel` | function | `null` | Called on cancel |
| `onClose` | function | `null` | Called when modal closes |
| `closeOnOverlay` | boolean | `true` | Close when clicking overlay |

**Methods:**
```javascript
// Close specific modal
Modal.close(modalId);

// Close all modals
Modal.closeAll();
```

---

### 5. Copy to Clipboard

One-click copy functionality with visual feedback.

**Import:**
```javascript
import Copy from './js/copy.js';
```

**HTML Usage:**
```html
<!-- Automatically works with data-copy attribute -->
<button data-copy="0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb">
  Copy Address
</button>

<span data-copy="Hello World">Copy Text</span>

<div data-copy="Some long content here...">
  Click to copy
</div>
```

**JavaScript Usage:**
```javascript
// Programmatic copy
await Copy.copy('Text to copy');

// With element for visual feedback
const element = document.querySelector('#my-button');
await Copy.copyToClipboard('Text to copy', element);
```

**Features:**
- ✨ Automatic initialization
- 👆 Works on any element with `data-copy`
- 💚 Visual "Copied!" feedback
- 📋 Fallback for older browsers
- 🎯 Auto-observes DOM changes

---

## Complete Example

Here's a complete example combining all components:

```javascript
import NotificationSystem from './js/notifications.js';
import { ConnectWallet } from './js/connect.js';
import Modal from './js/modal.js';
import Copy from './js/copy.js';

const wallet = new ConnectWallet();

// Setup wallet callbacks
wallet.onConnect((data) => {
  const account = data.accounts[0];
  const shortAccount = `${account.slice(0, 6)}...${account.slice(-4)}`;
  NotificationSystem.show(
    `Connected with ${shortAccount}`,
    'success'
  );
});

wallet.onDisconnect(() => {
  NotificationSystem.show('Wallet disconnected', 'warning');
});

wallet.onChainChange(({ chainId, name, allowed }) => {
  if (!allowed) {
    NotificationSystem.show(`Chain ${chainId} not supported`, 'danger');
    return;
  }
  NotificationSystem.show(`Switched to ${name}`, 'info');
});

// Send transaction with confirmation
async function sendETH(toAddress, amount) {
  const confirmed = await Modal.confirm(
    `Send ${amount} ETH to ${toAddress}?`,
    { title: 'Confirm Transaction' }
  );

  if (!confirmed) return;

  try {
    const provider = wallet.getEthersProvider();
    const signer = await provider.getSigner();

    const tx = await signer.sendTransaction({
      to: toAddress,
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

// Export for global access
window.walletConnect = wallet;
window.sendETH = sendETH;
```

## Customization

### Theme Colors

Edit CSS variables in your stylesheet:

```css
:root {
  --color-bg: #f5f5f5;
  --color-txt: #17202a;
  --primary-color: rgb(75, 186, 231);
}

[data-theme="dark"] {
  --color-bg: #17202a;
  --color-txt: #f5f5f5;
}
```

### Network Configuration

Edit `connect-config.js` to add/modify supported networks:

```javascript
export const networkConfigs = {
  ethereum: {
    name: "Ethereum",
    chainId: 1,
    chainIdHex: "0x1",
    rpcUrl: "https://ethereum-rpc.publicnode.com",
    icon: "./assets/img/eth.png",
    explorerUrl: "https://etherscan.io/tx/",
    showInUI: true,
  },
  // Add your networks here...
};
```

**Note:** The `explorerUrl` is used for transaction tracking links.

## Dependencies

- **ethers.js v6** - Web3 functionality (bundled in `libs/ethers.min.js`)

## Browser Support

- Modern browsers with ES6+ support
- Chrome/Edge 90+
- Firefox 88+
- Safari 14+

## License

MIT License - See [license](../license) file for details.

## Contributing

This is a starter template. Feel free to customize and extend it for your dapp needs!