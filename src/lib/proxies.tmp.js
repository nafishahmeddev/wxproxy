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
]