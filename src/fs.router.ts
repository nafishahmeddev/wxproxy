import fs from "fs";
import path from "path";
import ConnectSequence from "connect-sequence";
import { pathToRegexp, match } from "path-to-regexp";
import Logger from "./lib/logger";

const logger = Logger({ scope: "FS Routing" });
let routes = [];
const generate = (directory, prefix = "", map = []) => {
    const filenames = fs.readdirSync(path.join(directory, prefix));
    filenames.sort((a, b) => fs.statSync(path.join(directory, prefix, a)).isDirectory() ? 1 : -1)
    for (const filename of filenames) {
        const stat = fs.statSync(path.join(directory, prefix, filename));
        if (stat.isDirectory()) {
            const folderRoutes = generate(directory, filename, routes);
            map.push(...folderRoutes);
            continue;
        }
        //
        let segment = filename.slice(0, filename.length - 3);
        if (segment == "index") segment = ""
        segment = segment;

        const pathname = path.join("/" + prefix, segment);
        //module path
        const module = path.join(directory, prefix, filename);

        //keys
        let keys: any = pathname.split("/").map(seg => {
            if (seg.startsWith(":")) {
                return {
                    name: seg.slice(1, seg.length),
                    delimiter: "/",
                    repeat: false,
                    optional: false
                }
            }
            return null;
        }).filter(key => key != null)
        map.push({
            module: module,
            path: pathname,
            regexp: pathToRegexp(pathname)
        });

    }
    return map;
}
const reload = (directory) => {
    routes = generate(directory);
}
const watcher = (directory) => {
    //watch route file
    logger.info("Watcher Initialized...")
    fs.watchFile(path.resolve(directory), async (curr, prev) => {
        logger.info("Route file has been changed reassigning routes");
        await reload(directory);
    });
}


export function FileSystemRouter(options: {
    directory?: string
    prefix?: string,
    watcher?: boolean
} = {
        directory: null,
        prefix: null,
        watcher: false
    }) {
    options.directory = options.directory ?? path.dirname(require.main.filename);
    reload(options.directory);
    options.watcher && watcher(options.directory)


    return async (req, res, next) => {
        const route = routes.find(route => route.regexp.test(req.url));
        if (!route) return next();
        logger.info("Matched route is: ", route.path)
        const matched: any = (match(route.path, { decode: decodeURIComponent })(req.url));
        const params = matched.params;
        req.params = params;
        const sequence = new ConnectSequence(req, res, next);
        try {
            const module = await import(route.module);
            if (module[req.method.toLowerCase()]) {
                logger.info("Serving:", req.method)
                sequence.append(module[req.method.toLowerCase()]);
            } else if (module.default) {
                sequence.append(module.default);
            } else {
                throw new Error("No router found");
            }
        } catch (err) {
            sequence.append((req, res, next) => next())
        }
        sequence.run();
    }
}