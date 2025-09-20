# dappkit

Initializer that scaffolds a decentralized application with a connect wallet component, a theme switcher and a clean notification system.

## About

This is a simple command-line tool to bootstrap a new project with a pre-configured template.

- **Theme Switcher**: A reusable theme switcher with single-click to toggle between light and dark modes, and a double-click to reset to the system preference.
- **Notification System**: Modern, non-blocking slide-in notifications (toasts) with duration, a close button, and a progress bar.
- **Web3 Wallet Connection**: EIP-6963 compatible wallet connection with multi-network support, persistent state, and ENS integration.

This tool is designed for quick starts without any build tools.

## Usage

1.  **Link the tool for local development:**
    From inside the `dappkit` directory, run `npm link` to make the command available on your system.
    ```bash
    npm link
    ```

2.  **Run the initializer:**
    Use the `dappkit` command to create a new project in a specified directory.
    ```bash
    dappkit my-project
    ```
    This will create a new directory named `my-project` with the template files. If you want to initialize in the current directory, just run `dappkit .`

3.  **Start using your new project:**
    ```bash
    cd my-project
    ```
    Start a local development server to see the starter template in action.
