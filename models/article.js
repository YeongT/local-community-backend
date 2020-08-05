import { model, Schema } from 'mongoose';

const Article = new Schema({
  timestamp : String,
  target : { type: Schema.Types.ObjectId },
  content : {
    title : String,
    text : String,
    tags : Array,
    attach : {
      picture : Array,
      link : String
    }
  },
  owner : { type: Schema.Types.ObjectId },
  modify : {
    ismodified : {
      type : Boolean,
      default : false
    },
    target : { type: Schema.Types.ObjectId }
  },
  suecount : {
    type : Number,
    default : 0
  },
  visible : {
    type : Boolean,
    default : true
  }

});

export default model('article', Article);