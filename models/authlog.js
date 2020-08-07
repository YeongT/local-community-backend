import { model, Schema } from 'mongoose';

const authlog = new Schema({
    timestamp: String,
    causedby: String,
    originip: String,
    category: String,
    details: Object,
    result: Object,
    memo: String
}, {
    versionKey: false
});

export default model('authLog', authlog);