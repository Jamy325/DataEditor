#econding:UTF-8
require 'Json'

template=ARGV[0] 
outputDir=ARGV[1] || "../code/"
@templateDir=ARGV[2] || "."
@templateDir += "\\"
#@templateDir = @templateDir.encode("utf-8", "gbk")

puts "file:#{template}"
templateJson = nil

commonFile = "common.js"

ENUM = "enum"
KEY = "key"
NAME = "name"
OBJECT = "object"
UNIT = "unit"
UNION = "union"
BASE = "template_base"
FIELDS = "fields"
TYPE = "type"
COMMENT = "comment"
MULTI = "multi"
INDEX = "index"
INIT = "init"
VALUE = "value"
TABLE = "table"

@objectNameCache = {}

def genUnitName(baseName)
	return "TemplateUnit#{baseName}"
end

def genUnionName(baseName)
	return "TemplateUnion#{baseName}"
end


def getObjectName(baseName)
	baseName = baseName.encode("gbk", "utf-8")
	puts baseName
	
	if @objectNameCache[baseName] then 
		return @objectNameCache[baseName];
	end
	
	context = readFile(@templateDir + baseName + ".js")
	tJson = JSON.parse(context)
	key= tJson[BASE][KEY]
	name="Template#{key.capitalize}"
	@objectNameCache[baseName] = name;
	return name;
end

def readFile(path)
	context = ""
	File.open(path, 'r') do |f|
	context = f.read(f.size)
	end
	context.encode("utf-8", "gbk")
end

def writeFile(path, context)
	puts "write:#{path}"
	File.open(path, "w:UTF-8") do |f|
	f.write context
	end
end


def genMb(prefix, typeObj, typeName, comment)

	typeMutil = typeObj[MULTI]
	typeInit = typeObj[INIT]
	typeVal = typeObj[NAME]
	
	retMemberList = ""
	retMemberGet = ""
	retMemberGetImpl = ""
	retInitList = ""
	retType = ""
	retMemberGetFunction = ""
	
	member = "#{prefix}_#{typeName}"
	
	if typeVal == "string" then
		typeVal = "string"
		retType = "#{typeVal}"
		retInitList = %Q{\t#{member} = "#{typeInit}";\n} if typeInit		
		
		if typeMutil then

			retMemberGetImpl = %Q{
	{//#{comment}\n	
		var tmp = obj["#{typeName}"] || #{member};
		var nSize = tmp.length;
		for (var i = 0; i < nSize; ++i)
		{
			#{member}.push(tmp[i]);
		}	
	}	
		}
		else
			retMemberGetImpl = %Q{\t\t//#{comment}\n\t\t #{member} = obj["#{typeName}"] || #{member};\n}
		end
		
	elsif typeVal == "object" then
		typeVal = typeObj[INDEX]
		typeVal = getObjectName(typeVal)
		
		retMemberGetFunction = "TemplateMgr.convertInt"
		
		retInitList = %Q{\t#{member} = 0;\n} if typeInit	
		
		if typeMutil then
			retMemberGetImpl = %Q{
	{//#{comment}	
		var tmp = obj["#{typeName}"] || #{member};
		var nSize = tmp.length;
		for (var i = 0; i < nSize; ++i)
		{
			#{prefix}_#{typeName}.push(tmp[i]);
		}	
	}	
		}
		else
			retMemberGetImpl = %Q{\t\t//#{comment}\n\t\t #{member} = obj["#{typeName}"] || #{member}; \n}
		end
		
	elsif typeVal == "int" then
		retInitList = %Q{\t#{member} = 0;\n} if typeInit	
		
		retMemberGetFunction = "TemplateMgr.convertInt"
		
		if typeMutil then
			retMemberGetImpl = %Q{
	{//#{comment}	
		var tmp = obj["#{typeName}"] || #{member};
		var nSize = tmp.length;
		for (var i = 0; i < nSize; ++i)
		{
			#{prefix}#{typeName}.push(tmp[i]);
		}	
	}	
		}
		else
			retMemberGetImpl = %Q{\t\t//#{comment}\n\t\t #{member} = #{retMemberGetFunction}(obj["#{typeName}"] || #{member}); \n}
		end
	elsif typeVal == "boolean" then
		retInitList = %Q{\t#{member} = false;\n} if typeInit	
		
		retMemberGetFunction = "TemplateMgr.convertBoolean"
		
		if typeMutil then
			retMemberGetImpl = %Q{
	{//#{comment}	
		var tmp = obj["#{typeName}"] || #{member};
		var nSize = tmp.length;
		for (var i = 0; i < nSize; ++i)
		{
			#{prefix}#{typeName}.push(tmp[i]);
		}	
	}	
		}
		else
			retMemberGetImpl = %Q{\t\t//#{comment}\n\t\t #{member} = #{retMemberGetFunction}(obj["#{typeName}"] || #{member}); \n}
		end	
	elsif typeVal == "float" then
		retMemberGetFunction = "TemplateMgr.convertFloat"
		retInitList = %Q{\t#{member} = 0.0;\n} if typeInit	
		
		if typeMutil then
			retMemberGetImpl = %Q{
	{//#{comment}	
		var tmp = obj["#{typeName}"] || #{member};
		var nSize = tmp.length;
		for (var i = 0; i < nSize; ++i)
		{
			#{prefix}#{typeName}.push(tmp[i]);
		}	
	}	
		}
		else
			retMemberGetImpl = %Q{\t\t//#{comment}\n\t\t  #{member} = #{retMemberGetFunction}(obj["#{typeName}"] || #{member}); \n}
		end
		
	elsif typeVal == "enum" then
		retMemberGetFunction = "TemplateMgr.convertInt"
		typeVal = typeObj[INDEX]
		retType = typeVal
		retInitList = "\t#{member} = #{typeInit};\n" if typeInit		
		if typeMutil then
			retMemberGetImpl = %Q{
	{//#{comment}	
		var tmp = obj["#{typeName}"] || #{member};
		var nSize = tmp.length;
		for (var i = 0; i < nSize; ++i)
		{
			#{prefix}#{typeName}.push(tmp[i]);
		}	
	}	
		}
		else
			retMemberGetImpl = %Q{\t\t//#{comment}\n\t\t #{member} = #{retMemberGetFunction}(obj["#{typeName}"] || #{member}); \n}
		end
	elsif typeVal == "unit" then	
		typeVal = typeObj[INDEX]
		typeVal = genUnitName(typeVal)
		retType = "#{typeVal}"
		
		if typeMutil then
		retMemberGetImpl = %Q{
	{//#{comment}	
		var  tmp = obj["#{typeName}"] || #{member};
		var nSize = tmp.length;
		for (var i = 0; i < nSize; ++i)
		{
			var n = new #{typeVal};
			if (n.readJson(tmp[i])){
				#{prefix}#{typeName}.push(n);
			}
		}	
	}		
		}
		else
			retMemberGetImpl = %Q{\t//#{comment}\n\t\t var tmp = new #{typeVal}; \n\t if(tmp.readJson(obj["#{typeName}"]))\n\t\t#{member} = tmp;\n}
		end
		
	#	retInitList = "//\n"
	elsif typeVal == "union" then	
		#////
	else #////
		retMemberGetFunction = "TemplateMgr.convert#{typeVal.capitalize}"
		puts "#{typeVal} not found"
		retMemberGetImpl = %Q{\t\t//#{comment}\n\t\t  #{member}= #{retMemberGetFunction}(obj["#{typeName}"] || #{member}); \n}
		retInitList = %Q{\t #{prefix}#{typeName} = "";\n} if typeInit	
	end
	
	if retInitList == "" and typeInit then 
		retInitList = "\t#{member} = #{typeInit};\n"
	end
	
	if typeMutil then 
		typeVal = "[#{typeVal}]"
		retType = "#{typeVal}"
		retInitList = "\t#{member} = [];\n"
	 end
		
	retMemberList += "\t//#{comment}\n" 
	retMemberList += "\t//#{typeVal}\n\t_#{typeName} : null,\n"
	
	if typeName != "sn" then
		retType = typeVal if retType == ""				
		retMemberGet = "\t/**\n\t * #{comment}\n\t * @return {#{retType}}\n\t */\n\tget#{typeName.capitalize}:function(){\n\t\t return #{member};\n\t},\n"	
	end
	
	retInitList += %Q{cc.defineGetterSetter(this, "#{typeName}", this.get#{typeName.capitalize}, function(val){#{member} = val;}); \n\n}
	return retInitList, retMemberList, retMemberGet, retMemberGetImpl
end

def genEnum(json)

	return "" if json.empty?

	s = ""
	json.each do |k, v|
		s += "/*enum #{k}\n"
		s += "{\n*/"
		v.each do |e|
			s += "\tENUM.#{k}_#{e[KEY]} = #{e[VALUE]}; //#{e[NAME]}\n"	
		end
		s += "/*\t#{k}_Cnt\n"
		s += "};*/\n"
	end
	s
end

def genUnit(json, unions)

	return "" if json.empty?
	s = ""

	json.each do |k, v|
		enumClass = "";
		unitStruct = "";
		initlist = ""
		memberList = ""
		getter = ""
		reaeJson = ""
		className = genUnitName(k);
		
		v.each do |kk, vv|
			if vv[TYPE][NAME] == UNION then 
				unionIndex = vv[TYPE][INDEX]
				unionDefaultType = unions[unionIndex]["default"]
				iL, ml, mg, mgi = genMb("this.", unionDefaultType[TYPE], kk, unionDefaultType[COMMENT])
			else 
				iL, ml, mg, mgi = genMb("this.", vv[TYPE], kk, vv[COMMENT])
			end	
		
			initlist += iL		
			memberList += ml
			getter += mg	
			reaeJson += mgi	
		end
		jstpl = "%Q{"+readFile("jsunit.tpl")+"}"
		s += eval(jstpl);
	end

	return s;
end

#common.js process
common = {}
if template != commonFile then
common = JSON.parse(readFile(commonFile))
end

enum = common[ENUM] || {}
unit = common[UNIT] || {}

unitStructImpl = ""
enumClass = ""


#read template file
tJson = JSON.parse(readFile(template))

key= tJson[BASE][KEY]
templateTypeName = tJson[BASE][TYPE]

name="Template#{key.capitalize}"
FileName = name.upcase
className = name
TemplateName = key;



factory_create = <<EOF 
//\#{factory_create}
\tif (str == "#{key}")
\t{
\t	return new #{className}();
\t}
EOF

#factory_include = %Q{//\#{factory_include}\n#include "#{className}.h"}

fileds = tJson[FIELDS] || {}
unions = tJson[UNION] || {}

initlist = ""
memberList = ""
reaeJson=""
getter = ""
gettterimpl = ""
tEnum = tJson[ENUM]
tUnit = tJson[UNIT] 
enumClass = genEnum(tEnum) if tEnum
unitStruct = genUnit(tUnit, unions) if tUnit

enum.merge!( tEnum|| {} )
unit.merge!(tUnit || {} )

fileds.each do |e|
	typeName = e[KEY] #变量名
	typeObj = e[TYPE]#变量类型
	comment = e[COMMENT]#变量注释
	
	typeVal = typeObj[NAME]
	typeMutil = typeObj[MULTI]
	typeInit = typeObj[INIT]
	
	iL, ml, mg, mgi = genMb("this.", typeObj, typeName, comment)
	
	initlist += iL
	memberList += ml
	getter += mg	
	reaeJson += mgi
end

hpp = "%Q{"+readFile("js.tpl")+"}"
result = eval(hpp);
result = "/*\nwarning:this file was created by tojs.rb,plz don't modify it!\ncreate time:#{Time.now}\n*/\n\n" + result;
writeFile(outputDir + name + ".js", result)
puts "templateTypeName:#{templateTypeName}"

if templateTypeName == TABLE then 
	tableName = key.capitalize
	jsTable = "%Q{"+readFile("table.tpl")+"}"
	result = eval(jsTable);
	result = "/*\nwarning:this file was created by tojs.rb,plz don't modify it!\ncreate time:#{Time.now}\n*/\n\n" + result;
	writeFile(outputDir + "TemplateTableMgr_" +tableName + ".js", result)
end

unless enumClass.empty? then 
	File.open(outputDir + "enum.js", "a+") do |f|
		f.write enumClass
	end
end

