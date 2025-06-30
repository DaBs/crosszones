<p align="center" dir="auto">
<picture>
    <source media="(prefers-color-scheme: dark)" srcset="assets/logo-white.png">
    <source media="(prefers-color-scheme: light)" srcset="assets/logo-black.png">
    <img src="assets/logo-black.png">
  </picture>
<img src="./assets/screenshot.png" alt="CrossZones" />
</p>

Simple cross-platform window moving and resizing utility using shortcuts.

## 📲 Installation

Download the latest release installer for your OS in the [Release](https://github.com/DaBs/crosszones/releases)

## 📋 Features
|                    | Windows   | macOS  | Linux   |
|--------------------|-----------|--------|---------|
| Window Positioning | ✅       | ✅     | ❌     |
| Corner Controls    | ✅       | ✅     | ❌     |
| Window Sizing      | ❌       | ❌     | ❌     |
| Third Controls     | ✅       | ✅     | ❌     |
| Fourth Controls    | ✅       | ✅     | ❌     |
| Sixth Controls     | ✅       | ✅     | ❌     |
| Movement Controls  | ❌       | ❌     | ❌     |

## 🚀 Development

### Prerequisites

- Node.js (Latest LTS version recommended)
- Rust (Latest stable version)
- Platform-specific build tools:
  - Windows: Microsoft Visual Studio C++ Build Tools
  - macOS: Xcode Command Line Tools
  - Linux: Build essentials and WebKit development libraries

### Local development

1. Clone the repository:
   ```bash
   git clone https://github.com/DaBs/crosszones.git
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

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- [Rectangle](https://rectangleapp.com/) for Mac, the original inspiration
