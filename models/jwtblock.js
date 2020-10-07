import { model, Schema } from "mongoose";

const jwtBlock = new Schema({
  blockdate: String,
  blocktoken: String
}, {
  versionKey: false
});

export default model("jwtBlock", jwtBlock);
