import Homey from 'homey';
import VeSync from "./vesync/veSync";

class MyApp extends Homey.App {

  /**
   * onInit is called when the app is initialized.
   */
  async onInit() {
    this.log('MyApp has been initialized');
    let veSync = new VeSync('julian@suhl.de', 'julius15', 'America/New_York', true);
    await veSync.login();
    await veSync.getDevices();

  }

}

module.exports = MyApp;
