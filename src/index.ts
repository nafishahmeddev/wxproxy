import express from "express";
import Logger from './lib/logger';
import fs from "fs";
import path from "path";
import ConnectSequence from "connect-sequence";
const { createProxyMiddleware } = require('http-proxy-middleware');

import chalk from "chalk";

//assign logger to the project
Logger({ scope: "Gateway" });

//initiate express app
const app = express();

//
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '/../views'));

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
    app.get("/", (req, res) => res.send("Gateway is running...."));
    app.get("/auth", (req, res) => res.send("Auth service called...."));

    //handling proxies
    app.use("/api/v1/:segments*", (req: any, res, next) => {
        const segments = req.params.segments;
        const prefix = segments.split("/")[0];
        const proxy = global.proxies[prefix];

        console.info("Request for", segments)

        if (!proxy) return res.status(404).render("errors/404.ejs",{status: 404});


        //handle interceptor
        console.info("Request came to proxy handler...");
        const sequence = new ConnectSequence(req, res, next);

        //appending interceptor dynamically
        console.info("Appending interceptors...");
        sequence.append(...(proxy.interceptors ?? []));

        //appending dynamic proxy
        console.info("Appending main handler");
        sequence.append(createProxyMiddleware({
            target: proxy.target,
            ws: proxy.ws ? true: false,
            pathRewrite: {
                [`^/api/v1/${prefix}`]: '/',
              },
        }))

        //execute
        console.info("Executing handler");
        sequence.run();
    });

    //set fallback
    app.use("*", (req,res)=>res.status(404).render("errors/404.ejs", {status: 404}));


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