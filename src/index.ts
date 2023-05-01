import fs from "fs";
import path from "path";
import chalk from "chalk";
import ConnectSequence from "connect-sequence";
import HttpProxy from 'http-proxy';
import _ from "lodash";
import Logger from "./lib/logger";

const logger = Logger({scope: "Proxy"});

let proxies = [];
const reload = async (filepath) => {
    try {
        logger.info("Loading proxies configuration...");
        try {
            delete require.cache[require.resolve(filepath)];
        } catch (err) {

        }
        proxies = (await import(filepath)).default;
        logger.success("Proxies has been repopulated successfully");
    } catch (err) {
        logger.error("There is some error in routes", err);
    }
}

const watcher = (filepath) => {
    //watch route file
    logger.info("Watcher Initialized...")
    fs.watchFile(path.resolve(filepath), async (curr, prev) => {
        logger.info("proxies file has been changed reassigning proxies");
        await reload(filepath);
    });
}

export function ProxyHandler(options: {
    filepath: string,
    debug?: boolean,
    watch?: boolean
}) {
    //assign watcher
    options.watch && watcher(options.filepath);

    //assign proxies
    reload(options.filepath);

    //create server 
    const server = HttpProxy.createProxyServer({});
    server.on("error", (err) => logger.error(err));

    //return handler
    return (req: any, res, next) => {
        const proxy = proxies.find(proxy => {
            if (proxy.host && proxy.host != "*" && proxy.host != req.hostname) return false;
            return req.originalUrl.startsWith(proxy.prefix)
        });
        options.debug && logger.info("Request for: ", chalk.blue(req.originalUrl))

        //if no proxy found got to next 
        if (!proxy) return next();
        options.debug && logger.info("Proxy info is", proxy);

        //handle interceptor
        options.debug && logger.info("Request came to proxy handler...");
        const sequence = new ConnectSequence(req, res, next);

        //appending interceptor dynamically
        options.debug && logger.info("Appending interceptors...");
        sequence.append(...(proxy.interceptors ?? []));

        //appending dynamic proxy
        options.debug && logger.info("Appending main handler");
        sequence.append((req, res, next) => {
            req.url = req.url.replace(proxy.prefix, "");
            server.web(req, res, {
                target: proxy.target,
                ws: proxy.ws ? true : false,
                changeOrigin: proxy.changeOrigin ? true : false,
                toProxy: true
            }, (err) => {
                logger.error(err);
                next(err);
            });
        })

        //execute
        options.debug && logger.info("Executing handler");
        sequence.run();
    }
}

process.on('warning', e => logger.warn(e.stack));