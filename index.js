var redis = require("redis");

var dbutil = require('./dbutil');

var connection = dbutil.getMysqlConnection();
var pool = dbutil.getMysqlPoll();

dbutil.clearKeysDevices(connection, function () {
    var arr = dbutil.getListenIps();
    for (var i = 0; i < arr.length; i++) {
        console.log(arr[i])
        dbutil.startRedisLinsten(redis, arr[i])
    }
})
