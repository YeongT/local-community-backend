import { model, Schema } from 'mongoose';

const token = new Schema({
  owner: String,
  type: String,
  token: String,
  created: {
    type:Date,
    default: Date.now()
  },
  expired: {
    type:Date,
    default: Date.now() + 24*60*60*1000
  }
});

export default model('Token', token);