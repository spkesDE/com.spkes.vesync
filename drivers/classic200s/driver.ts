import Homey from 'homey';
import {Utils} from "../../utils";
import VeSyncHumidifier from "../../tsvesync/veSyncHumidifier";
import VeSync from "../../tsvesync/veSync";

class Classic200sDriver extends Homey.Driver {

    /**
     * onInit is called when the driver is initialized.
     */
    async onInit() {
        this.log('Classic200s Driver has been initialized');

        this.homey.flow.getActionCard("setModeClassic200s").registerRunListener(async (args) =>
            args.device.triggerCapabilityListener("classic200sCapability", args.mode));
    }

    /**
     * This method is called when a pair session starts.
     * Params: session – Bi-directional socket for communication with the front-end
     */
    async onPair(session: any) {
        //Skip login if there is valid session
        session.setHandler('showView', async (data: any) => {
            if (data === 'login') {
                // @ts-ignore
                if (this.homey.app.veSync.isLoggedIn()) await session.nextView();
            }
        });

        //Handle Login
        session.setHandler("login", async (data: any) => {
            return await Utils.handleLogin(this, data);
        });

        //Get devices
        session.setHandler("list_devices", async () => {
            // @ts-ignore
            let veSync: VeSync = this.homey.app.veSync;
            let devices = await veSync.getDevices();
            let devicesList: any = [];
            devices.filter(d => {
                return d instanceof VeSyncHumidifier && d.constructor === VeSyncHumidifier &&
                    (d as VeSyncHumidifier).Device_Features.Classic200S.models.includes(d.deviceType)
            })
                .forEach((d) => {
                    if (d instanceof VeSyncHumidifier) {
                        devicesList.push({
                            name: d.deviceName,
                            data: {
                                id: d.uuid,
                                cid: d.cid,
                                macID: d.macID
                            },
                            store: {
                                fanSpeedLevel: d.mist_level,
                                mode: d.mode,
                            }
                        });
                    }
                })
            return devicesList;
        });
    }

    // noinspection JSUnusedGlobalSymbols
    async onRepair(session: any, device: any) {
        session.setHandler("login", async (data: any) => {
            let result = await Utils.handleLogin(this, data);
            if (result) await device.getDevice();
            return result;
        });

    }

}

module.exports = Classic200sDriver;
