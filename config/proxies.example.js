module.exports = [
    {
        host: "*",
        prefix: "/api/v1/mynu",
        target: "http://localhost:8000/auth",
        ws: false,
        interceptors: [
            (req, res, next) => {
                return next();
            }
        ]
    },
    {
        host: "*",
        prefix: "/api/v1/wss",
        target: "http://localhost:8001",
        changeOrigin: true,
        ws: true
    }
]