import express from "express";
import Logger from './lib/logger';
import fs from "fs";
import path from "path";
import proxyMiddleware from 'express-http-proxy';
import ConnectSequence from "connect-sequence";
import chalk from "chalk";

//assign logger to the project
Logger({ scope: "Gateway" });

//initiate express app
const app = express();

//initiate proxies
global.proxies = {};
const reloadProxies = async () => {
    try {
        console.info("Initiating proxies...");
        delete require.cache[require.resolve(`./config/proxies.js`)];
        global.proxies = (await import(`./config/proxies.js`)).default;
        console.success("Proxies has been repopulated successfully");
    } catch (err) {
        console.error("There is some error in routes", err);
    }
}
const reboot = async () => {

    //loading proxies
    await reloadProxies();

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
        console.info("Request came to proxy handler...");
        const sequence = new ConnectSequence(req, res, next);

        //appending interceptor dynamically
        console.info("Appending interceptors...");
        sequence.append(...(proxy.interceptors ?? []));

        //appending dynamic proxy
        console.info("Appending main handler");
        let uri = segments.replace(`${prefix}/`, "");
        uri = uri.endsWith('/') ? uri.slice(0, -1) : uri;
        const url = `${proxy.target}/${uri}`;
        console.info("Full url is", url, ", Segment: ", uri);
        sequence.append(proxyMiddleware(url));

        //execute
        console.info("Executing handler");
        sequence.run();
    });

    const port = 8001;
    app.listen(port, "localhost", () => {
        console.success("Server listening to ", chalk.green(port));
    })
}
reboot();
//watch route file
fs.watchFile(path.resolve(__dirname + `/config/proxies.${process.env.NODE_ENV == "dev" ? "js" : "js"}`), async (curr, prev) => {
    console.warn("proxies file has been changed reassigning proxies");
    await reloadProxies();
});