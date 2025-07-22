import Homey from 'homey';
import VeSync from '../../tsvesync/VeSync';
import {Utils} from "../../utils";
import EverestAir from "../../tsvesync/devices/purifier/EverestAir";

class EverestAirDriver extends Homey.Driver {

    /**
     * onInit is called when the driver is initialized.
     */
    async onInit() {
        this.log('EverestAir Driver has been initialized');

        this.homey.flow.getActionCard("setModeEverestAirMode").registerRunListener(async (args) =>
            args.device.triggerCapabilityListener("everestAirCapability", args.mode));
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
                return d instanceof EverestAir
            }).forEach((d) => {
                if (d instanceof EverestAir) {
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

module.exports = EverestAirDriver;
