import { FileSystemRouter } from "../fs.router";
import express from "express";
import path  from "path";

const app = express();

app.use("/pages",FileSystemRouter({
    directory: path.resolve(path.join(__dirname, "pages")),
    watch: true
}))


app.listen(3000, ()=>{
    console.log("Server is running");
});