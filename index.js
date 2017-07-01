var redis = require("redis");
var dbutil = require('./dbutil');
var connection = dbutil.getMysqlConnection();
var pool = dbutil.getMysqlPoll();
var fs = require("fs");

var express = require('express');
var app = express();
// console.log(process.pid)
// setTimeout(function(){
// process.kill(process.id)
// },3000)
killLastPid()
savePid()
function savePid() {
    var d = fs.writeFileSync('pid.text', process.pid)
}
function killLastPid() {
    try {
        if (fs.existsSync('pid.text')) {
            var pid = fs.readFileSync('pid.text');
            if (pid) {
                process.kill(pid)
            }
        }
    }
    catch (e) {

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
})
