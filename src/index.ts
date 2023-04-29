import dotenv from "dotenv";
dotenv.config();
import express from "express";
import Logger from './lib/logger';
import fs from "fs";
import path from "path";
import ConnectSequence from "connect-sequence";
import { createProxyMiddleware } from 'http-proxy-middleware';
import http from "http";

import chalk from "chalk";
import { HttpLogger } from "./interceptors/HttpLogger";

//assign logger to the project
Logger({ scope: "Gateway" });

//initiate express app
const app = express();

//initiate view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '/../views'));

//http logger
app.use(HttpLogger);

//initiate proxies
let proxies = {};
const reloadProxies = async () => {
    try {
        console.info("Initiating proxies...");
        delete require.cache[require.resolve(`./config/proxies.js`)];
        proxies = (await import(`./config/proxies.js`)).default;
        console.success("Proxies has been repopulated successfully");
    } catch (err) {
        console.error("There is some error in routes", err);
    }
}
const reboot = async () => {
    //loading proxies
    await reloadProxies();

    //assigning dynamic routes
    app.get("/test", (req, res) => res.send("Gateway is running...."));
    app.get("/auth", (req, res, next) => next(new Error("Cool working...")));

    //handling proxies
    app.use("/api/v1/:segments*", (req: any, res, next) => {
        const segments = req.params.segments;
        const prefix = segments.split("/")[0];
        const proxy = proxies[prefix];

        console.info("Request for", segments)

        if (!proxy) return res.status(404).render("errors/error.ejs", { 
            status: 404,
            message: "Page not found!",
            description: " ",
         });


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
            ws: proxy.ws ? true : false,
            changeOrigin: proxy.changeOrigin ? true : false,
            logLevel: "silent",
            pathRewrite: {
                [`^/api/v1/${prefix}`]: '/',
            },
        }))

        //execute
        console.info("Executing handler");
        sequence.run();
    });

    //error handler
    app.use(function (err, req, res, next) {
        res.status(err.status || 500);
        res.render("errors/error.ejs", { 
            status: err.status || 500,
            message: err.message,
            description: err.stack,

        });
    });
    app.use(function (req, res, next) {
        res.status(400);
        res.render("errors/error.ejs", { 
            status:400,
            message: "Page not found",
            description: " ",

        });
    });

    //initialize server
    const server = http.createServer(app);

    //listen to server
    const port = Number(process.env.PORT) || 8000;
    server.listen(port, "localhost", () => {
        console.success("Server listening to ", chalk.green(port));
    })
}
reboot();
//watch route file
fs.watchFile(path.resolve(__dirname + `/config/proxies.${process.env.NODE_ENV == "dev" ? "js" : "js"}`), async (curr, prev) => {
    console.warn("proxies file has been changed reassigning proxies");
    await reloadProxies();
});