import moment from 'moment';
import mongoose from 'mongoose';
import timezone from 'moment-timezone';
import Privilege from '../../models/group/privilege';

const genPrivilege = async (userid, community, permission) => {
    if (!(userid && community && permission))
        throw 'ERR_GEN_PRIVILEDGE_DATA_NOT_PROVIDED';
    try {
        userid = mongoose.Types.ObjectId(userid);
        community = mongoose.Types.ObjectId(community);
    } catch (err) {
        return { privileges: null, privilege_error: err };
    }

    //#DELETE EXIST PRIVILEDGE FILED FOR DATA SAVING
    await Privilege.deleteMany({ user: userid, target: community });
    const newPrivilege = new Privilege({
        user: userid,
        created: moment().format('YYYY-MM-DD HH:mm:ss'),
        target: community,
        permission,
    });

    //#UPLOAD NEW PRIVILEGE OBJECT TO DATABASE
    const _privilege = await newPrivilege.save();
    if (!_privilege) return { privileges: null, privilege_error: _privilege };
    return { privileges: newPrivilege._id, privilege_error: null };
};

export default genPrivilege;
