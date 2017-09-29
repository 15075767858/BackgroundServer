var child_process = require("child_process");
var fs = require("fs");
var pidName = "/mnt/nandflash/ndpid.text";
function killLastPid() {
    var pid = getPid();
    process.kill(pid);
}

function savePid() {
    var d = fs.writeFileSync(pidName, process.pid)
}

function getPid() {
    try {
        if (fs.existsSync(pidName)) {
            var pid = fs.readFileSync(pidName);
            if (pid) {
                return pid.toString()
            }
        }
    } catch (e) {}
}


function killLastPid() {
    try {
        if (fs.existsSync(pidName)) {
            var pid = fs.readFileSync(pidName);
            if (pid) {
                process.kill(pid)
            }
        }
    } catch (e) {}
}
function rebootServer() {
    child_process.exec("n.exe reboot.js")

}
exports.killLastPid=killLastPid;
exports.savePid=savePid;
exports.getPid=getPid;
exports.rebootServer=rebootServer;