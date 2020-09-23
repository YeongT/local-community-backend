var _response = { "statusCode" : 500, "bodymsg" : "ERR_SERVER_FAILED_TEMPORARILY", "output" : null, "error" : "SERVER_RESPONSE_INVALID"};
const responseFunction = async (res, statusCode, bodymsg, output, error) => {
    if (!(statusCode && bodymsg)) throw("ERR_SERVER_BACKEND_SYNTAX_FAILED");
    if (!(error === undefined || error === null || error.includes("JsonWebTokenError") || error.startsWith("JWT_"))) console.error(error);
    _response.statusCode = statusCode;
    _response.bodymsg = bodymsg;
    _response.output = output || null;
    _response.error = error ? error.toString() : null;
    res.status(statusCode).json(_response);
    return _response;
};

export default responseFunction;
