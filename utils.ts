import VeSync from "./vesync/veSync";
import {Driver} from "homey";

export class Utils {
    static async handleLogin(driver: Driver, data: any): Promise<boolean> {
        let result = true;
        // @ts-ignore
        let veSync = driver.homey.app.veSync;
        if (veSync === null) {
            veSync = new VeSync(data.username, data.password, true);
            result = await veSync.login();
            if (!result) throw new Error(`Could not login with username ${data.username}`);
            // @ts-ignore
            driver.homey.app.veSync = veSync;
            await driver.homey.settings.set('username', data.username);
            await driver.homey.settings.set('password', veSync.password); //Save Hashed password
        } else if (!veSync.loggedIn) {
            result = await veSync.login();
            if (!result)  throw new Error(`Could not login with username ${data.username}`);
        }
        return result;
    }
}
