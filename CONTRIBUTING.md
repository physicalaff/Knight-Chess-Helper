# Contributing to Knight — Chess Assistant

Thank you for your interest in contributing to **Knight — Chess Assistant**! 

To understand the core architecture, playstyle presets, anti-ban emulations, and setup procedures of the extension, please check the **[Official User Guide](docs/USER_GUIDE.md)** first.

---

## 🚀 How to Contribute

### 1. Reporting Bugs & Suggesting Features
*   Open an issue on the [Issues](https://github.com/physicalaff/Knight-Chess-Helper/issues) page.
*   Clearly describe the bug or feature, including steps to reproduce, actual vs. expected behavior, and console logs if possible.

### 2. Submitting Pull Requests
1.  **Fork the repository** and clone your fork locally.
2.  **Create a branch** for your changes:
    ```bash
    git checkout -b feature/my-cool-feature
    # or
    git checkout -b fix/my-bug-fix
    ```
3.  **Implement your changes**:
    *   Maintain clean, self-documenting code.
    *   Ensure any helper functions are placed inside correct files (e.g. mouse movement logic in `mouse.js`, engine helpers in `engine.js`, UI elements in `ui.js`).
4.  **Perform syntax checks**:
    Ensure JavaScript code compiles without errors:
    ```bash
    node -c engine.js background.js ui.js mouse.js stats.js book.js
    ```
5.  **Commit and push**:
    Keep commits descriptive and atomic.
6.  **Open a Pull Request** against the `main` branch of this repository.

---

## 🎨 Code Architecture Guidelines

*   **Content Scripts Scope**: All content scripts (`mouse.js`, `stats.js`, `book.js`, `engine.js`, `ui.js`) run in the same global execution context on Chess.com. Be careful with global variable names (e.g., prefix UI-specific helpers like `sleep` or `rnd` to avoid naming collisions).
*   **WebAssembly Engine**: The Stockfish engine runs inside a background service worker or offscreen document. Communication is managed through Manifest V3 `chrome.runtime.sendMessage` API.
*   **Aesthetics**: Any UI styling should be defined inside the `STYLES` CSS string block in `ui.js` using modern CSS and a premium glassmorphic dark-theme design.
