import dbconnect from "./db/index.js";
import dotenv from "dotenv";
import { app } from "./app.js";

dotenv.config({path: "./.env"})//

dbconnect()
.then(()=>{
    app.listen(process.env.PORT || 8000, ()=>{
        console.log(`server is running at port:${process.env.PORT}`)
    })
})
.catch((err)=> {
    console.log(`MONGO db connection failed:`, err)
})


