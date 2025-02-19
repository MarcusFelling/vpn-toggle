import * as vscode from 'vscode';
import { vpnService } from './vpnUtils';

let disposables: vscode.Disposable[] = [];

// Called when the extension is activated.
export function activate(context: vscode.ExtensionContext) {
    // Clear previously registered commands.
    disposables.forEach(d => {
        try {
            d.dispose();
        } catch (error) {
            console.error('Error disposing command:', error);
        }
    });
    disposables = [];

    let lastUsedVPN = context.globalState.get<string>('lastUsedVPN');

    // Helper to show error messages.
    const showError = (error: unknown) => {
        const message = error instanceof Error ? error.message : 'Unknown error occurred';
        vscode.window.showErrorMessage(`VPN Error: ${message}`);
    };

    // Register connect command with progress indicator.
    let connectCmd = vscode.commands.registerCommand('vpn-toggle.connectVPN', async () => {
        if (!lastUsedVPN) {
            vscode.window.showErrorMessage('No VPN connection has been used yet. Please select a VPN first.');
            return;
        }
        const currentVPN = lastUsedVPN;
        await vscode.window.withProgress({ title: `Connecting to VPN: ${currentVPN}`, location: vscode.ProgressLocation.Notification }, async () => {
            await vpnService.connect(currentVPN);
        });
        vscode.window.showInformationMessage(`Connected to VPN: ${currentVPN}`);
    });
    // Register disconnect command with progress indicator.
    let disconnectCmd = vscode.commands.registerCommand('vpn-toggle.disconnectVPN', async () => {
        if (!lastUsedVPN) {
            vscode.window.showErrorMessage('No VPN connection has been used yet.');
            return;
        }
        const currentVPN = lastUsedVPN;
        await vscode.window.withProgress({ title: `Disconnecting from VPN: ${currentVPN}`, location: vscode.ProgressLocation.Notification }, async () => {
            await vpnService.disconnect(currentVPN);
        });
        vscode.window.showInformationMessage(`Disconnected from VPN: ${currentVPN}`);
    });

    // Register select/connect command with progress indicator.
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
                await vscode.window.withProgress({ title: `Connecting to VPN: ${selected.label}`, location: vscode.ProgressLocation.Notification }, async () => {
                    await vpnService.connect(selected.label);
                });
                lastUsedVPN = selected.label;
                await context.globalState.update('lastUsedVPN', selected.label);
                vscode.window.showInformationMessage(`Connected to VPN: ${selected.label}`);
            }
        } catch (error) {
            showError(error);
        }
    });

    // Add commands to subscriptions.
    disposables = [selectCmd, connectCmd, disconnectCmd];
    context.subscriptions.push(...disposables);
}

// Called when the extension is deactivated.
export function deactivate() {
    // Dispose registered commands.
    disposables.forEach(d => {
        try {
            d.dispose();
        } catch (error) {
            console.error('Error disposing command:', error);
        }
    });
    disposables = [];
}
