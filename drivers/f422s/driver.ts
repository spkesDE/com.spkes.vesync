import Homey from 'homey';
import VeSync from '../../tsvesync/veSync';
import {Utils} from "../../utils";
import VeSyncPurifierLV131 from "../../tsvesync/veSyncPurifierLV131.js";
import VeSyncTowerFan from "../../tsvesync/veSyncTowerFan";
import F422S from "../../tsvesync/devices/towerfan/F422S";

class F422SDriver extends Homey.Driver {

    /**
     * onInit is called when the driver is initialized.
     */
    async onInit() {
        this.log('F422S Driver has been initialized');
        this.homey.flow.getActionCard("setModeF422S").registerRunListener(async (args) =>
            args.device.triggerCapabilityListener("f422sCapability", args.mode));
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
                return d instanceof F422S;
            })
                .forEach((d) => {
                    if (d instanceof F422S) {
                        devicesList.push({
                            name: d.device.deviceName,
                            data: {
                                id: d.device.uuid,
                                cid: d.device.cid,
                                macID: d.device.macID
                            },
                            store: {
                                mode: d.device.mode,
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

module.exports = F422SDriver;
