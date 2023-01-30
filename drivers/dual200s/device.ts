import Homey from 'homey';
import VeSync from 'tsvesync';
import VeSyncHumidifier from 'tsvesync/veSyncHumidifier';
import VeSyncDeviceInterface from "../../lib/VeSyncDeviceInterface";
import VeSyncApp from "../../app";

class Dual200s extends Homey.Device implements VeSyncDeviceInterface {
    device!: VeSyncHumidifier;
    checkInterval: NodeJS.Timer | undefined;

    /**
     * onInit is called when the device is initialized.
     */
    async onInit() {
        await this.getDevice().catch(this.log);
        this.registerCapabilityListener("onoff", async (value) => await this.setMode(value ? "on" : "off"));
        this.registerCapabilityListener("dual200sCapability", async (value) => await this.setMode(value));
        this.registerFlows()
        this.log('Dual200s has been initialized');
    }

    async getDevice(): Promise<void> {
        return new Promise(async (resolve, reject) => {
            // @ts-ignore
            let veSync: VeSync = (this.homey.app as VeSyncApp).veSync;
            if (veSync === null || !veSync.isLoggedIn()) {
                await this.setUnavailable(this.homey.__("devices.failed_login"));
                return reject("Failed to login. Please use the repair function.");
            }
            let device = veSync.getStoredDevice().find(d => d.uuid === this.getData().id);
            if (device === undefined || !(device instanceof VeSyncHumidifier)) {
                this.error("Device is undefined or is not a Dual200s");
                await this.setUnavailable(this.homey.__("devices.not_found"));
                return reject("Device is undefined or is not a Dual200s");
            }
            this.device = device as VeSyncHumidifier;
            if (this.device.isConnected()) {
                await this.setAvailable();
                return resolve();
            }
            await this.setDeviceOffline();
            return reject("Cannot get device status. Device is " + this.device.connectionStatus);
        })
    }

    async setMode(value: string) {
        if (!this.device.isConnected()) {
            this.handleError("Dual200S is not connected");
            return;
        }
        if (value === "on" || value === "manual") {
            this.device?.toggleSwitch(true).catch(this.handleError.bind(this));
            this.setCapabilityValue('onoff', true).catch(this.error);
            this.setCapabilityValue('dual200sCapability', ["low", "medium", "high"][this.device?.extension.mist_level - 1 ?? 1] ?? "low").catch(this.error);
            return;
        }
        if (value === "off") {
            this.device?.toggleSwitch(false).catch(this.handleError.bind(this));
            this.setCapabilityValue('onoff', false).catch(this.error);
            this.setCapabilityValue('dual200sCapability', "off").catch(this.error);
            return;
        }
        if (value === "high") {
            this.device?.setMistLevel(3).catch(this.handleError.bind(this));
            this.setCapabilityValue('onoff', true).catch(this.error);
            return;
        }
        if (value === "medium") {
            this.device?.setMistLevel(2).catch(this.handleError.bind(this));
            this.setCapabilityValue('onoff', true).catch(this.error);
            return;
        }
        if (value === "low") {
            this.device?.setMistLevel(1).catch(this.handleError.bind(this));
            this.setCapabilityValue('onoff', true).catch(this.error);
            return;
        }
        if (value === "auto") {
            if (this.device?.deviceStatus === 'off')
                this.device.on().catch(this.handleError.bind(this));
            this.device?.setAutoMode().catch(this.handleError.bind(this));
            this.setCapabilityValue('onoff', true).catch(this.error);
        }
        this.log(value);
    }

    updateDevice(): void {

    }

    private handleError(error: any) {
        if (!this.device?.isConnected())
            this.setDeviceOffline().catch(this.error);
        else
            this.error(error)
    }

    public registerFlows(): void {
        this.homey.flow.getActionCard("setModeDual200s").registerRunListener(async (args) => await this.setMode(args.mode));
    }

    /**
     * onAdded is called when the user adds the device, called just after pairing.
     */
    async onAdded() {
        this.log('Dual200s has been added');
    }

    /**
     * onSettings is called when the user updates the device's settings.
     * @param {object} event the onSettings event data
     * @param {object} event.oldSettings The old settings object
     * @param {object} event.newSettings The new settings object
     * @param {string[]} event.changedKeys An array of keys changed since the previous version
     * @returns {Promise<string|void>} return a custom message that will be displayed
     */
    async onSettings({oldSettings: {}, newSettings: {}, changedKeys: []}): Promise<string | void> {
        this.log('Dual200s settings where changed');
    }

    /**
     * onRenamed is called when the user updates the device's name.
     * This method can be used this to synchronise the name to the device.
     * @param {string} name The new name
     */
    async onRenamed(name: string) {
        this.log('Dual200s was renamed');
    }

    /**
     * onDeleted is called when the user deleted the device.
     */
    async onDeleted() {
        this.log('Dual200s has been deleted');
    }

    private async setDeviceOffline() {
        await this.setUnavailable(this.homey.__("devices.offline")).catch(this.error);
        await this.setCapabilityValue('onoff', false).catch(this.error);
        if (this.checkInterval === undefined)
            this.checkInterval = setInterval(async () => {
                await this.device?.getStatus().catch(() => this.log("Still offline...."));
                if (this.device?.isConnected()) {
                    await this.setAvailable().catch(this.error);
                    this.log("Device is online.");
                    if (this.checkInterval !== undefined)
                        clearInterval(this.checkInterval)
                } else if (this.getAvailable()) {
                    await this.setUnavailable(this.homey.__("devices.offline")).catch(this.error);
                    await this.setCapabilityValue('onoff', false).catch(this.error);
                }
            }, 60 * 1000)
    }

}

module.exports = Dual200s;
