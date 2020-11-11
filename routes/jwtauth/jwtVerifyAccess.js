import Article from '../../models/post/article';
import Comment from '../../models/post/comment';
import Community from '../../models/group/community';
import Privilege from '../../models/group/privilege';

var _response = {
    privileges: null,
    verify_error: 'ERR_VERIFY_USER_SYNTAX_FAILED',
};

const returnResult = (result, error) => {
    if (result !== undefined) _response.privileges = result;
    if (error !== undefined) _response.verify_error = error;
    return _response;
};

const jwtVerifyAccess = async (userid, type, target) => {
    if (userid && type && target) {
        if (type === 'article') {
            const _article = await Article.findOne(
                {
                    _id: target,
                    owner: userid,
                    suecount: { $lt: 5 },
                    visible: true,
                },
                { _id: 0, content: 0, modify: 0 }
            );
            if (_article === undefined || _article === null)
                return returnResult(null, 'ERR_JWT_CAN_NOT_FIND_ARTICLE');
            if (!_article) return returnResult(null, _article);
            target = _article.target.community;
        }
        if (type === 'comment') {
            const _comment = await Comment.findOne(
                {
                    _id: target,
                    owner: userid,
                    suecount: { $lt: 5 },
                    visible: true,
                },
                { _id: 0, content: 0, modify: 0 }
            );
            if (_comment === undefined || _comment === null)
                return returnResult(null, 'ERR_JWT_CAN_NOT_FIND_COMMENT');
            if (!_comment) return returnResult(null, _comment);
            target = _comment.target.community;
        }
        const _community = await Community.findOne(
            { _id: target, status: 'inservice' },
            { info: 0 }
        );
        if (_community === null || _community === undefined)
            return returnResult(null, 'ERR_JWT_CAN_NOT_FIND_COMMUNITY');
        if (!_community) return returnResult(null, _community);

        //#FIND USER PRIVILEGE IN COMMUNITY MEMBER LIST
        const _useraccess = await _community.userlist.find(
            (obj) => obj.user === userid
        );
        if (_useraccess === undefined)
            return returnResult(null, 'ERR_JWT_NOT_USER_IN_COMMUNITY');

        const _privilege = await Privilege.findOne({
            _id: _useraccess.privilege,
            user: userid,
        });
        if (!_privilege) return returnResult(null, _privilege);
        return returnResult(_privilege.permission, null);
    }
    return returnResult(null, 'ERR_VERIFY_USER_NOT_PROVIDED');
};

export default jwtVerifyAccess;
