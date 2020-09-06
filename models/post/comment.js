import { model, Schema } from "mongoose";
import { commentEditLog as editLog } from "../../routes/coms/buildEditlog";

const Comment = new Schema({
  timestamp: String,
  target: {
    type: Schema.Types.ObjectId
  },
  content: {
    text: String,
    picture: Array
  },
  owner: {
    type: Schema.Types.ObjectId
  },
  modify: {
    ismodified: {
      type: Boolean,
      default: false
    },
    history: [
      editLog
    ]
  },
  suecount: {
    type: Number,
    default: 0
  },
  visible: {
    type: Boolean,
    default: true
  }
}, {
  versionKey: false
});

export default model("comment", Comment );