module.exports =  {
    "auth": {
        target: "http://localhost:8001/auth",
        ws: false,
        interceptors: [
            (req, res, next) => {
                return next();
            }
        ]
    }
}