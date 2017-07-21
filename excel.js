var Excel = require('exceljs');
var dbutil = require("./dbutil")
var schedule = require('node-schedule');
var fs = require("fs");
schedule.scheduleJob('0 0 0 1-31 * *', function () {
    console.log(new Date().toLocaleString());
    saveOneDayEventExcel();
});
schedule.scheduleJob('0 0 0 1 1-12 *', function () {
    console.log(new Date().toLocaleString());
    saveOneMonthEventExcel();
});

function saveEventExcel(startTime, endTime) {
    dbutil.queryEventMessageByDate(startTime, endTime, function (err, results, fields) {
        console.log(results)
        generateExcel(startTime.toDateString() + " - " + endTime.toDateString() + ".xlsx", results);
        //process.exit()
    });
}

//saveOneMinEventExcel()

function saveOneMinEventExcel() {
    var endTime = new Date();
    var startTime = new Date(endTime.getTime() - 60000);
    saveEventExcel(startTime, endTime);
}

function saveOneDayEventExcel() {
    var endTime = new Date();
    var startTime = new Date(endTime.getTime() - 86400000);
    saveEventExcel(startTime, endTime);
}

function saveOneMonthEventExcel() {
    var endTime = new Date();
    var startTime = new Date();
    startTime = new Date(startTime.setMonth(startTime.getMonth() - 1));

    saveEventExcel(startTime, endTime);
}

function generateExcel(filename, data) {
    var workbook = new Excel.Workbook();


    var worksheet = workbook.addWorksheet(filename, {
        properties: {
            tabColor: {
                argb: 'FFC0000'
            }
        }
    });
    worksheet.pageSetup.margins = {
        left: 70,
        right: 0.7,
        top: 75,
        bottom: 0.75,
        header: 0.3,
        footer: 0.3
    };
    worksheet.columns = [{
            header: 'Object_Name',
            key: 'Object_Name',
            width: 32
        },
        {
            header: 'Description',
            key: 'Description',
            width: 32
        },
        {
            header: 'device_instance',
            key: 'device_instance',
            width: 15
        },
        {
            header: 'device_number',
            key: 'device_number',
            width: 15
        },
        {
            header: 'Present_Value',
            key: 'Present_Value',
            width: 15
        },
        {
            header: 'message_number',
            key: 'message_number',
            width: 15
        },
        {
            header: 'last_update_time',
            key: 'last_update_time',
            width: 32,
            outlineLevel: 1
        }
    ];
    for (var i = 0; i < data.length; i++) {
        data[i].last_update_time = new Date(data[i].last_update_time).toLocaleString()
        worksheet.addRow(data[i]);
    }
    var eventPath = "/mnt/nandflash/event"
    if (fs.existsSync(eventPath) == false) {
        fs.mkdir(eventPath)
    }
        workbook.xlsx.writeFile(eventPath + "/" + filename)
}

exports.saveOneDayEventExcel = saveOneDayEventExcel;
exports.saveOneMonthEventExcel = saveOneMonthEventExcel;