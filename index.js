var mysql = require('mysql');
var pool = mysql.createPool({
    //connectionLimit: 100,
    host: '127.0.0.1',
    user: 'root',
    password: 'root',
    database: 'test'
});
var connection = mysql.createConnection({
    host: '127.0.0.1',
    user: 'root',
    password: 'root',
    database: 'test'
});
var redis = require("redis");
var redisClient = redis.createClient();
var redisClientSub = redis.createClient();
var dbutil = require('./dbutil')
dbutil.clearKeysDevices(connection, function () {
    dbutil.initMysqlData(redisClient, connection, function (err) {
        redisClientSub.psubscribe("*")
        redisClientSub.on("pmessage", function (pattern, channel, message) {
            var host = this.connection_options.host + "";
            var port = this.connection_options.port;
            var msArr = message.split("\r\n");
            console.log(arguments)
            console.log(msArr)
            if (msArr[1] == "Present_Value") {
                dbutil.saveSubscribeMessage(pool, host, port, msArr, function () {
                })
            }
        })
    })
})