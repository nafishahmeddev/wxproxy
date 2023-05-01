import chalk from "chalk";
import moment from "moment";
export const HttpLogger = (options = { response: true }) => (req: any, res: any, next) => {
    if (req._id) {
        return next();
    }
    req.time = moment();
    req._id = moment().unix();


    console.log("\n\n");
    console.log(chalk.yellow(`Incoming request ~🚀`), chalk.bgRed(req._id));
    console.log(chalk.bgYellowBright(req.method), req.originalUrl);
    console.log(chalk.blue("Headers"), ": ", JSON.stringify(req.headers, null, 2));
    console.log(chalk.blue("Params "), ": ", JSON.stringify(req.params, null, 2));
    console.log(chalk.blue("Query  "), ": ", JSON.stringify(req.query, null, 2));
    console.log(chalk.blue("Body   "), ": ", req.body);

    if (options.response == true) {
        const interceptor = (res, send) => (content) => {
            res.contentBody = content;
            res.send = send;
            res.send(content);
        };
        res.send = interceptor(res, res.send);
        res.on("finish", () => {
            console.log(chalk.blue(`Response`), `${moment.duration(moment().diff(req.time)).asMilliseconds()}ms`, chalk.bgRed(" ID:", req._id,));
            let resBody: any = null;
            try {
                resBody = JSON.stringify(JSON.parse(res.contentBody), null, 2);
            } catch (e) {
                resBody = res.contentBody;
            }
            console.info(resBody)
            console.log(chalk.yellow(`<<<<<<<<<< REQUEST END : `), chalk.bgRed(" ID:", req._id), "\n\n");
        });
    }
    next();
};