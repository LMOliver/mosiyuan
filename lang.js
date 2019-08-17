{

const LANG_ZH='zh_CN';
const LANG_EN='en_US';
let language=LANG_ZH;

const DICT_DATA={
	[LANG_ZH]:{
		name:'中文',
		dict:new Map(),
	},
	[LANG_EN]:{
		name:'English',
		dict:new Map(),
	},
};

const translateText=async (text,dest)=>{
	console.groupCollapsed('请求翻译');
	console.log(text);
	console.groupEnd();
	let api=`http://translate.google.cn/translate_a/single?client=gtx&dt=t&dj=1&ie=UTF-8&sl=zh_CN&tl=${dest}&q=${encodeURIComponent(text)}`;
	let call=`https://jsonp.afeld.me/?url=${encodeURIComponent(api)}`;
	let result=await axios.get(call);
	return {
		dest,
		result:result.data.sentences.map(s=>({trans:s.trans.trim(),src:s.orig.trim()})),
	};
}
window.translateText=translateText;

let textSet=new Set();

let plan=null;
let errored=false;
function setPlan(){
	if(errored){
		plan=null;
		return;
	}
	if(plan){
		return;
	}
	plan=setTimeout(()=>{
		translateText([...textSet].join('\n'),language)
		.then((result)=>{
			plan=null;
			// errored=true;
			let dict=DICT_DATA[result.dest].dict;
			console.groupCollapsed('翻译结果');
			for(let {trans,src} of result.result){
				// console.log(trans,src);
				if(!dict.has(src)){
					console.log(`${src} => ${trans}`);
				}
				dict.set(src,trans);
			}
			console.groupEnd();
		})
		.catch((error)=>{
			plan=null;
			errored=true;
			console.error(error);
		});
	},500);
}

function getTranslate(text,dest){
	if(dest==LANG_ZH){
		return text;
	}
	text=text.trim();
	if(!text)return '';
	let dict=DICT_DATA[dest].dict;
	if(dict.has(text)){
		return dict.get(text);
	}
	else{
		if(!textSet.has(text)){
			textSet.add(text);
			if(!plan){
				console.log(`PLAN ${text}`);
			}
		}
		setPlan();
		return text;
	}
}

function translate(text,...args) {
	text=text.replace(/(?:\<)(?:.+?)(?:\>)/g,(...groups)=>{
		args.push(groups[0]);
		return `{${args.length-1}}`;
	});
	text=text.split(/\{\!\}/g).map(s=>getTranslate(s,language)).join('');
	text=text.replace(/\{\.\}/g,'');
	for(let i in args){
		text=text.replace(new RegExp('\\{'+i+'\\}','g'),args[i]);
	}
	text=text.replace(/\{Siyuan\}/g,'<span class="siyuan"></span>');
	return text;
}

window.translate=translate;
window.setLanguage=(newLang)=>{language=newLang;};
window.getLangName=(lang)=>DICT_DATA[lang].name;
window.languages=[
	LANG_ZH,
	LANG_EN,
];
}