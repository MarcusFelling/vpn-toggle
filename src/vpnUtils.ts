import { exec as execCallback } from 'child_process';
import { promisify } from 'util';

const exec = promisify(execCallback);

export interface VPNConnection {
    name: string;
    status: 'Connected' | 'Disconnected';
}

export class VPNService {
    private async executePowerShell(command: string): Promise<string> {
        try {
            const { stdout } = await exec(`powershell.exe -Command "${command}"`);
            return stdout.trim();
        } catch (error) {
            console.error('PowerShell execution error:', error);
            throw new Error(`PowerShell command failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    async getConnections(): Promise<VPNConnection[]> {
        try {
            const command = "Get-VpnConnection | Select-Object -Property Name,ConnectionStatus | ConvertTo-Json";
            const stdout = await this.executePowerShell(`-NoProfile -Command "${command}"`);
            console.log('PowerShell output:', stdout);

            if (!stdout.trim()) {
                throw new Error('No VPN connections found. Please configure a VPN connection in Windows first.');
            }

            let vpnData = JSON.parse(stdout);
            vpnData = Array.isArray(vpnData) ? vpnData : [vpnData];

            const connections: VPNConnection[] = vpnData
                .filter((vpn: any) => vpn.Name)
                .map((vpn: any) => ({
                    name: vpn.Name,
                    status: vpn.ConnectionStatus === "Connected" ? "Connected" : "Disconnected"
                }));

            if (connections.length === 0) {
                throw new Error('No VPN connections found. Please configure a VPN connection in Windows first.');
            }

            console.log('Found VPN connections:', connections);
            return connections;
        } catch (error) {
            console.error('Error getting connections:', error);
            if (error instanceof Error && error.message.includes('Get-VpnConnection')) {
                throw new Error('Unable to detect VPN connections. Please ensure you have the Windows VPN feature enabled.');
            }
            throw error;
        }
    }

    async connect(connectionName: string): Promise<void> {
        try {
            await this.executePowerShell(`rasdial "${connectionName}"`);
        } catch (error) {
            throw new Error(`Failed to connect to VPN "${connectionName}": ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    async disconnect(connectionName: string): Promise<void> {
        try {
            await this.executePowerShell(`rasdial "${connectionName}" /DISCONNECT`);
        } catch (error) {
            throw new Error(`Failed to disconnect VPN "${connectionName}": ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
}

export const vpnService = new VPNService();
