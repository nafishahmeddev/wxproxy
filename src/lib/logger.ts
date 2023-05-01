import chalk from "chalk";
import { Signale } from "signale";
import fs from "fs";
import path from "path";
import moment from "moment";

export default (config: {
    scope: string,
    overrideConsole?: boolean
}) => {
    const currentTime = moment();
    const options = {
        disabled: false,
        interactive: false,
        secrets: [],
        stream: [
            process.stdout,
            fs.createWriteStream(path.resolve(path.join(__dirname, "../../logs/", `${currentTime.format("YYYY-MM-DD")}.log`)), {
                flags: "a"
            })
        ],
        scope: config.scope,
    };

    const signale = new Signale(options);
    signale.config({
        displayTimestamp: true,
        displayDate: true
    });

    //override console with logger
    if (config.overrideConsole) {
        console.log = signale.log;
        console.info = signale.info;
        console.warn = signale.warn;
        console.error = signale.error;
        console.debug = signale.debug;
        console.success = signale.success
        console.fetal = signale.fetal
    }
    //
    global.logger = signale;
    return signale;
};