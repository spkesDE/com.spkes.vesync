import Homey from 'homey';
import VeSync from '../../tsvesync/VeSync';
import {Utils} from "../../utils";
import CAFP583S from "../../tsvesync/devices/airfryer/CAFP583S";

class CAFP583SDriver extends Homey.Driver {

    async onInit() {
        this.log('CAFP583S Dual Blaze Driver has been initialized');

        this.homey.flow.getActionCard("startPresetCAFP583S").registerRunListener(async (args) =>
            args.device.startPreset(args.preset));
        this.homey.flow.getActionCard("stopCookCAFP583S").registerRunListener(async (args) =>
            args.device.stopCooking());
        this.homey.flow.getActionCard("setTempUnitCAFP583S").registerRunListener(async (args) =>
            args.device.setPreferredTempUnit(args.unit));
    }

    async onPair(session: any) {
        session.setHandler('showView', async (data: any) => {
            if (data === 'login') {
                // @ts-ignore
                if (this.homey.app.veSync.isLoggedIn()) await session.nextView();
            }
        });

        session.setHandler("login", async (data: any) => {
            return await Utils.handleLogin(this, data);
        });

        session.setHandler("list_devices", async () => {
            // @ts-ignore
            const veSync: VeSync = this.homey.app.veSync;
            const devices = await veSync.getDevices();
            const devicesList: any[] = [];

            devices.filter(d => d instanceof CAFP583S)
                .forEach((d) => {
                    if (d instanceof CAFP583S) {
                        devicesList.push({
                            name: `${d.device.deviceName} (Experimental)`,
                            data: {
                                id: `${d.device.uuid}:1`,
                                uuid: d.device.uuid,
                                chamber: 1,
                                cid: d.device.cid,
                                macID: d.device.macID
                            }
                        });
                    }
                });

            return devicesList;
        });
    }

    async onRepair(session: any, device: any) {
        session.setHandler("login", async (data: any) => {
            const result = await Utils.handleLogin(this, data);
            if (result) await device.getDevice();
            return result;
        });
    }
}

module.exports = CAFP583SDriver;
