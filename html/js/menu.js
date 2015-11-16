
var mm2 = $('#mm2') //菜单栏 - 其他 

//菜单栏 - 其他 - 新场景编辑
var mm2TabSkillTitle = '新场景编辑'
mm2.menu('appendItem', {
	text: mm2TabSkillTitle,
	iconCls: 'icon-ok',
	onclick: function(){	
		
		//选中tab
		if ( $('#tab').tabs("exists", mm2TabSkillTitle)){
			$('#tab').tabs('select', mm2TabSkillTitle);
			return;
		}
		var rand = Math.random();

		//添加tab		
	   var newTab = $('#tab').tabs('add', {
	        title: mm2TabSkillTitle,
	        content: "<iframe src='game-editor/scene-jsb.html?_=" + rand+"' width='99%' height='99%'/>",
	        closable: true
	    });
		
		
	} // onclick
});


//菜单栏 - 其他 - 场景编辑
mm2TabSceneTitle='关卡编辑器'
mm2.menu('appendItem', {
	text: mm2TabSceneTitle,
	iconCls: 'icon-ok',
	onclick: function(){			
			//选中tab
		if ( $('#tab').tabs("exists", mm2TabSceneTitle)){
			$('#tab').tabs('select', mm2TabSceneTitle);
			return;
		}

		var rand = Math.random();

		//添加tab		
	   var newTab = $('#tab').tabs('add', {
				
	        title: mm2TabSceneTitle,
	        content: "<iframe id = 'iframe-mm2TabSceneTitle' src='game-editor/scene.html?_=" + rand+"' width='98%' height='98%'/>",
			getChanges:function(){

				var ifr = window.frames['iframe-mm2TabSceneTitle']
				if(!ifr.window.__isSave__){
						return confirm("确定关闭？");
				}
				
				return true;
			},
	        closable: true
	    });
	}
});

var mm2TabAITitle = 'AI编辑'
mm2.menu('appendItem', {
	text: mm2TabAITitle,
	iconCls: 'icon-ok',
	onclick: function(){	
		
		//选中tab
		if ( $('#tab').tabs("exists", mm2TabAITitle)){
			$('#tab').tabs('select', mm2TabAITitle);
			return;
		}
		var rand = Math.random();

		//添加tab		
	   var newTab = $('#tab').tabs('add', {
	        title: mm2TabAITitle,
	        content: "<iframe src='game-editor/AI.html?_=" + rand+"' width='100%' height='100%' frameborder='0' scrolling='no'/>",
	        closable: true
	    });
		
		
	} // onclick
});

var mm2TabHeroTitle = '英雄预览'
mm2.menu('appendItem', {
    text: mm2TabHeroTitle,
    iconCls: 'icon-ok',
    onclick: function(){

        //选中tab
        if ( $('#tab').tabs("exists", mm2TabHeroTitle)){
            $('#tab').tabs('select', mm2TabHeroTitle);
            return;
        }
        var rand = Math.random();

        //添加tab
        var newTab = $('#tab').tabs('add', {
            title: mm2TabHeroTitle,
            content: "<iframe src='game-editor/hero.html?_=" + rand+"' width='100%' height='100%' frameborder='0' scrolling='no'/>",
            closable: true
        });


    } // onclick
});

var mm2TabCsvTableTitle = '表数据管理工具'
mm2.menu('appendItem', {
    text: mm2TabCsvTableTitle,
    iconCls: 'icon-ok',
    onclick: function(){

        //选中tab
        if ( $('#tab').tabs("exists", mm2TabCsvTableTitle)){
            $('#tab').tabs('select', mm2TabCsvTableTitle);
            return;
        }
        var rand = Math.random();

        //添加tab
        var newTab = $('#tab').tabs('add', {
            title: mm2TabCsvTableTitle,
            content: "<iframe src='game-editor/CSV.html?_=" + rand+"' width='100%' height='100%' frameborder='0' scrolling='no'/>",
            closable: true
        });


    } // onclick
});


var mm2TabStageTitle = '关卡编辑器'
mm2.menu('appendItem', {
    text: mm2TabStageTitle,
    iconCls: 'icon-ok',
    onclick: function(){

        //选中tab
        if ( $('#tab').tabs("exists", mm2TabStageTitle)){
            $('#tab').tabs('select', mm2TabStageTitle);
            return;
        }
        var rand = Math.random();

        //添加tab
        var newTab = $('#tab').tabs('add', {
            title: mm2TabStageTitle,
            content: "<iframe src='game-editor/stage.html?_=" + rand+"' width='100%' height='100%' frameborder='0' scrolling='no'/>",
            closable: true
        });


    } // onclick
});


