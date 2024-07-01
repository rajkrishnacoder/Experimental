import mongoose, {Schema} from "mongoose";

const videoSchema = new Schema(
    {
        videoFile: {
            type: String,
            required: true
        },
        thumbnail: {
            type: String,
            required: true
        },
        title: {
            type: String,
            required: true,
        },
        descripiton: {
            type: String,
            required: true,
            trim: true
        },
        duration: {
            type: Number,
            required: true
        },
        views: {
            type: Number,
            default: 0
        },
        isPublished: {
            type: Boolean,
            required: true
        },
        owner: {
            type: Schema.Types.ObjectId,
            ref: "User"
        }
    },
    {timestamps: true}
)

export const Video = mongoose.model("Video", videoSchema)