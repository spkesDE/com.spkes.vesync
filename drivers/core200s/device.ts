import Homey from 'homey';
import VeSync from "../../vesync/veSync";
import VeSyncFan from "../../vesync/veSyncFan";

class Core200S extends Homey.Device {
  private device: VeSyncFan | undefined;

  /**
   * onInit is called when the device is initialized.
   */
  async onInit() {
    this.getDevice();
    this.registerCapabilityListener("onoff", async (value) => {
      await this.device?.toggleSwitch(value as boolean ?? false)
      if(this.device?.mode === 'sleep' && value){
        this.setCapabilityValue('fanCapability', "sleep").catch(this.error);
      } if(!value){
        this.setCapabilityValue('fanCapability', "off").catch(this.error);
      } else {
        this.setCapabilityValue('fanCapability', ["low", "medium", "high"][this.device?.extension.fanSpeedLevel -1 ?? 1] ?? "low").catch(this.error);
      }
    });

    this.registerCapabilityListener("fanCapability", async (value) => {
      if(value === "high") {
        await this.device?.setFanSpeed(3);
        this.log("Speed 3");
        this.setCapabilityValue('onoff', true).catch(this.error);
      } else if(value === "medium") {
        await this.device?.setFanSpeed(2);
        this.log("Speed 2");
        this.setCapabilityValue('onoff', true).catch(this.error);
      } else if(value === "low") {
        await this.device?.setFanSpeed(1);
        this.log("Speed 1");
        this.setCapabilityValue('onoff', true).catch(this.error);
      } else if(value === "sleep") {
        if(this.device?.deviceStatus === 'off')
          await this.device.on();
        await this.device?.setMode('sleep');
        this.log("Sleep");
        this.setCapabilityValue('onoff', true).catch(this.error);
      } else if(value === "off") {
        await this.device?.off()
        this.log("Off");
        this.setCapabilityValue('onoff', false).catch(this.error);
      }
    });
    this.setCapabilityValue('onoff',this.device?.mode == "on" ?? false).catch(this.error);
    this.log('Core200S has been initialized');
  }

  public getDevice(){
    // @ts-ignore
    let veSync: VeSync = this.homey.app.veSync;
    if(veSync === null || !veSync.loggedIn){
      this.setUnavailable("Failed to login. Please re-enter the login data and restart the app.").then();
      return;
    }
    let device = veSync.devices.find(d => d.uuid === this.getData().id);
    if(device === undefined || !(device instanceof VeSyncFan)){
      this.error("Device is undefined or is not a Core200S");
      this.setUnavailable("Device is undefined or is not a Core200S. Re-add this device.").then();
      return;
    }
    this.device = device as VeSyncFan;
  }

  /**
   * onAdded is called when the user adds the device, called just after pairing.
   */
  async onAdded() {
    this.log('Core200S has been added');
  }

  /**
   * onSettings is called when the user updates the device's settings.
   * @param {object} event the onSettings event data
   * @param {object} event.oldSettings The old settings object
   * @param {object} event.newSettings The new settings object
   * @param {string[]} event.changedKeys An array of keys changed since the previous version
   * @returns {Promise<string|void>} return a custom message that will be displayed
   */
  async onSettings({ oldSettings: {}, newSettings: {}, changedKeys: [] }): Promise<string|void> {
    this.log('Core200S settings where changed');
  }

  /**
   * onRenamed is called when the user updates the device's name.
   * This method can be used this to synchronise the name to the device.
   * @param {string} name The new name
   */
  async onRenamed(name: string) {
    this.log('Core200S was renamed');
  }

  /**
   * onDeleted is called when the user deleted the device.
   */
  async onDeleted() {
    this.log('Core200S has been deleted');
  }

}

module.exports = Core200S;
