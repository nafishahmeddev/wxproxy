module.exports = [
    {
        host: "*",
        prefix: "/api/v1",
        target: "http://localhost:8000/test",
        ws: false,
        interceptors: [
            (req, res, next) => {
                return next();
            }
        ]
    },
    {
        host: "localhost",
        prefix: "/api/v1/test",
        target: "http://localhost:8001",
        changeOrigin: true,
        ws: true
    }
]