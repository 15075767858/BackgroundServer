var mysql = require("mysql");
function getMysqlConnection(option) {
    var connection = mysql.createConnection(option || {
        host: '127.0.0.1',
        user: 'root',
        password: 'root',
        database: 'test'
    });
    return connection;
}
function getMysqlPoll(option) {
    var pool = mysql.createPool({
        //connectionLimit: 100,
        host: '127.0.0.1',
        user: 'root',
        password: 'root',
        database: 'test'
    });
    return pool;
}
function initMysqlData(redisClient, connection, callback) {
    getRedisKeys(redisClient, function (err, keys) {
        var ip = redisClient.connection_options.host + "";
        var port = redisClient.connection_options.port;
        var devices = getDeviceByKeys(keys);
        generateMysqlDevices(connection, ip, port, devices, function (err) {
            console.log("device end");
            generateMysqlKeys(connection, redisClient, keys, function (err) {
                console.log("end");
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
            }
            )

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
                                console.log('success!');
                            });
                        }
                    }
                );
            }
            )
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
function saveSubscribeMessage(pool, ip, port, msArr, callback) {
    var key = msArr[0];
    var device_instance = key.substr(0, 4);
    var device_type = key.substr(4, 1);
    var device_number = key.substr(5, 2);
    var Present_Value = msArr[2];
    var last_update_time = new Date();
    pool.query("select id from smartio_device where ip=" + mysql.escape(ip) + " and port=" + mysql.escape(port) + " and device =" + mysql.escape(device_instance) + " limit 1", function (error, results, fields) {
        if (results[0]) {
            var deviceId = results[0].id;
            pool.query("insert INTO smartio_data_record SET  ? , `Object_Name` = (select Object_Name from smartio_key where device=" + mysql.escape(deviceId) + " and `key`=" + mysql.escape(key) + ") ",
                {
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
    })
}
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