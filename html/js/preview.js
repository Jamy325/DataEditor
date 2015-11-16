/**
 * Created by pengkun on 2015/6/10.
 */

var preview = {};

preview.getConfig = function(){
    var rfile = new window.parent.File("..\\publish\\preview.json", "r");
    rfile.open();
    var previewConfig = JSON.parse(rfile.readAll());
    rfile.close();

    return previewConfig;
};

preview.run = function(config) {
    try {
        if(config){
            var wfile = new window.parent.File("..\\publish\\preview.json", "w+");
            wfile.open();
            wfile.write(JSON.stringify(config));
            wfile.close();
        }

        var fileName = "..\\publish\\flight.exe";
        window.parent.external.system(fileName);
        //window.external.system('cmd /c '+fileName);
    }
    catch (errorObject)
    {
        alert(errorObject);
    }

}