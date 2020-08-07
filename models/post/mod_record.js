import { Schema } from 'mongoose';
const modRecord = new Schema({
  timestamp: String,
  causeby: String
}, {
  _id: false,
  versionKey: false
});


const genModRecord = (time, cause) => {
  const object = {
    timestamp: time,
    causeby: cause
  }
  return object;
};

export { genModRecord, modRecord };