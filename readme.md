Install

```
npm i wxproxy
```

Setup with express server for proxy server

```
const path = require("path");
const express = require('express')
const app = express()
const port = 3000
const {ProxyRouter} = require("wxproxy");

app.get('/', (req, res) => {
  res.send('Hello World!')
})

//for proxies
app.use(ProxyRouter({
    filepath: path.resolve(__dirname, "./proxies.js"),
    debug : true, //print debug console
    watch : true //watch the file and update proxies on file change
}))

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})
```

Proxy configuration file (proxies.js)

```
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
```

## Setup with express server for file system routing

```
const path = require("path");
const express = require('express')
const app = express()
const port = 3000
const { FileSystemRouter} = require("wxproxy");

app.get('/', (req, res) => {
  res.send('Hello World!')
})


//for filesystem routing
app.use("/pages",FileSystemRouter({
    directory: path.resolve(path.join(__dirname, "pages")),
    debug : true, //print debug console
    watch : true //watch the file and update proxies on file change
}))


app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})
```

File system router file example (./pages/index.js)

```
//this will assign on get method
exports.get = (req, res, next) =>{
    res.send("get method called");
}

//this will assign in post method
exports.post = (req, res, next) =>{
    res.send("post method called");
}

//this will assign as fallback
module.exports = (req, res, next) =>{
    res.send("default method called");
}


```
