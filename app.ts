import Homey from 'homey';
import VeSync from "./vesync/veSync";

class VeSyncApp extends Homey.App {
  veSync: VeSync | null = null;

  /**
   * onInit is called when the app is initialized.
   */
  async onInit() {
    this.log('VeSync has been initialized');
    this.veSync = new VeSync('julian@suhl.de', 'julius15', 'America/New_York', true);
    await this.veSync.login();
  }

}

module.exports = VeSyncApp;
