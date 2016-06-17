function File(fileName, flgs){

this.open = function(){
	var ret = window.external.open(fileName, flgs);
	var r = $.parseJSON(ret);
	if (!r.success){
		this.close();
	    throw r.msg;
	}
},

this.readAll = function(){
	var ret = window.external.all();
	var r = $.parseJSON(ret);
	if (!r.success){
		this.close();
	    throw r.msg;
	}
	
	return r.msg;
},

this.close = function(){
	window.external.close();
},

this.write = function(str){
	var ret = window.external.write(str, 1, 0);
	var r = $.parseJSON(ret);
	if (!r.success){
	    throw r.msg;
	}
},

this.seekg = function (pos) {
	window.external.seekg(pos)
}
}


function GetAllInDir(path) {
    if (!path) throw "invalid path";
    return window.external.getDir(path);
}

function GetAllFileInDir(path) {
	if (!path) throw "invalid path";
	var root ={children: JSON.parse(window.external.getDir(path))};

	function getFile(node,fileNodes){
		if(node.children){
			node.children.forEach(function(childNode){
				getFile(childNode,fileNodes);
			});
		}
		else{
			fileNodes.push(node);
		}
	};

	var allFile = [];
	getFile(root,allFile);
	return allFile;
}



function GetPathFileName(path){
	var value=path;
     var last=value.lastIndexOf("\\");
     var filename=value.substring(last+1,value.length);
	 return filename;
}

function exeContentCmd(path, cmd){
	var ret = window.external.exeContentCmd(path, cmd)
	var r = $.parseJSON(ret);
	return r.success;
}

function exeCmd(cmd){
	console.log(cmd)
	var r = window.external.system(cmd)
	console.log(r)
	return 0;
}

function OpenFileSelectDialog(title, defaultPath, filter){
	if(window.external.FileSelectDialog){
		return window.external.FileSelectDialog(title, defaultPath, filter);
	}
	
	$("#fileBrowDig").click();	
	var path = $("#fileBrowDig").val();
	return path;
}

function readJsFileToJson(path) {
    try 
    {
        var file = new File(path, 'r');
        file.open();
        var content = file.readAll();
        file.close();
        return JSON.parse(content);
    }
    catch(e)
    {
        return null;
    }
}

window.external.close = function(){}