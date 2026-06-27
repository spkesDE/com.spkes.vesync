import Homey from "homey";
import type BasicDevice from "../tsvesync/lib/BasicDevice";

type CapabilityValue = string | number | boolean;
type ApiCommandResponse = {
    code?: number;
    msg?: string;
    result?: {
        code?: number;
    };
};
type OptimisticCapabilityUpdate = {
    capability: string;
    value: CapabilityValue;
};

type StoredVeSyncDeviceData = {
    id?: string;
    uuid?: string;
    cid?: string;
    macID?: string;
    macId?: string;
};

export default class HomeyDeviceBase extends Homey.Device {
    /**
     * Tracks capabilities that were just changed locally while VeSync catches up.
     * Some VeSync command responses only confirm acceptance and do not contain the
     * new device state, so the next status poll can still return the old value.
     */
    private optimisticCapabilities = new Map<string, { value: CapabilityValue, expiresAt: number }>();
    private readonly fanSpeedCapabilities = [
        'fanSpeed0to2',
        'fanSpeed0to3',
        'fanSpeed0to4',
        'fanSpeed0to5',
        'fanSpeed0to9',
        'fanSpeed0to12',
    ];

    protected findStoredVeSyncDevice(devices: BasicDevice[]): BasicDevice | undefined {
        const data = this.getData() as StoredVeSyncDeviceData;
        const physicalUuid = data.uuid ?? data.id;
        const macID = data.macID ?? data.macId;

        return devices.find((storedDevice) => {
            const device = storedDevice?.device;
            if (!device) return false;
            if (physicalUuid && device.uuid !== physicalUuid) return false;
            if (data.cid && device.cid !== data.cid) return false;
            if (macID && device.macID !== macID) return false;
            return Boolean(physicalUuid || data.cid || macID);
        });
    }

    protected async checkForCapability(capability: string): Promise<void> {
        if (!this.hasCapability(capability)) {
            await this.addCapability(capability).catch(this.error);
        }
    }

    protected async setCapabilityIfPresent(capability: string, value: CapabilityValue): Promise<void> {
        if (this.hasCapability(capability)) {
            const optimisticCapability = this.optimisticCapabilities.get(capability);
            if (optimisticCapability) {
                if (Date.now() > optimisticCapability.expiresAt) {
                    this.optimisticCapabilities.delete(capability);
                } else if (optimisticCapability.value !== value) {
                    return;
                } else {
                    this.optimisticCapabilities.delete(capability);
                }
            }
            await this.setCapabilityValue(capability, value).catch(this.error);
        }
    }

    /**
     * Sets a capability immediately and temporarily protects it from stale status
     * polls. The protection is cleared once the cloud reports the same value or
     * when the TTL expires.
     */
    protected async setCapabilityOptimistically(
        capability: string,
        value: CapabilityValue,
        ttlMs = 15000
    ): Promise<void> {
        if (!this.hasCapability(capability)) {
            return;
        }

        this.optimisticCapabilities.set(capability, {
            value,
            expiresAt: Date.now() + ttlMs,
        });
        await this.setCapabilityValue(capability, value).catch(this.error);
    }

    /**
     * Runs a device command while reflecting the expected capability value in
     * Homey immediately. The command response is treated as an acknowledgement
     * only; live state still comes from the next status poll. If the command is
     * rejected, the previous Homey capability value is restored.
     */
    protected async runCommandWithOptimisticCapability(
        capability: string,
        value: CapabilityValue,
        command: () => Promise<ApiCommandResponse | void>,
        ttlMs = 15000
    ): Promise<void> {
        await this.runCommandWithOptimisticCapabilities([{capability, value}], command, ttlMs);
    }

    /**
     * Same as runCommandWithOptimisticCapability, but protects multiple related
     * capabilities from the same stale status poll. Fan speed commands use this
     * to keep both onoff and fanSpeed0toX stable while VeSync catches up.
     */
    protected async runCommandWithOptimisticCapabilities(
        capabilityUpdates: OptimisticCapabilityUpdate[],
        command: () => Promise<ApiCommandResponse | void>,
        ttlMs = 15000
    ): Promise<void> {
        const presentUpdates = capabilityUpdates.filter(({capability}) => this.hasCapability(capability));
        const previousValues = presentUpdates.map(({capability}) => ({
            capability,
            value: this.getCapabilityValue(capability),
        }));

        for (const {capability, value} of presentUpdates) {
            await this.setCapabilityOptimistically(capability, value, ttlMs);
        }

        try {
            const response = await command();
            this.assertCommandSucceeded(response);
        } catch (error) {
            for (const {capability, value} of previousValues) {
                this.optimisticCapabilities.delete(capability);
                if (this.isCapabilityValue(value)) {
                    await this.setCapabilityValue(capability, value).catch(this.error);
                }
            }
            throw error;
        }
    }

    protected getOptimisticFanSpeedUpdates(level: number): OptimisticCapabilityUpdate[] {
        return this.fanSpeedCapabilities
            .filter((capability) => this.hasCapability(capability))
            .map((capability) => ({capability, value: level}));
    }

    /**
     * VeSync bypass commands often return only request/result codes. They are
     * successful when every present code is 0 and the message is request success.
     */
    protected assertCommandSucceeded(response: ApiCommandResponse | void): void {
        if (!response) {
            return;
        }

        const requestFailed = response.code !== undefined && response.code !== 0;
        const messageFailed = response.msg !== undefined && response.msg !== "request success";
        const resultFailed = response.result?.code !== undefined && response.result.code !== 0;

        if (requestFailed || messageFailed || resultFailed) {
            throw new Error(`Device command failed: ${response.msg ?? response.code ?? response.result?.code}`);
        }
    }

    private isCapabilityValue(value: unknown): value is CapabilityValue {
        return typeof value === "string" || typeof value === "number" || typeof value === "boolean";
    }

    protected async markDeviceOffline(): Promise<void> {
        const wasAvailable = this.getAvailable();
        await this.setUnavailable(this.homey.__("devices.offline")).catch(this.error);
        if (wasAvailable) {
            await this.homey.flow.getDeviceTriggerCard("device_offline").trigger(this).catch(this.error);
        }
    }
}
