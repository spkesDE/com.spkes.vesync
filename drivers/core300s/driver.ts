import Homey from 'homey';
import VeSyncPurifier from '../../tsvesync/veSyncPurifier';
import VeSync from '../../tsvesync/veSync';
import {Utils} from "../../utils";

class Core300SDriver extends Homey.Driver {

    /**
     * onInit is called when the driver is initialized.
     */
    async onInit() {
        this.log('Core300S Driver has been initialized');

        this.homey.flow.getActionCard("setModeCore300s").registerRunListener(async (args) =>
            args.device.triggerCapabilityListener("core300sCapability", args.mode));
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
                return d instanceof VeSyncPurifier &&
                    (d as VeSyncPurifier).Device_Features.Core300S.models.includes(d.deviceType)
            })
                .forEach((d) => {
                    if (d instanceof VeSyncPurifier) {
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

module.exports = Core300SDriver;
