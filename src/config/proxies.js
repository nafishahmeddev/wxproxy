module.exports =  {
    "products": {
        "endpoint": "https://dummyjson.com/products",
        "middlewares": [
            (req, res, next) => {
                return next();
            }
        ]
    },
    "posts": {
        "endpoint": "https://jsonplaceholder.typicode.com/posts",
        "middlewares": [
            (req, res, next) => {
                return next();
            }
        ]
    },
    "comments": {
        "endpoint": "https://jsonplaceholder.typicode.com/comments",
        "middlewares": [
            (req, res, next) => {
                return next();
            }
        ]
    }
}