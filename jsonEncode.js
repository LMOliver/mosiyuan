function encode_compress(obj){
	obj=JSON.parse(JSON.stringify(obj));
	let data=[];
	let dataMap=new Map();
	function getData(d){
		let index=JSON.stringify(d);
		if(!dataMap.has(index)){
			let id=data.length;
			data.push(d);
			dataMap.set(index,id);
		}
		return dataMap.get(index);
	}
	function transverse(obj){
		if(obj!==null&&typeof obj==='object'){
			if(obj instanceof Array){
				return getData(obj.map(transverse));
			}
			else{
				let keys=getData([{},...(Object.keys(obj).map(transverse))]);
				return getData([keys,...(Object.values(obj).map(transverse))]);
			}
		}
		else{
			return getData(obj);
		}
	}
	transverse(obj);
	return data;
}

function decode_compress(data){
	data=JSON.parse(JSON.stringify(data));
	function isKeys(arr){
		return (arr instanceof Array)&&(typeof arr[0]==='object')&&(!(arr[0] instanceof Array));
	}
	function getObj(index){
		let x=data[index];
		if(x instanceof Array){
			if(x.length>0&&isKeys(data[x[0]])){
				let [,...keys]=getObj(x[0]);
				let [,...values]=x;
				values=values.map(getObj);
				let f=Object.create(null);
				for(let i=0;i<keys.length;i++){
					f[keys[i]]=values[i];
				}
				return f;
			}
			else{
				return x.map(getObj);
			}
		}
		else{
			return x;
		}
	}
	return getObj(data.length-1);
}