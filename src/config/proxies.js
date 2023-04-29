module.exports =  {
    "main": {
        target: "http://localhost:8001",
        ws: false,
        interceptors: [
            (req, res, next) => {
                return next();
            }
        ]
    }
}