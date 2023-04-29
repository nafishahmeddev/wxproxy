import express from "express";
import Logger from './lib/logger';
import fs from "fs";
import path from "path";
import proxy from "express-http-proxy";
import ConnectSequence from "connect-sequence";

//assign logger to the project
Logger({ scope: "API Gateway" });

const app = express();
global.handlersName = null;
global.handlers = {};
const reloadHandlers = async () => {
    try {

        delete require.cache[require.resolve(`./config/routes.js`)];
        global.handlers = (await import(`./config/routes.js`)).default;
        console.success("Handler has been re populated successfully");
    } catch (err) {
        console.error("There is some error in routes", err);
    }
}
const reboot = async () => {

    //loading handlers
    await reloadHandlers();

    //assigning dynamic routes
    app.get("/", (req, res) => res.send("Cool"));

    //handling proxies
    app.use("/api/v1/:segments",(req: any, res, next) => {
        const segments = req.params.segments;
        const prefix = segments.split("/")[0];
        const handler = global.handlers[prefix];
        if (!handler) return next(new Error("Handler not found"));
        const uri = segments.replace(`${prefix}`, "");

        //handle middleware
        console.log("request goes to handler");
        const sequence = new ConnectSequence(req, res, next);
        //appending middleware dynamically
        console.log("appending middleware dynamically");
        sequence.append(...(handler.middlewares ?? []));

        //appending dynamic handler
        console.log("appending dynamic handler");
        sequence.append(proxy(`${handler.endpoint}/${segments}${uri}`));
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
    console.log("Handlers file has been changed reassigning handlers");
    await reloadHandlers();
});