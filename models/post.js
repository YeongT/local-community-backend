import { model, Schema } from 'mongoose';

const post = new Schema({
  author: Object,
  created: Date,
  title: String,
  content: String,
  lastModified: Date
});

export default model('Post', post);