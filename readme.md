Install

```
npm i wxproxy
```

Setup with express server

```
const path = require("path");
const express = require('express')
const app = express()
const port = 3000
const {ProxyRouter, FileSystemRouter} = require("wxproxy");

app.get('/', (req, res) => {
  res.send('Hello World!')
})

//for proxies
app.use(ProxyRouter({
    filepath: path.resolve(__dirname, "./proxies.js"),
    debug : true, //print debug console
    watch : true //watch the file and update proxies on file change
}))

//for filesystem routing
app.use("/pages",FileSystemRouter({
    directory: path.resolve(path.join(__dirname, "pages")),
    watcher: true
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
