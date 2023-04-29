import express from "express";
import Logger from './lib/logger';
import fs from "fs";
import path from "path";
import ConnectSequence from "connect-sequence";
import { createProxyMiddleware } from 'http-proxy-middleware';
import { Server } from "socket.io";
import http from "http";

import chalk from "chalk";

//assign logger to the project
Logger({ scope: "Gateway" });

//initiate express app
const app = express();

//initiate view engine
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
    app.get("/test", (req, res) => res.send("Gateway is running...."));
    app.get("/auth", (req, res) => res.render("pages/ws.ejs"));
    //app.get("/ws", (req, res) => res.render("pages/ws.ejs"));

    //handling proxies
    app.use("/api/v1/:segments*", (req: any, res, next) => {
        const segments = req.params.segments;
        const prefix = segments.split("/")[0];
        const proxy = global.proxies[prefix];

        console.info("Request for", segments)

        if (!proxy) return res.status(404).render("errors/404.ejs", { status: 404 });


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
            changeOrigin: proxy.changeOrigin ? true: false,
            logLevel: "silent",
            pathRewrite: {
                [`^/api/v1/${prefix}`]: '/',
            },
        }))



        //execute
        console.info("Executing handler");
        sequence.run();
    });

    //set fallback 404
    app.use("*", (req, res) => res.status(404).render("errors/404.ejs", { status: 404 }));


    //initialize server
    const server = http.createServer(app);

    // //initialize socket io
    // const io = new Server(server, {
    //     path: '/api/v1/wss',
    // });
    // io.on('connection', (socket) => {
    //     console.info('a user connected');
    // });

    

    //listen to server
    const port = 8001;
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