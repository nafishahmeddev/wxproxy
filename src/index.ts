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
import ProxyHandler from "./lib/proxy.handler";

//assign logger to the project
Logger({ scope: "Gateway" });

//initiate express app
const app = express();

//initiate view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '/../views'));

//http logger
// app.use(HttpLogger({
//     response : false
// }));

const reboot = async () => {
    //assigning dynamic routes
    app.get("/test", (req, res) => res.send("Gateway is running...."));
    app.get("/auth", (req, res, next) => next(new Error("Cool working...")));

    //handling proxies
    const handler = await ProxyHandler({
        filepath : path.resolve(__dirname+"/../config/proxies.js"),
        debug: process.env.NODE_ENV == "dev"
    });
    app.use(handler);

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
    server.listen(port, () => {
        console.success("Server listening to ", chalk.green(port));
    })
}
reboot();