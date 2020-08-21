import { model, Schema } from "mongoose";

const postlog = new Schema({
    timestamp: String,
    causedby: String,
    originip: String,
    category: String,
    details: Object
}, {
    versionKey: false
});

export default model("postLog", postlog);