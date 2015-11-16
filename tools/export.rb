#econding:utf-8

require 'Json'
def traverse_dir(file_path)  
  if File.directory? file_path  
    Dir.foreach(file_path) do |file|  
      if file[0] != "." and file !~ /^_/
        traverse_dir(file_path+"/"+file){|x| yield x}  
      end  
    end  
  else  
    yield  file_path  
  end  
end

def readFile(path)
	context = ""
	File.open(path, 'r') do |f|
	context = f.read(f.size)
	end
	context.encode("utf-8", "gbk")
end

@commonTemplate = nil

def replaceObject(json, objType, temp, objs)	
		#json = fiedls[key]
		return if json.nil?
		
		isMulti = objType["multi"]
		
		#处理数组
		if isMulti then 
			objTypeClone = objType.clone
			objTypeClone["multi"] = false
			#puts "m #{json} -- #{objTypeClone}"
			json.each do |e|
			#把数组解开
				replaceObject(e, objTypeClone, temp, objs)
			end
		else 
			if objType["name"] == "object" then
			
				objName = json
				obj = objs[objName]
				if obj.nil? 
				puts "template field #{objType["index"]} error ,obj name #{objName} is null" 
				 if objName != "" then 
					puts "物体不存在:#{objName}"
					gets
				 end 					
				else 
					sn = obj["fields"]["sn"]
					json.replace sn.to_s	
				end

				
			elsif objType["name"] == "unit" then

				unitName = objType["index"]
			
				unit = temp["unit"][unitName] unless temp["unit"].nil?					
				unit = @commonTemplate["unit"][unitName] if unit.nil?
						
				#puts "unit #{objType} - #{unitName} not found!!" if unit.nil? 				
				json.each do |k, v|
					#puts "unit field #{k} nil" if unit[k].nil?		
					if !unit[k].nil? then
						replaceObject(v, unit[k]["type"], temp, objs)
					end
				end	

	
			else 
				
			end
		end
end


system("del /q data\\*")

templatepath="模板"
path="物体"

#打开模板
 temps={}
 traverse_dir(templatepath.encode("gbk")) do |f|  
	curFile=f.to_s()
	if curFile =~ /\.js$/ then
		fileName=File.basename(curFile, ".js")
		fileName=fileName.encode("utf-8", "gbk")
		#puts "template - #{fileName}"		
		
		jObj=JSON.parse(readFile(curFile))	
		temps[fileName] = jObj
	end 
 end
 
@commonTemplate = temps["common"]
 
 #打开物体
objs={}
 traverse_dir(path.encode("gbk")) do |f|  
	curFile=f.to_s()
	#puts "obj - #{curFile}"
	begin
		if curFile !~ /\.js$/ then		
			break
		end
		
		fileName=File.basename(curFile, ".js").encode("utf-8", "gbk")
		
	  if not objs[fileName].nil? then
		puts "错误 --- [#{fileName}] 文件名重复"
		puts "继续?[y]"
		gets 
		break
	  end
	  	
		s = readFile(curFile)
		jObj = JSON.parse(s)
		tempName = jObj['base']['template']
		t = temps[tempName]
		tbase = t["template_base"]
		snMin = tbase["sn_min"]
		snMax = tbase["sn_max"]
		
		fields = jObj["fields"]
		sn = fields["sn"].to_i
		#验证SN
		if sn < snMin || sn > snMax then
			puts "错误:#{fileName}的sn(#{sn}) 必须在 [#{snMin}, #{snMax})范围内"
			puts "继续?[y]"
			gets 
			break
		end
			
		#验证字段是否缺少
		tfields = t["fields"]
		tfields.each do |j|
			jkey=j["key"]
			if fields[jkey].nil? then
				#puts "warning -- obj[#{fileName}] , key[#{jkey}] is nil"
			end
		end		
				
		objs[fileName] = jObj				
	  
	end while false
	 
 end
 

 #替换物体名为SN
 jsons = []
 
 objs.each do |key, jObj|
		tempName = jObj['base']['template']
		fields = jObj["fields"]
		t = temps[tempName]
	
		tfields = t["fields"]
		puts "replace obj - #{key}"
		tmpKey = t['template_base']['key'];
		jObj['fields']["_className"] = "Template#{tmpKey.capitalize}";
		
		tfields.each do |j|		
			raise "fiel '#{j}' not find" if j["key"].nil?	
			raise "fiel '#{j}' not find" if j["key"].empty?	
			replaceObject(fields[j["key"]], j["type"], t, objs)	
		end
		jsons << jObj
 end
 
puts "begin write file"
allDataSN = {}
 jsons.each do |e|
	fileds = e["fields"]
	sn = fileds["sn"].to_i
	 
	 if allDataSN[sn] then 
		puts "错误:sn(#{sn}) 重复"
		puts "继续?[y]"
		gets 
	 end
	 
	if sn != 0 then
	allDataSN[sn] = e;
		File.open("data/#{sn}.js", "w") do |f|
			f.write fileds.to_json.gsub(/\\\\n/, "\\n")
		end
	end
 end
 
 
 
 
 
 
 
 