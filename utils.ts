import {Driver} from "homey";
import VeSyncApp from "./app";

export class Utils {
    static async handleLogin(driver: Driver, data: any): Promise<boolean> {
        let result = true;
        let app = driver.homey.app as VeSyncApp;
        if (!app.veSync.isLoggedIn()) {
            result = await app.veSync.login(data.username, data.password, true);
            if (!result) throw new Error(`Could not login with username ${data.username}`);
            await driver.homey.settings.set('username', data.username);
            await driver.homey.settings.set('password', app.veSync.password); //Save Hashed password
        }
        return result;
    }
}
