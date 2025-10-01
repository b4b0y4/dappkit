# dappkit

A minimal dependency starter template for decentralized applications. No build tools required.

## About

Simple CLI tool to scaffold a dapp with essential UI components:

- **Theme Switcher**: Light/dark mode with system preference support
- **Notifications**: Toast notifications with transaction tracking
- **Wallet Connect**: EIP-6963 compatible with multi-network support, ENS resolution, and copy address
- **Copy**: One-click copy with visual feedback

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
