# VS Code VPN Toggle for Windows

A Visual Studio Code extension to easily toggle Windows VPN connections on/off.

![build deploy](https://github.com/MarcusFelling/vpn-toggle/actions/workflows/build-deploy.yml/badge.svg)

## ⚙️ Prerequisites

- Windows 10 or later
- Configured VPN connections in Windows

## ✅ Features

The extension provides three commands:

- `VPN: Select and Connect` - Shows a list of available VPN connections to choose from
- `VPN: Connect to Last Used` - Connects to the most recently used VPN
- `VPN: Disconnect Current` - Disconnects the current VPN connection

Access these commands through the Command Palette (Ctrl+Shift+P):

![Show Commands](./images/commands.png)

## 🚚 Release Notes

### 0.0.5

Add Win32 OS to extension manifest

### 0.0.4

Fix regression

### 0.0.3

Show "Select and Connect" command first

### 0.0.2

Support VS Code engines v1+

### 0.0.1

Initial release

---