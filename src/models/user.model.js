import mongoose, {Schema} from "mongoose";
import jwt from "jsonwebtoken"
import bcrypt from "bcrypt"

const userSchema = new Schema(
    {
        username: {
            type: String,
            required: true,
            unique: true,
            lowerCase: true,
            trim: true,
            index: true
        }, 
        email: {
            type: String,
            required: true,
            unique: true,
            lowerCase: true,
            trim: true
        },
        fullName: {
            type: String,
            required: true,
            trim: true,
            index: true
        },
        avatar: {
            type: String,
            required: true,
        },
        coverImage: {
            type: String
        },
        watchHistory: [
            {
                type: Schema.Types.ObjectId,
                ref: "Video"
            }
        ],
        password: {
            type: String,
            required: [true, "password is required"],
            trim: true
        },
        refreshToken: {
            type: String
        }
    }, {timestamps: true}
)

userSchema.pre("save", async function(next){
    if(!this.isModified("password")) return next()
    this.password = await bcrypt.hash(this.password, 10)
    next()
})

userSchema.methods.isPasswordCorrect = async function(inputPassword){
    return await bcrypt.compare(inputPassword, this.password)
}

userSchema.methods.genrateAccessToken = function(){
    
    return jwt.sign(
        {
            _id: this._id,
            email: this.email,
            username: this.userName,
            fullName: this.fullName
        },
        process.env.ACCES_TOKEN_SECRET,
        {
            expiresIn: process.env.ACCES_TOKEN_EXPIRY
        }
    )
}

userSchema.methods.genrateRefressToken = function(){
    return jwt.sign(
        {
            _id: this._id
        },
        process.env.REFRESH_TOKAN_SECRET,
        {
            expiresIn: process.env.REFRESH_TOKAN_EXPIRY
        }
    )
}

export const User = mongoose.model("User", userSchema)