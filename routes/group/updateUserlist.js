import moment from "moment";
import mongoose from "mongoose";
import timezone from "moment-timezone";
import genPrivilege from "./genPrivilege";

const updateUserlist = async (community, userlist, userid, role) => {
    if (!(community && userlist && userid && role)) throw("ERR_UPDATE_USERLIST_DATA_NOT_PROVIDED");

    var arrayobj = userlist || [];
    try {
        community = mongoose.Types.ObjectId(community);
        userid = mongoose.Types.ObjectId(userid);
    }
    catch (err) {
        return {"userlist": null, "listerror": err};
    }

    //#UPLOAD NEW PRIVILEGE OBJECT TO DATABASE
    const { privileges, privilege_error } = await genPrivilege(userid, community, role);
    if (privilege_error !== null) return {"userlist": null, "listerror": privilege_error};

    const newMember = {
        "user": userid,
        "joined": moment().format("YYYY-MM-DD HH:mm:ss"),
        "privileges": privileges
    };
    arrayobj.push(newMember);
    return {"userlist": arrayobj, "listerror": null};
};

export default updateUserlist;