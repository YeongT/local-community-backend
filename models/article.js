import { model, Schema } from 'mongoose';

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
      String
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

export default model('article', Article);