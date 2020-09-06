import { model, Schema } from "mongoose";

const User = new Schema({
  email: String,
  password: String,
  name: String,
  gender: Number,
  phone: String,
  areaString: String,
  lastlogin: String,
  salt: String,
  community: Array,
  enable: {
    type: Boolean,
    default: false
  }
}, {
  versionKey: false
});


export default model("user", User);