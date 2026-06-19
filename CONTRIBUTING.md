# Contributing to Knight Chess Helper

First off — thank you for taking the time to contribute! 💙
Knight is an open-source project and every issue, idea and pull request helps.

Before diving in, the [**User Guide**](docs/USER_GUIDE.md) is the best place to understand how the extension is structured and what each feature does.

---

## 🚀 Ways to Contribute

### 🐛 Report a bug
Open an issue on the [Issues](https://github.com/physicalaff/Knight-Chess-Helper/issues) page and include:
- clear steps to reproduce,
- what you expected vs. what actually happened,
- your browser/version, and console logs if you have them.

### 💡 Suggest a feature
Open an issue describing the idea and the problem it solves. Mockups or examples are very welcome.

### 🔀 Submit a pull request
See the workflow below.

---

## 🔧 Development Setup

1. **Fork** the repository and clone your fork:
   ```bash
   git clone https://github.com/<your-username>/Knight-Chess-Helper.git
   cd Knight-Chess-Helper
   ```
2. **Create a branch** for your change:
   ```bash
   git checkout -b feature/my-cool-feature
   # or
   git checkout -b fix/my-bug-fix
   ```
3. **Load the extension** in Chrome via `chrome://extensions` → *Developer mode* → *Load unpacked* (select the project folder). Reload the extension after each change.

---

## ✅ Before You Open a PR

- **Keep modules focused.** Put logic where it belongs: board/cursor in `mouse.js`, engine helpers in `engine.js`, UI in `ui.js`, stats in `stats.js`, opening data in `book.js`.
- **Syntax-check your JavaScript.** Any modern JS toolchain works, e.g.:
  ```bash
  # with Bun
  bun build engine.js background.js ui.js mouse.js stats.js book.js --target=browser

  # or with Node
  node --check engine.js && node --check ui.js   # repeat per file
  ```
- **Write clean, self-documenting code** and keep commits small and descriptive.
- **Open the PR against `main`** with a short summary of what changed and why.

---

## 🎨 Code & Style Guidelines

- **Shared global scope.** All content scripts (`mouse.js`, `stats.js`, `book.js`, `engine.js`, `ui.js`) run in the same execution context on Chess.com. Prefix or namespace helpers (e.g. `sleep`, `rnd`) to avoid collisions.
- **Engine isolation.** Stockfish runs inside the background service worker / offscreen document. All communication goes through the Manifest V3 `chrome.runtime.sendMessage` API.
- **Styling.** UI styles live in the `STYLES` and `STYLES_V7` template strings in `ui.js`. The current design is a modern, minimal dark/light system with an indigo accent — keep new UI consistent with it, and respect `prefers-reduced-motion` for animations.

---

Thanks again for helping make Knight better! ⭐
