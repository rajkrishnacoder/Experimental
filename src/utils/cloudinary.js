import {v2 as cloudinary} from "cloudinary"
import fs from "fs"


cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});


const uploadOnCloudinary = async (localFilePath) =>{
    try {
        if(!localFilePath) return null
        //upload the fille on cloudinary
        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto"
        })
        // file has been uploaded successfull
        console.log("file is uploaded on cloudinary", response.url)
        fs.unlinkSync(localFilePath)
        return response;
    } catch (error) {
        fs.unlinkSync(localFilePath) // remove the locally save temporary file as the operation got failed
        console.log("fille is not upoladed for:", error)
        return null
    }
}

const deleteOnCloudinary = async (arrayOfFiles, myType)=>{
    try {
        if(!arrayOfFiles) return null

        const response = await cloudinary.api.delete_resources(arrayOfFiles, {resource_type: myType})

        console.log("file is deleted on coudinary", arrayOfFiles)
        return response
    } catch (error) {
        console.log("fille is not deleted from cloudinary:", error)
        return null
    }
}


export {uploadOnCloudinary, deleteOnCloudinary}