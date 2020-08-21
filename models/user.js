import { model, Schema } from "mongoose";

const User = new Schema({
  email: String,
  password: String,
  name: String,
  gender: Number,
  phone: String,
  area: {
    state: String,
    city: String,
    dong: String
  },
  lastlogin: String,
  salt: String,
  enable: {
    type: Boolean,
    default: false
  }
}, {
  versionKey: false
});


export default model("user", User);