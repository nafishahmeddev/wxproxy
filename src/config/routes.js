module.exports =  {
    "account": {
        "endpoint": "http://localhost:8001",
        "middlewares": [
            (req, res, next) => {
                return next();
            }
        ]
    },
    "wallet2": {
        "endpoint": "http://localhost:8001",
        "middlewares": [
            (req, res, next) => {
                return next();
            }
        ]
    }
}