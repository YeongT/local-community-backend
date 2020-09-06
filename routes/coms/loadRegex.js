import safe from "safe-regex"; 

const loadRegex = async () => {
    const REGEX_EMAIL=/^[0-9a-zA-Z\_\-\.]+@[a-zA-Z\_\-\.]+?\.[a-zA-Z]{2,3}$/,
    REGEX_PASSWD=/^.*(?=^.{8,15}$)(?=.*\d)(?=.*[a-zA-Z])(?=.*[!@#$%^&+=]).*$/,
    REGEX_PHONE=/^(?:(010-?\d{4})|(01[1|6|7|8|9]-?\d{3,4}))-?\d{4}$/,
    REGEX_NAME=/^[ㄱ-ㅎㅏ-ㅣ가-힣a-zA-Z0-1 ]{2,10}/;

    if (!(safe(REGEX_EMAIL) && safe(REGEX_PASSWD) && safe(REGEX_PHONE)) && safe(REGEX_NAME)) {
        console.error(`EMAIL REGEX PASS : ${safe(REGEX_EMAIL)}`);
        console.error(`PASSWD REGEX PASS : ${safe(REGEX_PASSWD)}`);
        console.error(`PHONE REGEX PASS : ${safe(REGEX_PHONE)}`);
        console.error(`NAME REGEX PASS : ${safe(REGEX_NAME)}`);
        throw("ERR_OCCURED_WHILE_LOADING_REGEX : SOME_REGEX_NOT_SAFE");
    }
    return ({
        "emailchk": REGEX_EMAIL,
        "passwdchk": REGEX_PASSWD,
        "phonechk": REGEX_PHONE,
        "namechk": REGEX_NAME
    });
};

export default loadRegex;
