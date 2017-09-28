var mysql = require("mysql");
var fs = require("fs");
var cheerio = require("cheerio");
var connection = getMysqlConnection();
var pool = getMysqlPoll();
var filterpoint = {};

function errlog(err) {
    if (err) {
        console.log(err)
        fs.appendFileSync("/mnt/nandflash/wwwerror.log", new Date().toLocaleString() + " " + err.message + "\r\n")
    }
}

function getListenIps() {
    try {
        var data = fs.readFileSync("/mnt/nandflash/listenip.xml")
        var xmlstr = data.toString();
        $ = cheerio.load(xmlstr);
        var items = $("item")
        var arr = [];
        for (var i = 0; i < items.length; i++) {
            var keys = $(items[i]).find("key");
            var subscribeKeys = []; //订阅的key
            var loopKeys = []; //延时循环访问
            for (var j = 0; j < keys.length; j++) {
                if (keys[j].attribs["loop_time"] == 0) {
                    subscribeKeys.push(keys[j].attribs['number']);
                } else {
                    loopKeys.push({
                        "loop_time": keys[j].attribs["loop_time"],
                        "key": keys[j].attribs["number"],
                        "history": keys[j].attribs['history'],
                        "event": keys[j].attribs['event']
                    });
                }
            }
            arr.push({
                host: $(items[i]).find("ip").text(),
                port: $(items[i]).find("port").text(),
                subscribeKeys: subscribeKeys,
                loopKeys: loopKeys
            })
        }
        return arr;
    } catch (err) {
        errlog(err)
    }
}
getListenIps()

function getFilterPoint() {
    try {
        if (!fs.exists("/mnt/nandflash/filterpoint.xml")) {
            return;
        }
        var data = fs.readFileSync("/mnt/nandflash/filterpoint.xml")
        var xmlstr = data.toString();
        $ = cheerio.load(xmlstr);
        var items = $("item");
        for (var i = 0; i < items.length; i++) {
            var ip = $(items[i]).find("ip").text()
            var key = $(items[i]).find("key").text()

            if (!filterpoint[ip]) {
                filterpoint[ip] = {}
            }
            filterpoint[ip][key] = true;
        }
        console.log(filterpoint)
    } catch (err) {
        errlog(err)
    }
}
//getFilterPoint()

function getMysqlXmlConfig() {
    try {
        var data = fs.readFileSync("/mnt/nandflash/mysqlconfig.xml")
        var xmlstr = data.toString();
        $ = cheerio.load(xmlstr);
        var host = $("host").text()
        var username = $("username").text()
        var password = $("password").text()
        var databasename = $("databasename").text()
        return {
            host: host,
            user: username,
            password: password,
            database: databasename,
            multipleStatements: true
        }
    } catch (err) {
        errlog(err)
    }
}

function getMysqlConnection(option) {
    var connection = mysql.createConnection(option || getMysqlXmlConfig());
    return connection;
}

function getMysqlPoll(option) {
    var pool = mysql.createPool(getMysqlXmlConfig());
    return pool;
}
setInterval(function () {
    var new_pool = getMysqlPoll();
    var old_pool = pool;
    pool = new_pool;
    old_pool.end();

    var new_connection = getMysqlConnection();
    var old_connection = connection;
    connection = new_connection;
    old_connection.end();
}, 1800000)

function initMysqlData(redisClient, connection, callback) {
    getRedisKeys(redisClient, function (err, keys) {
        var ip = redisClient.connection_options.host + "";
        var port = redisClient.connection_options.port;
        var devices = getDeviceByKeys(keys);
        generateMysqlDevices(connection, ip, port, devices, function (err) {
            generateMysqlKeys(connection, redisClient, keys, function (err) {
                callback(err);
            })
        })
    })
}

function clearKeysDevices(connection, callback) {
    connection.query("delete from smartio_key;", function (err, results, fields) {
        if (err) {
            throw err;
        }
        callback(err, results, fields);
    });
    // connection.query("delete from smartio_device;", function (err, results, fields) {
    //     if (err) {
    //         throw err;
    //     }

    // });
}

function getRedisKeys(redisClient, callback) {
    redisClient.keys("[0-9][0-9][0-9][0-9][0-9][0-9][0-9]", function (err, replies) {
        callback(err, replies);
    })
}



function generateMysqlDevices(connection, ip, port, devices, callback) {
    connection.beginTransaction(function (err) {
        let count = 0;
        for (let i = 0; i < devices.length; i++) {
            connection.query("select * from smartio_device where ip = ? and port = ? and device = ?", [ip, port, devices[i]], function (err, results) {
                if (err) {
                    console.log(err)
                } else {
                    count++;
                    if (results[0] == undefined) {
                        connection.query(`insert INTO smartio_device(ip,port,device) values("${ip}",${port},${devices[i]});`, function (err) {
                            if (err) {
                                return connection.rollback(function () {
                                    throw err;
                                })
                            }
                            if (count == devices.length) {
                                connection.commit(function (err) {
                                    if (err) {
                                        return connection.rollback(function () {
                                            throw err;
                                        });
                                    }
                                    callback(err)
                                });
                            }
                        })
                    } else {
                        if (count == devices.length) {
                            connection.commit(function (err) {
                                if (err) {
                                    return connection.rollback(function () {
                                        throw err;
                                    });
                                }
                                callback(err)
                            });
                        }
                    }

                }
            })

        }
    })
}

function generateMysqlKeys(connection, redisClient, keys, callback) {
    var ip = redisClient.connection_options.host + "";
    var port = redisClient.connection_options.port;
    connection.beginTransaction(function (err) {
        let count = 0;
        for (let i = 0; i < keys.length; i++) {
            redisClient.hgetall(keys[i], function (err, obj) {
                var key = this.args[0];
                var device = key.substr(0, 4)
                var insertJSON = {
                    'key': key,
                    'Object_Name': "",
                    'Present_Value': "",
                    'Notify_Type': "",
                    'Description': "",
                    'Object_Type': "",
                    'Hide': "",
                    'Update_Interval': "",
                    'Max_Pres_Value': "",
                    'High_Limit': "",
                    'Acked_Transitions': "",
                    'Min_Pres_Value': "",
                    'Out_Of_Service': "",
                    'Limit_Enable': "",
                    'Event_Enable': "",
                    'Event_State': "",
                    'Deadband': "",
                    'Low_Limit': "",
                    'Device_Type': "",
                    'Object_Identifier': "",
                    'Notification_Class': "",
                    'Lock_Enable': "",
                    'UnitsObject_Type': "",
                    'Offset': "",
                    'COV_Increment': "",
                    'Status_Flags': "",
                    'Time_Delay': "",
                    'Reliability': "",
                    'Resolution': "",
                    'Priority_Array': "",
                    'Relinquish_Default': "",
                    'Units': "",
                    'Elapsed_Active_Time': "",
                    'Change_Of_State_Count': "",
                    'Polarity': "",
                    'Time_Of_Active_Time_Reset': "",
                    'Active_Text': "",
                    'Inactive_Text': "",
                    'Change_Of_State_Time': "",
                    'Time_Of_State_Count_Reset': "",
                    'Plant': "",
                    'Feedback_Value': "",
                    'Minimum_Off_Time': "",
                    'Minimum_On_Time': "",
                    'Model_Name': "",
                    'Alarm_Value': "",
                    'Update_Time': ""
                }
                JSON.apply(insertJSON, obj);
                insertJSON.Update_Time = new Date();
                var query = connection.query("insert INTO smartio_key SET ?,`device`=(select id from smartio_device where `ip`=\"" + ip + "\" and `port`=\"" + port + "\" and `device`=\"" + device + "\" limit 1)",
                    insertJSON,
                    function (err) {
                        if (err) {
                            return connection.rollback(function () {
                                throw err;
                            });
                        }
                        count++;
                        if (count == keys.length) {
                            connection.commit(function (err) {
                                if (err) {
                                    return connection.rollback(function () {
                                        throw err;
                                    });
                                }
                                callback(err);
                            });
                        }
                    }
                );
            })
        }
    })
}

function getTypesByColumn(columns) {
    var typesArr = [];
    for (var i = 0; i < columns.length; i++) {
        var clName = columns[i].COLUMN_NAME;
        if (clName != "id" & clName != "key" & clName != "device") {
            typesArr.push(clName)
        }
    }
    return typesArr;
}

function getDeviceByKeys(keys) {
    var deviceArr = []
    for (var i = 0; i < keys.length; i++) {
        var device = keys[i].substr(0, 4);
        if (!deviceArr.find(function (val, index) {
                if (device == val) {
                    return true;
                }
            })) {
            deviceArr.push(device)
        }
    }
    return deviceArr;
}

JSON.apply = function (object, config) {
    if (object) {
        if (config && typeof config === 'object') {
            var i, j, k;
            for (i in config) {
                if (object[i] != undefined)
                    object[i] = config[i];
            }
        }
    }
    return object;
};

// pool.query("select COLUMN_NAME from  information_schema.COLUMNS where table_name = 'smartio_key';",
//     function (error, results, fields) {
//         var typesArr = getTypesByColumn(results);
//     }
// )

function saveEventMessage(option, callback) {
    var msArr = option.message.split("\r\n");
    var key = msArr[0];
    var host = option.host;
    if (filterpoint[host]) {
        if (filterpoint[host][key]) {
            callback()
            return;
        }
    }
    var deviceId = option.deviceId;
    var Present_Value = msArr[2];
    var message_number = option.channel.split(".")[2];
    saveEventMessageToDB(key, deviceId, Present_Value, message_number, callback)
}

function saveEventMessageToDB(key, deviceId, Present_Value, message_number, callback) {
    var device_instance = key.substr(0, 4);
    var device_type = key.substr(4, 1);
    var device_number = key.substr(5, 2);
    var last_update_time = new Date();

    var sql = pool.query("select * from smartio_key where  `key` = " + key + " and `device`=" + deviceId + " limit 1", function (err, results, fields) {
        var Object_Name, Description;
        if (err) {
            errlog(err)
            return
        }
        if (!results) {
            errlog({
                message: "saveEventMessageToDB results undefine"
            })
            console.log("results undefine")
            return;
        }
        if (results[0]) {
            Object_Name = results[0].Object_Name;
            Description = results[0].Description;
        }
        pool.query("insert INTO smartio_event SET  ? ", {
                Object_Name: Object_Name,
                Description: Description,
                message_number: message_number,
                device: deviceId,
                device_instance: device_instance,
                device_type: device_type,
                device_number: device_number,
                Present_Value: Present_Value,
                last_update_time: last_update_time
            },
            function (err) {
                callback(err);
            }
        );
    })
}

function queryEventMessageByDate(startTime, endTime, callback) {
    console.log("start query message")
    pool.query("select * from smartio_event where last_update_time>? and last_update_time <? ", [startTime, endTime], function (err, results, fields) {
        console.log("end query message")
        callback(err, results, fields)
    })
}

function queryEventMessageByDatePage(startTime, endTime, page, callback) {
    console.log("start query message")
    pool.query("select * from smartio_event where last_update_time>? and last_update_time <?  limit ?,?", [startTime, endTime, 100000 * page, 100000], function (err, results, fields) {
        console.log("end query message")
        callback(err, results, fields)
    })
}

function saveSubscribeMessage(deviceId, msArr, callback) {
    if (!msArr[0]) {
        return
    }
    var key = msArr[0];
    var Present_Value = msArr[2];
    saveSubscribeMessageToDB(deviceId, key, Present_Value, callback);
}

function saveSubscribeMessageToDB(deviceId, key, Present_Value, callback) {
    var device_instance = key.substr(0, 4);
    var device_type = key.substr(4, 1);
    var device_number = key.substr(5, 2);
    var last_update_time = new Date();
    pool.query("insert INTO smartio_data_record SET  ? , `Object_Name` = (select Object_Name from smartio_key where device=" + mysql.escape(deviceId) + " and `key`=" + mysql.escape(key) + ") ", {
            device: deviceId,
            device_instance: device_instance,
            device_type: device_type,
            device_number: device_number,
            Present_Value: Present_Value,
            last_update_time: last_update_time
        },
        function (err) {
            callback(err);
        }
    );
}

function startRedisLinsten(redis, option) {
    var redisClient = redis.createClient(option);
    var redisClientSub = redis.createClient(option);
    redisClient.on("error", function (err) {
        errlog(err)
    })
    redisClientSub.on("error", function (err) {
        errlog(err)
    })

    initMysqlData(redisClient, connection, function (err) {
        var loopKeys = option.loopKeys;
        for (let i = 0; i < loopKeys.length; i++) {
            let loopTime = loopKeys[i].loop_time;
            let key = loopKeys[i].key;
            let history = loopKeys[i].history;
            let event = loopKeys[i].event;
            setInterval(function () {
                redisClient.hget(key, "Present_Value", function (err, Present_Value) {
                    var host = redisClient.connection_options.host;
                    var port = redisClient.connection_options.port;
                    getDeviceId(host, port, key.substr(0, 4), function (err, deviceId) {
                        if (event) {
                            saveEventMessageToDB(key, deviceId, Present_Value, 0, function () {})
                        }
                        if (history) {
                            saveSubscribeMessageToDB(deviceId, key, Present_Value, function () {})
                        }
                    });
                })
            }, loopTime)
        }

        redisClientSub.psubscribe("*");
        redisClientSub.on("pmessage", function (pattern, channel, message) {
            console.log(message);
            var host = this.connection_options.host + "";
            var port = this.connection_options.port;
            var msArr = message.split("\r\n");
            if (option.subscribeKeys.indexOf(msArr[0]) < 0) {
                return;
            }
            if (msArr[1] == "Present_Value") {
                getDeviceId(host, port, message.substr(0, 4), function (err, deviceId) {
                    //console.log(deviceId)
                    saveEventMessage({
                        deviceId,
                        channel,
                        message,
                        host
                    }, function () {})
                    saveSubscribeMessage(deviceId, msArr, function () {})
                });
            }
        })
    })
}

function getDeviceId(host, port, device_instance, callback) {
    pool.query("select id from smartio_device where ip=" + mysql.escape(host) + " and port=" + mysql.escape(port) + " and device =" + mysql.escape(device_instance) + " limit 1", function (error, results, fields) {
        if (!results) {
            errlog({message:"getDeviceId results undefine"})
            console.log("results undefine")
            return ;
        }
        if (results[0]) {
            //console.log(results)
            callback(error, results[0].id);
        }
    })
}

// function insertHistoryIndex(historys, callback) {

//     var query = "insert INTO smartio_history_index set ? ;"

//     var queryStr = "";
//     for (let i = 0; i < historys.length; i++) {
//         queryStr += mysql.format(query, historys[i]);
//     }
//     console.log(queryStr)
//     pool.query(queryStr, function (err, results, fields) {
//         callback(err, results, fields);
//     })
// }

function insertHistoryIndex(history, callback) {
    var sql = pool.query("select id from smartio_history_index where tablename=?", history.tablename, function (err, results) {
        errlog(err);
        if (!results) {
            errlog({
                message: "saveEventMessageToDB results undefine"
            })
            console.log("results undefine")
            return;
        }
        if (results[0]) {
            pool.query("update smartio_history_index set ? where id=" + results[0].id, history, function (err, results) {
                errlog(err);
                callback(results)
            })
        } else {
            pool.query("insert INTO smartio_history_index set ?", history, function (err, results) {
                errlog(err);
                callback(results)
            })
        }
        console.log('results', results, sql.sql)
    })

}

function getHistoryIndexAll(callback) {
    pool.query("select * from smartio_history_index", function (err, results, fields) {
        errlog(err)
        callback(err, results, fields);
    })
}


function insertHistory(data, callback) {
    var sql = "insert INTO smartio_history set ?";
    sql = mysql.format(sql, data);
    pool.query(sql, function (err, results, fields) {
        errlog(err)
        callback(err, results, fields);
    })
}
exports.insertHistory = insertHistory;
exports.getHistoryIndexAll = getHistoryIndexAll;
exports.insertHistoryIndex = insertHistoryIndex;
exports.queryEventMessageByDate = queryEventMessageByDate;
exports.queryEventMessageByDatePage = queryEventMessageByDatePage;
exports.getMysqlConnection = getMysqlConnection;
exports.getMysqlPoll = getMysqlPoll;
exports.initMysqlData = initMysqlData;
exports.clearKeysDevices = clearKeysDevices;
exports.getRedisKeys = getRedisKeys;
exports.generateMysqlDevices = generateMysqlDevices;
exports.generateMysqlKeys = generateMysqlKeys;
exports.getTypesByColumn = getTypesByColumn;
exports.getDeviceByKeys = getDeviceByKeys;
exports.saveSubscribeMessage = saveSubscribeMessage;
exports.startRedisLinsten = startRedisLinsten;
exports.getListenIps = getListenIps;