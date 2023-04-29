import chalk from "chalk";
import moment from "moment";
export const HttpLogger  = (req: any, res:any, next)=>{
    if(req.id){
        return next();
    }
    req.time = moment();
    req.id = moment().unix();

    const resDotSendInterceptor = (res, send) => (content) => {
        res.contentBody = content;
        res.send = send;
        res.send(content);
    };
    console.log(chalk.yellow(`\n\n>>>>>>>>> REQUEST START : `), chalk.bgRed(" ID:", req.id,));
    console.log(chalk.bgGreenBright(chalk.bgYellowBright(req.method), req.originalUrl));
    console.log(chalk.blue("HEADER"), ": ",req.headers);
    console.log(chalk.blue("PARAMS"), ": ",req.params);
    console.log(chalk.blue("QUERY "), ": ",req.query);
    console.log(chalk.blue("BODY  "), ": ",req.body);
    res.send = resDotSendInterceptor(res, res.send);
    res.on("finish", () => {
        console.log(chalk.blue(`RESPONSE`), `${moment.duration(moment().diff(req.time)).asMilliseconds()}ms`);
        let resBody : any = null;
        try{
            resBody = JSON.stringify(JSON.parse(res.contentBody), null, 2);
        } catch (e){
            resBody = res.contentBody;
        }
        console.info(resBody)
        console.log(chalk.yellow(`<<<<<<<<<< REQUEST END : `), chalk.bgRed(" ID:", req.id), "\n\n");
    });
    next();
};