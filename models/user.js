  
import { model, Schema } from 'mongoose';

const User = new Schema({
  email: String,
  passwd : String,
  name : String,
  gender : Number,
  phone : String,
  area : {
      State : String,
      City : String,
      Dong : String
  },
  salt : String
});

export default model('Users', User);