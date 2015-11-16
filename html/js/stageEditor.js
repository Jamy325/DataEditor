/**
 * Created by pengkun on 2015/6/10.
 */

var stageEditor = {};

stageEditor.saveData = function(stageSN,waves,entitis){
    //关卡
    var waveFileName = "../关卡/" + stageSN + "_wave.csv";
    var wfile = new window.parent.File(waveFileName, "w+");
    try{
        wfile.open();
        //debugger;
        wfile.write(CSV.JSONToCVS(waves));
        wfile.close();
    }
    catch(e){
        $.messager.alert('信息',e);
        return false;
    }

    //实体
    var entityFileName = "../关卡/" + stageSN + "_entity.csv";
    wfile = new window.parent.File(entityFileName, "w+");
    try{
        wfile.open();
        //debugger;
        wfile.write(CSV.JSONToCVS(entitis));
        wfile.close();
    }
    catch(e){
        $.messager.alert('信息',e);
        return false;
    }

    return true;
};

stageEditor.packFiles = function (){
    var exportJson = {};
    var files =  JSON.parse(window.parent.GetAllInDir("../关卡"));
    for(var i in files){
        var rfile = new window.parent.File("../关卡/" + files[i].text + ".csv", "r");
        rfile.open();
        var csvData = rfile.readAll();
        rfile.close();
        exportJson[files[i].text]=csvData;
    }

    var wfile = new window.parent.File("../publish/data/stage.dat", "w+");
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