import { model, Schema } from 'mongoose';

const comment = new Schema({
  author: Object,
  created: Date,
  content: String,
  lastModified: Date,
  postId: Object
});

export default model('Comment', comment);
