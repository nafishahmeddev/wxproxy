import fs from "fs";
import path from "path";
import chalk from "chalk";
import ConnectSequence from "connect-sequence";
import { createProxyMiddleware } from 'http-proxy-middleware';


let _console : any = console;
function parse(str) {
    return Function(`'use strict'; return (${str})`)()
}

let proxies = [];
const reload = async (filepath) => {
    try {
        _console.info("Initiating proxies...");
        const proxiesString = fs.readFileSync(filepath).toString();
        const tmpFile = __dirname + "/proxies.tmp.js";
        fs.writeFileSync(tmpFile, proxiesString);
        try {
            delete require.cache[require.resolve("./proxies.tmp.js")];
        } catch (err) {

        }
        proxies = (await import("./proxies.tmp.js")).default;
        _console.success("Proxies has been repopulated successfully");
    } catch (err) {
        _console.error("There is some error in routes", err);
    }
}

const watcher = (filepath) => {
    //watch route file
    fs.watchFile(path.resolve(filepath), async (curr, prev) => {
        _console.warn("proxies file has been changed reassigning proxies");
        await reload(filepath);
    });
}

export default async function ProxyHandler(options: {
    filepath: string,
    debug? : boolean
}) {
    //assign console 
    _console = options.debug? console : {
        log: (...data)=>{},
        info: (...data)=>{},
        error: (...data)=>{},
        debug: (...data)=>{},
        fetal: (...data)=>{},
    };
    //assign watcher
    await watcher(options.filepath);

    //assign proxies
    await reload(options.filepath);

    return (req: any, res, next) => {
        const proxy = proxies.find(proxy => {
            if (proxy.host && proxy.host != "*" && proxy.host != req.hostname) return false;
            return req.originalUrl.startsWith(proxy.prefix)
        });
        _console.info("Request for: ", chalk.blue(req.originalUrl))

        //if no proxy found got to next 
        if (!proxy) return next();


        //handle interceptor
        _console.info("Request came to proxy handler...");
        const sequence = new ConnectSequence(req, res, next);

        //appending interceptor dynamically
        _console.info("Appending interceptors...");
        sequence.append(...(proxy.interceptors ?? []));

        //appending dynamic proxy
        _console.info("Appending main handler");

        sequence.append(createProxyMiddleware({
            target: proxy.target,
            ws: proxy.ws ? true : false,
            changeOrigin: proxy.changeOrigin ? true : false,
            //logLevel: "silent",
            pathRewrite: {
                [`^${proxy.prefix}`]: '/',
            },
        }))

        //execute
        _console.info("Executing handler");
        sequence.run();
    }
}