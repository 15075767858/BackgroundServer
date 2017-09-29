var fs = require("fs");
var path = "/mnt/nandflash/wwwerror.log";

function errlog(err) {
    if (err) {
        console.log(err)
        fs.appendFileSync(path, new Date().toLocaleString() + " " + err.message + "\r\n")
    }
}

exports.errlog=errlog;