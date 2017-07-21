var Excel = require('exceljs');
function testexcel() {

    var workbook = new Excel.Workbook();
    workbook.creator = 'Me';
    workbook.lastModifiedBy = 'Her';
    workbook.created = new Date(1985, 8, 30);
    workbook.modified = new Date();
    workbook.lastPrinted = new Date(2016, 9, 27);
    workbook.properties.date1904 = true;
    workbook.views = [
        {
            x: 0, y: 0, width: 10000, height: 20000,
            firstSheet: 0, activeTab: 2, visibility: 'visible'
        }
    ]
    var worksheet = workbook.addWorksheet('My Sheet');
    worksheet.columns = [
        { header: 'Id', key: 'id', width: 10 },
        { header: 'Object_Name', key: 'Object_Name', width: 32 },
        { header: 'Description', key: 'Description', width: 32 },
        { header: 'device_instance', key: 'device_instance', width: 32 },
        { header: 'device_number', key: 'device_number', width: 32 },
        { header: 'Present_Value', key: 'Present_Value', width: 32 },
        { header: 'message_number', key: 'message_number', width: 32 },
        { header: 'last_update_time', key: 'last_update_time', width: 10, outlineLevel: 1 }
    ];
    worksheet.addRow({id:"1","Object_Name":"1","Description":"2","device_instance":"1"})
    // Access an individual columns by key, letter and 1-based column number 
    var idCol = worksheet.getColumn('id');
    var nameCol = worksheet.getColumn('B');
    var dobCol = worksheet.getColumn(3);
   
    // iterate over all current cells in this column 
    dobCol.eachCell(function (cell, rowNumber) {
        // ... 
    });

    // iterate over all current cells in this column including empty cells 
    dobCol.eachCell({ includeEmpty: true }, function (cell, rowNumber) {
        // ... 
    });

    workbook.xlsx.writeFile("./a.xlsx")
}
testexcel()
