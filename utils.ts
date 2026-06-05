import {Driver} from "homey";
import VeSyncApp from "./app";
import {getErrorMessage} from "./lib/utils/error";

export class Utils {
    static async handleLogin(driver: Driver, data: any): Promise<boolean> {
        let result = true;
        let app = driver.homey.app as VeSyncApp;
        if (!app.veSync.isLoggedIn()) {
            result = await app.veSync.login(data.username, data.password, false).catch(
                (error: unknown) => {
                    throw new Error(`Could not login with username ${data.username} - Reason: ${getErrorMessage(error)}`);
                }
            );
            if (!result) throw new Error(`Could not login with username ${data.username}`);
            driver.homey.settings.set('username', data.username);
            driver.homey.settings.set('password', app.veSync.password); //Save Hashed password
        }
        return result;
    }
}
