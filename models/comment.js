import { model, Schema } from 'mongoose';

const Comment = new Schema({
  timestamp: String,
  target: {
    ispost: {
      type: Boolean,
      default: false
    },
    target: {
      type: Schema.Types.ObjectId
    }
  },
  content: {
    text: String,
    attach: {
      picture: Array,
      link: String,
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
    target: {
      type: Schema.Types.ObjectId
    }
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

export default model('comment', Comment );