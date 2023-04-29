import Gateway from 'fast-gateway';
import Logger from './lib/logger';
import fs from "fs";
import path from "path";

Logger({
    prefix: "API Gateway"
});
let service = null;
const reboot = async () => {
    const routes  = (await import("./config/routes")).default;
    const gateway = Gateway({
        routes: routes,
        middlewares:[
            (req, res, next)=>{
                console.info("Request arrived")
                return next();
            }
        ]
    });
    await gateway.start(8000).then((_evt) => {
        console.success( "service has been deployed to ", JSON.stringify(_evt.address(), null, 2));
        service = _evt;
    }).catch(err => {
        console.fetal(err);
    })
}

const routesFile = path.resolve(__dirname + `/config/routes.${process.env.NODE_ENV=="dev"? "ts": "js"}`);
console.log(routesFile);
fs.watchFile(routesFile, (curr, prev)=>{
    console.warn("Route configuration changed. restarting service");
    service?.close();
    reboot();
});

reboot();