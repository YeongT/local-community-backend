import { model, Schema } from "mongoose";
import UserInfo from "./userdetail";

const Community = new Schema({
  info: {
    created: String,
    name: String,
    description: String,
    picture: String,
    tags: Array
  },
  userlist: [
    UserInfo
  ],
  suecount: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    default: "inservice"
  }
}, {
  versionKey: false
});

export default model("community", Community);