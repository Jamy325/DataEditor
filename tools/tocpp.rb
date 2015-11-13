#econding:UTF-8
require 'Json'

template=ARGV[0]
outputDir=ARGV[1] || "../code/"
puts "file:#{template}"
templateJson = nil

commonFile = "common.js"

ENUM = "enum"
KEY = "key"
NAME = "name"
OBJECT = "object"
UNIT = "unit"
BASE = "template_base"
FIELDS = "fields"
TYPE = "type"
COMMENT = "comment"
MULTI = "multi"
INDEX = "index"
INIT = "init"
VALUE = "value"

def readFile(path)
	context = ""
	File.open(path, 'r') do |f|
	context = f.read(f.size)
	end
	context
end

def writeFile(path, context)
	File.open(path, 'w') do |f|
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
	
	if typeVal == "string" then
		typeVal = "std::string"
		retType = "const #{typeVal}&"
		retInitList = %Q{\t#{prefix}#{typeName} = "#{typeInit}";\n} if typeInit		
		
		if typeMutil then
			retMemberGetImpl = %Q{
	{//#{comment}\n	
		const CSJson::Value& tmp = obj["#{typeName}"];
		uint32t nSize = tmp.size();
		for (uint32t i = 0; i < nSize; ++i)
		{
			#{typeVal} n;
			getJsonVal(tmp[i], n);
			#{prefix}#{typeName}.push_back(n);
		}	
	}	
		}
		else
			retMemberGetImpl = %Q{\t\t//#{comment}\n\t\ getJsonVal(obj["#{typeName}"], #{prefix}#{typeName}); \n}
		end
		
	elsif typeVal == "object" then
		typeVal = "int32t"
		
		retInitList = %Q{\t#{prefix}#{typeName} = 0;\n} if typeInit	
		
		if typeMutil then
			retMemberGetImpl = %Q{
	{//#{comment}	
		const CSJson::Value& tmp = obj["#{typeName}"];
		uint32t nSize = tmp.size();
		for (uint32t i = 0; i < nSize; ++i)
		{
			#{typeVal} n;
			getJsonVal(tmp[i], n);
			#{prefix}#{typeName}.push_back(n);
		}	
	}	
		}
		else
			retMemberGetImpl = %Q{\t\t//#{comment}\n\t\ getJsonVal(obj["#{typeName}"], #{prefix}#{typeName}); \n}
		end
		
	elsif typeVal == "int" then
		typeVal = "int32t"	
		retInitList = %Q{\t#{prefix}#{typeName} = 0;\n} if typeInit	
		
		if typeMutil then
			retMemberGetImpl = %Q{
	{//#{comment}	
		const CSJson::Value& tmp = obj["#{typeName}"];
		uint32t nSize = tmp.size();
		for (uint32t i = 0; i < nSize; ++i)
		{
			#{typeVal} n;
			getJsonVal(tmp[i], n);
			#{prefix}#{typeName}.push_back(n);
		}	
	}	
		}
		else
			retMemberGetImpl = %Q{\t\t//#{comment}\n\t\ getJsonVal(obj["#{typeName}"], #{prefix}#{typeName}); \n}
		end
		
	elsif typeVal == "bool" then
		typeVal = "int32t"
		retInitList = %Q{\t#{prefix}#{typeName} = 0;\n} if typeInit	
		
		if typeMutil then
			retMemberGetImpl = %Q{
	{//#{comment}	
		const CSJson::Value& tmp = obj["#{typeName}"];
		uint32t nSize = tmp.size();
		for (uint32t i = 0; i < nSize; ++i)
		{
			#{typeVal} n;
			getJsonVal(tmp[i], n);
			#{prefix}#{typeName}.push_back(n);
		}	
	}	
		}
		else
			retMemberGetImpl = %Q{\t\t//#{comment}\n\t\ getJsonVal(obj["#{typeName}"], #{prefix}#{typeName}); \n}
		end
		
	elsif typeVal == "enum" then
		typeVal = typeObj[INDEX]
		retType = typeVal
		retInitList = "\t#{prefix}#{typeName} =(#{typeVal}) #{typeInit};\n" if typeInit		
		if typeMutil then
			retMemberGetImpl = %Q{
	{//#{comment}	
		const CSJson::Value& tmp = obj["#{typeName}"];
		uint32t nSize = tmp.size();
		for (uint32t i = 0; i < nSize; ++i)
		{
			#{typeVal} n;
			getJsonVal(tmp[i], (int&)n);
			#{prefix}#{typeName}.push_back(n);
		}	
	}	
		}
		else
			retMemberGetImpl = %Q{\t\t//#{comment}\n\t\ getJsonVal(obj["#{typeName}"], (int&)#{prefix}#{typeName}); \n}
		end
	elsif typeVal == "unit" then	
		typeVal = typeObj[INDEX]
		retType = "const #{typeVal}&"
		
		if typeMutil then
		retMemberGetImpl = %Q{
	{//#{comment}	
		const CSJson::Value& tmp = obj["#{typeName}"];
		uint32t nSize = tmp.size();
		for (uint32t i = 0; i < nSize; ++i)
		{
			#{typeVal} n;
			n.ReadJsonImpl(tmp[i]);
			#{prefix}#{typeName}.push_back(n);
		}	
	}		
		}
		else
			retMemberGetImpl = %Q{\t\t//#{comment}\n\t\ #{prefix}#{typeName}.ReadJsonImpl(obj["#{typeName}"]); \n}
		end
		
		retInitList = "//\n"
	else 
		puts "#{typeVal} not found"
		retMemberGetImpl = %Q{\t\t//#{comment}\n\t\ getJsonVal(obj["#{typeName}"], #{prefix}#{typeName}); \n}
		retInitList = %Q{\t#{prefix}#{typeName} = "";\n} if typeInit	
	end
	
	if retInitList == "" and typeInit then 
		retInitList = "\t#{prefix}#{typeName} = #{typeInit};\n"
	end
	
	if typeMutil then 
		typeVal = "vector<#{typeVal}>"
		retType = "const #{typeVal}&"
	 end
		
	retMemberList += "\t//#{comment}\n"
	retMemberList += "\t#{typeVal} #{prefix}#{typeName};\n"
	
	if typeName != "sn" then
		retType = typeVal if retType == ""		
		retMemberGet = "\t#{retType} get#{typeName.capitalize}() const{ return #{prefix}#{typeName};}\n"
	end
	
	return retInitList, retMemberList, retMemberGet, retMemberGetImpl
end

def genEnum(json)

	return "" if json.empty?

	s = ""
	json.each do |k, v|
		s += "enum #{k}\n"
		s += "{\n"
		v.each do |e|
			s += "\t#{k}_#{e[KEY]} = #{e[VALUE]}, //#{e[NAME]}\n"	
		end
		s += "\t#{k}_Cnt\n"
		s += "};\n"
	end
	s
end

def genUnit(json)

	return "" if json.empty?
	s = ""
	
	json.each do |k, v|
	
		initlist = ""
		memberList = ""
		getter = ""
		reaeJson = ""
		
		v.each do |kk, vv|
			iL, ml, mg, mgi = genMb("", vv[TYPE], kk, vv[COMMENT])
		
			initlist += iL.gsub(/\t/,"\t\t")
			
			memberList += ml
			getter += mg	
			reaeJson += mgi	
		end
	
		s += "struct #{k}:public TemplateBase\n"
		s += "{\n"
		s += "\t#{k}()\n"
		s += "\t{\n"
		s += "#{initlist}"
		s += "\n\t}\n"
		
		s += memberList
		
		s += "\n//method impl \n\tbool ReadJsonImpl(const CSJson::Value& obj)\n"
		s += "\t{\n"
		s += "\t"+reaeJson
		s += "\t\treturn true;\n"
		s += "\t}\n"
		s += "};\n"
	end
	
	 s
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

name="Template#{key.capitalize}"
FileName = name.upcase
ClassName = name
TemplateName = key;
factory_create = <<EOF 
//\#{factory_create}
\tif (str == "#{key}")
\t{
\t	return new #{ClassName}();
\t}
EOF

factory_include = %Q{//\#{factory_include}\n#include "#{ClassName}.h"}

fileds = tJson[FIELDS] || {}

initlist = ""
memberList = ""
reaeJson=""
getter = ""
gettterimpl = ""
tEnum = tJson[ENUM]
tUnit = tJson[UNIT] 
enumClass = genEnum(tEnum) if tEnum
unitStruct = genUnit(tUnit) if tUnit

enum.merge!( tEnum|| {} )
unit.merge!(tUnit || {} )

fileds.each do |e|
	typeName = e[KEY] #变量名
	typeObj = e[TYPE]#变量类型
	comment = e[COMMENT]#变量注释
	
	typeVal = typeObj[NAME]
	typeMutil = typeObj[MULTI]
	typeInit = typeObj[INIT]
	
	iL, ml, mg, mgi = genMb("m_", typeObj, typeName, comment)
	
	initlist += iL
	memberList += ml
	getter += mg	
	reaeJson += mgi
end

hpp = "%Q{"+readFile("template.h")+"}"
writeFile(outputDir + name + ".h", eval(hpp))

cpp = "%Q{"+readFile("template.cpp")+"}"
writeFile(outputDir + name + ".cpp", eval(cpp))

if key != "common" then
factory = "%Q{"+readFile(outputDir + "TemplateFactory.cpp")+"}"
writeFile(outputDir + "TemplateFactory.cpp", eval(factory))
end
