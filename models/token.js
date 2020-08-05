import { model, Schema } from 'mongoose';

const token = new Schema({
  owner: String,
  type: String,
  token: String,
  created: String,
  expired: String
});

export default model('token', token);