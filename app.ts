import Homey from 'homey';
import VeSync from './tsvesync/veSync';
import VeSyncPurifier from "./tsvesync/veSyncPurifier";
import VeSyncHumidifier from "./tsvesync/veSyncHumidifier";

export default class VeSyncApp extends Homey.App {
    veSync: VeSync = new VeSync();
    username: string = "";
    password: string = "";

    /**
     * onInit is called when the app is initialized.
     */
    async onInit() {
        //Debug reset password and username
        //await this.homey.settings.unset('username');
        //await this.homey.settings.unset('password');
        this.username = await this.homey.settings.get('username');
        this.password = await this.homey.settings.get('password');
        await this._initializeFlows();
        await this.startVeSync();
    }

    private async startVeSync() {
        if (this.username === null || (this.password === '' || this.password === null)) {
            this.log('No username or password set');
            return;
        }
        await this.veSync.login(this.username, this.password, true);
        this.log('VeSync has been initialized');
    }

    private async _initializeFlows() {
        /**************/
        /* Fan Speeds */
        /**************/
        this.homey.flow.getActionCard("fan_speed_0_3").registerRunListener((args) =>
            args.device.triggerCapabilityListener("fanSpeed0to3", Number(args.level) ?? 1));
        this.homey.flow.getActionCard("fan_speed_0_4").registerRunListener((args) =>
            args.device.triggerCapabilityListener("fanSpeed0to4", Number(args.level) ?? 1));
        this.homey.flow.getActionCard("fan_speed_0_5").registerRunListener((args) =>
            args.device.triggerCapabilityListener("fanSpeed0to5", Number(args.level) ?? 1));
        this.homey.flow.getActionCard("fan_speed_0_9").registerRunListener((args) =>
            args.device.triggerCapabilityListener("fanSpeed0to9", Number(args.level) ?? 1));
        this.homey.flow.getActionCard("warm_fan_speed_0_3").registerRunListener((args) =>
            args.device.triggerCapabilityListener("warmFanSpeed0to3", Number(args.level) ?? 0));

        /***********/
        /* Display */
        /***********/
        this.homey.flow.getActionCard("display_toggle").registerRunListener((args) =>
            args.device.triggerCapabilityListener("display_toggle", args.checkbox));

        /**************/
        /* Nightlight */
        /**************/
        this.homey.flow.getActionCard("nightlight").registerRunListener((args) => {
            let device = args.device.device as VeSyncPurifier;
            device.setNightLight(args.level);
            args.device.setCapabilityValue("nightlight_toggle", args.level !== "off");
        });
        this.homey.flow.getActionCard("nightlight_slider").registerRunListener((args) => {
            let device = args.device.device as VeSyncHumidifier;
            device.setNightLightBrightness(args.brightness);
            args.device.setCapabilityValue("nightlight_toggle", args.brightness > 0);
        });
    }
}

module.exports = VeSyncApp;
