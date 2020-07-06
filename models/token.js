import { model, Schema } from 'mongoose';

const token = new Schema({
  owner: String,
  type: String,
  token: String,
  created: Date,
  expired: Date
});

export default model('Token', token);