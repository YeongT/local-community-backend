import { model, Schema } from 'mongoose';

const accesslog = new Schema({
    timestamp: String,
    causedby : String,
    originip : String,
    category : String,
    details : Object,
    result: String,
    memo: String
});

export default model('accessLog', accesslog);