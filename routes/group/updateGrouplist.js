import moment from "moment";
import mongoose from "mongoose";
import timezone from "moment-timezone";
import User from "../../models/user";

const updateGrouplist = async (userid, community, privileges) => {
    if (!(userid && community && privileges)) throw("ERR_UPDATE_USERLIST_DATA_NOT_PROVIDED");

    try {
        userid = mongoose.Types.ObjectId(userid);
        community = mongoose.Types.ObjectId(community);
    }
    catch (error) {
        return error;
    }

    //#LOAD USER COMMUNITY LIST FROM DATABASE
    const _user = await User.findOne({"_id": userid}, {"auth":0});
    if (!_user) return (_user === undefined || _user === null) ? "ERR_COULD_NOT_FOUND_USER_OBJECT" : _user;
    
    //#ADD GROUPDETAIL TO LIST OBJECT AND UPDATE FIELD
    var grouplist = _user.service.community || [];
    const newGroup = {
        "community": community,
        "joined": moment().format("YYYY-MM-DD HH:mm:ss"),
        "privileges": privileges
    };
    grouplist.push(newGroup);
    
    const _update = await User.updateOne({"_id": userid}, {"service.community": grouplist});
    return _update ? null : _update;
};

export default updateGrouplist;