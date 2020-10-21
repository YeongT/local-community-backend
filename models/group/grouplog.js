import { model, Schema } from "mongoose";

const grouplog = new Schema({
    timestamp: String,
    causedby: String,
    originip: String,
    category: String,
    details: Object,
    result: Object
}, {
    versionKey: false
});

export default model("groupLog", grouplog);