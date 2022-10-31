import Homey from 'homey';
import VeSync from "../../vesync/veSync";
import VeSyncPurifier from "../../vesync/veSyncPurifier";
import {Utils} from "../../utils";
import VeSyncHumidifier from "../../vesync/veSyncHumidifier";

class Classic300sDriver extends Homey.Driver {

    /**
     * onInit is called when the driver is initialized.
     */
    async onInit() {
        this.log('Classic300s Driver has been initialized');
    }

    /**
     * This method is called when a pair session starts.
     * Params: session – Bi-directional socket for communication with the front-end
     */
    async onPair(session: any) {
        //Skip login if there is valid session
        session.setHandler('showView', async (data :any) => {
            if (data === 'login') {
                // @ts-ignore
                if (this.homey.app.veSync.isLoggedIn()) await session.nextView();
            }
        });

        //Handle Login
        session.setHandler("login", async (data:any) => {
            return await Utils.handleLogin(this, data);
        });

        //Get devices
        session.setHandler("list_devices", async () => {
            // @ts-ignore
            let veSync: VeSync = this.homey.app.veSync;
            let devices = await veSync.getDevices();
            devices.filter(d => d.deviceType === 'Classic300s' || d.Device_Features.Classic300s.models.contains(d.deviceType));
            let devicesList: any = [];
            devices.forEach((d) => {
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
        session.setHandler("login", async (data:any) => {
            let result = await Utils.handleLogin(this, data);
            if(result) await device.getDevice();
            return result;
        });

    }

}

module.exports = Classic300sDriver;
