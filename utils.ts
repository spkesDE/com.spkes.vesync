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
                    throw new Error(`Could not login - Reason: ${getErrorMessage(error)}`);
                }
            );
            if (!result) throw new Error(`Could not login`);
            Utils.saveCredentials(driver, data.username, app.veSync.password);
        }
        return result;
    }

    /**
     * Repair always logs in with the entered credentials, also while a session
     * is active, so a changed password or account takes effect. If they are
     * rejected, the current session stays untouched.
     */
    static async handleRepairLogin(driver: Driver, data: any): Promise<boolean> {
        let app = driver.homey.app as VeSyncApp;
        const result = await app.veSync.login(data.username, data.password, false).catch(
            (error: unknown) => {
                throw new Error(`Could not login - Reason: ${getErrorMessage(error)}`);
            }
        );
        if (!result) throw new Error(`Could not login`);
        Utils.saveCredentials(driver, data.username, app.veSync.password);
        return result;
    }

    private static saveCredentials(driver: Driver, username: string, hashedPassword: string): void {
        driver.homey.settings.set('username', username);
        driver.homey.settings.set('password', hashedPassword); //Save Hashed password
    }
}
