import chalk from "chalk";
import { Signale } from "signale";
import fs from "fs";
import path from "path";
import moment from "moment";

export default (config: {
    scope: string
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

    global.logger = signale;
    return signale;
};