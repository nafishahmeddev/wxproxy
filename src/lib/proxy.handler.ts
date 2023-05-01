import fs from "fs";
import path from "path";
import chalk from "chalk";
import ConnectSequence from "connect-sequence";
import _ from "lodash";
import { createProxyMiddleware } from "http-proxy-middleware";

let proxies = [];
const reload = async (filepath) => {
    try {
        console.info("Loading proxies configuration...");
        try {
            delete require.cache[require.resolve(filepath)];
        } catch (err) {

        }
        proxies = (await import(filepath)).default;
        console.success("Proxies has been repopulated successfully");
    } catch (err) {
        console.error("There is some error in routes", err);
    }
}

const watcher = (filepath) => {
    //watch route file
    console.info("Watcher Initialized...")
    fs.watchFile(path.resolve(filepath), async (curr, prev) => {
        console.info("proxies file has been changed reassigning proxies");
        await reload(filepath);
    });
}

export default async function ProxyHandler(options: {
    filepath: string,
    debug?: boolean,
    watch?: boolean
}) {
    //assign watcher
    options.watch && await watcher(options.filepath);

    //assign proxies
    await reload(options.filepath);

    //return handler
    return (req: any, res, next) => {
        const proxy = proxies.find(proxy => {
            if (proxy.host && proxy.host != "*" && proxy.host != req.hostname) return false;
            return req.originalUrl.startsWith(proxy.prefix)
        });
        options.debug && console.info("Request for: ", chalk.blue(req.originalUrl))

        //if no proxy found got to next 
        if (!proxy) return next();

        //handle interceptor
        options.debug && console.info("Request came to proxy handler...");
        const sequence = new ConnectSequence(req, res, next);

        //appending interceptor dynamically
        options.debug && console.info("Appending interceptors...");
        sequence.append(...(proxy.interceptors ?? []));

        //appending dynamic proxy
        options.debug && console.info("Appending main handler");
        sequence.append(createProxyMiddleware({
            target: proxy.target,
            ws: proxy.ws ? true : false,
            changeOrigin: proxy.changeOrigin ? true : false,
            logLevel: options.debug ? 'debug' : "silent",
            pathRewrite: {
                [`^${proxy.prefix}`]: '',
            },
        }))


        //execute
        options.debug && console.info("Executing handler");
        sequence.run();
    }
}

process.on('warning', e => console.warn(e.stack));