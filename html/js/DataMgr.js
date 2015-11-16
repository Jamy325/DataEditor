/**
 * Created by jamy on 2015/2/6.
 */
DataMgr = window.DataMgr || function () { }


DataMgr.getInstance = function () {
    if (!!DataMgr._innerObj) {
        return DataMgr._innerObj;
    }

    var data = {};          //所有数据
	var template = {};      //所有模版
	var treeMenu = {};      //文件结构

    DataMgr._innerObj = {
        init: function (config) {
	        var dataPath = config.project_dir;
	        var templatePath = config.template_dir;

	        var allTemplates = JSON.parse(GetAllInDir(templatePath));
			if(!allTemplates) {
				alert(templatePath + "找不到模版文件");
			}

			function readTempalte(node){
			    var fullpath = node.attributes.path;
			    if (!fullpath.match(/.*\.js$/)) {
			        return;
			    }
				var filename = node.text;
				var f = new File(fullpath, "r" );
				f.open();
				var context = f.readAll();
				f.close();
				var json = JSON.parse(context);
				template[filename] = json;
			}

	        for (var i = 0; i < allTemplates.length; ++i){
		        readTempalte(allTemplates[i]);
	        }

	        //读取物体文件
            var ret = GetAllInDir(dataPath)
	        treeMenu = $.parseJSON(ret);
			if(!treeMenu) {
				alert(dataPath + "找不到物体数据");
			}

            //加载所有物体
            function readAllFile(node) {
			
                var children = node.children;
                if (!!children) {
                    for (var i = 0; i < children.length; ++i) {
                        readAllFile(children[i]);
                    }
					
					children.sort(function(nodeA, nodeB){
						var isAJsFile = nodeA.attributes.path.indexOf(".js") != -1;
						var isBJsFile = nodeB.attributes.path.indexOf(".js") != -1;
						
						if (isAJsFile && isBJsFile){
							return parseInt(data[nodeA.attributes.path]['fields']['sn']) > parseInt(data[nodeB.attributes.path]['fields']['sn']) ? 1 : -1;
						}
						if (isAJsFile && !isBJsFile) return -1;
						if (!isAJsFile && isBJsFile) return 1;
						if (!isAJsFile && !isBJsFile) return 0;
					});
                    return;
                }

                if (!!node.state) {
                    return;
                }

                var path = node.attributes.path;
                var f = new File(path, "r");
                f.open();
                var context = f.readAll();
                f.close();
                var json = JSON.parse(context);
                data[path] = json;
            }
            for (var i = 0; i < treeMenu.length; ++i) {
                readAllFile(treeMenu[i]);
            }
        },

	    getTreeMenu:function(){
		  return treeMenu;
	    },

        //根据文件名获取对应的数据
        get: function (name) {
			var obj = data[name];
			if (obj) return obj;
			
			var objName = "^.*?\\\\"+name+"\.js$";	
			for (var i in data ){							
				if (i.match(objName)){
				obj = data[i];
				return obj;
				}
			}
			
			objName = "^.*?\/"+name+"\.js$";	
			for (var i in data ){							
				if (i.match(objName)){
				obj = data[i];
				return obj;
				}
			}
            return obj;
        },
		save:function(filename){
			var objName = "^.*?\\\\"+filename+"\.js$";									
			for (var i in data ){							
				if (i.match(objName)){
				objName = i;
				break;
				}
			}
			
			if (objName[0] == '^') {
				objName = "^.*?\/"+filename+"\.js$";									
				for (var i in data ){							
					if (i.match(objName)){
					objName = i;
					break;
					}
				}	
			}
			
			if (objName[0] == '^') return ;
			var saveJson = this.get(objName);
			if (!saveJson) return;
			
			var objPath = objName;
			var obj = this.get(objPath);
		    var f = new File(objPath, "w");
	        var str = JSON.stringify(saveJson, null, '\t');

	        f.open();
	        f.seekg(0);
	        f.write(str);
	        f.close();		
		},

        //根据文件名更新对应的数据
        update: function (name, val) {
            data[name] = val;
        },
        //根据文件名新增对应的数据
        add: function (name, val) {
            if (!!data[name]) {
                throw name + "had exist";
            }
            data[name] = val;
        },
	    getTemplate: function (name) {
		    return template[name];
	    },
		getFileNameBySN:function(sn){
			for(var i in data){
				if(data[i]['fields'].sn == sn){
					return i;
				}
			}
			return "";
		},
		getObjectBySN : function(sn){
			var obj = null;
			for(var i in data){
				if(data[i]['fields'].sn == sn){
					obj = data[i];
					break;
				}
			}
			
			if (obj == null){
				return null;
			}
			
			//克隆对象
			var cloneObj = jQuery.extend(true, {}, obj); 
			var fields = cloneObj['fields'];
			
			//读取模版
			var tempName = cloneObj['base']['template']
			var temp = template[tempName]
			
			function replaceObject(field, key, fieldType, tmpFields){
				var fieldJson = field[key];
				
				if(!fieldJson) return;
				
				var isMulti = fieldType["multi"];
				
				if (isMulti){
					if (typeof(fieldJson) == 'string'){return;}
					
					var	objTypeClone = jQuery.extend(true, {}, fieldType); 
					objTypeClone["multi"] = false;								
					for(var i in fieldJson){
						replaceObject(fieldJson, i, objTypeClone, tmpFields);
					}
				}
				else {
					if (fieldType['name'] == "object"){
						var objName = "^.*?\\\\"+fieldJson+"\.js$";					
						var obj = null;
						for (var i in data ){							
							if (i.match(objName)){
								obj = data[i];
								break;
							}
						}
						
						if (!obj){
							objName = "^.*?\/"+fieldJson+"\.js$";					
							for (var i in data ){							
								if (i.match(objName)){
									obj = data[i];
									break;
								}
							}				
						}
						
						var sn = 0;
						if(!obj){
							console.log("template field error ,obj name #{objName} is null");
							return;
						}
						else{
							sn = obj["fields"]["sn"]
						}
						
						field[key] = sn;				
					}
					else if (fieldType['name'] == "unit"){
							var	unitName = fieldType["index"];
			
							var unit = null;
							if (temp["unit"]){
								var	unit = temp["unit"][unitName];
							}
							
							
							if (!unit){
								var commonTemplate = template['common'];
								unit = commonTemplate["unit"][unitName];
							}
							
							if (!unit){
								alert('unit not find');
								return;
							}
										
							for (var i in fieldJson) {
								if (!!unit[i]){
									replaceObject(fieldJson, i, unit[i]["type"], temp)
								}
							}
					}
					
				}
				
			};	//replaceObject
			
			var tmpFields = temp['fields'];
			for(var i = 0; i < tmpFields.length; ++i){
				var fieldInfo = tmpFields[i];
				var fieldKey = fieldInfo['key'];
				var fieldType = fieldInfo['type'];
				
				replaceObject(fields, fieldKey, fieldType, tmpFields);						
			}
			
			return fields;
		}
    }

    return DataMgr._innerObj;
}


