import * as vscode from 'vscode';
import * as sinon from 'sinon';
import { vpnService, VPNConnection } from '../vpnUtils';
import { strictEqual } from 'assert';
import { activate, deactivate } from '../extension';

suite('VPN Toggle Extension Test Suite', () => {
    let showErrorMessageStub: sinon.SinonStub;
    let showInfoMessageStub: sinon.SinonStub;
    let showQuickPickStub: sinon.SinonStub;
    let globalState: { [key: string]: any };
    let context: vscode.ExtensionContext;
    let registerCommandStub: sinon.SinonStub;

    setup(async () => {
        // Clear existing command registrations
        await vscode.commands.executeCommand('workbench.action.reloadWindow');
        
        showErrorMessageStub = sinon.stub(vscode.window, 'showErrorMessage');
        showInfoMessageStub = sinon.stub(vscode.window, 'showInformationMessage');
        showQuickPickStub = sinon.stub(vscode.window, 'showQuickPick');
        registerCommandStub = sinon.stub(vscode.commands, 'registerCommand').callThrough();
        
        globalState = {};
        context = {
            subscriptions: [],
            globalState: {
                get: (key: string) => globalState[key],
                update: (key: string, value: any) => {
                    globalState[key] = value;
                    return Promise.resolve();
                }
            }
        } as any;

        // Activate the extension with our mocked context
        await activate(context);
    });

    teardown(async () => {
        // Deactivate the extension
        await deactivate();
        
        // Dispose all commands
        for (const subscription of context.subscriptions) {
            try {
                subscription.dispose();
            } catch (error) {
                console.error('Error disposing subscription:', error);
            }
        }
        
        sinon.restore();
        globalState = {};
        
        // Clear command registrations
        await vscode.commands.executeCommand('workbench.action.reloadWindow');
    });

    test('Should show error when connecting without last used VPN', async () => {
        await vscode.commands.executeCommand('vpn-toggle.connectVPN');
        strictEqual(
            showErrorMessageStub.calledWith('No VPN connection has been used yet. Please select a VPN first.'),
            true,
            'Error message not shown correctly'
        );
    });

    test('Should connect to last used VPN', async () => {
        const connectStub = sinon.stub(vpnService, 'connect').resolves();
        globalState['lastUsedVPN'] = 'TestVPN';
        
        await vscode.commands.executeCommand('vpn-toggle.connectVPN');
        
        strictEqual(connectStub.calledWith('TestVPN'), true, 'VPN connect not called with correct name');
        strictEqual(
            showInfoMessageStub.calledWith('Connected to VPN: TestVPN'),
            true,
            'Success message not shown correctly'
        );
    });

    test('Should handle connection error', async () => {
        const error = new Error('Connection failed');
        sinon.stub(vpnService, 'connect').rejects(error);
        globalState['lastUsedVPN'] = 'TestVPN';
        
        await vscode.commands.executeCommand('vpn-toggle.connectVPN');
        
        strictEqual(
            showErrorMessageStub.calledWith(`VPN Error: ${error.message}`),
            true,
            'Error message not shown correctly'
        );
    });

    test('Should show available VPN connections in quick pick', async () => {
        const connections: VPNConnection[] = [
            { name: 'VPN1', status: 'Disconnected' },
            { name: 'VPN2', status: 'Connected' }
        ];
        sinon.stub(vpnService, 'getConnections').resolves(connections);
        showQuickPickStub.resolves({ label: 'VPN1', description: 'Disconnected' });
        
        await vscode.commands.executeCommand('vpn-toggle.selectAndConnectVPN');
        
        const expectedQuickPickItems = [
            { label: 'VPN1', description: 'Disconnected' },
            { label: 'VPN2', description: 'Connected' }
        ];
        strictEqual(
            showQuickPickStub.calledWithMatch(sinon.match.array.deepEquals(expectedQuickPickItems)),
            true,
            'Quick pick not shown with correct items'
        );
    });

    test('Should disconnect from VPN', async () => {
        const disconnectStub = sinon.stub(vpnService, 'disconnect').resolves();
        globalState['lastUsedVPN'] = 'TestVPN';
        
        await vscode.commands.executeCommand('vpn-toggle.disconnectVPN');
        
        strictEqual(disconnectStub.calledWith('TestVPN'), true, 'VPN disconnect not called with correct name');
        strictEqual(
            showInfoMessageStub.calledWith('Disconnected from VPN: TestVPN'),
            true,
            'Success message not shown correctly'
        );
    });
});