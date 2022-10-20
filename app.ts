import Homey from 'homey';
import VeSync from "./vesync/veSync";

class VeSyncApp extends Homey.App {
  veSync: VeSync | null = null;
  username: string = "";
  password: string = "";

  /**
   * onInit is called when the app is initialized.
   */
  async onInit() {
    this.username = await this.homey.settings.get('username');
    this.password = await this.homey.settings.get('password');

    this.homey.settings.on('set', key => {
      if (key === 'username') {
        this.username = this.homey.settings.get('username');
      }
      if (key === 'passwordRaw') {
        this.password = this.homey.settings.get('passwordRaw');
        this.startVeSync(true);
      }
    });
    await this.startVeSync();
  }

  private async startVeSync(rawPassword: boolean = false) {
    if (this.username === null || (this.password === '' || this.password === null && !rawPassword)) {
      this.log('No username or password');
      return;
    }
    this.veSync = new VeSync(this.username, this.password, rawPassword);
    await this.veSync.login();
    this.homey.settings.set("password", this.veSync.password)
    this.log('VeSync has been initialized');
  }
}

module.exports = VeSyncApp;
