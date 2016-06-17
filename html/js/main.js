
function inArray(val, array){
	for(var e in array){
		if (array[e] == val){
			return e;
		}
	}
	
	return -1;
}

function removePanel() {

	var tab = $('#tab').tabs('getSelected');
	if (tab) {
	    var index = $('#tab').tabs('getTabIndex', tab);
	    $('#tab').tabs('close', index);
	}
}

function LoadScript(path){
	if (path.indexOf(':') != -1) {
		  //加载ProjConfig
	var f = new File(path, 'r');
		 
	f.open()
	f.seekg(0)
	var str = f.readAll();
	f.close()
	
	eval(str);
	}
	else {
			//加载ProjConfig
	var e = document.createElement("script")
	e.src = path
	document.body.appendChild(e);
	}
  
}
	
	function genRows(fieldRowNode, templateJson, tab) {
	    var childRow = []
	    var typeField = fieldRowNode.type
	    var editor = { type: "text" }

	    if (typeField.name == "enum") {
	        var enumName = typeField.index;
	        //先从common里找
		    var commonTemplate = DataMgr.getInstance().getTemplate("common");
	        var enumJson = commonTemplate["enum"][enumName];
	        if (typeof (enumJson) == 'undefined') {
	            enumJson = templateJson["enum"][enumName]
	        }

	        if (typeof (enumJson) == 'undefined') {
	            alert(enumName + "未定义")
	        }

			var filter = typeField.filter;
			var include = null;
			var exclude = null;
			if (filter){
				include = filter.include;
				exclude = filter.exclude;			
			}
			
	        var ops = []
	        for (var k = 0; k < enumJson.length; ++k) {
				var eName = enumJson[k].name;
				var eVal = enumJson[k].value;
				
				if (include){
					if (inArray(eVal, include) != -1) ops.push({ "value": eVal, "name":eName});
					continue;
				}else if (exclude){
					if (inArray(eVal, exclude) == -1) ops.push({ "value": eVal, "name":eName});	
					continue;					
				}else{
					ops.push({ "value": eVal, "name":eName});
				}	            
	        }

	        editor = {
	            "type": "combobox",
	            "options": {
	                valueField: 'value',
	                textField: 'name',
	                data: ops
	            }
	        }
	    }
	    else if (typeField.name == "object") {
	        var objDir = typeField.index;
	        editor = {
	            "type": "objectselect",
	            "options": {
	                "objectdir": objDir
	            }
	        }
	    }
	    else if (typeField.name == "unit") {
	        var unitName = typeField.index
	        //先从common里找
		    var commonTemplate = DataMgr.getInstance().getTemplate("common");
	        var unitJson = commonTemplate["unit"][unitName];
	        if (typeof (unitJson) == 'undefined') {
	            unitJson = templateJson["unit"][unitName]
	        }

	        for (var e in unitJson) {
	            unitJson[e]['key'] = e;
	            var ret = genRows(unitJson[e], templateJson, tab)
	            if (ret.multi) {
	                ret.children = []
	                var d = " <a style='color:green' title='双击可新建' href='#'>数组</a>"
	                ret.name += d;
	                ret.type += d;
	            }

	            childRow.push(ret);
	        }
			
			function getDependField(key){
				for(var i = 0; i < childRow.length; ++i){
					if (childRow[i].key == key){
						return childRow[i];
					}
				}
				
				return null;
			}
			
			for(var i = 0; i < childRow.length; ++i){
				var edt = childRow[i].editor;
				if (edt.options && edt.options.dependFiled!= ""){
					var opt = edt;
					var target = getDependField(opt.dependFiled);
					if (!target) continue;
					if(!tab.dependsMap){
						tab.dependsMap = {};
					}
					if (!tab.dependsMap[target.id]){
						tab.dependsMap[target.id] = [];
					}					
					tab.dependsMap[target.id].push(childRow[i].id);
					childRow[i].editor.dependFiledId = target.id;
				}
			}


	        editor = {
	            "type": "text",
	            "options": {
	                "unit": objDir
	            }
	        }

	    }
		else if (typeField.name == "union"){
			var unionName = typeField.index		//依赖信息
			 var dependFiled = fieldRowNode.depend;	//依赖字段名
			    //先从common里找
		    var commonTemplate = DataMgr.getInstance().getTemplate("common");
	        var unionJson = commonTemplate["unit"][unitName]
			if (typeof (unionJson) == 'undefined') {
	            unionJson = templateJson["union"][unionName]
	        }
			
			//先从common里找
			editor.type = "text";
			editor.depend = unionJson;
			editor.dependFiled = dependFiled;
			editor.options = {};		
		}
		else {	
			editor.type = fieldRowNode.editor
			editor.options = typeField.options;
		}
		
	    var typeName = typeField.name;

	    window.editor.curRowID++;
	    return {
	        id: fieldRowNode.key + window.editor.curRowID,
	        key: fieldRowNode.key,
	        name: '<span class = "easyui-tooltip" title="' + fieldRowNode.comment + '">' + fieldRowNode.name + '</span>',
	        value: typeField.multi ? "" : fieldRowNode.type.init,
	        type: typeName,
	        field: fieldRowNode,    //模板对应字段
	        editor: editor,
	        multi: typeField.multi,
	        children: childRow
	    };
	}

	//新建标签页
	function addTab(title, tbid, templateName, objPath, sn) {
	    var tbstr = '<table id="' + tbid + '"></table>'
		var dataMgr = DataMgr.getInstance();
	    var saveFunction = function () {
	        //保存操作
	        var tg = $('#' + tbid)
	        tg.treegrid("endEdit", window.editor.curEditorRowID)
	        tg.treegrid("acceptChanges")
	        var saveJson = { "base": { "template": templateName } }
	        var fields = {}
	        var griddata = tg.treegrid("getRoots")
			
	        function savedata(obj, result) {
	            if (obj.multi) {
	                var a = []
	                for (var i = 0; i < obj.children.length; ++i) {
	                    var tmp = {}
	                    savedata(obj.children[i], tmp);
	                    a.push(tmp[obj.key]);
	                }
	                result[obj.key] = a
	            }
	            else {
	                //unit
	                if (obj.field.type.name == "unit") {
	                    var tmp = {}
	                    for (var i = 0; i < obj.children.length; ++i) {	                                
	                        savedata(obj.children[i], tmp)
	                    }
	                    result[obj.key] = tmp;
	                }
	                else {
	                    result[obj.key] = obj.value;
	                }
	            }

	        }

	        for (var i = 0; i < griddata.length; ++i) {
	            savedata(griddata[i], fields)
	        }
	        saveJson["fields"] = fields;

	        var f = new File(objPath, "w");
	        var str = JSON.stringify(saveJson, null, '\t');

	        f.open();
	        f.seekg(0);
	        f.write(str);
	        f.close();

	        DataMgr.getInstance().update(objPath, saveJson);
	        var save = newTab.find(".tabs-title");
	        save.each(function (k, v) {
	            if ($(v).html() == title) {
	                $(v).css("color", 'black')
	            }
	        })
	    }

	    //添加tab
	   var newTab = $('#tab').tabs('add', {
	        title: title,
	        content: tbstr,
	        closable: true,
	        tools: [{
	            iconCls: 'icon-save',
	            handler: saveFunction
	        }]

	    });

		//把对应模版转变为json
	    var templateJson = dataMgr.getTemplate(templateName);
	    var data = templateJson.fields
	    var rows = [];

		//分析模版
	    for (var i = 0; i < data.length; ++i) {
	        var row = genRows(data[i], templateJson, newTab);	//根据模板信息 生成一行

	        if (row.multi) {
	            row.children = []
				var d = " <a style='color:green' title='双击可新建' href='#'>数组</a>"
	            row.name += d;
                row.type += d;
	        }
			
			if (row.key == "sn"){
				row.value = sn
			}
			
	        rows.push(row)
	    } //for

		//双击操作， 添加一行， 进队列表项目管用
	    var onDbClickRow = function (row) {

	        var jtbid = $(this)
	        row.templateJson = templateJson;

	        if (window.editor.curEditorRowID != row.id) {
	            jtbid.treegrid("endEdit", window.editor.curEditorRowID)
	        }
			
	        var rowidTmp = row.id
	        if (row.multi) {
	            window.editor.curRowID++;
	            rowidTmp = row.key + window.editor.curRowID

	            var node = jtbid.treegrid('getSelected');
	            var data = genRows(node.field, templateJson, newTab)
	            data.multi = false		
	            data.type = data.field.type.name
				data.name += "<span style='color:red'> (" + (node.children.length) + ")</span>"
				
	            jtbid.treegrid('append', {
	                parent: node.id,
	                data: [data]
	            })
				
				var save = newTab.find(".tabs-title");
	            save.each(function (k, v) {
	              if ($(v).html() == title) {
	                $(v).css("color", 'red')
	               }
	            })	
				return;
	        }

	        if (row.field.type.name == "unit") {
				var save = newTab.find(".tabs-title");
	                save.each(function (k, v) {
	                    if ($(v).html() == title) {
	                        $(v).css("color", 'red')
	                    }
	            })				
	            return;
	        }

	        window.editor.curEditor = row.editor
	        jtbid.treegrid("beginEdit", rowidTmp)
	        window.editor.curEditorRowID = rowidTmp;
			window.editor.curTreeGrid = jtbid;
	    }
		
		//单击人一行， 释放编辑
	    var onClickRow = function (row) {
	        var jtbid = $(this)
	        row.templateJson = templateJson;
	        jtbid.treegrid("endEdit", window.editor.curEditorRowID)
	        window.editor.curEditorRowID = row.id
	        window.editor.curTreeGrid = jtbid;
	    }
		
		//依赖发生改变
		var onDependChange = function(treegrid, nodeId, dependRow){		
			var curNode = treegrid.treegrid('find', nodeId);
			if (!curNode) return;
			var dependVal = dependRow.value;
			var dependInfo = curNode.editor.depend;
			if (!dependInfo) return;
			var curInfo = dependInfo[dependVal];
			if (!curInfo) {
				dependVal = "default";
				curInfo = dependInfo[dependVal];
			}
			if (!curInfo) return;
			
			curInfo.key = curNode.key;
			var data = genRows(curInfo, templateJson, newTab)
			data.id = curNode.id;
			
			// curNode.name =  '<span class = "easyui-tooltip" title="' + curInfo.comment + '">' + curInfo.name + '</span>';	
		//	data.editor.type = curInfo.type;
			data.editor.dependFiled = curInfo.editor.dependFiled;
			data.editor.depend = curNode.editor.depend;
			data.value = curNode.value;
			
			 treegrid.treegrid('update', {
				id: nodeId,
				row:data			
			 });
		}
		
		//内容改变
		var onAfterEdit = function(row,changes){
			if (changes.value) {
				var save = newTab.find(".tabs-title");
				save.each(function (k, v) {
					if ($(v).html() == title) {
						$(v).css("color", 'red')
					}
				})
				
				var depends = newTab.dependsMap[row.id];
				if(!depends) return;
				var jtbid = $(this);
				
				for(var i = 0; i < depends.length; ++i){
					var a = depends[i];
					onDependChange(jtbid, a, row);
				}
			}
		}
		
		var onLoadSuccess = function(row, data){
			var jtbid = $(this);
			for(var e in newTab.dependsMap){
				var row = jtbid.treegrid('find', e);
				if (!row) continue;
				
				var depends = newTab.dependsMap[row.id];
				if(!depends) return;
				
				for(var i = 0; i < depends.length; ++i){
					var a = depends[i];
					onDependChange(jtbid, a, row);
				}
			}
		}
		
		//右键菜单
		var onContextMenu = function(e, node){
	            e.preventDefault();
	           var tg = $(this)
	            var node = tg.treegrid('getSelected');
	            if (node) {
	                $.messager.confirm('Confirm', '确定删除 <span style="color:red">' + node.name + '</span> ?', function (r) {
	                    if (r) {
	                        tg.treegrid('remove', node.id);
							var save = newTab.find(".tabs-title");
							save.each(function (k, v) {
								if ($(v).html() == title) {
									$(v).css("color", 'red')
								}
							})
	                    }
	                });
	             
	            }		
		}
	
	    $('#' + tbid).treegrid({
	        idField: 'id',
	        treeField: 'name',
	        fit: true,
	        onAfterEdit:onAfterEdit,
	        onDblClickRow: onDbClickRow,
	        onClickRow: onClickRow,
	        onContextMenu: onContextMenu,
			onLoadSuccess:onLoadSuccess,
	        columns: [[
                { title: 'key', field: 'name', width: 200 },
                { title: 'type', field: 'type', width: 100 },
                { title: 'value', field: 'value', width: 300 ,editor: "commonEditor", formatter:commonFormat }
	        ]],
	        data: {
	            "total": rows.length, "rows": rows
	        }
	    });//treegrid
		
	    newTab.saveFunc = saveFunction
	    return newTab;
	}

	function onProjectOpen(projPath) {	
		window.editor = {}
	    window.editor.curEditorRowID = ""
	    window.editor.curRowID = 100000;
		
	    //加载ProjConfig
		LoadScript(projPath)
		
		//等待配置加载完成
	var id =	setTimeout(function () {
		clearTimeout(id);
		    //读取工程文件数据
		    var dataMgr = DataMgr.getInstance();
		   dataMgr.init(ProjConfig);
		   projectOpen(dataMgr.getTreeMenu());
		}, 0);
		
	}

	//打开工程
	function projectOpen(menuData) {
        //读取工程文件数据
		var dataMgr = DataMgr.getInstance();

		$('#tree').tree({
		   data: menuData,
		   formatter:function(node){
					var s = node.text;
					if (node.children){
						s += '&nbsp;<span style=\'color:blue\'>(' + node.children.length + ')</span>';
					}
					return s;
				},
		    onContextMenu: function (e, node) {
		        e.preventDefault();
		        // select the node
		        $('#tree').tree('select', node.target);
				
		        // display context menu
		        //不是叶子节点
		        if ($('#tree').tree("isLeaf", node.target)) {
		            $('#deleteobject').menu('show', {
		                left: e.pageX,
		                top: e.pageY
		            });
		            return;
		        }

		        $('#addobject').menu('show', {
		            left: e.pageX,
		            top: e.pageY
		        });
				
				 var root = getCurNodeRoot($('#tree'), node);
				if (root == null) return;

				var addObjectMenu = $('#addobject');
				var importCsvItem = addObjectMenu.menu('findItem', '导出为csv');
				var exportCsvItem = addObjectMenu.menu('findItem', '导入为csv');
					
				if (root != node){			
					addObjectMenu.menu('disableItem', importCsvItem.target);
					addObjectMenu.menu('disableItem', exportCsvItem.target);
				}else{
					addObjectMenu.menu('enableItem', importCsvItem.target);
					addObjectMenu.menu('enableItem', exportCsvItem.target);									
				}
				
		    },
		    onClick: function (node) {
		        var jtbid = window.editor.curTreeGrid;
                if (jtbid)
                    jtbid.treegrid("endEdit", window.editor.curEditorRowID)

				//不是叶子节点
				if(!$('#tree').tree("isLeaf",  node.target)){
				    return;
				}
				
				if ( $('#tab').tabs("exists", node.id)){
					$('#tab').tabs('select', node.id);
				}
				else
				{
					try 
					{
						//根据树节点获得物体
						var dataMgr = DataMgr.getInstance();
				        var filePath = node.attributes.path;
						var objdata = dataMgr.get(filePath);
						if(!objdata){
							return;
						}

				        //表单id
						var tbid = "pg_" + node.id;

						var newTab = addTab(node.id, tbid, objdata.base.template, filePath);

						//获取treegrid对象
						var tg = $("#" + tbid);
						var templateJson = dataMgr.getTemplate(objdata.base.template);
						templateJson["treegrid"] = tg;

						//根据数据和模版生成页面
						function setRowValue(row, objval, templateJson) {
						    var typeField = row.field.type
						    if (row.multi) {
						        var children = row.children;    //应该是空的。。
						        var childrendata = objval  //   这个是数组
								if (row.type.search('数组') == -1) {
									var d = " <a style='color:green' title='双击可新建' href='#'>数组</a>"
									row.name += d;
									row.type += d;
								}
						        if (typeof (childrendata) != "object") { return; }

						        for (var i = 0; i < childrendata.length; ++i) {

						            var rowRet = genRows(row.field, templateJson, newTab);
						            rowRet.multi = false;   //子项了
									rowRet.name += "<span style='color:blue'> (" + i + ")</span>";
						            setRowValue(rowRet, childrendata[i], templateJson);
						            children.push(rowRet);
						        }
						        return;
						    }


						    if (typeField.name == "unit") {
						        var children = row.children;
						        var childrendata = objval
						        for (var ii = 0; ii < children.length; ++ii) {
						            var childrenKey = children[ii].key
						            if (objval) {
										setRowValue(children[ii], objval[childrenKey], templateJson)
						            }
						        }
						    }
						    else {
						        row.value = objval;
						        row.templateJson = templateJson
						    }
						}

						var datas = tg.treegrid("getData");
					    //赋值
						for (var i = 0; i < datas.length; ++i) {
						    var row = datas[i];
						    setRowValue(row, objdata.fields[row.key], templateJson)
						}
						tg.treegrid("loadData", datas);
					}//try
					catch(e)
					{
						alert("+"+e.stack)
					}
				}
			}

		});

		$('#tab').tabs({
					onBeforeClose: function(title,index){
					var tab = $(this).tabs("getTab", index)
					var tg = tab.find("table[id^=pg]")

					if (window.editor.curTreeGrid && tg.attr("id") == window.editor.curTreeGrid.attr("id")) {
					    window.editor.curTreeGrid = null
					}
	
					if (tg.length == 0) {
						var options = $(tab).panel('options');
						if (options.getChanges){
							return options.getChanges();
						} 
						
						return true;
					} 

					var rows = tg.treegrid('getChanges')
					if (rows == 0) return true;

					var target = this;
					$.messager.confirm('未保存', title + '<span style="color:red">未保存</span>,你是否要关闭? ', function(r){
					if (r){
						var opts = $(target).tabs('options');
						var bc = opts.onBeforeClose;
						opts.onBeforeClose = function(){};  // allowed to close now
							$(target).tabs('close',index);
							opts.onBeforeClose = bc;  // restore the event function
						}
					});
					return false;	// prevent from closing
					}
		})	
	}

	function getCurNodeRoot(tree, node) {
	   var ret = node;
	   var n = tree.tree("getParent", node.target);
	    while (n) {
	       ret = n;
	       n = tree.tree("getParent", n.target);	      
	   }

	    return ret;
	}


//新建一个物体
function NewTemplate() {
    //不是叶子节点
   var tree = $('#tree')
    var node = tree.tree("getSelected")
    if (tree.tree("isLeaf", node.target)) {
        return;
    }

   
   var root = getCurNodeRoot(tree, node);

   if (root == null) return;

    $.messager.prompt('新建物体', '文件名:', function (title) {
        if (title) {
            var path = node.attributes.path +"\\" + title + ".js"
            var templateName = root.text
			
			var snfile = root.attributes.path + "\\_info.js"

			try {
				var f = new File(snfile, "rw");
				f.open()
				var snStrs = f.readAll()
				f.close();
			}
			catch(e){
				  $.messager.alert('Warning', snfile + " ,被<span style='color:red'>锁定</span>, 请先!"+
				  "<a href='javascript:svngetlock(\"" + snfile.replace(/\\/g,"\\\\") + "\")'>解锁</a>"
				  );
				return;
			}
			
			try{
					var snJson = $.parseJSON(snStrs);
			}catch(e){
				 $.messager.alert("error", snfile + ",文件错误,请恢复到正确版本")
			}
		
			
			//新加一个标签页
           var tab = addTab(title, "new_" + title, templateName, path, snJson.next_sn)
            tree.tree("append", {
                parent: node.target,
                data: [{ id: title, text: title, attributes: { path: path } }]
            });

            if (tab && tab.saveFunc) {
                tab.saveFunc();
            }

	        snJson.next_sn += 1;
		    var f = new File(snfile, "w");
			f.open()
			f.seekg(0)
			f.write($.toJSON(snJson));
			f.close()
        }
    });

}

function contextCmd(cmd1,cmd2){
   var tree = $('#tree')
    var node = tree.tree("getSelected")
	if (node == null) return;
	
	var path = node.attributes.path
	if (!exeContentCmd(path, cmd1) && !exeContentCmd(path, cmd2)){
		$.messager.alert('哎.怎么说你呢!', 
		'骚年你的机器似乎未安装<span style="color:red"> tortoissvn</span>,请<a href="http://tortoisesvn.net/downloads.html">下载</a>,安装成功之后重新打开编辑器!');
	}
}

function contextCmd_unlock(){
	var tree = $('#tree')
    var node = tree.tree("getSelected")
	if (node == null) return;
	
	var root = getCurNodeRoot(tree, node);
    if (root == null) return;
	var objDir = root.attributes.path;
	var snfile = objDir +"/_info.js"
	
	exeContentCmd(snfile, "svn get loc&k");
}

function svngetlock(path){
	if (!exeContentCmd(path, "svn get loc&k")){
		$.messager.alert('哎.怎么说你呢!', 
		'骚年你的机器似乎未安装<span style="color:red"> tortoissvn</span>,请<a href="http://tortoisesvn.net/downloads.html">下载</a>,安装成功之后重新打开编辑器!');
	}
}
	
$.extend($.fn.datagrid.defaults.editors, {
    objectselect: {  //选择物品的编辑框
        init: function (container, options) {
           
            var input = $('<input type="text" >').appendTo(container);
            var objectdir = options.objectdir

            var dir = ProjConfig.project_dir + objectdir + "\\";
            var ret = GetAllInDir(dir)
            var tree = $.parseJSON(ret);
            data = tree;
            input.combotree({
                required: false,
                data: data
            });

            return input;
        },
        getValue: function (target) {
            return target.combotree('getValue');
        },
        setValue: function (target, value) {
            $(target).val(value);
        },
        resize: function (target, width) {
            var input = $(target);
            if ($.boxModel == true) {
                input.width(width - (input.outerWidth() - input.width()));
            } else {
                input.width(width);
            }
        }
    }
});


$.extend($.fn.datagrid.defaults.editors, {
    commonEditor: {  //默认编辑框
        init: function (container, options) {
            var editor = window.editor.curEditor
            var input = null;

            if (editor.type == "text") {
				input = $('<input type="text" >').appendTo(container);
				setTimeout(function(){
					input.select();
				}, 0)
				
            }
            else if (editor.type == "numberbox") {
				input = $('<input type="text" >').appendTo(container);
                input.numberbox({
                    required: false,
                    value: 0
                });
            }
            else if (editor.type == "combobox") {
				input = $('<input type="text" >').appendTo(container);
				input.css("width", "300px");
				editor.options.editable = false;
                input.combobox(editor.options)
            }
			 else if (editor.type == "boolbox") {
				 input = $('<input type="text" >').appendTo(container);
				 input.combobox({
							valueField:'id',
							textField:'text',
							data:[{
									"id":0,
									"text":"false"
								},{
									"id":1,
									"text":"true"
							}]});
            }
            else if (editor.type == "objectselect") {
				input = $('<input type="text" >').appendTo(container);
                var objectdir = editor.options.objectdir

                var dir = ProjConfig.project_dir + objectdir + "\\";
                var ret = GetAllInDir(dir)
                var tree = $.parseJSON(ret);
                data = tree;
                input.css("width", "300px");
               var com = input.combotree({
                    required: false,
                    data: data
               });
                com.css("width", "300px")
            }
			else if(editor.type == "timespinner"){
				input = $('<input type="text" >').appendTo(container);
				input.timespinner({
					min: '00:00',
					required: true,
					showSeconds: true
				});
			}
			else if (editor.type == "numberspinner"){
				input = $('<input type="text" >').appendTo(container);
				input.numberspinner(editor.options);				
			}
			else if (editor.type == "unionEditor"){				
				// var options = editor.options;
				// var unitName = options.depend;	//依赖信息
				// var dependFiled = options.dependFiled;//依赖字段
				
				// var commonTemplate = DataMgr.getInstance().getTemplate("common");
				// var unionJson = commonTemplate["unit"][unitName]
				// var templateJson = DataMgr.getInstance().getTemplate("common");
				// if (typeof (unionJson) == 'undefined') {
					// unionJson = templateJson["union"][unionName]
				// }
				
				// var dependInfo = unionJson[unionName];
				
				// debugger
				
			}
			else if(editor.type == "htmleditor"){
							// 打开Dialog后创建编辑器
			input = $('<textarea name="htmleditor" style="width:100%;height:100%;"></textarea>').appendTo(container);			
			KindEditor.create('textarea[name="htmleditor"]', {
				resizeType : 1,
				allowPreviewEmoticons : false,
				allowImageUpload : false,
				items : [
					'source', '|','fontname', 'fontsize', '|', 'forecolor', 'hilitecolor', 
					'removeformat', '|', 'justifyleft', 'justifycenter', 'justifyright']
				});
			}
            else {
				input = $('<input type="text" >').appendTo(container);
            }

            return input;
        },
        getValue: function (target) {
            var editor = window.editor.curEditor
			if (editor.type == "numberbox") {
                target.numberbox('getValue');
            }
            else if (editor.type == "combobox" ) {
                return target.combobox('getValue');
            }
			else if (editor.type == "boolbox"){
				return target.combobox('getValue');
			}
            else if (editor.type == "objectselect") {
				if (editor.depend){
					var objName = target.combotree('getValue');
					var obj = DataMgr.getInstance().get(objName);
					if (!obj) return "";
					return obj["fields"]["sn"];
				}
                return target.combotree('getValue');
            }
			else if (editor.type == "timespinner"){
				return target.timespinner('getValue');
			}else if (editor.type == "numberspinner"){
				return target.numberspinner('getValue');
			}
			else if (editor.type == "htmleditor"){
				return KindEditor.instances[0].html();
			}
             return $(target).val(); 
        },
        setValue: function (target, value) {
            var editor = window.editor.curEditor
			 if (editor.type == "numberbox") {
                target.numberbox('setValue', value);
            }
            else if (editor.type == "combobox") {
                target.combobox('setValue', value);
            }
			else if (editor.type == "boolbox"){
				return target.combobox('setValue',value);
			}
            else if (editor.type == "objectselect") {
				if (editor.depend){					
					var name = DataMgr.getInstance().getFileNameBySN(value);
					target.combotree('setValue', name);				
					return;
				}			
                target.combotree('setValue', value);
            }
			else if (editor.type == "timespinner") {
                target.timespinner('setValue', value);
            }else if (editor.type == "numberspinner"){
				return target.numberspinner('setValue', value);
			}
			else if (editor.type == "htmleditor"){
				return KindEditor.instances[0].html(value);
			}
            else {
                $(target).val(value);
            }
        },
        resize: function (target, width) {
            var input = $(target);
            if ($.boxModel == true) {
                input.width(width - (input.outerWidth() - input.width()));
            } else {
                input.width(width);
            }
        },
		destroy:function(target){
			  var editor = window.editor.curEditor
			if (editor.type == "htmleditor"){
				KindEditor.remove('textarea[name="htmleditor"]');
			}	
		}
    }
});


function deleteobject() {
    var tree = $('#tree')
    var node = tree.tree("getSelected")
    if (!tree.tree("isLeaf", node.target)) {
        return;
    }
    var path = node.attributes.path
    $.messager.alert('Warning', '文件路径:'+path+",请手工删除并提交!");

}

function commonFormat(val, row) {
    if (typeof (val) == 'undefined') return;
	if (val === "") return;

    var typeName = row.field.type.name;
	
    if (typeName == "enum") {
	    var commnTemplate = DataMgr.getInstance().getTemplate("common");

        var enumVal = commnTemplate['enum'][row.field.type.index]
	    
        if (typeof (enumVal) == 'undefined') {
            enumVal = row.templateJson['enum'][row.field.type.index]
        }
		
        if (typeof (enumVal) == 'undefined') {
           return  "<span style='color:black;background-color:red'>" + val + "</span>" + "<span style='color:red;font-weight:bold;'>(枚举类型不存在)</span>";
        }
		
		var filter = row.field.type.filter;

        //枚举不一定是从０开始的
        for (var i = 0; i < enumVal.length; ++i) {
            if (enumVal[i].value == val) {		
				var valName = enumVal[i].name
			
				if (filter && filter.include && inArray(val, filter.include) == -1){
					return  "<span style='color:black;background-color:red'>" + valName + "</span>" + "<span style='color:red;font-weight:bold;'>(无效)</span>";			
				}
				else if(filter && filter.exclude && inArray(val, filter.exclude) != -1){
					return  "<span style='color:black;background-color:red'>" + valName + "</span>" + "<span style='color:red;font-weight:bold;'>(无效)</span>";			
				}
       
                return valName + " (<span style='color:deeppink'>" + val + "</span>)";
            }
        }
	
		return  "<span style='color:black;background-color:red'>"+ val +"</span>" + "<span style='color:red;font-weight:bold;'>(值无效)</span>";
    }
	else if (typeName == "boolean"){
		return !!parseInt(val) ?  "true".fontcolor('green') : "false".fontcolor('red');
	}
	else if (typeName == "object"){
		var origVal = val;
		if (row.editor.depend){
			val = DataMgr.getInstance().getFileNameBySN(val);
		}
		
		var tmp = DataMgr.getInstance().get(val);
		if (tmp){
			var sn = tmp["fields"]["sn"];
			var str = val;
			var indexJs = str.lastIndexOf(".js");
			if (indexJs > 0){
				var lastIndexOfpath = str.lastIndexOf("/") ;
				if (lastIndexOfpath == -1){
					lastIndexOfpath = str.lastIndexOf("\\") ;
				}
				val = str.substr(lastIndexOfpath + 1, indexJs - lastIndexOfpath - 1);
			}
			
			var arg = ["'"+row.field.type.index+"'", "'"+val+"'"]
			return val + " (<span style='color:seagreen'><a href=javascript:openTabByName("+arg.join(",")+")>" + sn + "</a></span>)"
		}
		
		if (!row.field.type.multi){
			return  "<span style='color:black;background-color:red'>"+ origVal +"</span>" + "<span style='color:red;font-weight:bold;'>(不存在)</span>";
		}
	}
	
  function encodeHtml(s){
	 var REGX_HTML_ENCODE = /"|&|'|<|>|[\x00-\x20]|[\x7F-\xFF]|[\u0100-\u2700]/g; 
	  return (typeof s != "string") ? s :
		  s.replace(REGX_HTML_ENCODE,
					function($0){
						var c = $0.charCodeAt(0), r = ["&#"];
						c = (c == 0x20) ? 0xA0 : c;
						r.push(c); r.push(";");
						return r.join("");
					});
};
	return encodeHtml(val);
}


function IsSave(){
	return confirm("确定关闭?");
}

function selectNextRow(jtbid, allNode, id) {
    for (var i = 0; i < allNode.length; ++i) {
        var node = allNode[i];
        if (node.id == id) {
            var index = i + 1;
            if (index >= allNode.length) {
                return allNode[0]
            }
            
           var next =  allNode[index]
            /* if (next.type == "unit" || next.multi) {
               return selectNextRow(jtbid, allNode, next.id)
            }
            */
           return next;
        }
    }
}

function getAllNodes(datas, vt)
{
    for (var i = 0; i < datas.length; ++i) {
        var node = datas[i];
        vt.push(node)

        var children = node.children;
        getAllNodes(children, vt)
    }
}

//按键处理
function enterkey() {
	if (typeof(window.editor) == 'undefined') return;
	e = window.event.keyCode;

	if (e === 13 || e === 27) //回车
	{
	    window.event.preventDefault()

	    var jtbid = window.editor.curTreeGrid;
	    if (jtbid) {
	        jtbid.treegrid("endEdit", window.editor.curEditorRowID)
	        event.returnValue = true; // 取消此事件的默认操作 
	    }
	}
	else if (e === 9) {//tab
	    window.event.preventDefault()

	    if (window.editor.tab) { return; }

	    event.returnValue = true; // 取消此事件的默认操作 
		var jtbid = window.editor.curTreeGrid;	
		jtbid.treegrid("endEdit", window.editor.curEditorRowID)

		var datas = jtbid.treegrid("getData");

		var allNodes = []
        getAllNodes(datas, allNodes)

        var nextRow = selectNextRow(jtbid, allNodes, window.editor.curEditorRowID)

		jtbid.treegrid("select", nextRow.id);
		window.editor.curEditorRowID = nextRow.id;
		window.editor.curEditor = nextRow.editor
		if (nextRow.type == "unit" || nextRow.multi) {
		}
		else {
		    jtbid.treegrid("beginEdit", nextRow.id)
		}

		window.editor.tab = true;

		setTimeout(function () {
		    window.editor.tab = false;
		}, 100)
	}

	return true;
}

//鼠标处理
function onMouseClick(e){
	 e = e || window.event;
	 
    if (!!window.editor){
	 var jtbid = window.editor.curTreeGrid;
	 if (jtbid) {
	     jtbid.treegrid("endEdit", window.editor.curEditorRowID)
	 //    event.returnValue = true; // 取消此事件的默认操作 
	 }
	}
}

function saveAll(){
    var allTab = $("#cc .icon-save");
    allTab.each(function (k, v) {
        v.click();
    })
}
//根据模版导出csv文件
function templateJson2CSV(fieldInfo, name, key, value, tab, template, templateCommon, multi){	
	var templateFields = template.fields;
	if (fieldInfo.type.multi){
		if (!value) {		
			return;
		}	
			
		for(var i = 0; i < value.length; ++i){
			var fieldInfoCopy = jQuery.extend(true, {}, fieldInfo);
			fieldInfoCopy.type.multi = false;
			templateJson2CSV(fieldInfoCopy, name,  key + "." + i, value[i], tab, template, templateCommon, true)
		}
	}
	else if (fieldInfo.type.name == "unit"){
		var unitName = fieldInfo.type.index;
		var	unit = templateCommon["unit"][unitName];
		if (!unit && template["unit"]){
			unit = template["unit"][unitName];
		}
		
		if (!unit){
			throw "invalid unit" + unitName;
		}

		for(var u in unit){	
			var val = value || {};
			templateJson2CSV(unit[u], unit[u].name, key +"."+ u, val[u], tab, template, templateCommon);
		}
	}
	else {	
		tab.n.push({key:key, name:name});
		if (value){
			tab.data[key] = value;	
		}else {
			tab.data[key] = "";
		}	
	}
}

function exportCSV(){
	var path = OpenFileSelectDialog("选择导出文件", "..", "任意文件(*.*)");
	var tree = $('#tree')
    var node = tree.tree("getSelected")
	if (node == null) return;	
	
	var root = getCurNodeRoot(tree, node);
    if (root == null) return;
	
	var paths = tree.tree("getData", root.target).children;
	
	if (path == ""){
		return;
	}

	var s = ""
	var csvTable = []
	var templateCommon = DataMgr.getInstance().getTemplate("common");
	
	function processNode(elementNode){
		var nodes = elementNode.children;
		if (nodes) {
			for(var i = 0; i < nodes.length; ++i){
				processNode(nodes[i])
			}
			return;
		}
		
		var fileName = elementNode.attributes.path;
		if (!fileName.match("^.*\.js$")) return;
		
		var f = new File(fileName, "r");
		f.open()
		f.seekg(0)
		var jsonStr = f.readAll();
		f.close()
		
		var json = JSON.parse(jsonStr);
		var fiels = json.fields;
		var tab = { n: [], data: {"fileName":fileName}}
		//var tab1 = { n: [], data: {}}
		var template = DataMgr.getInstance().getTemplate(json.base.template);
		var templateFields = template.fields;
		
		for(var k = 0; k < templateFields.length; ++k){		
			var fieldInfo = templateFields[k];
			var key = fieldInfo["key"];
			var value = fiels[key];
			templateJson2CSV(fieldInfo, fieldInfo.name, key, value,tab, template, templateCommon);
		}
		/*
		for (var e in fiels) {
			json2CSV(e, fiels[e], tab);
		}*/
		csvTable.push(tab)			
	}

	for (var i = 0; i < paths.length; ++i) {
		processNode(paths[i]);
	}
	
	var head = [{key:"fileName", name:"文件路径"}]
	for (var i = 0; i < csvTable.length; ++i) {
	    var row = csvTable[i];
		var h = row.n;
		for(var k = 0; k < h.length; ++k){
			var isFind = false;
			for(var j = 0; j < head.length; ++j){
				if (head[j].key == h[k].key){
					isFind = true;
					break;
				}
			}
			
			if (!isFind){
				head.push(h[k]);
			}
		}
	}

	var ret = "";
	var retName = "";
	for (var k in head) {
	    ret += "\"" + head[k].key + "\",";
		retName += "\"" + head[k].name + "\",";
	}
	ret += "\n"
	ret += retName + "\n";
	
	for (var i = 0; i < csvTable.length; ++i) {
        var data = csvTable[i].data
        for (var key in head) {
			var k = head[key].key;
            var val = data[k];

            if (typeof (val) == "string") {
                val = val.replace(/\"/g, "\"\"");
            }

            if (val == null) { val = "" }
            ret += "\"" + val + "\","
	    }
	    ret += "\n"
	}

	path = path + ".csv"
	var f = new File(path, "w");
	f.open()
	f.seekg(0)
	f.write(ret);
	f.close()
	var alertMsg = "导出完成！路径:<span style='color:red'>"+path+"</span>";
	
	//alertMsg += "选用sn="+ head.data["sn"] + ",显示名:<span style='color:green'>" + head.data["ShowName"] + "</span>为导出模版！"	
	$.messager.alert('info', alertMsg);
}


function importCSV(){
    //不是叶子节点
    var tree = $('#tree')
    var node = tree.tree("getSelected")
    if (tree.tree("isLeaf", node.target)) {
        return;
    }
    var root = getCurNodeRoot(tree, node);

    if (root == null) return;
	var templateName = root.text;
	
	//获取锁
	var objDir = root.attributes.path;
	var snfile = objDir +"/_info.js"

	try {
		var f = new File(snfile, "rw");
		f.open()
		var snStrs = f.readAll()
		f.close();
	}
	catch(e){
		  $.messager.alert('Warning', snfile + " ,被<span style='color:red'>锁定</span>, 请先!"+
		  "<a href='javascript:svngetlock(\"" + snfile.replace(/\\/g,"\\\\") + "\")'>解锁</a>"
		  );
		return;
	}
	
	var snJson = $.parseJSON(snStrs);		
	
    var file = OpenFileSelectDialog("选择导入文件", "..", "csv文件(*.csv)");
    if (file == "") {
        $.messager.alert('警告', '路径不能为空');
        return;
    }

	exeCmd("move /y " + objDir+"\\_info.js " +objDir +"\\_info.bak");
	exeCmd("del /s /q " + objDir+"\\*.js");
	exeCmd("move /y " + objDir+"\\_info.bak " +objDir +"\\_info.js");
	
	try{
		//读取csv文件
		var f = new File(file, "r");
		f.open()
		f.seekg(0)
		var jsonStr = f.readAll();
		f.close()
		
		var rowsCsv = CSV.parse(jsonStr);
		var templateCommon = DataMgr.getInstance().getTemplate("common");
		var template = DataMgr.getInstance().getTemplate(templateName);
		var templateFields = template.fields;
			
		//转化为json
		//  var files = csv2Json(rowsCsv);
		var files = csv2TemplateJson(rowsCsv, template, templateCommon);
		var paths = tree.tree("getData", node.target).children;
		var errs = []

		var curMaxSN = 0;
		for (var sn in files) {
			sn = parseInt(sn);
			if (curMaxSN < sn) curMaxSN = sn;
			
			var fileName = files[sn].fileName;
			var json = { "base": { "template": templateName } }
			json.fields = files[sn].obj
			files[sn] = null;
			
			//保存文件
			var f = new File(fileName, "w");
			var str = JSON.stringify(json, null, '\t');
			f.open()
			f.seekg(0)
			f.write(str);
			f.close()
			
			DataMgr.getInstance().update(fileName, json);
		}


		var err = ""
		for (var e in files) {
			if (files[e]) {
				err += e + ", "
			}
		}

		if (err != "") {
			var strError = "sn:" + err + "<span>导入失败</span>"
			$.messager.alert("错误", strError)
		}
		else {
			snJson.next_sn = curMaxSN + 1;
			var f = new File(snfile, "w");
			f.open()
			f.seekg(0)
			f.write($.toJSON(snJson));
			f.close()	
			$.messager.alert("成功", "导入成功,请刷新编辑器");
		}
				
	}catch(e){
		$.messager.alert("错误", "导入失败:" + (typeof(e) == "string" ?  e : e.message));	
	}
}
//根据模版把csv文件倒回json
function csv2TemplateJson(csvRow, template, templateCommon){
	var fields = csvRow[0]; //第一行为字段名,第二行为字段对应的中文名
    if (fields[0] != "fileName" || fields[1] != "sn") {
        throw "格式无效";
    }
	
	//从第三行开始解析
	var files = {}
	var fieldInfos = template.fields;
	 for (var index = 2; index < csvRow.length; ++index) {
		var datas = csvRow[index];
        if (datas.length != fields.length) {
            throw "字段长度不相等, 记录为:" + values;
        }
		
		var values = {};
		for(var e in fields) {
			values[fields[e]] = datas[e];
		}
			 
		 var obj = {};
		 for(var i = 0; i < fieldInfos.length; ++i){
			var fieldInfo = fieldInfos[i];
			genTemplateField(fieldInfo, fieldInfo.key,values,obj, template, templateCommon, false);
		 }
		 
		 files[obj.sn] = {fileName:values.fileName, obj:obj};
	 }
	 
	 return files;
}

function genTemplateField(fieldInfo, key, values, ret,template, templateCommon, multi){
	if (fieldInfo.type.multi){
		var arrayData = [];
		ret[fieldInfo.key] = arrayData;
		var i = 0;
		do {
			var k = key + "." + i;
			i += 1;
			
			if (fieldInfo.type.name == "unit"){
				
				function checkUnitIsNull(preKey, unitFieldInfo){
					var unitName = unitFieldInfo.type.index;
					var	unit = templateCommon["unit"][unitName];
					if (!unit && template["unit"]){
						unit = template["unit"][unitName];
					}
					
					if (!unit){
						throw "invalid unit" + unitName;
					}
										
					for(var e in unit){
						var v = values[preKey + "." + e];
						var fi = unit[e];
						
						if (fi.type.name == "unit" && !checkUnitIsNull(preKey + "." + e, fi)){
							return false;
						}
						
						if (typeof(v) != "undefined"){
							return false;
						}
					}
					
					return true;
				}
				
				if (checkUnitIsNull(k, fieldInfo)){
					break;
				}
					
			}else {
				var v = values[k];
				if (typeof(v) == "undefined") break;
			}
			
			
			var fieldInfoCopy = jQuery.extend(true,{}, fieldInfo);
			fieldInfoCopy.type.multi = false;
			genTemplateField(fieldInfoCopy, k, values, ret, template, templateCommon, true);
		}while(true);
		
		return;
	}

	if (fieldInfo.type.name == "unit"){
		var obj = {};
		var unitName = fieldInfo.type.index;
		var	unit = templateCommon["unit"][unitName];
		if (!unit && template["unit"]){
			unit = template["unit"][unitName];
		}
		
		if (!unit){
			throw "invalid unit" + unitName;
		}
		
		for(var e in unit){
			var fieldInfoCopy = jQuery.extend({}, unit[e]);
			fieldInfoCopy.key = e;
			genTemplateField(fieldInfoCopy, key + "." + e, values, obj, template, templateCommon, false);
		}
		
		function  checObjIsEmpty(aObject){
			for(var e in aObject){
				if (typeof(aObject[e]) == "object"){
					if (!checObjIsEmpty(aObject[e])) return false;
				}
				else if (typeof(aObject[e]) == "string"){
					if (aObject[e] != "") return false;
				}
			}
			
			return true;
		}

		var isEmpty = checObjIsEmpty(obj);
		var oldKey = fieldInfo.key;
		if (multi){
			if (!isEmpty){
				ret[oldKey].push(obj);
			}		
		}else{
			ret[oldKey] = obj;
		}
		
		return;
	}
	
	var val = values[key];
	//if (val === "") return;
	val+="";
	var oldKey = fieldInfo.key;
	if (multi){
		if (val != ""){
			ret[oldKey].push(val);
		}	
	}else{
		ret[oldKey] = val;
	}
}

function doSearch(value, name) {
	if (name === "filename"){
	    return searchByCondition(value, function (node) {
			var text = node.text;
			var result = text.replace(value, value.fontcolor("red"))
			if (result != text) {
				node.text = result; 
				return true;
			}
			return false;
		});	
	}
	else if (name === "sn"){	
		return searchByCondition(value, function(node){
			var sn = parseInt(value);
			var path = node.attributes.path;
			if (!path){
				return false;
			}
			
			var data = DataMgr.getInstance().get(path);
			if (!data) {
				return false;
			}

			if (data.fields.sn != sn) {
				return false;
			}

			return true;
		});
	}else if (name == "reference"){
		return searchByCondition(value, function (node) {
				var path = node.attributes.path;
				if (!path){
					return false;
				}
				
				var data = DataMgr.getInstance().get(path);
				if (!data) {
					return false;
				}

				var fields = JSON.stringify(data.fields);
				if (fields.indexOf(value) == -1) {
					return false;
				}
			return true;
		});
	}
}

function searchByCondition(value, conditionFunc){
    var data = DataMgr.getInstance().getTreeMenu();
    var menudata = []
    $.extend(true, menudata, data);
	if(value == "" || !conditionFunc){
		 projectOpen(menudata);
		 return;
	}

    function filter(node) {
        var children = node.children;
        var ret = 0;

        if (children) {
            for (var i = children.length - 1; i >= 0; --i) {
                if (!filter(children[i])) {
                    children[i] = null;
                }
                else {
                    ret += 1;
                }
            }
        }
              
        node.state = 'open'
		if (conditionFunc(node)){
			ret += 1;
		}
		
        return ret > 0;
    }
    
    for (var i = menudata.length - 1; i  >= 0; --i) {
        if (!filter(menudata[i])) {
            menudata[i] = null;
        }
    }

    //除去为空的属性
    var str = JSON.stringify(menudata);
    str = str.replace(/,null/g, "");
    str = str.replace(/null,/g, "");
    str = str.replace(/null/g, "");
    var result = JSON.parse(str);
    projectOpen(result);
}


function showOpenProjectDialog(){			
	$('#OpenProjectDialog').dialog({
    title: '打开工程',
    width: 650,
    height: 600,
    closed: false,
    cache: true,
    href: 'findPorjectDialog.htm',
    modal: true,
	buttons:[
			{
				text:'打开',
				handler:function(){

					var val = $('#proj').textbox("getValue");
					if (val == "") {
						val = $('#proj').val();
					}
					
					if (val == ""){
						$.messager.alert('警告','路径不能为空');  
						return false;
					}
					try{
						onProjectOpen(val);						
						$('#OpenProjectDialog').dialog('close');
						//保存文件
						var f = new File("defaultpaht.js", "w");
						f.open()
						f.seekg(0)
						f.write(val);
						f.close()	
					}catch(e){
						exeCmd('cmd /c inetcpl.cpl')
					}
						
				}
			}]
	});	
}

window.checkNodeState = true;
function collapOrExpanseAll(){
	var tab = $('#tab').tabs('getSelected');
	if (!tab) return;

	var tg = tab.find("table[id^=pg]");
	if (tg.length == 0) return;
	var data = tg.treegrid('getData');
	
	window.checkNodeState = !window.checkNodeState;
	var action =  !!window.checkNodeState ? 'expandAll': 'collapseAll';
		
	for(var i in data){		
		tg.treegrid(action, data[i].id);
	}
}

function openAllCmd(){
	var tree = $('#tree')
    var node = tree.tree("getSelected")
	if (node == null) return;
	
	var path = node.attributes.path;
	var children = node.children;	
	var opts=tree.tree("options");
	for(var i = 0; i < children.length; ++i){
		var e = children[i];	
		(function(e,i){
			var id = setTimeout(function(){ 
			opts.onClick.call(tree, e);
			clearTimeout(id);
		}, i);
		})(e, i * 0.5);
	}
}

function openTabByName(dir, name){
	var tree = $('#tree')
	var opts=tree.tree("options");
	var root=tree.tree('getRoots');
	
	for(var k = 0; k < root.length; ++k){
		var node = root[k]
		if (node.text == dir){
			
			function opera(node){
				if (node.text == name){
					opts.onClick.call(tree, node);
					return true;
				}
				
				var children = node.children || [];
				for(var i = 0; i < children.length; ++i){
					var e = children[i];	
					if (opera(e)) return true;
				}

				return false;
			}
			
			opera(node);
			break;
		}
		
	}
}

function openCurDir(){
	var tree = $('#tree')
    var node = tree.tree("getSelected")
	if (node == null) return;
	
	var path = node.attributes.path;
	exeCmd("explorer " + path)
}

function findAllReference(){
	var tree = $('#tree')
    var node = tree.tree("getSelected");
	if (node == null) return;
	//不是叶子节点
	if(!$('#tree').tree("isLeaf",  node.target)){
		return;
	}
	
	var value = node.id;

	doSearch(value, "reference");
}
