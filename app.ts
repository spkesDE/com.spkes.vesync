import Homey from 'homey';
import VeSync from './tsvesync/VeSync';
import axiosRetry from "axios-retry";
import axios from "axios";
import BasicPurifier from "./tsvesync/lib/BasicPurifier";
import BasicHumidifier from "./tsvesync/lib/BasicHumidifier";

export default class VeSyncApp extends Homey.App {
    veSync: VeSync = new VeSync();
    username: string = "";
    password: string = "";

    /**
     * onInit is called when the app is initialized.
     */
    async onInit() {
        //Debug reset password and username
        this.username = await this.homey.settings.get('username');
        this.password = await this.homey.settings.get('password');
        await this._initializeFlows();
        axiosRetry(axios, {
            retries: 3,
            retryDelay: (retryCount) => {
                this.error(`Failed to make API call. Retry attempt #${retryCount}`);
                if (retryCount == 1) return 1000;
                if (retryCount == 2) return 1000 * 5;
                if (retryCount == 3) return 1000 * 10;
                return retryCount * 1000;
            },
            retryCondition: () => true
        });
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
            let device = args.device.device as BasicPurifier;
            device.setNightLight(args.level);
            args.device.setCapabilityValue("nightlight_toggle", args.level !== "off");
        });
        this.homey.flow.getActionCard("nightlight_slider").registerRunListener((args) => {
            let device = args.device.device as BasicHumidifier;
            device.setNightLightBrightness(args.brightness);
            args.device.setCapabilityValue("nightlight_toggle", args.brightness > 0);
        });
    }
}

module.exports = VeSyncApp;
