import jwtToken from "../../models/jwtblock";
import moment from "moment";

const jwtBlockToken = async (token) => {
    var _response = { "blockerror" : null, "blocktoken" : token };
    const _blockToken = new jwtToken({
        "blockdate" : moment().format("YYYY-MM-DD HH:mm:ss"),
        "blocktoken" : token
    });

    //#SAVE TOKEN BLOCK INFORMATION IN DATABASE
    const _result = await _blockToken.save();
    if (!_result) _response.blockerror = _result.toString();
    return _response;
};

export default jwtBlockToken;