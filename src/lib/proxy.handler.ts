import fs from "fs";
import path from "path";
import chalk from "chalk";
import ConnectSequence from "connect-sequence";
import { createProxyMiddleware } from 'http-proxy-middleware';

let proxies = [];
const reload = async (filepath) => {
    try {
        console.info("Initiating proxies...");
        console.log(filepath);
        //delete require.cache[require.resolve(filepath)];
        proxies = (await import(filepath)).default;
        console.success("Proxies has been repopulated successfully");
    } catch (err) {
        console.error("There is some error in routes", err);
    }
}

const watcher = (filepath) => {
    //watch route file
    fs.watchFile(path.resolve(filepath), async (curr, prev) => {
        console.warn("proxies file has been changed reassigning proxies");
        await reload(filepath);
    });
}

export default async function  ProxyHandler(options: {
    filepath : string
}) {
    import(path.relative(__dirname,options.filepath)).then(res=>{
        console.log(res);
    }).catch(err=>console.error(err.message));
    return (req, res, next) =>{next()}
    //assign watcher
    await watcher(options.filepath);

    //assign proxies
    await reload(options.filepath);
    console.log(options.filepath);

    return (req: any, res, next) => {
        const proxy = proxies.find(proxy => {
            if (proxy.host && proxy.host != "*" && proxy.host != req.hostname) return false;
            return req.originalUrl.startsWith(proxy.prefix)
        });
        console.info("Request for: ", chalk.blue(req.originalUrl))

        //if no proxy found got to next 
        if (!proxy) return next();


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
            //logLevel: "silent",
            pathRewrite: {
                [`^${proxy.prefix}`]: '/',
            },
        }))

        //execute
        console.info("Executing handler");
        sequence.run();
    }
}