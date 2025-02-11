import { VPNService } from '../vpnUtils';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as assert from 'assert';
import * as sinon from 'sinon';

const execAsync = promisify(exec);

suite('VPNService Tests', () => {
    let vpnService: VPNService;
    let execStub: sinon.SinonStub;

    setup(() => {
        vpnService = new VPNService();
        execStub = sinon.stub(vpnService, 'executePowerShell' as any); // Use 'as any' to bypass private access
    });

    teardown(() => {
        sinon.restore();
    });

    test('getConnections should return an array of VPN connections', async () => {
        execStub.resolves(JSON.stringify([
            { Name: 'TestVPN1', ConnectionStatus: 'Connected' },
            { Name: 'TestVPN2', ConnectionStatus: 'Disconnected' }
        ]));

        const connections = await vpnService.getConnections();
        assert.deepStrictEqual(connections, [
            { name: 'TestVPN1', status: 'Connected' },
            { name: 'TestVPN2', status: 'Disconnected' }
        ]);
    });

    test('connect should successfully connect to a VPN', async () => {
        execStub.resolves('');
        await vpnService.connect('TestVPN');
        assert.ok(execStub.calledOnce);
        assert.ok(execStub.calledWith(`rasdial "TestVPN"`));
    });

    test('connect should throw an error if connection fails', async () => {
        execStub.rejects(new Error('Connection failed'));

        await assert.rejects(
            vpnService.connect('TestVPN'),
            /Connection failed/
        );
    });

    test('disconnect should successfully disconnect from a VPN', async () => {
        execStub.resolves('');
        await vpnService.disconnect('TestVPN');
        assert.ok(execStub.calledOnce);
        assert.ok(execStub.calledWith(`rasdial "TestVPN" /DISCONNECT`));
    });

    test('disconnect should throw an error if disconnection fails', async () => {
        execStub.rejects(new Error('Disconnection failed'));

        await assert.rejects(
            vpnService.disconnect('TestVPN'),
            /Disconnection failed/
        );
    });
});
