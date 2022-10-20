import Homey from 'homey';
import VeSync from "../../vesync/veSync";
import VeSyncPurifier from "../../vesync/veSyncPurifier";

class Core200SDriver extends Homey.Driver {

  /**
   * onInit is called when the driver is initialized.
   */
  async onInit() {
    this.log('Core200S Driver has been initialized');
  }

  /**
   * onPairListDevices is called when a user is adding a device and the 'list_devices' view is called.
   * This should return an array with the data of devices that are available for pairing.
   */
  async onPairListDevices() {
    // @ts-ignore
    let veSync: VeSync = this.homey.app.veSync;
    if(veSync === null || !veSync.loggedIn) return;
    let devices = await veSync.getDevices();
    devices.filter(d => d.deviceType === 'Core200S');
    let devicesList: any = [];
    devices.forEach((d) => {
      if(d instanceof VeSyncPurifier)
        devicesList.push({
          name: d.deviceName,
          data: {
            id: d.uuid,
            cid: d.cid,
            macID: d.macID
          },
          store: {
            fanSpeedLevel: d.level,
            mode: d.mode,
          }
        })
    })
    return devicesList;
  }

}

module.exports = Core200SDriver;
