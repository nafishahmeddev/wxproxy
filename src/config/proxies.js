module.exports = {
    "auth": {
        target: "http://localhost:8001/auth",
        ws: false,
        interceptors: [
            (req, res, next) => {
                return next();
            }
        ]
    },
    "test": {
        target: "http://localhost:8001/test",
        ws: false,
        interceptors: [
            (req, res, next) => {
                return next();
            }
        ]
    },
    // "wss": {
    //     target: "http://localhost:8001",
    //     changeOrigin: true,
    //     ws: true,
    //     logLevel: 'debug',
    // }
}