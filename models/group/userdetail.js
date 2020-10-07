import { Schema } from "mongoose";

const userDetail = new Schema({
    user: Schema.Types.ObjectId,
    joined: String,
    privileges: Schema.Types.ObjectId
}, {
  versionKey: false
});

export default userDetail;