# Components Quick Reference

Quick reference guide for all dappkit components.

## Import All Components

```javascript
import NotificationSystem from './js/notifications.js';
import { ConnectWallet } from './js/connect.js';
import Modal from './js/modal.js';
import Copy from './js/copy.js';
```

---

## 🔔 Notifications & Transactions

```javascript
// Basic notifications
NotificationSystem.show('Message here', 'success');
NotificationSystem.show('Message here', 'info');
NotificationSystem.show('Message here', 'warning');
NotificationSystem.show('Message here', 'danger');

// With options
NotificationSystem.show('Message', 'info', {
  duration: 7000,        // Auto-hide after 7s (0 = never)
  closable: true,        // Show close button
  showProgress: true,    // Show progress bar
  html: false           // Allow HTML content
});

// Track transactions
NotificationSystem.track(txHash, chainId, rpcUrl, {
  label: 'Swap Tokens',
  onPending: () => console.log('Pending'),
  onSuccess: (receipt) => console.log('Success', receipt),
  onError: (error) => console.error('Failed', error),
  autoRemove: true,      // Auto-remove when done
  removeDelay: 5000      // Delay before removal (ms)
});

// Clear notifications
NotificationSystem.clearAll();              // Clear everything
NotificationSystem.clearTransactions();     // Clear only transactions
```

---

## 🔗 Wallet Connection

```javascript
const wallet = new ConnectWallet();

// Callbacks
wallet.onConnect((data) => {
  console.log(data.accounts, data.chainId);
});

wallet.onDisconnect(() => {
  console.log('Disconnected');
});

wallet.onChainChange(({ chainId, name, allowed }) => {
  console.log(chainId, name, allowed);
});

// API
wallet.isConnected();              // boolean
await wallet.getAccount();         // address or null
await wallet.getChainId();         // hex string
wallet.getProvider();              // EIP-1193 provider
wallet.getEthersProvider();        // ethers BrowserProvider
await wallet.disconnect();         // disconnect wallet
```

---

## 💬 Modals

```javascript
// Confirm dialog
const confirmed = await Modal.confirm(
  'Are you sure?',
  { title: 'Confirm' }
);

// Alert dialog
await Modal.alert(
  'Success!',
  { title: 'Alert' }
);

// Custom modal
Modal.show({
  title: 'Custom Modal',
  content: 'Your content here',
  html: false,              // Allow HTML
  confirmText: 'Confirm',
  cancelText: 'Cancel',
  showCancel: true,
  showConfirm: true,
  closeOnOverlay: true,     // Close on overlay click
  onConfirm: () => {},
  onCancel: () => {},
  onClose: () => {}
});

// API
Modal.close(modalId);   // Close specific modal
Modal.closeAll();       // Close all modals
```

---

## 📋 Copy to Clipboard

```javascript
// HTML - automatic
<button data-copy="0x742d35Cc...">Copy Address</button>
<span data-copy="Some text">Copy</span>

// JavaScript
await Copy.copy('Text to copy');
await Copy.copyToClipboard('Text', element);
```

---

## Complete Example

```javascript
import NotificationSystem from './js/notifications.js';
import { ConnectWallet } from './js/connect.js';
import Modal from './js/modal.js';

const wallet = new ConnectWallet();

wallet.onConnect((data) => {
  NotificationSystem.show('Wallet connected!', 'success');
});

async function sendTransaction(to, amount) {
  // Confirm first
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

---

## HTML Setup

Include CSS files:

```html
<link rel="stylesheet" href="./assets/css/theme.css" />
<link rel="stylesheet" href="./assets/css/notifications.css" />
<link rel="stylesheet" href="./assets/css/connect.css" />
<link rel="stylesheet" href="./assets/css/modal.css" />
<link rel="stylesheet" href="./assets/css/copy.css" />
```

Add containers:

```html
<div id="notificationContainer"></div>
<div id="modalContainer"></div>
```

Wallet widget:

```html
<div class="connect-wrapper">
  <div class="connect-widget">
    <button id="connect-btn" class="connect-btn">Connect</button>
    <div id="connect-wallet-list" class="connect-wallet-list">
      <div class="connect-chain-list" id="connect-chain-list"></div>
      <div id="connect-get-wallet" class="connect-get-wallet">
        <a href="https://ethereum.org/en/wallets/" target="_blank">
          Get a Wallet!
        </a>
      </div>
      <div id="connect-wallets" class="connect-wallets"></div>
    </div>
  </div>
</div>
```

---

## Tips

- All components auto-initialize
- No manual DOM setup needed
- Containers auto-inject if missing
- Copy works on any `[data-copy]` element
- Notifications and transactions appear in same container (bottom-left)
- Explorer URLs configured in `connect-config.js`

---

For detailed documentation, see [README-DAPPKIT.md](./README-DAPPKIT.md)