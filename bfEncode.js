function encode(str){
	let result=[];
	let chars=[];
	for(let i=0;i<str.length;i++){
		let char=str.charCodeAt(i);
		if(!chars.includes(char)){
			chars.push(char);
		}
	}
	chars.sort((a,b)=>a-b);
	str=str.split('').reverse().join('');
	for(let i=0;i<str.length;i++){
		let char=str.charCodeAt(i);
		let x=chars.indexOf(char)+1;
		result.push('>','+'.repeat(x));
	}
	result.push('[');
	let cur=0;
	for(let i=0;i<chars.length;i++){
		result.push('>','+'.repeat(chars[i]-cur),'<-[');
		cur=chars[i];
	}
	result.push(']'.repeat(chars.length));
	result.push('>.<<]');
	return result.join('');
}
encode('++--**//!!--cdaca');