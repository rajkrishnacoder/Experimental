import mongoose from "mongoose";
import { DB_NAME } from "../constant.js";

const dbconnect = async ()=>{
    try {
        const dbconnected = await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
        console.log("MONGODB connected with:", dbconnected.connection.host)
    } catch (error) {
        console.log("MONGODB db disconnected for:", error)
        process.exit(1)
    }
}

export default dbconnect