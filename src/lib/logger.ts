import { Signale } from "signale";
export default (config: {
    scope: string
}) => {
    const options = {
        disabled: false,
        interactive: false,
        secrets: [],
        stream: [
            process.stdout,
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