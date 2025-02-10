import * as vscode from 'vscode';
import { vpnService } from './vpnUtils';

let disposables: vscode.Disposable[] = [];

export function activate(context: vscode.ExtensionContext) {
    // Clear any existing commands
    disposables.forEach(d => {
        try {
            d.dispose();
        } catch (error) {
            console.error('Error disposing command:', error);
        }
    });
    disposables = [];

    let lastUsedVPN = context.globalState.get<string>('lastUsedVPN');

    const showError = (error: unknown) => {
        const message = error instanceof Error ? error.message : 'Unknown error occurred';
        vscode.window.showErrorMessage(`VPN Error: ${message}`);
    };

    let connectCmd = vscode.commands.registerCommand('vpn-toggle.connectVPN', async () => {
        if (!lastUsedVPN) {
            vscode.window.showErrorMessage('No VPN connection has been used yet. Please select a VPN first.');
            return;
        }

        try {
            await vpnService.connect(lastUsedVPN);
            vscode.window.showInformationMessage(`Connected to VPN: ${lastUsedVPN}`);
        } catch (error) {
            showError(error);
        }
    });

    let disconnectCmd = vscode.commands.registerCommand('vpn-toggle.disconnectVPN', async () => {
        if (!lastUsedVPN) {
            vscode.window.showErrorMessage('No VPN connection has been used yet.');
            return;
        }

        try {
            await vpnService.disconnect(lastUsedVPN);
            vscode.window.showInformationMessage(`Disconnected from VPN: ${lastUsedVPN}`);
        } catch (error) {
            showError(error);
        }
    });

    let selectCmd = vscode.commands.registerCommand('vpn-toggle.selectAndConnectVPN', async () => {
        try {
            const connections = await vpnService.getConnections();
            const items = connections.map(c => ({
                label: c.name,
                description: c.status
            }));
            
            const selected = await vscode.window.showQuickPick(items, {
                placeHolder: 'Select VPN connection',
                ignoreFocusOut: true
            });

            if (selected) {
                await vpnService.connect(selected.label);
                lastUsedVPN = selected.label;
                await context.globalState.update('lastUsedVPN', selected.label);
                vscode.window.showInformationMessage(`Connected to VPN: ${selected.label}`);
            }
        } catch (error) {
            showError(error);
        }
    });

    disposables = [connectCmd, disconnectCmd, selectCmd];
    context.subscriptions.push(...disposables);
}

export function deactivate() {
    // Dispose all commands
    disposables.forEach(d => {
        try {
            d.dispose();
        } catch (error) {
            console.error('Error disposing command:', error);
        }
    });
    disposables = [];
}
