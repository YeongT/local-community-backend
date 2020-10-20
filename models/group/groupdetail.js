import { Schema } from "mongoose";

const userDetail = new Schema({
    community: {
        id: Schema.Types.ObjectId,
        name: String,
        description: String,
        picture: String,
        tags: Array
    },
    member: Number,
    joined: String,
    privileges: Schema.Types.ObjectId
}, {
    _id: false,
    versionKey: false
});

export default userDetail;