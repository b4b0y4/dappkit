# starter-init

Initializer that scaffolds a project with a theme switcher and a clean notification system.

## About

This is a simple command-line tool to bootstrap a new project with a pre-configured template. The template includes:

- A theme switcher (`theme.js`, `theme.css`) for light/dark/system modes.
- A notification system (`notifications.js`, `notifications.css`) for modern, non-blocking toasts.
- A basic `index.html` to demonstrate the features.

This tool is designed for quick starts without any build tools.

## Usage

1.  **Link the tool for local development:**
    From inside the `starter-init` directory, run `npm link` to make the command available on your system.
    ```bash
    npm link
    ```

2.  **Run the initializer:**
    Use the `init-starter` command to create a new project in a specified directory.
    ```bash
    init-starter my-project
    ```
    This will create a new directory named `my-awesome-project` with the template files. If you want to initialize in the current directory, just run `init-starter`.

3.  **Start using your new project:**
    ```bash
    cd my-project
    ```
    Open `index.html` in your browser to see the starter template in action.
