import Homey from 'homey';
import VeSync from './tsvesync/veSync';

export default class VeSyncApp extends Homey.App {
  veSync: VeSync = new VeSync();
  username: string = "";
  password: string = "";

  /**
   * onInit is called when the app is initialized.
   */
  async onInit() {
    //Debug reset password and username
    //await this.homey.settings.unset('username');
    //await this.homey.settings.unset('password');
    this.username = await this.homey.settings.get('username');
    this.password = await this.homey.settings.get('password');
    await this.startVeSync();
  }

  private async startVeSync() {
    if (this.username === null || (this.password === '' || this.password === null)) {
      this.log('No username or password set');
      return;
    }
    await this.veSync.login(this.username, this.password, true);
    this.log('VeSync has been initialized');
  }
}

module.exports = VeSyncApp;
