import Homey from 'homey';
import VeSync from '../../tsvesync/VeSync';
import {Utils} from "../../utils";
import CAFDC111SAEU from "../../tsvesync/devices/airfryer/CAFDC111SAEU";

class CAFDC111SAEUDriver extends Homey.Driver {

    async onInit() {
        this.log('CAFDC111SAEU Driver has been initialized');

        this.homey.flow.getActionCard("startPresetCAFDC111S").registerRunListener(async (args) =>
            args.device.startPreset(args.preset));
        this.homey.flow.getActionCard("stopCookCAFDC111S").registerRunListener(async (args) =>
            args.device.stopCooking());
        this.homey.flow.getActionCard("setTempUnitCAFDC111S").registerRunListener(async (args) =>
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

            devices.filter(d => d instanceof CAFDC111SAEU)
                .forEach((d) => {
                    if (d instanceof CAFDC111SAEU) {
                        [1, 2].forEach((chamber) => {
                            devicesList.push({
                                name: `${d.device.deviceName} Basket ${chamber}`,
                                data: {
                                    id: `${d.device.uuid}:${chamber}`,
                                    uuid: d.device.uuid,
                                    chamber,
                                    cid: d.device.cid,
                                    macID: d.device.macID
                                }
                            });
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

module.exports = CAFDC111SAEUDriver;
