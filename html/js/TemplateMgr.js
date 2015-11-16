/**
 * Created by jamy on 2015/3/3.
 */
/*
 * 模版数据管理器
 */

var TemplateMgr = TemplateMgr || {};

TemplateMgr.getInstance = function(){
	if (typeof  TemplateMgr._innerMgr !== 'undefined'){
		return TemplateMgr._innerMgr;
	}

	var dataMgr = DataMgr.getInstance();
	TemplateMgr._innerMgr = {
			getDataBySN : function (sn){
				return dataMgr.getObjectBySN(sn);
			}
	};

	return TemplateMgr._innerMgr;
};

//一些类型转换函数
TemplateMgr.convertInt = function(val){
	return parseInt(val);
};

TemplateMgr.convertBool = function(val){
	return isBoolean(val);
};

TemplateMgr.convertScript = function(val){
	return val + "";
};

TemplateMgr.convertFloat = function(val){
	return parseFloat(val);
};

TemplateMgr.convertIntArray = function(val){
	var tmp = [];
	for(var i = 0; i < val.length; ++i){
		tmp.push(TemplateMgr.convertInt(val[i]));
	}

	return tmp;
};

TemplateMgr.convertBoolArray = function(val){
	var tmp = [];
	for(var i = 0; i < val.length; ++i){
		tmp.push(TemplateMgr.convertBool(val[i]));
	}

	return tmp;
};

TemplateMgr.convertScriptArray = function(val){
	var tmp = [];
	for(var i = 0; i < val.length; ++i){
		tmp.push(TemplateMgr.convertScript(val[i]));
	}

	return tmp;
};

//TemplateMgr.getInstance().getDataBySN(1);
