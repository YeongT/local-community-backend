import { Schema } from "mongoose";
import moment from "moment";
import timezone from "moment-timezone";

const articleEditLog = new Schema({
  timestamp: String,
  content: {
    title: String,
    text: String,
    tags: Array,
    attach: {
      picture: Array,
      link: Array
    }
  }
}, {
  _id: false,
  versionKey: false
});

const commentEditLog = new Schema({
  timestamp: String,
  content: {
    text: String,
    picture: Array
  }
}, {
  _id: false,
  versionKey: false
});

const genEditLog = (content) => {
  moment.tz.setDefault("Asia/Seoul");
  const object = {
    timestamp: moment().format("YYYY-MM-DD HH:mm:ss"),
    content
  };
  return object;
};

export { articleEditLog, commentEditLog, genEditLog };