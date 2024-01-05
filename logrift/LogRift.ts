import * as https from 'https';
import axios from "axios";

export default class LogRift {
    private static targetUrl: string = 'https://logs.spkes.de/api/receiver.php';
    private static version: string = '0.0.1';
    private token: string;
    private name: string | undefined;
    private package: string | undefined;
    private version: string | undefined;

    constructor(options: {
        token: string;
        name?: string;
        package?: string;
        version?: string;
        url?: string;
    }) {
        this.token = options.token;
        this.name = options.name;
        this.package = options.package;
        this.version = options.version;
    }

    private send(type: string, message: string) {
        const body = {
            type,
            message,
            name: this.name,
            package: this.package,
            version: this.version,
        };

        const options = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Logflare-Api-Key': this.token,
            },
        };

        const req = https.request(LogRift.targetUrl, options, (res) => {
            let responseData = '';
            res.on('data', (chunk) => {
                responseData += chunk;
            });
            res.on('end', () => {
                console.log(responseData);
            });
        });

        req.on('error', (error) => {
            console.error(error);
        });

        req.write(JSON.stringify(body));
        req.end();
    }

    public log(message: string) {
        this.send('log', message);
    }

    public error(message: string) {
        this.send('error', message);
    }

    public debug(message: string) {
        this.send('debug', message);
    }

    public warn(message: string) {
        this.send('warn', message);
    }

    public trace(message: string) {
        this.send('trace', message);
    }

    public fatal(message: string) {
        this.send('fatal', message);
    }

    public info(message: string) {
        this.send('info', message);
    }
}
