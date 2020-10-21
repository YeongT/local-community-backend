import { Schema } from "mongoose";

const userDetail = new Schema({
    community: Schema.Types.ObjectId,
    joined: String,
    privileges: Schema.Types.ObjectId
}, {
    _id: false,
    versionKey: false
});

export default userDetail;