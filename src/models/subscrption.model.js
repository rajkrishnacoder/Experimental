import mongoose, {Schema} from "mongoose";

const subscriberSchema = new Schema(
    {
        subscriber: {
            type: Schema.Types.ObjectId,
            ref: "User"
        }, 
        channel: {
            tupe: Schema.Types.ObjectId,
            ref: "User"
        }
    }, 
    {timestamps: true}
)

export const Subscriber = mongoose.model("Subscriber", subscriberSchema)