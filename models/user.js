import { model, Schema } from 'mongoose';

const User = new Schema({
  email: String,
  password : String,
  name : String,
  gender : Number,
  phone : String,
  area : {
      State : String,
      City : String,
      Dong : String
  },
  lastlogin : Date,
  salt : String,
  enable : {
    type : Boolean,
    default : false
  }
});

export default model('Users', User);