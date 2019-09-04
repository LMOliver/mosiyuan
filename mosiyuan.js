'use strict';
{
	const VERSION='0.6.4.2';
	const VERSION_NAME='';
	const VERSION_MESSAGE=`调整了界面，增加了一个新成就。`;
	const {encode,decode}=(()=>{
		const C=126-33+1;
		const ENCODE_P={33:125,34:84,35:44,36:102,37:57,38:68,39:50,40:69,41:59,42:83,43:100,44:72,45:116,46:35,47:108,48:89,49:92,50:51,51:65,52:73,53:124,54:119,55:90,56:45,57:47,58:75,59:60,60:95,61:96,62:91,63:63,64:111,65:46,66:101,67:36,68:120,69:104,70:97,71:42,72:55,73:99,74:113,75:53,76:112,77:122,78:114,79:106,80:33,81:79,82:74,83:121,84:61,85:85,86:76,87:49,88:93,89:82,90:40,91:117,92:105,93:62,94:94,95:39,96:78,97:86,98:109,99:41,100:66,101:70,102:48,103:58,104:88,105:103,106:64,107:115,108:80,109:81,110:43,111:123,112:67,113:56,114:107,115:110,116:52,117:118,118:77,119:126,120:87,121:98,122:34,123:71,124:38,125:37,126:54,};
		const DECODE_P={125:33,84:34,44:35,102:36,57:37,68:38,50:39,69:40,59:41,83:42,100:43,72:44,116:45,35:46,108:47,89:48,92:49,51:50,65:51,73:52,124:53,119:54,90:55,45:56,47:57,75:58,60:59,95:60,96:61,91:62,63:63,111:64,46:65,101:66,36:67,120:68,104:69,97:70,42:71,55:72,99:73,113:74,53:75,112:76,122:77,114:78,106:79,33:80,79:81,74:82,121:83,61:84,85:85,76:86,49:87,93:88,82:89,40:90,117:91,105:92,62:93,94:94,39:95,78:96,86:97,109:98,41:99,66:100,70:101,48:102,58:103,88:104,103:105,64:106,115:107,80:108,81:109,43:110,123:111,67:112,56:113,107:114,110:115,52:116,118:117,77:118,126:119,87:120,98:121,34:122,71:123,38:124,37:125,54:126,};
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
						let keys=getData([{},...Object.keys(obj).map(transverse)]);
						return getData([keys,...Object.values(obj).map(transverse)]);
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
				return arr instanceof Array&&typeof arr[0]==='object'&&!(arr[0] instanceof Array);
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
		function encodeArr(arr){
			function encodeChar(x){
				return String.fromCharCode(ENCODE_P[x+33]);
			}
			return arr.map((x,i)=>encodeChar((x+Number(i)*(C-21))%C)).join('');
		}
		function decodeArr(str){
			function decodeChar(ch){
				return DECODE_P[ch.charCodeAt(0)]-33;
			}
			return str.split('').map((ch,i)=>(decodeChar(ch)+Number(i)*21)%C);
		}
		const FLAG_COMPRESS='-';
		return {
			encode(x){
				let arr=decodeArr(JSON.stringify(encode_compress(x)));
				let l=arr.length;
				for(let i=l-1;i>0;i--){
					arr[i]=(arr[i]-arr[i-1]+C)%C;
				}
				return this.PADDING
				+encodeArr(arr)
				+this.PADDING
				+FLAG_COMPRESS;
			},
			decode(x){
				let compressed=false;
				if(x[x.length-1]===FLAG_COMPRESS){
					x=x.slice(0,-1);
					compressed=true;
				}
				let arr=decodeArr(x.slice(this.PADDING.length,-this.PADDING.length));
				let l=arr.length;
				for(let i=1;i<l;i++){
					arr[i]=(arr[i]+arr[i-1])%C;
				}
				let result=JSON.parse(encodeArr(arr));
				// console.log(JSON.parse(JSON.stringify(result)));
				if(compressed){result=decode_compress(result);}
				return result;
			},
		};
	})();

	const EXP_BASE=10;
	const FIRSTS=['K','M','B'];
	const NUM_HEADS=['','U','D','T','q','Q','s','S','O','N'];
	const NUM_TAILS=['','Dc','Vi','Tg','qg','Qg','sg','Sg','Og','Ng'];
	function pn(num){
		if(typeof num!=='number'){return String(num);}
		if(num===Infinity){return '+∞';}
		if(num===-Infinity){return '-∞';}
		if(isNaN(num)){return 'NaN';}
		let str=num.toExponential(2);
		let ePos=str.indexOf('e');
		let val=parseFloat(str.substring(0,ePos));
		let exp=parseInt(str.substring(ePos+1));
		if(exp<5){
			if(Number.isSafeInteger(num)){return num.toString();}
			for(let i=2;i<=4;i++){
				if(exp>=-i){return num.toFixed(i);}
			}
			return num.toExponential(2);
		}else if(exp>3*EXP_BASE**2){
			return num.toExponential(2);
		}
		val*=Math.pow(10,exp%3);
		let elv=Math.floor(exp/3)-1;
		let suf=elv<=2
			?FIRSTS[elv]
			:(NUM_HEADS[elv%EXP_BASE]+NUM_TAILS[Math.floor(elv/EXP_BASE)]).slice(0,2);
		return `${val.toPrecision(3)}${suf}`;
	}
	function pnr(num){
		const s=['','I','II','III','IV','V','VI','VII','VIII','IX','X','XI','XII','XIII','XIV','XV','XVI','XVII','XVIII','IXX','XX'];
		if(typeof num!=='number'){return String(num);}
		if(!Number.isFinite(num)){return num.toString();}
		if(!Number.isSafeInteger(num)||num<0||num>=s.length){return pn(num);}
		return s[num];
	}
	const SIYUAN='<span class="siyuan">Siyuan</span>';
	const DAILY_MESSAGES=[
		`你强归你强，${SIYUAN}比你强！`,
		`你可以按住<code>Enter</code>来快速点击一个按钮。`,
		`${SIYUAN}是我们的红太阳，没有她我们会死！`,
		`你<strong>不能</strong>通过按住<code>Shift</code>点击一个按钮以直接购买最大数量的事物。`,
		`今天又是美好的一天~`,
		`若不是${SIYUAN}相助，也许我到现在还不知道我做错了什么。现在我知道了，是<code>LCT</code>上<code>splay</code>的时候判断父亲是否为根直接用了<code>if(fa->fa)</code>。`,
		`洁白的光点游走于漆黑的天幕之上，暗紫色的薄纱在其间舞动。在此无月之夜，是否可以知晓：“后缀自动机怎么写？”`,
		`那些文档有一部分真的有用……`,
		`${SIYUAN} 膜 她 自 己`,
		`${SIYUAN} D 她 自 己`,
		`如果你花掉了一些东西，它的花费也会降低，就像你从没买过它一样。`,
		`<a href="https://lmoliver.github.io">qwq</a>`,
		`要想探寻真理，不仅要虔诚膜拜${SIYUAN}，领导者的实力也是很重要的。`,
		`<code>code.replace(/\\n\\s*\\{/mg,\'{\');</code>`,
		`嘤嘤嘤`,
		`Hello world!`,
		`在夕阳的照耀下，教堂的圆顶散发出金色的光辉。`,
		`这一刻，我们都是${SIYUAN}的忠实粉丝。`,
		`Do the magic!`,
		`传说${SIYUAN}会在被她抛弃的终端上用 root 权限执行<code>rm -rf /*</code>。`,
		`${SIYUAN}太强了，所以你复制不了这个网站中的任何一个${SIYUAN}。`,
		`空谈误国，实干兴邦。`,
		`<img src="./daily1.png">`,
		`<img src="./daily2.png">`,
		`<img src="./daily3.png">`,
		`<img src="./daily4.png">`,
		`Orz${SIYUAN} 就来 <a href="https://orzsiyuan.com">orzsiyuan.com</a>！`,
		`你知道吗？${SIYUAN}几乎每天都会上几次<a href="http://lydsy.online">http://lydsy.online</a>！(难道网址中的<code>dsy</code>是天意？)`,
		`追寻真理的各种花费与你本轮尝试次数有关。`,
		`追寻真理时重置会将当前成功轮数也清空！`,
		`在真理之路上，要不畏艰辛，敢于推翻重来，才不会在错误的道路上越走越远。`,
		`窝 又 被 ${SIYUAN} D 了 QAQ`,
		`道路千万条，光明第一条。防御没做好，黑屏两行泪。`,
		`元素和光明在你下线时也会增加！`,
		`贪 D 的(9^0+9^1+...+9^n+...)头 ${SIYUAN}`,
		`${SIYUAN}:“辣鸡，真辣鸡！”`,
		`${SIYUAN}:“泥萌怎么这么菜 nya？”`,
		`${SIYUAN}:“我就 D 你怎么了？”`,
		`${SIYUAN}:“哪场 ** CF 连样例解释都没有？”`,
		`${SIYUAN}:“tourist 能过，那窝肯定也能过！”`,
		`萌新三连:“窝怎么立直了 nya？胡是什么 nya，可以跳过吗？自摸是不是每巡都有的，好烦 nya！”`,
		`Markdown: [https://orzsiyuan.com](https://lmoliver.github.io/mosiyuan)`,
		`如果出现了难以对付的敌人，你可以<strong>召唤拯救</strong>扫清他们。`,
		`祝贺 ${SIYUAN} ZJOI2019 Day2 40+40+50=130分 && 触发女装 Flag !`,
		`2019-08-21 ${SIYUAN} 被阿祭`,
		`${SIYUAN} AK NOI！`,
		`${SIYUAN} AK IOI！`,
		`${SIYUAN} 女装！`,
		`<strong>传教</strong>可以增加你的信徒数量。`,
		`传教中出现的题目来自某场${SIYUAN}将要 AK 的比赛的笔试。`,
		`洛谷膜拜 ${SIYUAN} 主题：<a href="https://www.luogu.org/theme/design/5321">https://www.luogu.org/theme/design/5321</a>`,
		`强迫症真的这么好吗？`,
		`JRNEOJ 不是 OJ！`,
		`当世界速度达到上限时，会触发<strong>时间震荡</strong>，使你失去一些世界速度。`,
	].map(s=>s.replace(/nya/g,'<span class="nya">nya</span>'));

	function makeProblem(str,...was){
		let [statement,answers]=str.split(/[：？]/g);
		answers=answers.split('；');
		answers.forEach(a=>{
			if(a.trim()===''){
				throw new Error(str);
			}
		});
		if(answers.length===1){
			answers=answers[0].split('、');
		}
		return [statement.replace(/_{2,}/g,'<input style="width:10%;" disabled="">'),answers,was];
	}

	const SP_PROBLEMS=[
		['NOI 机试使用的操作系统是：Linux','Windows','MacOS','Android'],
		['Linux 中为文件改名使用的命令是：mv <旧文件名> <新文件名>','rm <旧文件名> <新文件名>','cp <旧文件名> <新文件名>','rename <旧文件名> <新文件名>'],
		['在 Linux 中返回上一级目录使用的命令是：cd ..','cd .','cd ...','cd ./'],
		['在 Linux 中删除当前目录下的 test 目录的命令是：rm -r test','rm -rf /*','rm -d test','rm test'],
		['当前目录下有一个编译好的可执行文件 a.out，执行它使用的命令是：./a.out','a.out','./a','../a.out'],
		['使用高级语言编写的程序称之为：源程序','高级程序','高级语言程序','现代程序'],
		['在 NOI Linux 系统中可以用来调试程序的程序是：gdb','g++','fpc','debugger'],
		['在 Linux 系统中，文件夹中的文件可以与该文件夹同名吗：可以','不行',`只有${SIYUAN}才能做到`,'我不知道'],
		['Linux 系统中杀死名为 test 的后台进程的命令是：killall test','kill test','kill -name test','kill $test'],
		['Linux 系统中可以查看隐藏文件的命令是：ls -a','ls -h','ls -s','ls -i'],
		['Linux 系统中编译 C 程序的编译器是：gcc','g++','fpc','c'],
		['Linux 系统中编译 Pascal 程序的编译器是：fpc','pas','gcc','p++'],
		['Linux 系统中编译 C++程序的编译器是：g++','gcc','cpp','c++'],
		['Linux 系统中，将当前目录下的文件名打印到 tmp 文件中的命令是：ls >tmp','./ls >tmp','tmp <ls','./tmp <ls'],
		['Linux 系统中，测量当前目录下程序 test 运行时间的命令是：time ./test','./test | time','./time ./test','time test'],
		['vim 编辑器中，强制退出不保存修改应当输入：:q!',':wq!',':ZZ',':eN'],
		['vim 编辑器中，强制退出并保存修改可输入以下三种命令之一：:wq、ZZ、:x',':sq'],
		['vim 编辑器中，定位到文件中第 12 行应当输入：:12','/12',':l12','\\12'],
		['vim 编辑器中，在文件中查找字符串“12”应当输入：/12',':r12','\\12',':12'],
		['使用 gcc 编译 C 程序时，生成调试信息的命令行选项是：-g','-d','-debug','-h'],
		['使用 gcc 编译 C 程序时，生成所有警告信息的命令行选项是：-Wall','-Wevery','-Werror','-Wnoexpect'],
		['使用 gcc 编译 C 程序时，只编译生成目标文件的命令行选项是：-c','-o','-d','-a'],
		['使用 gcc 编译 C 程序时，指定输出文件名的命令行选项是：-o','-n','-c','-a'],
		['如果 C 程序中使用了 math.h 中的函数，在编译时需要加入选项：-lm','-lmath','-m','-math'],
		['Linux 系统中具有最高权限的用户是：root','admin','OP','friend'],
		['在 Linux 的各个虚拟控制台间切换的快捷键有：Ctrl+Alt+F1、Ctrl+Alt+F2、Ctrl+Alt+F3、Ctrl+Alt+F4、Ctrl+Alt+F5、Ctrl+Alt+F6','Ctrl+Alt+Esc','Ctrl+Alt+F7','Ctrl+Alt+F8','Ctrl+Alt+Del'],
		['在 NOI Linux 中，从字符控制台切换回桌面环境使用的快捷键是：Ctrl+Alt+F7','Ctrl+Alt+Esc','Ctrl+Alt+F1','Ctrl+C'],
		['在 NOI Linux 中默认使用的 Shell 是：bash','shell','bat','cmd'],
		['在 Linux 中查看当前系统中的进程使用的命令是：ps','ts','mg','pr'],
		['在 Linux 中查看进程的 CPU 利用率使用的命令是：ps','tr','pr','mg'],
		['如果自己的程序进入死循环，应当如何终止：Ctrl+C','Ctrl+Z','Ctrl+D','Alt+F4'],

		['可执行文件 a.out 从标准输入读取数据。现有一组输入数据保存在 1.in 中，使用这个测试数据文件测试自己的程序的命令是：./a.out <1.in','1.in | a.out','1.in | ./a.out','a.out <1.in'],
		['可执行文件 prog_1 向标准输出输出运行结果。将输出结果保存到 1.out 文件中使用的命令是：./prog_1 >1.out','./prog_1 | 1.out','prog_1 >1.out','prog_1 | 1.out'],
		[`使用 Reset 键强行重新启动计算机可能会对系统造成的后果是：文件系统损坏、膜拜${SIYUAN}存档损坏`,'中央处理器损坏','硬盘损坏'],
		['在 Linux 系统中，用于查看文件的大小的命令是：ls -l','ls -s','ls -a','ls -m'],
		[
			`当前目录中有如下文件<pre><code>-rw-r--r-- 1 user None 8.7K Jul 2 16:35 foobar
-rw-r--r-- 1 user None 93   Jul 2 16:35 foobar.c
-rwx------ 1 user None 144  Jul 2 16:35 foobar.sh
</code></pre>
	其中，可以执行的文件是：foobar.sh`,
			`foobar`,
			`foobar.c`,
			'以上文件均不能执行'
		],
		['评测系统中对程序源文件大小的限制是：小于 100KB','小于 1MB','小于 6KB','小于 5MB'],
		['如无另行说明，评测系统中对程序使用内存的限制是：以硬件资源为限','256MB','512MB','4GB'],
		['Linux 下的换行字符为：\\n','\\r','\\n\\r','\\r\\n'],
		['终止一个失去响应的进程（$pid 代表进程号）的命令是：kill $pid','killall $pid','kill -n $pid','kill -i $pid'],
		['Linux 中是否区分文件和目录名称的大小写：是','否','只区分文件','只区分目录'],
		['选手在 NOI 机试过程中是否禁止使用网络：是','否',`只有${SIYUAN}可以`,'使用前需向监考人员举手示意'],
		['为程序 my.c 创建一个备份 myc.bak 时，使用的命令是：cp my.c myc.bak','he my.c my.bak','mv -c my.bak my.c','copy my.c my.bak'],
		['调试程序的方法有：单步调试、使用 print 类语句打印中间结果、读源代码','向监考人员求助',`膜拜${SIYUAN}以寻求帮助`],
		['在考试过程中，如果出现系统死机或者崩溃现象，选手应当采取的措施是：举手示意监考人员处理','关机重启',`向${SIYUAN}祈祷`,'使用旁边的电脑'],
		['提交的答案程序中如果包含 NOI 考试明确禁止使用的代码，后果是：本题成绩以 0 分计算','本场比赛成绩以 0 分计算','受到禁赛处罚','以评测机分数为准'],
		['对评测结果有疑义，需要申请复评，则：提出书面申请；经领队、科学委员会主席签字确认后，提交至评测人员','在调整程序之后',`在膜拜${SIYUAN}之后`],
		['复评成绩较原始成绩有变化，则：以复评成绩为准','以两次最高分为准','由评测人员确定','复评成绩无效'],
		['Pascal 中 integer 和 long integer 类型的长度和编译选项是否有关系：有关系','没有关系','因人而异','只有 integer 长度和编译选项有关系'],
		['NOI 考试对 C++ 语言模板的使用有限制吗？没有','有','禁止使用 <code>bits/stdc++.h</code>','大括号不能换行'],
		['NOI 考试对 PASCAL 语言的使用有限制吗？有','没有','因人而异','视情况而定'],
		['名为 FILE 的文件和名为 File 的文件在 Linux 系统中被认为是：不同的文件','相同的文件','冲突的文件','有相同文件名的文件'],
		['目录 DIRECT 和目录 Direct 在 Linux 系统中被认为是：不同的目录','相同的目录','冲突的目录','有相同名称的目录'],
		['在 NOI 正式考试中如何登录自己的比赛用机：使用考前工作人员下发的账户及密码',`使用膜拜${SIYUAN}的账户及密码`,'使用试机时使用的账户及密码','使用考试开始时公布的账户及密码'],
		['如果考试分多日进行，那么选手的考试账户和口令：由工作人员在每场考试开始前下发','在第一场考试前统一下发','在试机时统一下发','考试开始前公示于 NOI 官网上'],
		['考试结束后，应如何处理密码条：保存好密码条，用于复测','保存好密码条，用于下一场考试','销毁密码条，避免密码泄露','保存好密码条，用于证明成绩'],
		['选手答案文件保存的目录是：选手目录下和考题名称符合的目录','选手目录下和考题编号符合的目录','根目录下和考题名称符合的目录','根目录下和考题编号符合的目录'],
		['选手答案的文件名要求是：和试卷的题目摘要中所示文件名一致','和试卷的题目摘要中题目的英文名称一致','和试卷的题目摘要中输出文件名一致','和试卷的题目摘要中的题目编号一致'],
		['选手答案的文件名大小写错误，成绩会怎样：0 分','成绩不变','取消比赛资格','需要提出书面申请；经领队、科学委员会主席签字确认后，提交至评测人员，改正文件名'],
		['选手提交的源代码文件名是否有特殊要求：源程序文件名由试题名称缩写加后缀构成，试题名称缩写及后缀一律使用小写','没有特殊要求','源程序文件名由试题名称缩写加后缀构成，试题名称缩写及后缀一律使用大写','源程序文件名由试题名称缩写加后缀构成，试题名称缩写使用大写，后缀使用小写'],
		['在 NOI 考试中，Pascal 源文件的扩展名规定为：pas','cpp','pac','pascal'],
		['在 NOI 考试中，C 源文件的扩展名规定为：c','C','cpp','ｃ'],
		['在 NOI 考试中，C++ 源文件的扩展名规定为：cpp','CPP','c++','cpq'],
		['发现鼠标或其他硬件设备有问题，选手可以：请工作人员更换','在复评时申请加分','使用自带的设备','使用旁边机器的设备'],
		['对试题理解有问题，选手可以：举手求助','将错就错',`膜拜${SIYUAN}`,'谨慎猜测'],
		['考试结束后选手需要：迅速离开','留在考场内等待复评','等待工作人员收取完毕，有序离开考场','关闭机器电源并离开'],
		['复评结束后是否还能提交复评申请：不能','能','只能在结果公布前提交','需要领队、科学委员会主席签字确认'],
		['测试点时间限制的含义是指：题目允许程序运行所占用的用户时间总和的上限值','题目允许程序运行所占用的系统时间总和的上限值','题目允许程序运行所占用的内核时间总和的上限值','题目允许程序运行所占用的计算时间总和的上限值'],
		['什么情况下选手可以申请延长考试时间：机器出现故障，并由工作人员确认和记录','选手程序出现致命错误','选手丢失密码条','选手因故障自行重启机器'],
		['考试中选手自行重新启动机器，能否获得加时？不能','能','因人而异','视情况而定'],
		['草稿纸用完了，如何处理：举手向监考人员求助','使用自带的草稿纸','直接将草稿打在桌面上',`膜拜${SIYUAN}`],
		['水喝完了，如何处理：举手向监考人员再要一瓶','到饮水机处自行灌水','渴着','从其他选手处得到水瓶'],
		[`${SIYUAN}觉得考试太简单，能提前离开吗？能`,'不能','将题目全部完成方可离场',`只有${SIYUAN}能提前离场`],
		[`${SIYUAN}离开考场后，发现有个题可以吊打标算，能回去再改吗？不能`,'能','向监考人员说明情况后可返回考场','向科学委员会提交书面申请并通过后可返回考场'],
		['考试中机器突然没响应了，如何处理？举手向监考人员求助','自行处理','视情况而定','举手向监考人员求助，并承担总成绩扣分的惩罚'],
		['考试中发现登录名和密码的单子丢了，如何处理？向工作人员求助','无法参加考试','向工作人员求助，并承担罚时惩罚','自行处理'],
		['复评的时候忘记登录名和密码了，如何处理？向工作人员求助','无法进行复评','向工作人员求助，并承担罚时惩罚','自行处理'],
		['在监考人员宣布 NOI 机试开始之前，是否允许选手登录系统和翻阅试卷？否','是','在准备工作完成后可以','视情况而定'],
		['在 NOI 上机考试中，是否允许选手私自重新启动计算机？否','是','在机器出现问题时可以','在考试开始前可以'],
		['在 NOI 系列考试中，如果由于文件名不正确导致被判 0 分，提出复评请求，会被接受吗？不会','会','因人而异','视情况而定'],
		['在 NOI 系列考试中，如果由于文件目录名不正确导致被判 0 分，提出复评请求，会被接受吗？不会','会','因人而异','视情况而定'],
		['在 NOI 系列考试中，如果由于文件保存路径不正确导致被判 0 分，提出复评请求，会被接受吗？不会','会','因人而异','视情况而定'],
		['选手可以不使用 IDE 环境编辑程序源代码吗？可以','不可以','只有高手可以','可以，但需承担总成绩扣分的惩罚'],
		['选手回答填空题，提交的答案中可以包含引号吗？不可以','可以','因人而异','视情况而定'],
		['选手程序在某测试点上的运行时间仅比时限多 0.005 秒，算不算超时？算','不算','因人而异','视情况而定'],
		['在 NOI 上机考试中，允许选手使用的编程语言包括：C、C++、Pascal','Python','Java'],
		['NOI 比赛的题目类型有：非交互式程序题、交互式程序题、答案提交题','交互式答案提交题'],
		['选手比赛中提交的有效文件类型有：答案文件、源程序','可执行文件','高级程序'],
		['选手提交的程序不得进行的操作包括：试图访问网络、使用 fork 或其它线程/进程生成函数、打开或创建题目规定的输入/输出文件之外的其它文件、运行其它程序','重定向标准输入输出','进行大量计算'],
		['以修改过的程序或答案为依据的申诉是否会被受理：否','是','因人而异','视情况而定'],
		['没有复测结果支持的申诉是否会被受理：否','是','因人而异','视情况而定'],
		['超过申诉时间的申诉是否会被受理：否','是','因人而异','视情况而定'],
		['对评测结果中的超时有异议，且复测结果的运行时间与题目时间限制之差小于题目时间限制5％的申诉是否会被受理：否','是','因人而异','视情况而定'],
		['遇到下列哪些情况可以向工作人员申请加时补偿：计算机硬件故障、操作系统死机','程序出现错误','编辑器配置错误'],
		['考试时若遇到计算机硬件故障或操作系统死机，应如何处理？举手向工作人员求助','自行处理','举手向监考人员求助，并承担比赛时间减少惩罚','举手向监考人员求助，并承担总成绩扣分的惩罚'],
		['选手进入考场可以携带的物品是：笔、手表','草稿纸','U 盘'],
		['选手进入考场不可以携带的物品是：纸、U 盘、手机','笔','手表'],
		['竞赛组织者将在竞赛场地为选手提供的物品是：草稿纸、饮用水、食品','笔'],

		['一个完整的计算机系统应包括：硬件系统、软件系统','文件系统','编译器'],
		['目前微型计算机中采用的逻辑组件是：大规模集成电路、超大规模集成电路','比特','晶体管'],
		['软件与程序的区别是：软件是程序以及开发、使用和维护所需要的所有文档的总称；程序是软件的一部分','程序是软件以及开发、使用和维护所需要的所有文档的总称','软件是程序的一部分','软件是程序的别名'],
		['IT 表示：信息技术','工业技术','电脑技术',`膜拜${SIYUAN}技术`],
		['计算机中央处理器简称为：CPU','GPU','CMP','RAM'],
		['计算机内存储器的作用是：用来存放当前 CPU 正在使用的程序和数据','管理计算机的硬件资源和软件资源','快速执行大规模并行计算','用于控制、管理和存储指令执行'],
		['用来全面管理计算机硬件和软件资源的软件叫：操作系统','Linux','文件系统','硬件系统'],
		['LAN 是指：局域网','广域网','互联网','长距网'],
		['在微机中，bit 的中文含义是：二进制位','字符','三进制位','字节'],
		['计算机所能辨认的最小信息单位是：位','字符','字节','行'],
		['ASCII 的含义是：美国信息交换标准代码','国际基础字符集二代','标准字符信息交换代码','ASC2 字符编码'],
		['在计算机术语中经常用 RAM 表示：随机存取存储器','迭代存取存储器','只读存储器','顺序存取存储器'],
		['RAM 存储器在断电后，其中的数据会变化吗？会','不会','看断电时长','视情况而定'],
		['ROM 存储器在断电后，其中的数据会变化吗？不会','会','看断电时长','视情况而定'],
		['现代计算机所应用的存储程序原理是谁提出的？冯·诺依曼','艾伦·麦席森·图灵',`${SIYUAN}`,'Gennady Korotkevich'],
		['计算机内所有的信息都是以什么形式表示的？二进制数码','文件','补码','机器语言'],
		['计算机直接识别和执行的语言是：机器语言','汇编语言','C','逻辑电路'],
		['Linux 是一个 ____ 的操作系统，意思是源码可以免费获得：开源','开放','公开','公有'],
		['NOI 的中文意思是：全国信息学奥林匹克竞赛','全国青少年信息学奥林匹克竞赛','全国青少年奥林匹克竞赛','全国信息技术奥林匹克竞赛'],
		['字长为 32bit 的计算机,表示它能作为一个整体进行传送的数据长度可为几个字节？4','1','8','32'],
		['一个字节由相邻的 ____ 个二进制位组成：8','1','32','4'],
		['二进制数 10 化为十进制数是：2','10','1010','4'],
		['与十六进制数（AB）等值的二进数是：10101011','10011010','10111100','10101001'],
		['Linux 中查看当前路径使用的命令是：pwd','ps','ls','cd'],
		['在 Linux 下建立目录使用的命令是：mkdir','touch -r','ls','cd'],
		['NOI 比赛中提供的 Pascal IDE 环境除了 GUIDE 之外，还有：Lazarus','Anjuta','GUIDE','Gedit'],
		['NOI 比赛中提供的 C++ IDE 环境除了 GUIDE 之外，还有：Anjuta','Lazarus','GUIDE','Gedit'],
		['NOI 比赛中提供的编程工具除了 GUIDE、Lazarus、Anjuta 等 IDE 环境之外，还可以使用的编程工具有：Vi 、Gedit','sublime','VSCode'],
		['NOI 比赛每场上机考试的比赛时间是 ____ 小时：5','3','4','3.5'],
		['首届 NOI 是 ____ 年举办的：1984','1983','1926','1938','2000','1993'],
		['今年是第几届 NOI？36','31','34','35','37'],
		['今年是第几届 IOI？31','30','35','36','37'],
		['第 12 届 IOI 是 ____ 年在北京举办的：2000','1984','1995','1999'],

		['以下链接中指向 OJ 的有：luogu.org；uoj.ac；loj.ac；acm.hdu.edu.cn；lydsy.com；joyoi.cn；vijos.org','github.com','lmoliver.github.io/blog','lmoliver.github.io/mosiyuan','slay.one','generals.io','agar.io','lydsy.online','orzsiyuan.com','lmoliver.github.io/jrneoj','m2oj.com','zhihu.com/?target=uoj.ac'],
		['如果使用 Kuai 排进行有序序列合并，归并排序的时间复杂度是：O(n(log n)^2)','O(n log n)','O(log n)','O((log n)^2)'],
	].map(a=>makeProblem(...a));

	const SAVE_ITEMS={
		moValue:{
			name:`膜拜次数`,
			format:`VALUE次膜拜`,
		},
		moCount:{
			name:`点击次数`,
			format:`VALUE次点击`,
		},
		advancedMoLevel:{
			name:`真诚膜拜等级`,
			format:`真诚膜拜Lv.VALUE`,
		},
		moers:{
			name:`信徒`,
			format:`VALUE位信徒`,
		},
		churchs:{
			name:`教堂`,
			format:`VALUE座教堂`,
		},
		XY:{
			name:`信仰`,
			format:`VALUE信仰`,
		},
		books:{
			name:`经书`,
			format:`VALUE本经书`,
		},
		spLevel:{
			name:`传教等级`,
			format:`传教 Lv.VALUE`,
		},
		sping:{
			name:`传教中`,
			format:`VALUE`,
		},
		spCombo:{
			name:`连续正确数`,
			format:`Combo : VALUE`,
			default:0,
		},
		spingProblem:{
			name:`正在回答的问题`,
			format:`VALUE`,
			default:{
				pid:-1,
				chooses:[],
			},
		},
		temple:{
			name:`遗迹`,
			format:`已探索VALUE个遗迹`,
		},
		hugeStone:{
			name:`巨石`,
			format:`VALUE块巨石`,
		},
		fazhen:{
			name:`法阵`,
			format:`VALUE座法阵`,
		},
		knowledgeBook:{
			name:`知识之书`,
			format:'VALUE本知识之书'
		},
		crystal:{
			name:`水晶`,
			format:`VALUE水晶`,
		},
		wisdomLevel:{
			name:`智慧`,
			format:`智慧Lv.VALUE`,
		},
		mysteryLevel:{
			name:`奥秘`,
			format:`奥秘Lv.VALUE`,
		},
		natureLevel:{
			name:`本质`,
			format:`本质Lv.VALUE`,
		},
		truthLevel:{
			name:`真理`,
			format:`真理Lv.VALUE`,
		},
		len:{
			name:`透镜`,
			format:`VALUE枚透镜`,
		},
		gem:{
			name:`宝石`,
			format:`VALUE枚宝石`,
		},
		magicStone:{
			name:`魔法石`,
			format:`VALUE枚魔法石`,
		},
		altar:{
			name:`神坛`,
			format:`VALUE座神坛`,
		},
		theology:{
			name:`神学`,
			format:`VALUE神学`,
		},
		magician:{
			name:`魔法师`,
			format:`VALUE位魔法师`,
		},
		magic:{
			name:`魔力`,
			format:`VALUE魔力`,
		},
		scientist:{
			name:`科学家`,
			format:`VALUE名科学家`,
		},
		science:{
			name:`研究`,
			format:`VALUE研究`,
		},
		truthUpgradeHistory:{
			name:`升级真理历史`,
			format:`...`,
			default:[],
		},
		truthUpgradeStage:{
			name:`升级真理阶段`,
			format:`第VALUE阶段`,
		},
		truthUpgradeAttempt:{
			name:`升级真理尝试次数`,
			format:`第VALUE次尝试`,
		},
		truthUpgradeGemNeed:{
			name:`升级真理所需宝石`,
			format:`需要VALUE宝石`,
		},
		truthUpgradeMagicStoneNeed:{
			name:`升级真理所需魔法石`,
			format:`需要VALUE魔法石`,
		},
		truthUpgradeLenNeed:{
			name:`升级真理所需透镜`,
			format:`需要VALUE透镜`,
		},
		tech:{
			name:`科技`,
			format:`...`,
			default:{},
		},
		devotion:{
			name:`虔诚感应强度`,
			format:`VALUE虔诚感应强度`,
		},
		light:{
			name:`亮度`,
			format:`VALUE亮度`,
			default:1,
		},
		elementTower:{
			name:`元素塔`,
			format:`VALUE座元素塔`,
		},
		element:{
			name:`元素`,
			format:`...`,
			default:{},
		},
		elementOwned:{
			name:`已拥有元素`,
			format:`...`,
			default:{},
		},
		lastTime:{
			name:`上次运行时间`,
			format:`<VALUE>`,
			default:Date.now(),
		},
		rngSeed:{
			name:`随机数生成器种子`,
			format:`...`,
			default:{},
		},
		defBuildings:{
			name:`阵地建筑`,
			format:`...`,
			default:[],
		},
		enemy:{
			name:`敌人`,
			format:`...`,
			default:{
				current:[],
				arr:[],
				pop:[],
			},
		},
		warMind:{
			name:`战意感应强度`,
			format:`VALUE战意感应强度`,
			default:0,
		},
		warLevel:{
			name:`战争等级`,
			format:`VALUE`,
			default:0,
		},
		enemyProgress:{
			name:`产敌进程`,
			format:`VALUE`,
			default:0,
		},
		debugging:{
			name:`调试模式标识`,
			format:`VALUE`,
			default:false,
		},
		// magicSpecialty:{
		// 	name:`魔法特产`,
		// 	format:`VALUE`,
		// 	default:Math.floor(Math.random()*4),
		// },
		version:{
			name:`版本`,
			format:`VALUE版本`,
			default:VERSION,
		},
		// adventure:{
		// 	name:`冒险`,
		// 	format:`...`,
		// 	default:false,
		// },
		magicTreeSeed:{
			name:`魔灵树树苗`,
			format:`VALUE株魔灵树树苗`,
			default:0,
		},
		magicTree:{
			name:`魔灵树`,
			format:`VALUE株魔灵树`,
			default:0,
		},
		timeIDC:{
			name:`时间感应强度`,
			format:`VALUE时间感应强度`,
			default:0,
		},
		worldSpeed:{
			name:`世界速度`,
			format:`VALUE世界速度`,
			default:1,
		},
		achievements:{
			name:`成就`,
			format:`...`,
			default:{},
		},
	};

	const TECH={
		1:{
			optics:{
				name:`光学`,
				description:`水晶的获取使光学成为最先被发展的科学学科。`,
				require:[],
				cost(lv){
					return [
						['len',(Math.pow(lv,2)+1)*50],
						['science',(Math.pow(lv,3)+1)*50],
					];
				},
			},
			focus:{
				name:`聚焦`,
				description:`用水晶打磨成镜片，利用阳光增幅信仰获取。`,
				require:[['optics',1]],
				cost(lv){
					return [['crystal',(Math.pow(lv,2)+1)*100]];
				},
			},
			magnifier:{
				name:`放大镜`,
				description:`让你的魔法师不用超凡的眼力也能弄清魔法石内部的魔力结构。`,
				require:[['optics',2]],
				cost(lv){
					return [['crystal',(Math.pow(lv,1.5)+1)*75]];
				},
			},
			glasses:{
				name:`眼镜`,
				description:`黑色的框架配上镜片，足以使老龄科学家与神学家看得更清楚。`,
				require:[['optics',3]],
				cost(lv){
					return [
						['len',Math.ceil(Math.pow(lv+1,1.5)*10)],
						['science',Math.ceil(Math.pow(lv+1,2)*1000)],
						['magic',Math.ceil(Math.pow(1.5,lv))],
					];
				}
			},
			xuanxue:{
				name:`玄学`,
				description:`经过她手里的随机事件便受她掌控，但没被她看到的呢？玄学便是为了探究这个问题而生。`,
				require:[],
				cost(lv){
					return [
						['crystal',Math.pow(lv+1,2.5)*10],
						['magicStone',Math.pow(lv+1,3)*10],
					];
				},
			},
			dunai:{
				name:`毒奶`,
				description:`通过反向毒奶可以减少实验时不该产生的误差，进而减少水晶消耗。`,
				require:[['xuanxue',3]],
				cost(lv){
					return [
						['theology',2333+(Math.pow(1.5,lv)-1)*8666],
						['magic',Math.pow(1.5,lv)*6666],
					];
				},
			},
			tidy:{
				name:`整洁`,
				description:`洗个澡，把衣服穿戴整齐，往往运气会更好！效果与真诚膜拜等级的质因数分解中 2 的数量有关。`,
				require:[['xuanxue',4]],
				cost(lv){
					return [['crystal',50*(lv+1)**2]];
				},
			},
			spell:{
				name:`法术`,
				description:`使用不了法术，还能称之为魔法吗？`,
				require:[],
				cost(lv){
					return [
						['magicStone',500*(lv+1)],
						['magic',2.5**lv *500/3],
					];
				},
			},
			spellWater:{
				name:`流水术`,
				description:`江河湖海，皆在掌控。`,
				require:[['spell',2]],
				cost(lv){
					return [['magic',Math.pow(3.5,lv)*100]];
				}
			},
			devotionInduction:{
				name:`虔诚感应`,
				description:`一束玄妙的魔力丝通向天空，让她知道你正在认真地膜拜她。`,
				require:[
					['focus',1],
					['spell',4],
				],
				cost(lv){
					return [
						['theology',Math.pow(2,lv)*1000],
						['magic',Math.pow(lv+1,3)*1000],
					];
				},
			},
		},
		2:{
			pscience:{
				name:`科普`,
				description:`用一些不科学的小东西反而能唤起孩子们对科学的好奇。`,
				require:[],
				cost(lv){
					return [
						['gem',30*Math.pow(lv+1,2.2)*Math.pow(1.2,lv/25)],
						['magic',5e5*Math.pow(lv+1,0.1)*Math.pow(1.2,lv/25)],
					];
				},
			},
			geometry:{
				name:`几何学`,
				description:`花纹与光斑启发了人们对图形的思考。`,
				require:[
					['focus',5],
					['tidy',1],
				],
				cost(lv){
					return [['science',5e4*(lv+4)**2]];
				},
			},
			hugeStoneBuilding:{
				name:`巨石`,
				description:`她是如此之巨，以至于巨石都听从她的号令！`,
				require:[['geometry',1]],
				cost(lv){
					return [
						['theology',1e6*(lv+2)**2],
						['books',1e2+lv*20],
					];
				},
			},
			spellWind:{
				name:`风语术`,
				description:`隐匿于气，交谈于风。`,
				require:[['spell',6]],
				cost(lv){
					return [['magic',Math.pow(4,lv)*100]];
				}
			},
			spellBird:{
				name:`御鸟术`,
				description:`与鸟相关？对了一半。这法术确实与麻雀相关……`,
				require:[
					['spell',8],
					['spellWind',3],
				],
				cost(lv){
					return [['magic',Math.pow(5,lv)*500]];
				}
			},
			fazhenBuilding:{
				name:`法阵`,
				description:`将施法过程描述出来，静态化，就变成了法阵。`,
				require:[
					['geometry',1],
					['spell',10],
				],
				cost(lv){
					return [
						['moers',3e2*lv],
						['magician',3+lv],
					];
				},
			},
			fireFazhen:{
				name:`烈焰阵`,
				description:`燃烧！不过好像没有什么东西该被烧掉呢。`,
				require:[
					['geometry',3],
					['fazhenBuilding',2],
				],
				cost(lv){
					return [
						['crystal',300*(lv+1)],
						['magic',Math.pow(3,lv)*4],
					];
				},
			},
			explore:{
				name:`探索`,
				description:`城镇的远处时常有微光传来，那似乎不仅仅是自然的造物……`,
				require:[
					['fireFazhen',2],
					['optics',12],
				],
				cost(lv){
					return [
						['moValue',1e17*1e2**lv],
						['len',Math.pow(4,lv)*2],
					];
				},
			},
			warMindInduction:{
				name:`战意感应`,
				description:`法阵与乌云以红色的光柱连接，让她知道人们渴望战斗。`,
				require:[
					['explore',3],
					['fireFazhen',5],
					['devotionInduction',5],
				],
				cost(lv){
					return [
						['theology',Math.pow(3,lv)*1000],
						['fazhen',lv+1],
					];
				},
			},
			windFazhen:{
				name:`疾风阵`,
				description:`强劲的风力加上成块的碎土能使敌人倒退好几步，但也会吹跑正在飞向教堂的鸽子。`,
				require:[
					['explore',3],
					['fireFazhen',5],
					['spellBird',8],
					['warMindInduction',2],
				],
				cost(lv){
					return [
						['magic',Math.pow(3,lv)*1000],
						['fazhen',lv+1],
					];
				},
			},
		},
		3:{
			antiGugu:{
				name:`驱鸽仪`,
				description:`有人曾说这将是真理 III 中的第一个研究。现在看来他说得对。`,
				require:[['windFazhen',2]],
				cost(lv){
					return [
						['hugeStone',Math.pow(2,lv)*6],
						['science',Math.pow(3,lv)*10000],
					];
				},
			},
			blessing:{
				name:`祝福术`,
				description:`来自她的祝福能让信徒们如获新生。`,
				require:[
					['antiGugu',1],
					['windFazhen',2],
					['explore',4],
				],
				cost(lv){
					return [
						['moValue',1e16*2**lv],
						['theology',50000*2**lv],
					];
				},
			},
			timeInduction:{
				name:`时间感应`,
				description:`数百双眼睛盯着法阵中幽蓝色的光芒，向她祈求永恒的瞬间。`,
				require:[
					['antiGugu',2],
					['fazhenBuilding',9],
					['glasses',40],
				],
				cost(lv){
					return [
						['worldSpeed',(1-1/(lv+2))*(1+0.2*lv)],
						['knowledgeBook',Math.floor(lv/4+0.5)],
					];
				},
			},
			magicTree:{
				name:`魔灵树`,
				description:`魔灵树的果实天生自带保护魔法，这使这些果实为敌人所觊觎。`,
				require:[
					['blessing',10],
					['fazhenBuilding',10],
				],
				cost(lv){
					return [
						['moValue',lv**lv],
						['magic',1e9*2**lv],
					];
				},
			},
			expedition:{
				name:`远征`,
				description:`<尚未实装>`,
				require:[
					['blessing',12],
					['magicTree',1],
				],
				cost(lv){
					return [
						['books',300+lv*50],
						['science',1e6*1.12**lv],
					];
				},
			},
		},
		4:{

		},
		5:{

		},
	};

	const TRUTH_UPGRADES={
		0:{
			stages:2,
			attempts:5,
			minCost:10,
			maxCost:50,
			dark:false,
			fog:false,
			gen(){
				return {
					x:Math.floor(this.random('truthUpgrade')*41+10),
					y:Math.floor(this.random('truthUpgrade')*41+10),
					z:Math.floor(this.random('truthUpgrade')*41+10),
				};
			},
			dis(x,y,z,tx,ty,tz){
				return Math.abs(x-tx)+Math.abs(y-ty)+Math.abs(z-tz);
			},
			message(res){
				return `差距:${res}`;
			},
		},
		1:{
			stages:3,
			attempts:5,
			minCost:50,
			maxCost:100,
			dark:false,
			fog:false,
			gen(){
				return {
					x:Math.floor(this.random('truthUpgrade')*51+50),
					y:Math.floor(this.random('truthUpgrade')*51+50),
					z:Math.floor(this.random('truthUpgrade')*51+50),
				};
			},
			dis(x,y,z,tx,ty,tz){
				return Math.round(Math.sqrt((x-tx)**2+(y-ty)**2+(z-tz)**2));
			},
			message(res){
				return `距离:${res}`;
			},
		},
		2:{
			stages:3,
			attempts:18,
			minCost:100,
			maxCost:160,
			gen(){
				return {
					x:Math.floor(this.random('truthUpgrade')*61+100),
					y:Math.floor(this.random('truthUpgrade')*61+100),
					z:Math.floor(this.random('truthUpgrade')*61+100),
				};
			},
			dis(x,y,z,tx,ty,tz){
				let c=0;
				if(x>tx){c++;}
				if(y>ty){c++;}
				if(z>tz){c++;}
				return c;
			},
			message(res){
				return `${res}种材料过多`;
			},
		},
		3:{
			stages:4,
			attempts:9,
			minCost:160,
			maxCost:220,
			dark:false,
			fog:false,
			gen(){
				return {
					x:Math.floor(this.random('truthUpgrade')*61+160),
					y:Math.floor(this.random('truthUpgrade')*61+160),
					z:Math.floor(this.random('truthUpgrade')*61+160),
				};
			},
			dis(x,y,z,tx,ty,tz){
				let dx=Math.abs(x-tx);
				let dy=Math.abs(y-ty);
				let dz=Math.abs(z-tz);
				return 1+(dx^dy^dz)%9;
			},
			message(res){
				return `相位:${res}`;
			},
		},
		4:{
			stages:4,
			attempts:15,
			minCost:220,
			maxCost:280,
			dark:false,
			fog:false,
			gen(){
				return {
					x:Math.floor(this.random('truthUpgrade')*61+220),
					y:Math.floor(this.random('truthUpgrade')*61+220),
					z:Math.floor(this.random('truthUpgrade')*61+220),
				};
			},
			dis(x,y,z,tx,ty,tz){
				let dx=Math.abs(x-tx);
				let dy=Math.abs(y-ty);
				let dz=Math.abs(z-tz);
				let md=Math.max(dx,dy,dz);
				let res=0;
				if(dx===md){res|=1;}
				if(dy===md){res|=2;}
				if(dz===md){res|=4;}
				return res;
			},
			message(res){
				let dd=[];
				if(res&1){dd.push('宝石');}
				if(res&2){dd.push('魔法石');}
				if(res&4){dd.push('透镜');}
				if(dd.length===3){
					return '所有差距相同';
				}else{
					return `${dd.join('、')}差距最大`;
				}
			},
		},
	};

	const ELEMENTS={
		fals:{
			name:`谬`,
			color:`pink`,
			token:`⋄`,
		},
		luan:{
			name:`乱`,
			color:`fuchsia`,
			token:`▪`,
		},
		void:{
			name:`虚`,
			color:`black`,
			token:`☉`,
		},

		water:{
			name:`水`,
			color:`lightblue`,
			token:`α`,
		},
		fire:{
			name:`火`,
			color:`orange`,
			token:`β`,
		},
		earth:{
			name:`土`,
			color:`brown`,
			token:`γ`,
		},
		wind:{
			name:`风`,
			color:`#dddd00`,
			token:`δ`,
		},

		magic:{
			name:`魔`,
			color:`purple`,
			token:`λ`,
		},

		ice:{
			name:`冰`,
			color:`skyblue`,
			token:`I`,
		},

		air:{
			name:`气`,
			color:`#ccccff`,
			token:`ε`,
		},
		rain:{
			name:`雨`,
			color:`blue`,
			token:`ζ`,
		},
		wood:{
			name:`木`,
			color:`#44dd00`,
			token:`η`,
		},
		coal:{
			name:`炭`,
			color:`#886644`,
			token:`θ`,
		},
	};

	const BASIC_ELEMENTS=['water','fire','earth','wind'];

	const ENEMY_ABBR=[
		`attack`,
		`defendx`,
		`defendy`,
		`defendz`,
		`speed`,
		`health`,
	];

	function damage(e,tp,val,st){
		e.abbr.health-=Math.min(1,st/(st+e.abbr['defend'+tp]))*val;
	}

	const DEFENSE_BUILDING={
		waterArrowTower:{
			name:`水箭塔`,
			description:['0.1魔法伤害(0.8s冷却)','0.01水元素/秒'],
			require:{
				tech:[['spellWater',3]],
				element:['water'],
			},
			runCost:[['water',0.01]],
			buildTime:20,
			cost(){
				return {
					resource:[
						['fazhen',1],
						['hugeStone',5],
					],
					element:[['water',2]],
				};
			},
			attack(e){
				damage(e,'y',0.1,0.1);
				return {
					cooldown:0.8,
				};
			},
		},
		fireTrap:{
			name:`火焰陷阱`,
			description:['0.3物理伤害/秒','0.01火元素/秒'],
			require:{
				tech:[['fireFazhen',3]],
				element:['fire'],
			},
			runCost:[['fire',0.01]],
			buildTime:30,
			cost(){
				return {
					resource:[
						['fazhen',1],
						['hugeStone',5],
					],
					element:[['fire',5]],
				};
			},
			attack(e,s){
				damage(e,'z',0.3*s,0.3);
				return {};
			},
		},
		windFazhen:{
			name:`疾风阵`,
			description:['0.15击退(1.0s冷却)','土、风元素各0.01/秒'],
			require:{
				tech:[
					['windFazhen',1],
					['spellWind',5],
				],
				element:[
					`wind`,
					`earth`,
				],
			},
			runCost:[
				['wind',0.01],
				['earth',0.01],
			],
			buildTime:40,
			cost(){
				return {
					resource:[
						['fazhen',1],
						['hugeStone',5],
					],
					element:[
						['wind',7],
						['earth',7],
					],
				};
			},
			attack(e){
				let dis=0.15;
				e.score-=dis/e.strength;
				e.pos+=dis;
				return {
					cooldown:1,
				};
			},
		},
		birdFazhen:{
			name:`咕咕阵`,
			description:['[1.0/(距离+2)]精神伤害/秒','土、风元素各0.02/秒'],
			require:{
				tech:[
					['windFazhen',1],
					['spellBird',5],
				],
				element:[
					`wind`,
					`earth`,
				],
			},
			runCost:[
				['wind',0.02],
				['earth',0.02],
			],
			buildTime:45,
			cost(){
				return {
					resource:[
						['fazhen',1],
						['hugeStone',5],
					],
					element:[['wind',15]],
				};
			},
			attack(e,s){
				let dmg=1/(2+e.pos);
				damage(e,'x',dmg*s,dmg);
				return {};
			},
		},
		pureMagicTower:{
			name:`纯魔巨炮`,
			description:['15.0魔法伤害(40~60s冷却)','水、火、土、风、魔元素各0.01/秒'],
			require:{
				tech:[['fazhenBuilding',5]],
				element:['magic'],
			},
			runCost:[
				['fire',0.01],
				['wind',0.01],
				['earth',0.01],
				['water',0.01],
				['magic',0.01],
			],
			buildTime:60,
			cost(){
				return {
					resource:[
						['magic',1e6],
						['fazhen',2],
					],
					element:[['magic',30]],
				};
			},
			attack(e){
				damage(e,'y',15,15);
				return {
					cooldown:40+Math.random()*20,
				};
			},
		},
	};

	const DB_ABBRS={
		id(){
			return 'waterArrowTower';
		},
		priorityID(){
			return 0;
		},
		cooldown(){
			return 0;
		},
		buildTime(){
			return 0;
		},
		lastCooldown(){
			return 0;
		},
	};

	const DB_PROI={
		0:{
			name:`最早出现`,
			priority:(_e,id)=>id,
		},
		1:{
			name:`血量最少`,
			priority:(e)=>-e.abbr.health,
		},
		2:{
			name:`距离最近`,
			priority:(e)=>-e.pos,
		},
		3:{
			name:`功勋最高`,
			priority:(e)=>e.score,
		},
		4:{
			name:`攻击最高`,
			priority:(e)=>e.abbr.attack,
		},
		5:{
			name:`速度最快`,
			priority:(e)=>e.abbr.speed,
		},
		6:{
			name:`意志最低`,
			priority:(e)=>-e.abbr.defendx,
		},
		7:{
			name:`符咒最低`,
			priority:(e)=>-e.abbr.defendy,
		},
		8:{
			name:`护甲最低`,
			priority:(e)=>-e.abbr.defendz,
		},
		9:{
			name:`实力最强`,
			priority:(e)=>e.strength,
		},
		100:{
			name:`不攻击`,
			priority:()=>-Infinity,
		},
	};

	const magic1=x=>Math.cos((1-x)*Math.PI)*0.5+0.5;
	const magic2=x=>magic1(magic1(x));
	const magic3=x=>magic2(magic1(x));
	const ENV_SIZE=10;
	const ADVENTURE_VIEW=4;
	// eslint-disable-next-line no-unused-vars
	const GRID_SYMBOLS={
		[undefined]:'',
		['']:'',
		1:`1`,
		2:`2`,
		3:`3`,
		4:`4`,
		wave:`~`,
	};
	const simpleTile=()=>({bg:'white',color:'white',t:''});
	const colorCap=(x)=>Math.max(0,Math.min(255,x));
	const COLOR_MODITY=25;
	const genColor=(r,g,b)=>`rgb(${colorCap(r+COLOR_MODITY*2*Math.random()-COLOR_MODITY)},${colorCap(g+COLOR_MODITY*2*Math.random()-COLOR_MODITY)},${colorCap(b+COLOR_MODITY*2*Math.random()-COLOR_MODITY)})`;
	const ENV={
		0:{
			name:`迷雾浮岛`,
			specialElement:`air`,
			civilization:{
				name:`虚空异形`,
			},
			genTile(depth){
				return Math.random()<magic3(depth)?{
					bg:genColor(128,128,128),
					color:`black`,
					t:`1`,
				}:simpleTile();
			},
		},
		1:{
			name:`暗礁海洋`,
			specialElement:`rain`,
			civilization:{
				name:`深海鱼人`,
			},
			genTile(depth){
				return Math.random()<magic3(depth)?{
					bg:genColor(0,0,255),
					color:`black`,
					t:`wave`,
				}:simpleTile();
			},
		},
		2:{
			name:`妖精森林`,
			specialElement:`wood`,
			civilization:{
				name:`圣殿精灵`,
			},
			genTile(depth){
				return Math.random()<magic3(depth)?{
					bg:genColor(0,255,0),
					color:`black`,
					t:`3`,
				}:simpleTile();
			},
		},
		3:{
			name:`烈焰山脉`,
			specialElement:`coal`,
			civilization:{
				name:`星火人族`,
			},
			genTile(depth){
				return Math.random()<magic3(depth)?{
					bg:genColor(255,255,0),
					color:`black`,
					t:`4`,
				}:simpleTile();
			},
		},
	};

	const ACHIEVEMENTS={
		firstMo:{
			name:`初次膜拜`,
			description:`欢迎来到膜拜${SIYUAN}！`,
			got:(game)=>game.moCount>0,
			price:{
				autoClick:0.1,
			},
		},
		busyWork:{
			name:`事务繁忙`,
			description:`拥有 5 座教堂`,
			got:(game)=>game.churchs>=5,
		},
		tinyWork:{
			name:`微小的贡献`,
			description:`积累 100 信仰`,
			got:(game)=>game.XY>=100,
		},
		doubleOverflow:{
			name:`爆 double 啦`,
			description:`信徒花费 == <code>Infinity</code>`,
			got:(game)=>game.moerCost===Infinity,
		},
		sp3:{
			name:`稳定发挥`,
			description:`达到传教 III`,
			got:(game)=>game.spLevel>=3,
		},
	};

	const PRICES={
		autoClick:{
			name:'自动点击',
			format:'VALUE点击/秒',
			reduce:(a,b)=>a+b,
			init:0,
		},
	};

	function truthAbbrDescription(lv){
		const abbrList=[
			`dark`,
			`fog`,
			`gugu`,
		].filter(s=>TRUTH_UPGRADES[lv][s]);
		if(abbrList.length===0){return '';}
		return '('+abbrList.map(x=>({
			dark:`<span title="真理隐于黑暗，逃避着前来的探索者。" class="help">黑暗</span>`,
			fog:`<span title="透过迷雾，真理的影子显得模糊。" class="help">迷雾</span>`,
			gugu:`<span title="鸽子的羽毛落在实验器材上，使实验无法进行。}" class="help">鸽羽</span>`,
		}[x])).join(', ')+')';
	}

	function hasUpgrade(lv){
		return lv in TRUTH_UPGRADES;
	}

	const PADDING='WW91JTIwYXJlJTIwdG9vJTIweWF1bmclMjB0b28lMjBzaW1wbGUldUZGMENzb21ldGltZXMlMjBuYWl2ZS4lMEE=';
	function initData(data){
		if(data.debugging){
			throw new Error('debugger detected!');
		}
	
		for(let resName in SAVE_ITEMS){
			let dd=data[resName];
			if(typeof dd==='undefined'||typeof dd==='number'&&Math.abs(dd)>1e100){
				if(typeof SAVE_ITEMS[resName].default!=='undefined'){
					data[resName]=SAVE_ITEMS[resName].default;
				}else{
					data[resName]=0;
				}
			}
		}

		data.PADDING=PADDING;
		if(hasUpgrade(data.truthLevel)){
			data.gemChosen=TRUTH_UPGRADES[data.truthLevel].minCost;
			data.magicStoneChosen=TRUTH_UPGRADES[data.truthLevel].minCost;
			data.lenChosen=TRUTH_UPGRADES[data.truthLevel].minCost;
		}else{
			data.gemChosen=0;
			data.magicStoneChosen=0;
			data.lenChosen=0;
		}
		for(let lv in TECH){
			let lvv=TECH[lv];
			for(let id in lvv){
				if(typeof data.tech[id]==='undefined'){
					data.tech[id]=0;
				}
			}
		}

		for(let el in ELEMENTS){
			if(!isFinite(data.element[el])){
				data.element[el]=0;
			}
		}

		data.truthUpgradeResult='';
		data.truthUpgradeMessage='';
		data.truthUpgradeMessageUpdate=(new Date()).getTime();
		data.dailyMessage=DAILY_MESSAGES[Math.floor(Math.random()*DAILY_MESSAGES.length)];

		data.showEnemyArr=false;

		data.selectedTruthLevel={};

		for(let db of data.defBuildings){
			for(let a in DB_ABBRS){
				if(typeof db[a]==='undefined'){db[a]=DB_ABBRS[a](db.id);}
			}
		}

		data.saveInput='';
	
		if(!('version' in data)||data.version<VERSION){
			data.showUpdate=true;
		}
		else{
			data.showUpdate=false;
		}

		data.spMessage='';
		data.spMessageUpdate=Date.now();

		data.timeShockHint='';
		data.timeShockHintUpdate=Date.now();

		data.popMessages=[];

		data.version=VERSION;

		data.DAILY_MESSAGES=DAILY_MESSAGES;
		data.TRUTH_UPGRADES=TRUTH_UPGRADES;
		data.ELEMENTS=ELEMENTS;
		data.DEFENSE_BUILDING=DEFENSE_BUILDING;
		data.SAVE_ITEMS=SAVE_ITEMS;
		data.DB_PROI=DB_PROI;
		data.VERSION=VERSION;
		data.VERSION_NAME=VERSION_NAME;
		data.VERSION_MESSAGE=VERSION_MESSAGE;
		data.ENEMY_ABBR=ENEMY_ABBR;
		data.BASIC_ELEMENTS=BASIC_ELEMENTS;
		data.languages=window.languages;
		data.getLangName=window.getLangName;
		data.setLanguage=window.setLanguage;
		data.TECH=TECH;
		data.SP_PROBLEMS=SP_PROBLEMS;
		data.ACHIEVEMENTS=ACHIEVEMENTS;
		data.SIYUAN=SIYUAN;
	}
	/* global Vue */
	Vue.component('hint-message',{
		props:['value','update'],
		template:`<span class="message" :style="{opacity:op}" v-if="op>0" v-html="value.replace(/</g,\'&lt;\')"></span>`,
		watch:{
			update(){
				if(this.value){
					this.sec=0;
				}
			},
		},
		computed:{
			op(){
				return Math.max(0,Math.min(1,3-this.sec/5));
			},
		},
		data(){
			return {
				sec:Infinity,
			};
		},
		mounted(){
			setInterval(()=>{
				this.sec+=0.1;
			},100);
		},
	});

	Vue.component('m-doc',{
		props:['title','value','need'],
		template:`
			<div class="m-doc">
				<div v-if="value>=need">
					<h4 v-html="title"></h4>
					<slot></slot>
				</div>
				<div v-else-if="value>=need/10">
					<h4 v-html="title"></h4>
					<progress :max="need" :value="value" class="ww"></progress>
					{{\`\${pn(value)}/\${pn(need)} 次点击\`}}
				</div>
			</div>
		`,
		methods:{
			pn,
		},
	});

	Vue.component('model-alert',{
		props:['title','value','update'],
		template:`
			<div class="model-alert" v-if="showing">
				<div class="model-alert-shader" @click="()=>this.showing=false"></div>
				<div class="model-alert-inner">
					<strong v-html="title"></strong>
					<p v-for="v in value.split('\\n')" v-html="v"></p>
				</div>
			</div>
		`,
		data(){
			return {
				showing:true,
			};
		},
	});

	!function(){
		new Vue({
			el:`#app`,
			template:window.GAME_UI,
			watch:{
				light(v){
					this.setLight(v);
				},
			},
			methods:{
				pn,
				pnr,
				hasUpgrade,
				truthAbbrDescription,
				setLight(v){
					let x=Math.pow(v,1.5);
					document.getElementById('global')
						.style.backgroundColor
					=`rgba(0,0,0,${1-x})`;
				},
				moSiyuan(r=1){
					this.moCount+=r;
					this.moValue+=r*this.moDelta;
				},
				buyAdvancedMo(){
					this.moValue-=this.advancedMoCost;
					this.advancedMoLevel+=1;
				},
				buyMoer(){
					if(!this.canBuyMoer){return;}
					this.moValue-=this.moerCost;
					this.moers+=1+7*Math.min(this.tech.spell,5);
				},
				buyChurch(){
					if(!this.canBuyChurch){return;}
					this.moers-=this.churchCost;
					this.churchs+=1;
				},
				buyChurchMax(){
					while(this.canBuyChurch||this.canBuyMoer){
						while(this.canBuyChurch){
							this.buyChurch();
						}
						while(this.canBuyMoer&&!this.canBuyChurch){
							this.buyMoer();
						}
					}
				},
				buyXY(){
					this.XY+=this.XYEarn;
					this.moValue=0;
				},
				buyBook(){
					this.XY-=this.bookCost;
					this.books+=1;
				},
				PCtoString(pid,choose){
					return SP_PROBLEMS[pid][choose.ac?1:2][choose.id];
				},
				spAns(index){
					let {pid,chooses}=this.spingProblem;
					let choose=chooses[index];
					if(choose.ac){
						choose.selected=true;
						if(chooses.every(c=>!c.ac||c.selected)){
							this.spCombo+=1;
							if(this.spCombo>=this.spNeed){
								this.spCombo=0;
								this.sping=false;
								this.spLevel+=1;
								this.spMessage='传教成功！';
								this.spingProblem=[];
								this.spMessageUpdate=Date.now();
							}
							else{
								this.spMessage=`还有${this.spNeed-this.spCombo}个问题`;
								this.sp();
							}
						}
					}
					else{
						this.spCombo=0;
						this.sping=false;
						this.spMessage='传教失败！';
						this.spingProblem=[];
						let acs=chooses.filter(c=>c.ac).map(c=>this.PCtoString(pid,c));
						this.spMessage=`传教失败，正确答案是${acs.map(x=>`<strong>${x}</strong>`).join('、')}。`;
					}
					this.spMessageUpdate=Date.now();
				},
				sp(){
					if(!this.sping){
						this.books-=this.spCost;
						this.sping=true;
						this.spMessage=`人们想要你回答${this.spNeed}个问题`;
						this.spMessageUpdate=Date.now();
					}
					let pid;
					do{
						pid=Math.floor(this.random('sp')*SP_PROBLEMS.length);
						if(SP_PROBLEMS.length===1){break;}
					}while(pid===this.spingProblem.pid);
					let problem=SP_PROBLEMS[pid];
					let chooses=[
						...problem[1].map((_,i)=>({ac:true,id:i})),
						...problem[2].map((_,i)=>({ac:false,id:i})),
					];
					chooses.sort((a,b)=>{
						let x=this.PCtoString(pid,a);
						let y=this.PCtoString(pid,b);
						let s=Math.random()<0.02?-1:1;
						if(x<y){return -s;}
						else if(x>y){return s;}
						else {return 0;}
					});
					this.spingProblem={pid,chooses};
				},
				exploreTemple(){
					this.XY-=this.exploreTempleCost;
					this.temple+=1;
				},
				pray(){
					if(!this.canPray){return;}
					this.moValue-=this.prayCost;
					this.crystal+=1+7*Math.min(this.tech.optics,5);
				},
				wisdomUpgrade(){
					if(!this.canUpgradeWisdom){return;}
					this.crystal-=this.wisdomUpgradeCost;
					this.wisdomLevel+=1;
				},
				mysteryUpgrade(){
					if(!this.canUpgradeMystery){return;}
					this.crystal-=this.mysteryUpgradeCost;
					this.mysteryLevel+=1;
				},
				natureUpgrade(){
					if(!this.canUpgradeNature){return;}
					this.crystal-=this.natureUpgradeCost;
					this.natureLevel+=1;
				},
				wisdomUpgradeMax(){
					while(this.canPray||this.canUpgradeWisdom){
						while(this.canUpgradeWisdom){
							this.wisdomUpgrade();
						}
						while(this.canPray&&!this.canUpgradeWisdom){
							this.pray();
						}
					}
				},
				mysteryUpgradeMax(){
					while(this.canPray||this.canUpgradeMystery){
						while(this.canUpgradeMystery){
							this.mysteryUpgrade();
						}
						while(this.canPray&&!this.canUpgradeMystery){
							this.pray();
						}
					}
				},
				natureUpgradeMax(){
					while(this.canPray||this.canUpgradeNature){
						while(this.canUpgradeNature){
							this.natureUpgrade();
						}
						while(this.canPray&&!this.canUpgradeNature){
							this.pray();
						}
					}
				},

				makeLen(){
					this.len+=this.makeLenEarn;
					this.crystal=0;
				},
				makeGem(){
					this.gem+=this.makeGemEarn;
					this.crystal=0;
				},
				makeMagicStone(){
					this.magicStone+=this.makeMagicStoneEarn;
					this.crystal=0;
				},
				buyAltar(){
					this.gem-=this.altarCost;
					this.altar+=1;
				},
				buyMagician(){
					this.magicStone-=this.magicianCost;
					this.magician+=1;
				},
				buyScientist(){
					this.len-=this.scientistCost;
					this.scientist+=1;
				},

				genTruthUpgradeNeed(){
					let s=TRUTH_UPGRADES[this.truthLevel].gen.call(this);
					this.truthUpgradeGemNeed=s.x;
					this.truthUpgradeMagicStoneNeed=s.y;
					this.truthUpgradeLenNeed=s.z;
				},
				truthUpgrade(){
					if(!this.canUpgradeTruth){
						return;
					}

					this.gem-=this.gemChosen;
					this.magicStone-=this.magicStoneChosen;
					this.len-=this.lenChosen;
					this.crystal-=this.truthUpgradeCrystalCost;
					this.theology-=this.truthUpgradeTheologyCost;
					this.magic-=this.truthUpgradeMagicCost;
					this.science-=this.truthUpgradeScienceCost;

					let tu=TRUTH_UPGRADES[this.truthLevel];

					if(this.truthUpgradeAttempt===0){
						this.genTruthUpgradeNeed();
					}
					this.truthUpgradeAttempt++;

					let res=tu.dis(
						this.gemChosen,
						this.magicStoneChosen,
						this.lenChosen,
						this.truthUpgradeGemNeed,
						this.truthUpgradeMagicStoneNeed,
						this.truthUpgradeLenNeed
					);
					this.truthUpgradeHistory.push({
						x:this.gemChosen,
						y:this.magicStoneChosen,
						z:this.lenChosen,
						r:res,
					});

					if(this.gemChosen===this.truthUpgradeGemNeed
					&&this.magicStoneChosen===this.truthUpgradeMagicStoneNeed
					&&this.lenChosen===this.truthUpgradeLenNeed){

						this.truthUpgradeStage++;
						if(this.truthUpgradeStage>=tu.stages){
							this.truthLevel++;
							this.resetTruthUpgrade();
							this.truthUpgradeResult='实验成功';
							this.truthUpgradeMessage='发现新的真理！';
						}else{
							this.resetStage();
							this.truthUpgradeResult='实验成功';
							this.truthUpgradeMessage='离真理更进一步';
						}
					}else{
						this.truthUpgradeResult='实验失败';
						this.truthUpgradeMessage=tu.message(res);
					}
					this.updateTruthUpgradeMessage();
				},
				resetStage(){
					this.truthUpgradeAttempt=0;
					this.truthUpgradeResult='';
					this.truthUpgradeMessage='';
					this.truthUpgradeHistory=[];
					this.gemChosen
				=this.magicStoneChosen
				=this.lenChosen
				=TRUTH_UPGRADES[this.truthLevel].minCost;
					this.updateTruthUpgradeMessage();
				},
				resetTruthUpgrade(){
					this.truthUpgradeStage=0;
					this.resetStage();
				},
				updateTruthUpgradeMessage(){
					this.truthUpgradeMessageUpdate=(new Date()).getTime();
				},
				techLevel(id){
					return Number(this.tech[id]|0);
				},
				canBuyTech(lv,id){
					return TECH[lv][id].cost(this.techLevel(id)).every(([item,value])=>this[item]>=value);
				},
				buyTech(lv,id){
					if(this.canBuyTech(lv,id)){
						TECH[lv][id].cost(this.techLevel(id)).forEach(([item,value]) => {
							this[item]-=value;
						});
						this.tech[id]=this.techLevel(id)+1;
					}
				},
				getDevotion(){
					this.devotion+=Math.pow(this.tech.devotionInduction,2);
				},
				buyHugeStone(){
					if(!this.canBuyHugeStone){return;}
					this.XY-=this.hugeStoneCost;
					this.hugeStone+=1;
				},
				buyFazhen(){
					if(!this.canBuyFazhen){return;}
					this.hugeStone-=this.fazhenCost;
					this.fazhen+=1;
				},
				buyKB(){
					if(!this.canBuyKB){return;}
					this.fazhen-=this.KBCost;
					this.knowledgeBook+=1;
				},
				buyElementTower(){
					if(!this.canBuyElementTower){return;}
					this.hugeStone-=this.elementTowerHugeStoneCost;
					this.fazhen-=this.elementTowerFazhenCost;
					this.len-=this.elementTowerLenCost;
					this.elementTower+=1;
				},
				saveImport(){
					try{
						let data=decode.call({
							PADDING,
						},this.saveInput.trim());
						for(let name in SAVE_ITEMS){
							this.$set(this,name,data[name]);
						}
						initData.call(this,this);
						this.saveInput='导入成功！';
						this.solvePTL();
					}catch(e){
						this.saveInput='导入失败！';
					}
				},
				saveExport(){
					if(this.debugging){
						this.saveInput='在调试模式下无法导出存档。';
						return;
					}
					let save={};
					for(let name in SAVE_ITEMS){
						save[name]=this[name];
					}
					this.saveInput=encode.call(this,save);
				},
				random(name){
					if(typeof this.rngSeed[name]==='undefined'){
						this.rngSeed[name]=Date.now()%233280;
					}
					this.rngSeed[name]=(this.rngSeed[name]*9301+49297)%233280;
					return this.rngSeed[name]/233280;
				},

				genEnemyDNA(...parentsDNA){
					let dna={};
					for(let abbr of ENEMY_ABBR){
						let value=Math.random();
						let weight=-1;
						for(let e of parentsDNA){
							let r=Math.random();
							if(r>weight){
								value=e[abbr];
								weight=r;
							}
						}
						dna[abbr]=value;
					}
					let TBWeight=Math.random()<1?1:0.1;
					let TBAbbr;
					let weight=-1;
					for(let abbr in dna){
						let r=Math.random();
						if(r>weight){
							TBAbbr=abbr;
							weight=r;
						}
					}
					dna[TBAbbr]*=Math.pow(1+TBWeight,2*Math.random()-1);
					return dna;
				},
				getEnemyAbbr(dna,strength){
					let r=strength/Math.sqrt(ENEMY_ABBR.map(a=>Math.pow(dna[a],2)).reduce((a,b)=>a+b,0));
					if(!isFinite(r)){r=1e10;}
					let res={};
					for(let abbr of ENEMY_ABBR){
						res[abbr]=dna[abbr]*r;
					}
					return res;
				},
				takePop(f=Math.min){
					let p=this.enemy.pop;
					let x=f(...p.map(x=>x.score));
					for(let i=0;i<p.length;i++){
						if(p[i].score===x){
							return p.splice(i,1)[0].dna;
						}
					}
				},
				fillArr(){
					let e=this.enemy;
					while(e.arr.length<5&&e.pop.length){
						e.arr.push(this.takePop(Math.max));
					}
					while(e.arr.length<5){
						e.arr.push(this.genEnemyDNA());
					}
				},
				enemyDNAback(dna,score){
					let e=this.enemy;
					e.pop.push({dna,score},{dna,score});
					this.fillArr();
					while(e.pop.length>50){
						this.takePop(Math.min);
					}
				},
				getName(dna){
					let {attack,defendx,defendy,defendz,speed,health}
					=this.getEnemyAbbr(dna,1);

					const ABBR_LOW=0.1;
					const ABBR_MID=0.18;
					const ABBR_HIGH=0.6;

					let strs=[];

					if(health>ABBR_HIGH){strs.push('巨');}
					else if(attack>ABBR_HIGH){strs.push('血');}
					else if(speed>ABBR_HIGH){strs.push('灵');}

					if(attack*speed*health>ABBR_LOW){strs.push('烈焰');}
					else if(defendx*defendy*defendz>ABBR_LOW){strs.push('寒冰');}

					else if(defendx>ABBR_HIGH){strs.push('妖');}
					else if(defendy>ABBR_HIGH){strs.push('魔');}
					else if(defendz>ABBR_HIGH){strs.push('金');}

					if(attack*defendz>ABBR_MID){strs.push('雄狮');}
					else if(speed*defendx>ABBR_MID){strs.push('恶狼');}
					else if(health*defendy>ABBR_MID){strs.push('青蛙');}
					else {strs.push('白狐');}

					return strs.map((s,i)=>Number(i)===0?s:s.substr(1)).join('');
				},
				spawnEnemy(strength){
					let e=this.enemy;
					this.fillArr();
					if(e.arr.length===0){
						e.arr.push(this.genEnemyDNA());
					}
					let dnas=[e.arr.shift()];
					for(let i=0;i<e.arr.length&&Math.random()<0.3;i++){
						dnas.push(e.arr[i]);
					}
					let dna=this.genEnemyDNA(...dnas);
					let abbr=this.getEnemyAbbr(dna,strength);
					e.current.push({
						strength,
						dna,
						abbr:abbr,
						pos:10,
						score:0,
						focus:false,
					});
					this.fillArr();
				},
				passTimeLoop(s){
					for(let id of BASIC_ELEMENTS){
						this.element[id]+=s*this.basicElementEarn;
					}
					for(let id in ELEMENTS){
						if(this.element[id]>0){
							this.elementOwned[id]=true;
						}
					}
					this.light=Math.min(1,this.light+s/3600*this.basicElementEarn);
				},
				solvePTL(){
					let nt=Date.now();
					this.passTimeLoop((nt-this.lastTime)/1000);
					this.lastTime=nt;
				},
				showDB(id){
					let {tech,element}=DEFENSE_BUILDING[id].require;
					return tech.every(([id,value])=>this.tech[id]>=value)
					&& element.every((id)=>this.elementOwned[id]);
				},
				canBuildDB(id){
					if(this.defBuildings.length>=this.position){return false;}
					let {resource,element}=DEFENSE_BUILDING[id].cost();
					return element.every(([id,value])=>this.element[id]>=value)
					&& resource.every(([id,value])=>this[id]>=value);
				},
				buildDB(id){
					let {resource,element}=DEFENSE_BUILDING[id].cost();
					if(!this.canBuildDB(id)){return;}
					element.forEach(([id,value])=>{this.element[id]-=value;});
					resource.forEach(([id,value])=>{this[id]-=value;});
					this.defBuildings.push({
						id,
						cooldown:0,
						priorityID:0,
						buildTime:DEFENSE_BUILDING[id].buildTime,
					});
				},
				getWarMind(){
					this.warMind+=Math.pow(this.tech.warMindInduction,2)*10;
				},
				salvation(){
					this.warMind=0;
					this.warLevel=0;
					this.enemy.current=[];
					this.light-=0.2;
				},
				regenMap(){
					const genLine=(depth)=>{
						depth/=ENV_SIZE;
						return new Array(ADVENTURE_VIEW*2+1).fill(depth).map(ENV[this.magicSpecialty].genTile);
					};
					if(this.adventure.map===null){
						this.adventure.map=(new Array(ADVENTURE_VIEW*4+1)).fill(0).map((_,index)=>genLine(ADVENTURE_VIEW*2-index));
					}
					while(this.adventure.mapDepth<this.adventure.depth){
						this.adventure.map.unshift(genLine(this.adventure.mapDepth+ADVENTURE_VIEW*2+1));
						this.adventure.map.pop();
						this.adventure.mapDepth++;
					}
					while(this.adventure.mapDepth>this.adventure.depth){
						this.adventure.map.push(genLine(this.adventure.mapDepth-ADVENTURE_VIEW*2-1));
						this.adventure.map.shift();
						this.adventure.mapDepth--;
					}
				},
				shiftMap(){
					this.adventure.map.forEach((line,index)=>{
						line.shift();
						line.push(ENV[this.magicSpecialty].genTile((this.adventure.mapDepth+ADVENTURE_VIEW*2-index)/ENV_SIZE));
					});
				},
				startAdventure(){
					this.adventure={
						player:{
							health:this.adventurerInitHealth,
						},
						map:null,
						depth:0,
						mapDepth:0,
					};
					this.regenMap();
				},
				adventureMove(arg){
					this.adventure.depth+=arg;
					this.regenMap();
					this.shiftMap();
				},
				endAdventure(){
					this.adventure=false;
				},
				buyMagicTreeSeed(){
					if(this.canBuyMagicTreeSeed){
						this.element.magic-=this.magicTreeSeedCost;
						this.magicTreeSeed+=1;
					}
				},
				getTimeIDC(){
					this.timeIDC+=this.tech.timeInduction*2;
				},
				calcTimeUnstablity(){
					let now=new Date();
					if(now.getDate()%10!==now.getMonth()%9){return 1;}
					return Math.pow(2+Math.abs(now.getMinutes()-30)/15,1.2);
				},
				gameTick(s){
					s*=Math.max(1e-3,this.worldSpeed);

					this.moSiyuan(s*this.bookEffect);
				
					this.theology+=s*this.theologyPerSec;
					let msc=Math.min(this.magicStone,s*this.magicCostPerSec);
					this.magicStone-=msc;
					this.magic+=msc*this.magicRate;
					let sci=this.science;
					sci+=s*this.sciencePerSec;
					sci=Math.min(sci,this.scienceLimit);
					this.science=sci;

					let dd=Math.min(this.devotion,s*Math.max(this.devotion*0.001*Math.max(1,Math.sqrt(this.devotionInductionFactor)),2));
					this.devotion-=dd;

					let wd=Math.min(this.warMind,s*Math.max(this.warMind*0.01,1));
					this.warMind-=wd;

					if(this.warMind<=0){
						this.warMind=0;
					}
					if(this.warMind>=this.warLevelUpgradeNeed){
						this.warLevel+=0.05*s;
					}
					else if(this.warMind<this.warLevelUpgradeNeed/2){
						let wl=Math.max(this.warLevel-0.2*s,0);
						this.warLevel=wl;
					}

					if(this.warLevel!==0){
						let tt=Math.max(this.warLevel,1);
						this.enemyProgress+=wd/(50*Math.sqrt(tt));
						while(this.enemyProgress>=1){
							this.enemyProgress-=1;
							this.spawnEnemy(tt);
						}
					}

					let td=Math.min(this.timeIDC,s*Math.max(this.timeIDC*0.01,0.1)*this.calcTimeUnstablity());
					this.timeIDC-=td;

					this.worldSpeed+=td/1500;
					if(this.worldSpeed>this.worldSpeedLimit){
						let shock=Math.min(Math.max(0.1,this.worldSpeedLimit*Math.random()*0.3)*this.calcTimeUnstablity(),this.worldSpeed-(Math.random()*0.1+0.1));
						this.worldSpeed-=shock;
						this.timeShockHint=pn(-shock);
						this.timeShockHintUpdate=Date.now();
					}

					if(this.timeIDC<=0&&this.worldSpeed>1){
						this.worldSpeed=Math.max(1,this.worldSpeed-s*0.0015*this.calcTimeUnstablity());
					}

					this.passTimeLoop(s);

					let cur=this.enemy.current;

					for(let db of this.defBuildings){
						let t=db.buildTime-s;
						db.buildTime=Math.max(t,0);
					}
				
					// DB target
					for(let db of this.defBuildings){
						delete db.targetID;
						if(db.buildTime>0){continue;}
						let v=-Infinity;
						for(let i in this.enemy.current){
							let e=this.enemy.current[i];
							let sv=DB_PROI[db.priorityID].priority(e,s);
							if(!isNaN(sv)&&sv!==-Infinity){
								if(e.focus){sv+=Infinity;}
								if(sv>v){
									db.targetID=i;
									v=sv;
								}
							}
						}
					}

					// DB action
					for(let db of this.defBuildings){
						if(db.buildTime>0){continue;}
						if(db.cooldown||typeof db.targetID!=='undefined'){
							let el=DEFENSE_BUILDING[db.id].runCost;
							if(el.some(([id,value])=>
								this.element[id]<Math.max(value*s,1)
							)){
								continue;
							}else{
								el.forEach(([id,value])=>{
									this.element[id]-=value*s;
								});
							}
						}
						let cd=db.cooldown-s;
						if(typeof db.targetID!=='undefined'){
							while(cd<=0){
								let e=this.enemy.current[db.targetID];
								let res=DEFENSE_BUILDING[db.id].attack(e,s);
								if(res.cooldown){
									cd+=res.cooldown;
									db.lastCooldown=res.cooldown;
								}else{
									break;
								}
							}
						}
						db.cooldown=Math.max(cd,0);
					}

					// enemy action
					for(let e of this.enemy.current.filter(e=>e.abbr.health>0)){
						if(!isFinite(e.score)){e.score=0;}
						let time=s;
						let newPos=e.pos-e.abbr.speed*time;
						newPos=Math.max(newPos,0);
						let dis=e.pos-newPos;
						time-=dis/e.abbr.speed;
						e.score+=dis/e.strength;
						e.pos=newPos;
						if(e.pos<=0){
							let dmg=e.abbr.attack*time;
							this.light-=dmg/1e4;
							if(this.light<0){this.light=0;}
							e.score+=3*dmg/e.strength;
						}
					}

					// kill dead enemies
					for(let db of this.defBuildings){
						if(typeof db.targetID!=='undefined'&&(cur[db.targetID].abbr===undefined||cur[db.targetID].abbr.health<=0)){
							delete db.targetID;
						}
					}

					while(cur.some(e=>e.abbr.health<=0)){
						let e=cur.splice(cur.findIndex(e=>e.abbr.health<=0),1)[0];
						this.enemyDNAback(e.dna,e.score);
						this.element.magic+=e.strength;
					}
				},
				gainAch(ach){
					if(!this.achievements[ach]){
						this.popMessages.push(`获得新成就：<strong>${ACHIEVEMENTS[ach].name}</strong>！`);
						this.achievements[ach]=true;
					}
				},
				processAchs(){
					for(let ach in ACHIEVEMENTS){
						if(!this.achievements[ach]){
							let got=ACHIEVEMENTS[ach].got;
							if(typeof got==='function'){
								if(got(this)){
									this.gainAch(ach);
								}
							}
						}
					}
				},
			},
			computed:{
				moDelta(){
					return Math.ceil((1+this.advancedMoLevel)*(1+this.moers)*(1+this.wisdomLevel)*this.devotionInductionFactor);
				},

				canBuyAdvancedMo(){
					return this.moValue>=this.advancedMoCost;
				},
				advancedMoCost(){
					return Math.floor(10*Math.pow(1+0.2/(this.churchs+1)+0.1/Math.sqrt(this.mysteryLevel+1),this.advancedMoLevel));
				},

				canBuyMoer(){
					return this.moValue>=this.moerCost;
				},
				moerCost(){
					return Math.ceil(
						Math.max(
							100
							*Math.pow(
								1.6,
								this.moers
								/((1+this.spLevel*0.15)*this.tidyEffectFactor)
							)
							*Math.pow(
								1e3/(1e3+this.XY*(1+this.natureLevel)),
								2.5
							),
							Math.pow(this.moers,2)
						)
					);
				},

				canBuyChurch(){
					return this.moers>=this.churchCost;
				},
				churchCost(){
					return Math.ceil(5+Math.pow(this.churchs,1.1+0.1/(1+this.hugeStoneEffectFactor)));
				},

				XYEarn(){
					return this.moValue/2000*this.churchs*(1+this.wisdomLevel)*(1+this.tech.focus/4);
				},

				spCost(){
					return Math.ceil(Math.pow(1.6,this.spLevel)*10);
				},
				spNeed(){
					return this.spLevel*3+5;
				},

				canBuyBook(){
					return this.XY>=this.bookCost;
				},
				bookCost(){
					return 100*Math.pow(1.15,this.books/(1+this.knowledgeBook/2));
				},
				bookEffect(){
					return Math.min(this.moCount/1000,1)+Math.floor(this.books*1.2*Math.pow(1+this.mysteryLevel,1.5));
				},

				exploreNeed(){
					return 100+this.temple*10;
				},
				exploreTempleCost(){
					return Math.pow(2,Math.pow(1.8,this.temple))*5e6;
				},

				canPray(){
					return this.moValue>=this.prayCost;
				},
				prayCost(){
					return Math.pow(1.6,this.crystal/this.temple/(1+this.truthLevel))*1e10/Math.pow(this.XY,1/3);
				},
				canUpgradeWisdom(){
					return this.crystal>=this.wisdomUpgradeCost;
				},
				wisdomUpgradeCost(){
					return Math.ceil(Math.pow(this.wisdomLevel/(1+this.truthLevel)+1.5,2)/(1+this.altar/3));
				},
				canUpgradeMystery(){
					return this.crystal>=this.mysteryUpgradeCost;
				},
				mysteryUpgradeCost(){
					return Math.ceil(Math.pow(this.mysteryLevel/(1+this.truthLevel)+4.5,3)/this.wisdomLevel/(1+this.magician/3));
				},
				canUpgradeNature(){
					return this.crystal>=this.natureUpgradeCost;
				},
				natureUpgradeCost(){
					return Math.ceil(Math.pow(this.natureLevel/(1+this.truthLevel)+4.5,3)/this.mysteryLevel/(1+this.scientist/3));
				},

				makeGemEarn(){
					return Math.max(0,Math.floor(this.crystal/3*(this.wisdomLevel/6)-this.gem*0.6));
				},
				makeMagicStoneEarn(){
					return Math.max(0,Math.floor(this.crystal/3*(this.mysteryLevel/6)-this.magicStone*0.6));
				},
				makeLenEarn(){
					return Math.max(0,Math.floor(this.crystal/3*(this.natureLevel/6)-this.len*0.6));
				},

				altarCost(){
					return 16*Math.pow(1.5,this.altar);
				},
				theologyPerSec(){
					return Math.max(0,Math.sqrt(this.moDelta*this.gem)-(1+this.theology)/this.altar)/1e4*(1+this.tech.glasses);
				},
				magicianCost(){
					return 16*Math.pow(1.5,this.magician);
				},
				magicCostPerSec(){
					return Math.max(0.01,this.magicStone/5e2)*Math.sqrt(this.magician)/this.fazhenEffectFactor;
				},
				magicRate(){
					return 5*this.magician*(1+this.tech.magnifier/4)*this.fazhenEffectFactor;
				},
				scientistCost(){
					return 16*Math.pow(1.5,this.scientist);
				},
				sciencePerSec(){
					return Math.max(0,Math.sqrt(this.len*this.scientist)/2)*Math.sqrt(1+this.tech.glasses)*(1+Math.sqrt(this.tech.pscience)/4);
				},
				scienceLimit(){
					return 50*Math.pow(this.scientist,2)*(1+this.tech.glasses)*(1+Math.sqrt(this.tech.pscience)/4);
				},

				truthUpgradeAttemptFactor(){
					return Math.max(1,Math.pow(3.5,this.truthUpgradeAttempt-TRUTH_UPGRADES[this.truthLevel].attempts+1));
				},
				truthUpgradeTheologyCost(){
					return this.gemChosen*Math.pow(6,this.truthLevel)*16*this.truthUpgradeAttemptFactor/(1+this.tech.spellWater/20);
				},
				truthUpgradeMagicCost(){
					return this.magicStoneChosen*Math.pow(6,this.truthLevel)*36*this.truthUpgradeAttemptFactor/(1+this.tech.spellWater/16);
				},
				truthUpgradeScienceCost(){
					return this.lenChosen*Math.pow(6,this.truthLevel)*49*this.truthUpgradeAttemptFactor/(1+this.tech.spellWater/8);
				},
				truthUpgradeCrystalCost(){
					return Math.ceil(
						this.truthUpgradeAttemptFactor
						*Math.pow(2.5,this.truthLevel)
						*(this.gemChosen+this.magicStoneChosen+this.lenChosen)
						*(2/(3+Math.sqrt(this.tech.dunai)))
						*Math.pow(0.8,this.knowledgeBook)
					);
				},
				truthUpgradeVaild(){
					function isVaild(l,x,u){
						return typeof x==='number'&&Number.isSafeInteger(x)&&!isNaN(x)&&l<=x&&x<=u;
					}
					let t=TRUTH_UPGRADES[this.truthLevel];
					return isVaild(t.minCost,this.gemChosen,t.maxCost)
					&& isVaild(t.minCost,this.magicStoneChosen,t.maxCost)
					&& isVaild(t.minCost,this.lenChosen,t.maxCost);
				},
				canUpgradeTruth(){
					return this.truthUpgradeVaild
					&& this.gem>=this.gemChosen
					&& this.magicStone>=this.magicStoneChosen
					&& this.len>=this.lenChosen
					&& this.crystal>=this.truthUpgradeCrystalCost
					&& this.theology>=this.truthUpgradeTheologyCost
					&& this.magic>=this.truthUpgradeMagicCost
					&& this.science>=this.truthUpgradeScienceCost;
				},

				devotionInductionFactor(){
					let x=this.devotion;
					return Math.pow(1.2,Math.sin(Math.pow(x,1/3))*Math.log2(x+1));
				},

				tidyEffectFactor(){
					if(this.advancedMoLevel<=0){return 1;}
					let lowbit=this.advancedMoLevel&-this.advancedMoLevel;
					let x=Math.log2(lowbit);
					return 1+Math.max(x-10/this.tech.tidy,0);
				},

				canBuyHugeStone(){
					return this.XY>=this.hugeStoneCost;
				},
				hugeStoneCost(){
					return 1e18*Math.pow(2.5,this.hugeStone)*Math.pow(0.97,this.tech.hugeStoneBuilding);
				},
				hugeStoneEffectFactor(){
					return (1+this.hugeStone)*Math.sqrt(1+this.tech.hugeStoneBuilding);
				},
				canBuyFazhen(){
					return this.hugeStone>=this.fazhenCost;
				},
				fazhenCost(){
					return 3*Math.pow(this.fazhen+1,2);
				},
				canBuyKB(){
					return this.fazhen>=this.KBCost;
				},
				KBCost(){
					return 2+this.knowledgeBook;
				},
				fazhenEffectFactor(){
					return (1+this.fazhen)*Math.sqrt(1+this.tech.fazhenBuilding);
				},

				canBuyElementTower(){
					return this.hugeStone>=this.elementTowerHugeStoneCost
					&& this.fazhen>=this.elementTowerFazhenCost
					&& this.len>=this.elementTowerLenCost;
				},
				elementTowerHugeStoneCost(){
					return 3+Math.floor(2*this.elementTower);
				},
				elementTowerFazhenCost(){
					return 1+Math.floor(0.25*this.elementTower);
				},
				elementTowerLenCost(){
					return Math.pow(4,this.elementTower)*100;
				},
				position(){
					return Math.ceil(Math.min(3*this.elementTower,15));
				},
				basicElementEarn(){
					return 0.001*this.elementTower;
				},
				warLevelUpgradeNeed(){
					return 1000+200*this.warLevel;
				},
				adventurerInitHealth(){
					return this.tech.blessing*5+50*this.knowledgeBook;
				},

				magicTreeSeedCost(){
					return 7.2e3/(this.tech.magicTree+10/(this.magicTreeSeed+1));
				},
				canBuyMagicTreeSeed(){
					return this.element.magic>=this.magicTreeSeedCost;
				},

				worldSpeedLimit(){
					return 1+this.tech.timeInduction*0.2;
				},
			},
			data:function(){
				let save=localStorage.getItem('game-mosiyuan-save');
				let data={};
				if(save){
					try{
						data=decode.call({
							PADDING,
						},save);
					}catch(e){
						window.prompt(`无法读取存档。\n${e}\n请全选复制以下存档文本，以备日后恢复。`,save);
					}
				}
				try{
					initData.call(this,data);
				}catch(e){
					window.prompt(`存档初始化失败。\n${e}`);
					data={};
					localStorage.clear();
				}
				return data;
			},
			created(){
				this.setLight(this.light);
			},
			mounted(){
				const saveSave=()=>{
					if(!this.debugging){
						let save={};
						for(let resName in SAVE_ITEMS){
							save[resName]=this[resName];
						}
						localStorage.setItem('game-mosiyuan-save',encode.call(this,save));
					}
					setTimeout(saveSave,20);
				};
				setTimeout(saveSave);
				this.solvePTL();
				const loop=()=>{
					let nt=Date.now();
					let s=(nt-this.lastTime)/1000;
					window.DT=s;
					this.gameTick(s);
					this.processAchs();
					this.lastTime=nt;
				};
				setInterval(loop);
				const maker=(obj)=>{
					return {
						get:()=>{
							if(window.LOCAL){
								return obj;
							}
							console.log(
								`膜拜 %cS%ciyuan%c 要真诚!\n%chttps://orzsiyuan.com/`,
								`color:black;font-weight:bold;`,
								`color:red;font-weight:bold;`,
								'',
								'color:blue;'
							);
							clearTimeout(saveSave);
							this.$set(this,'debugging',true);
							setTimeout(()=>{
								window.location.href='./SiyuanAK.png';
							},5000);
							return undefined;
						},
					};
				};
				Object.defineProperty(window,'_',maker(this));
			},
		});
	}();

}