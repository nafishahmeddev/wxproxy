import express from "express";
import Logger from './lib/logger';
import fs from "fs";
import path from "path";
import proxy from "express-http-proxy";
import ConnectSequence from "connect-sequence";

//assign logger to the project
Logger({ scope: "API Gateway" });

const app = express();
global.proxiesName = null;
global.proxies = {};
const reaoadProxies = async () => {
    try {

        delete require.cache[require.resolve(`./config/proxies.js`)];
        global.proxies = (await import(`./config/proxies.js`)).default;
        console.success("proxy has been re populated successfully");
    } catch (err) {
        console.error("There is some error in routes", err);
    }
}
const reboot = async () => {

    //loading proxies
    await reaoadProxies();

    //assigning dynamic routes
    app.get("/", (req, res) => res.send("Cool"));

    //handling proxies
    app.use("/api/v1/:segments*", (req: any, res, next) => {
        const segments = req.params.segments;
        const prefix = segments.split("/")[0];
        const proxy = global.proxies[prefix];

        console.log("Request for", segments)

        if (!proxy) return res.status(404).send("404 not found");


        //handle interceptor
        console.info("request goes to proxy");
        const sequence = new ConnectSequence(req, res, next);

        //appending interceptor dynamically
        console.info("appending interceptor dynamically");
        sequence.append(...(proxy.interceptors ?? []));

        //appending dynamic proxy
        console.info("appending dynamic proxy");
        let uri = segments.replace(`${prefix}/`, "");
        uri = uri.endsWith('/') ? uri.slice(0, -1) : uri;
        const url = `${proxy.endpoint}/${uri}`;
        console.log("URL is", url, uri);
        sequence.append(proxy(url));
        sequence.run();
    });

    const port = 8001;
    app.listen(port, "localhost", () => {
        console.success("Server listening to ", port);
    })
}
reboot();
//watch route file
fs.watchFile(path.resolve(__dirname + `/config/routes.${process.env.NODE_ENV == "dev" ? "js" : "js"}`), async (curr, prev) => {
    console.warn("proxies file has been changed reassigning proxies");
    await reaoadProxies();
});