import Homey from 'homey';
import VeSync from '../../tsvesync/VeSync';
import {Utils} from "../../utils";
import Core200S from "../../tsvesync/devices/purifier/Core200S";

class Core200SDriver extends Homey.Driver {

    /**
     * onInit is called when the driver is initialized.
     */
    async onInit() {
        this.log('Core200S Driver has been initialized');

        this.homey.flow.getActionCard("setModeCore200s").registerRunListener(async (args) =>
            args.device.triggerCapabilityListener("core200sCapability", args.mode));
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
                return d instanceof Core200S
            }).forEach((d) => {
                if (d instanceof Core200S) {
                    devicesList.push({
                        name: d.device.deviceName,
                        data: {
                            id: d.device.uuid,
                            cid: d.device.cid,
                            macID: d.device.macID
                        }
                    });
                }
            })
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

module.exports = Core200SDriver;
