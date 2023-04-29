module.exports = {
    "mynu": {
        target: "http://localhost:8000",
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