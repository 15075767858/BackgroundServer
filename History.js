var mysql = require("mysql");
var fs = require("fs");
var cheerio = require("cheerio");
var redis = require("redis");
var dbutil = require("./dbutil")
var HistoryArr = [];
var clientArr = [];

function run() {
    getHistoryXml()
    setInterval(function () {
        queryRedisByKeys()
    }, 10000)
}
exports.run=run;
function getHistoryXml() {
    HistoryArr = [];
    var data = fs.readFileSync("/mnt/nandflash/HistoryTable.xml")
    var xmlstr = data.toString();
    $ = cheerio.load(xmlstr);
    var items = $("item");
    for (var i = 0; i < items.length; i++) {
        var ip = $(items[i]).find("ip").text().replace(/[\n\t]/gm, "")
        var port = $(items[i]).find("port").text().replace(/[\n\t]/gm, "")
        var tablename = $(items[i]).find("tablename").text().replace(/[\n\t]/gm, "")
        var keys = $(items[i]).find("keys").text().replace(/[\n\t]/gm, "")
        var keysArr = keys.split(",").sort().slice(0, 7)

        var data = {
            ip,
            port,
            tablename,
            keys: keys,
            key1: keysArr[0] || "",
            key2: keysArr[1] || "",
            key3: keysArr[2] || "",
            key4: keysArr[3] || "",
            key5: keysArr[4] || "",
            key6: keysArr[5] || "",
            key7: keysArr[6] || "",
            key8: keysArr[7] || "",
        }
        HistoryArr.push(data)
        dbutil.insertHistoryIndex(data, function (err, results) {
            setInterval(function () {
                queryRedisByKeys()

            }, 10000)
        })
    }

}

function queryRedisByKeys() {
    dbutil.getHistoryIndexAll(function (err, results) {
        for (let i = 0; i < results.length; i++) {
            //console.log(results[i])
            let client = redis.createClient({
                host: results[i].ip,
                port: results[i].port
            })
            client.multi()
                .hget(results[i].key1, "Present_Value")
                .hget(results[i].key2, "Present_Value")
                .hget(results[i].key3, "Present_Value")
                .hget(results[i].key4, "Present_Value")
                .hget(results[i].key5, "Present_Value")
                .hget(results[i].key6, "Present_Value")
                .hget(results[i].key7, "Present_Value")
                .hget(results[i].key8, "Present_Value")
                .exec(function (err, replies) {
                    //console.log(results[i])
                    var data = {
                        tablename: results[i].id,
                        key1_value: replies[0],
                        key2_value: replies[1],
                        key3_value: replies[2],
                        key4_value: replies[3],
                        key5_value: replies[4],
                        key6_value: replies[5],
                        key7_value: replies[6],
                        key8_value: replies[7],
                        last_update_time: new Date()
                    }
                    client.quit()
                    dbutil.insertHistory(data, function () {

                    })
                    console.log(replies)
                })
        }
        console.log(results.length)
    })

}