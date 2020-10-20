import { model, Schema } from "mongoose";
import communityInfo from "./group/groupdetail";

const User = new Schema({
  account: {
    email: String,
    status: {
      type: String,
      default: "unknown"
    },
    joined: String
  },
  service: {
    community: {
      type: [
        communityInfo
      ],
      default: []
    }
  },
  profile: {
    imageurl: String,
    name: String,
    phone: String,
    gender: Number,
    areaString: String
  },
  auth: {
    password: String,
    denied: {
      type: Number,
      default: 0
    },
    history: {
      lastlogin: String,
      lastpwd: String
    },
    salt: String
  }
}, {
  versionKey: false
});

export default model("user", User);