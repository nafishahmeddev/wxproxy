import fs from "fs";
import path from "path";
import chalk from "chalk";
import ConnectSequence from "connect-sequence";
import HttpProxy from 'http-proxy';


let server = HttpProxy.createProxyServer({});
let proxies = [];
const reload = async (filepath) => {
    try {
        console.info("Initiating proxies...");
        const proxiesString = fs.readFileSync(filepath).toString();
        const tmpFile = __dirname + "/proxies.tmp.js";
        fs.writeFileSync(tmpFile, proxiesString);
        try {
            delete require.cache[require.resolve("./proxies.tmp.js")];
        } catch (err) {

        }
        proxies = (await import("./proxies.tmp.js")).default;
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

export default async function ProxyHandler(options: {
    filepath: string,
    debug?: boolean
}) {
    //assign watcher
    await watcher(options.filepath);

    //assign proxies
    await reload(options.filepath);

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
        sequence.append((req,res) => {
            server.web(req, res, {
                target: proxy.target,
                ws: proxy.ws ? true : false,
                changeOrigin: proxy.changeOrigin ? true : false,
                ignorePath: true
            }, (err)=>{
                console.error(err);
            });
        })

        //execute
        options.debug && console.info("Executing handler");
        sequence.run();
    }
}

process.on('warning', e => console.warn(e.stack));