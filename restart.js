var pidutil = require("./pidutil");
var child_process = require("child_process");
var run = require("./run");
var log = require("./log")
setInterval(function () {
    listenApp()
}, 30000)
function listenApp() {
    var pid = pidutil.getPid();
    var command = 'tasklist /fi "pid eq ' + pid + '"';
    console.log(command);
    var path1 = process.cwd() + "\\n.exe";
    //console.log(path1);
    var path2 = process.cwd() + "\\index.js";
    //console.log(path2);
    child_process.exec(command, function (err, stdout, stderr) {
        if (stdout.indexOf('n.exe') < 0) {
            log.errlog({ message: "server restart" })
            child_process.spawn(path1, [path2])
        }
        console.log(arguments)
    })
}
