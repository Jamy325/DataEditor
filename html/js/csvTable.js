/**
 * Created by pengkun on 2015/6/10.
 */

$.getScript("cvs.js", function(){
    alert("Script loaded and executed.");
    // Use anything defined in the loaded script...
});

var csvTable = {};

csvTable.packCsvFile = function(csvTemplate){
    var exportJson = {};
    for(var i in csvTemplate){
        var rfile = new window.parent.File("../CSV/" + csvTemplate[i].name + ".csv", "r");
        rfile.open();
        var csvData = rfile.readAll();
        rfile.close();
        exportJson[csvTemplate[i].key]=csvTable.converToExportCvs(csvTemplate[i],csvData);
    }

    var wfile = new window.parent.File("../publish/data/CSV.dat", "w+");
    try{
        wfile.open();
        wfile.write(JSON.stringify(exportJson));
        wfile.close();
    }
    catch(e){
        $.messager.alert('信息',e);
        return false;
    }


    return true;
};

//转换成导出格式的csv
csvTable.converToExportCvs = function(csvFileInfo,originData){
    var jsonData = CSV.parse(originData);

    var curRowHeaderData = jsonData[0];
    var curColHeaderData = [];
    for(var i in jsonData)
        curColHeaderData.push(jsonData[i][0]);


    csvTable.replaceHeaderKeyToValue(csvFileInfo.row,curRowHeaderData);
    csvTable.replaceHeaderKeyToValue(csvFileInfo.col,curColHeaderData);
    for(var i in jsonData){
        jsonData[i][0] = curColHeaderData[i];
    }

    return csvTable.ConvertJsonToCsv(jsonData);
}

//替换表头中的枚举key为枚举value
csvTable.replaceHeaderKeyToValue = function(headerInfo,data){
    if(headerInfo.type=="enum"){
//                debugger;
        var templateName = headerInfo.value[0]?headerInfo.value[0]:"common";
        var templateData = window.parent.DataMgr.getInstance().getTemplate(templateName);

        var enumData = templateData["enum"][headerInfo.value[1]];
        for(var i in data){
            if(i==0)
                continue;

            for(var j in enumData){
                if(enumData[j].key == data[i]){
                    data[i] = enumData[j].value;
                    break;
                }
            }
        }
    }

    return data;
};

csvTable.ConvertJsonToCsv = function (jsonData){
    var strData = "";
    for(var rowIndex=0;rowIndex<jsonData.length;rowIndex++){
        for(var colIndex=0;colIndex<jsonData[0].length;colIndex++){
            strData+=jsonData[rowIndex][colIndex];
            if(colIndex == jsonData[0].length-1)
                strData+="\n";
            else
                strData+=",";
        }
    }
    return strData;
};