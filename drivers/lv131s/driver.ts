import Homey from 'homey';
import VeSync from '../../tsvesync/VeSync';
import {Utils} from "../../utils";
import VeSyncPurifierLV131 from "../../tsvesync/old/veSyncPurifierLV131.js";

class LV131SDriver extends Homey.Driver {

    /**
     * onInit is called when the driver is initialized.
     */
    async onInit() {
        this.log('LV131S Driver has been initialized');

        this.homey.flow.getActionCard("setModeLV131S").registerRunListener(async (args) =>
            args.device.triggerCapabilityListener("lv131sCapability", args.mode));
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
                return d instanceof VeSyncPurifierLV131 &&
                    (d as VeSyncPurifierLV131).Device_Features.LV131S.models.includes(d.deviceType)
            })
                .forEach((d) => {
                    if (d instanceof VeSyncPurifierLV131) {
                        devicesList.push({
                            name: d.deviceName,
                            data: {
                                id: d.uuid,
                                cid: d.cid,
                                macID: d.macID
                            },
                            store: {
                                fanSpeedLevel: d.fan_level,
                                mode: d.mode,
                            }
                        });
                    }
                });
            return devicesList;
        });
    }

    async onRepair(session: any, device: any) {
        session.setHandler("login", async (data: any) => {
            let result = await Utils.handleLogin(this, data);
            if (result) await device.getDevice();
            return result;
        });

    }

}

module.exports = LV131SDriver;
