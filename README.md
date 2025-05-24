# CrossZones

![CrossZones Icon](assets/icon.png)

A modern, cross-platform desktop application built with Tauri, React, and TypeScript.

## 🌟 Features

- **Cross-Platform**: Runs natively on Windows, macOS, and Linux
- **Modern UI**: Built with React and TypeScript for a responsive, type-safe experience
- **Native Performance**: Powered by Tauri for optimal performance and smaller bundle sizes
- **Beautiful Design**: Custom icon and modern interface design

## 🚀 Getting Started

### Prerequisites

- Node.js (Latest LTS version recommended)
- Rust (Latest stable version)
- Platform-specific build tools:
  - Windows: Microsoft Visual Studio C++ Build Tools
  - macOS: Xcode Command Line Tools
  - Linux: Build essentials and WebKit development libraries

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/crosszones.git
   cd crosszones
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run tauri dev
   ```

### Building

To build the application for your platform:

```bash
npm run tauri build
```

The built application will be available in the `src-tauri/target/release` directory.

## 🛠️ Development

### Recommended IDE Setup

- [VS Code](https://code.visualstudio.com/) + 
  - [Tauri](https://marketplace.visualstudio.com/items?itemName=tauri-apps.tauri-vscode)
  - [rust-analyzer](https://marketplace.visualstudio.com/items?itemName=rust-lang.rust-analyzer)
  - [ESLint](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint)
  - [Prettier](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode)

### Project Structure

- `src/` - React application source code
- `src-tauri/` - Tauri backend code
- `assets/` - Application assets and icons
- `public/` - Static files

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- [Rectangle](https://rectangleapp.com/) for Mac, the original inspiration
