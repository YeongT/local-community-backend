import { model, Schema } from "mongoose";
import { articleEditLog as editLog } from "./recordlog";

const Article = new Schema({
  timestamp: String,
  target: {
    type: Schema.Types.ObjectId
  },
  content: {
    title: String,
    text: String,
    tags: Array,
    attach: {
      picture: Array,
      link: Array
    }
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

export default model("article", Article);