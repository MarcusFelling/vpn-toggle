import * as assert from 'assert';
import * as vscode from 'vscode';
import * as extension from '../extension';

suite('Extension Test Suite', () => {
	// Create a dummy extension context
	let context: any;

	setup(() => {
		context = {
			globalState: {
				get: (key: string) => undefined,
				update: async (key: string, value: any) => { /* no-op */ }
			},
			subscriptions: []
		};
	});

	test('Extension should register commands', async () => {
		extension.activate(context);
		// Allow a short delay for activation
		await new Promise(resolve => setTimeout(resolve, 100));
		const commands = await vscode.commands.getCommands(true);
		assert.ok(commands.includes('vpn-toggle.connectVPN'), 'Command vpn-toggle.connectVPN not registered');
		assert.ok(commands.includes('vpn-toggle.disconnectVPN'), 'Command vpn-toggle.disconnectVPN not registered');
		assert.ok(commands.includes('vpn-toggle.selectAndConnectVPN'), 'Command vpn-toggle.selectAndConnectVPN not registered');
	});

	teardown(() => {
		extension.deactivate();
	});
});
