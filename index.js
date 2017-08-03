var redis = require("redis");
var dbutil = require('./dbutil');
var connection = dbutil.getMysqlConnection();
var pool = dbutil.getMysqlPoll();
var fs = require("fs");
var express = require('express');
var History = require("./History");
var app = express();
var child_process=require("child_process");
var pidName = "/mnt/nandflash/ndpid.text";
require("./excel")
killLastPid()
savePid()

function rebootServer() {
    child_process.exec("n.exe reboot.js")

    // setTimeout(function () {
    //     process.kill(process.pid)
    // }, 1000)
}
app.get("/reboot", function () {
    rebootServer()
})

function savePid() {
    var d = fs.writeFileSync(pidName, process.pid)
}

function killLastPid() {
    try {
        if (fs.existsSync(pidName)) {
            var pid = fs.readFileSync(pidName);
            if (pid) {
                process.kill(pid)
            }
        }
    } catch (e) {

    }
}

var server = app.listen(1888, function (err) {
    if (err) {
        throw err;
    }
    dbutil.clearKeysDevices(connection, function () {
        var arr = dbutil.getListenIps();
        for (var i = 0; i < arr.length; i++) {
            dbutil.startRedisLinsten(redis, arr[i])
        }
    })
    History.run();
})