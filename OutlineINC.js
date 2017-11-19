/* 2017-11-4 记录
 * 已知bug, 在markdown文档编辑模式下会对所有<div>标签添加id等属性
 * 没搞清楚【google code wiki 大纲】是什么，所以禁用其功能
 *
 *
 *
 */

	//
	var strCheckStatusDefault = "111111"
	//浏览器对象
	var objApp = window.external;
	var objWindow = objApp.Window;
	var objCommon = objApp.CreateWizObject("WizKMControls.WizCommonUI");
	var pluginPath = objApp.GetPluginPathByScriptFileName("Outline.js");
	//该API在Wiznote 4.5以上版本已经失效
	//var objHtmlDocument = objWindow.CurrentDocumentHtmlDocument;
	var objBrowser = objWindow.CurrentDocumentBrowserObject;
	var pluginBrowser = window.WizChromeBrowser;
	var serializer = new XMLSerializer();
	//
	var pluginPath = objApp.GetPluginPathByScriptFileName("Outline.js");
	var languangeFileName = pluginPath + "plugin.ini";
	//
	var htmlText = "";
	var htmlTextLink = "";
	//
	btnInsertContentToDoc.value = objApp.LoadStringFromFile(languangeFileName, "strBtnInsertContent");
	btnDeleteContentToDoc.value = objApp.LoadStringFromFile(languangeFileName, "strBtnDeleteContent");
	btnInsertBookmarkToDoc.value = objApp.LoadStringFromFile(languangeFileName, "strBtnInsertBookmark");
	btnDeleteBookmarkToDoc.value = objApp.LoadStringFromFile(languangeFileName, "strBtnDeleteBookmark");
	btnInsertOutlineToDoc.value = objApp.LoadStringFromFile(languangeFileName, "strBtnInsertOutline");
	btnDeleteOutlineToDoc.value = objApp.LoadStringFromFile(languangeFileName, "strBtnDeleteOutline");
	////
	var objCheckboxContent = document.getElementById("chkContent");
	var objCheckboxBookmark = document.getElementById("chkBookmark");
	var objCheckboxWiki = document.getElementById("chkWiki");
	var objCheckboxH16 = document.getElementById("chkH16");
	var objCheckboxBold = document.getElementById("chkBold");
	////
	//KMContentPageTopID为插件添加在文档的元素
	//var objAPageTop = objHtmlDocument.getElementById("KMContentPageTopID");
	var KMCheckStatus;
	objBrowser.ExecuteScript("document.getElementById('KMContentPageTopID').KMCheckStatus", function(ret){KMCheckStatus = ret});
	////
	var listContent = [];
	var listBookmark = [];
	var listWiki = [];
	var listH16 = [];
	var listBold = [];
	var newObj;
	
	//
	////
	////==========================================================================================================================
	////工具函数
	function KMGetCurrentBrowserObject() {
		return objWindow.CurrentDocumentBrowserObject;
	}
	
	// 获取文档浏览器对象
	function ObjectDeliver(pluginBrowser, obj){
		var paraList = window.document;
		pluginBrowser.ExecuteFunction1("ObjectReceiver", paraList, null);
	}
	
	// 对象接收器
	function ObjectReceiver(obj){
		//newObj = obj;
	}
	
	// 对象传递测试函数
	function testFunc(){
		objBrowser.ExecuteScript(ObjectDeliver.toString(), function(ret){
			objBrowser.ExecuteFunction1("ObjectDeliver", pluginBrowser, null);
		});
	}
	testFunc();
	
	// 字符-元素转换器
	function ArrayToElements(strArray){
				// 解析字符串
				var parser = new DOMParser();
				var elementsStr = strArray.join("");
				// 注意，这里获得listContent是伪数组
				var elemArray = parser.parseFromString(elementsStr, "text/html").body.children;
				elemArray = Array.prototype.slice.call(elemArray);
				return elemArray;
			}
	

	//// 生成随机数字
	function getRandomInt() {
		var objDate = new Date();
		var strRnd1 = objDate.getTime();
		var strRnd2 = Math.floor(100 + 900 * Math.random()); //100 ~ 999
		return strRnd1.toString() + strRnd2.toString();
	}

	////
	function getRepStr(str,i) {
		return new Array(i+1).join(str);
	}

	////
	function getCompare(a,b) {
		if (a.getAttribute("offsetTop") < b.getAttribute("offsetTop")) { return -1; }
		else if (a.getAttribute("offsetTop") == b.getAttribute("offsetTop") && a.offsetLeft < b.offsetLeft) {return -1; }
		else { return 1; }
	}

	////
	function getCheckStatus(str,iType) {
		if (iType == 1) {
			if (str == "1") { return true; }
			else { return false; }
		}
		else {
			if (str) { return "1"; }
			else { return "0"; }
		}
	}

	////跳转到页面元素位置
	function gotoElem(pos) {
		// 需要注入文档浏览器执行
		objBrowser.ExecuteScript("document.body.scrollTop =" + pos, null);
	    /*
		try {
	        var left = document.body.offsetLeft;
	        document.body.scrollTop = pos;
	    }
	    catch (err) {
	        alert(err);
	    }
		*/
	}
	
	// 将序列化储存的对象还原
	////
	////==========================================================================================================================
	////初始化添加大纲
	Initial();
	//
	function Initial() {
		if (!KMCheckStatus) { var strCheckStatus = strCheckStatusDefault; }
		else {var strCheckStatus = KMCheckStatus; }
		objCheckboxContent.setAttribute("checked", getCheckStatus(strCheckStatus.substr(0,1),1));
		objCheckboxBookmark.setAttribute("checked", getCheckStatus(strCheckStatus.substr(1,1),1));
		objCheckboxWiki.setAttribute("checked", getCheckStatus(strCheckStatus.substr(2,1),1));
		objCheckboxH16.setAttribute("checked", getCheckStatus(strCheckStatus.substr(3,1),1));
		objCheckboxBold.setAttribute("checked", getCheckStatus(strCheckStatus.substr(4,1),1));
		//
		GetAndPrintContent();
		GetAndPrintBookmark();
		//GetAndPrintWiki();
		GetAndPrintH16();
		GetAndPrintBold();
	}
	////
	////==========================================================================================================================
	////需要传入文档浏览器的函数
	//用户自己设定的Wizhelper contents
	function GetContent() {
		// 返回DOM对象序列化后的数组，该函数会传入文档浏览器执行
		var listContent = [];
		var serializer = new XMLSerializer();
		
		// 添加目录形式【KMContentClass=1~5】的大纲链接
		var objAs = document.getElementsByTagName("A");
		for (var i = 0; i < objAs.length; i++) {
			var elem = objAs[i];
			elem.setAttribute("offsetTop", elem.offsetTop.toString());
			elem.setAttribute("offsetLeft", elem.offsetLeft.toString());
			var id = elem.id;
			var iClass = parseInt(elem.getAttribute('KMContentClass'));
			var name = elem.name;
			if (iClass) {
				// 【iClass】是专属于Content的自定义属性
				// 将DOM对象序列化
				var elemAString = serializer.serializeToString(elem);
				listContent.push(elemAString);
			}
		}
		// H1~H6
		for (var k = 1; k <= 6; k++){
			var objH16 = document.getElementsByTagName("H"+k);
			for (var i = 0; i < objH16.length; i++) {
				var elem = objH16[i];
				elem.setAttribute("offsetTop", elem.offsetTop.toString());
				elem.setAttribute("offsetLeft", elem.offsetLeft.toString());
				var text = elem.innerText;
				var iClass = parseInt(elem.getAttribute("KMContentClass"));
				if (iClass && text != null && text != "") {
					// 将DOM对象序列化
					var elemHString = serializer.serializeToString(elem);
					listContent.push(elemHString);
				}
			}
		}
		// Wiki
		var objWiki = document.getElementsByTagName("DIV");
		for (var i = 0; i < objWiki.length; i++) {
			var elem = objWiki[i];
			elem.setAttribute("offsetTop", elem.offsetTop.toString());
			elem.setAttribute("offsetLeft", elem.offsetLeft.toString());
			var text = elem.innerText;
			var iClass = parseInt(elem.getAttribute("KMContentClass"));
			if  (iClass && text != null && text != "" && text.search(/^=[^<>]+=$/) > -1) {
				// 将DOM对象序列化
				var elemDIVString = serializer.serializeToString(elem);
				listContent.push(elemDIVString);
			}
		}
		// Bold
		var objBold = document.getElementsByTagName("B");
		for (var i = 0; i < objBold.length; i++) {
			var elem = objBold[i];
			elem.setAttribute("offsetTop", elem.offsetTop.toString());
			elem.setAttribute("offsetLeft", elem.offsetLeft.toString());
			var text = elem.innerText;
			var iClass = parseInt(elem.getAttribute("KMContentClass"));
			if  (iClass && text != null && text != "") {
				// 将DOM对象序列化
				var elemBString = serializer.serializeToString(elem);
				listContent.push(elemBString);
			}
		}
		// Strong
		var objStrongs = document.getElementsByTagName("STRONG");
		for (var i = 0; i < objStrongs.length; i++) {
			var elem = objStrongs[i];
			elem.setAttribute("offsetTop", elem.offsetTop.toString());
			elem.setAttribute("offsetLeft", elem.offsetLeft.toString());
			var text = elem.innerText;
			var iClass = parseInt(elem.getAttribute("KMContentClass"));
			if  (iClass && text != null && text != "") {
				// 将DOM对象序列化
				var elemStrongString = serializer.serializeToString(elem);
				listContent.push(elemStrongString);
			}
		}
		//console.log("GetContent" + listContent);
		return listContent;
	}
	//
	function GetBookmark() {
		// 添加书签形式【<a name="bookmarkname">】的大纲
		var listBookmark = [];
		var serializer = new XMLSerializer();
		var objAs = document.getElementsByTagName("A");
		for (var i = 0; i < objAs.length; i++) {
			var elem = objAs[i];
			if (!elem.id){elem.id = "WizKMOutline_" + getRandomInt();}
			elem.setAttribute("offsetTop", elem.offsetTop.toString());
			elem.setAttribute("offsetLeft", elem.offsetLeft.toString());
			var id = elem.id;
			var name = elem.name;
			var iClass = parseInt(elem.getAttribute("KMContentClass"));
			var isHide = elem.getAttribute("KMContentHide");
			if  ((!isHide || isHide != "1") && !iClass && id!="KMContentPageTopID" && name != null && name != "") {
				// 将DOM对象序列化
				var elemBookmarkString = serializer.serializeToString(elem);
				listBookmark.push(elemBookmarkString);
			}
		}
		//console.log("GetBookmark");
		return listBookmark;
	}
	//
	function GetH16(){
		// 添加标题样式【<h1>,<h2>,<h3>,<h4>,<h5>,<h6>】的大纲
		var listH16 = [];
		var serializer = new XMLSerializer();
		for (var k = 1; k <= 6; k++){
			var objH16 = document.getElementsByTagName("H"+k);
			for (var i = 0; i < objH16.length; i++) {
				var elem = objH16[i];
				if (!elem.id){elem.id = "WizKMOutline_" + getRandomInt();}
				elem.setAttribute("offsetTop", elem.offsetTop.toString());
				elem.setAttribute("offsetLeft", elem.offsetLeft.toString());
				var text = elem.innerText;
				var iClass = parseInt(elem.getAttribute("KMContentClass"));
				var isHide = elem.getAttribute("KMContentHide");
				if  ((!isHide || isHide != "1") && !iClass && text != null && text != "") {
					// 拥有iClass属性的不应爱被捕捉
					listH16.push(elem);
				}
			}
		}
		// 定义比较函数
		function getCompare(a,b) {
			if (a.offsetTop < b.offsetTop) { return -1; }
			else if (a.offsetTop == b.offsetTop && a.offsetLeft < b.offsetLeft) {return -1; }
			else { return 1; }
		}
		// 对大纲按照在文档中的位置进行排序
		listH16.sort(getCompare);
		// 将DOM对象序列化
		for (var j=0; j<listH16.length; j++) {
			listH16[j] = serializer.serializeToString(listH16[j]);
		}
		//console.log("GetH16" + listH16);
		return listH16;
	}
	//
	/*
	function GetWiki(){
		// 添加 google code wiki 大纲
		var listWiki = [];
		var serializer = new XMLSerializer();
		var objWiki = document.getElementsByTagName("DIV");
		for (var i = 0; i < objWiki.length; i++) {
			var elem = objWiki[i];
			if (!elem.id){elem.id = "WizKMOutline_" + getRandomInt();}
			elem.setAttribute("offsetTop", elem.offsetTop.toString());
			elem.setAttribute("offsetLeft", elem.offsetLeft.toString());
			var text = elem.innerText;
			var iClass = parseInt(elem.getAttribute("KMContentClass"));
			var isHide = elem.getAttribute("KMContentHide");
			if  ((!isHide || isHide != "1") && !iClass && text != null && text != "" && text.search(/^=[^<>]+=$/) > -1) {
				// 将DOM对象序列化
				var elemWikiString = serializer.serializeToString(elem);
				listWiki.push(elemWikiString);
			}
		}
		//console.log("GetWiki" + listWiki);
		return listWiki;
	}
	*/
	//
	function GetBold(){
		// 添加加粗样式【<strong>,<b>】的大纲
		var listBold = [];
		var serializer = new XMLSerializer();
		var objBold = document.getElementsByTagName("B");
		for (var i = 0; i < objBold.length; i++) {
			var elem = objBold[i];
			if (!elem.id){elem.id = "WizKMOutline_" + getRandomInt();}
			elem.setAttribute("offsetTop", elem.offsetTop.toString());
			elem.setAttribute("offsetLeft", elem.offsetLeft.toString());
			var text = elem.innerText;
			var iClass = parseInt(elem.getAttribute("KMContentClass"));
			var isHide = elem.getAttribute("KMContentHide");
			if  ((!isHide || isHide != "1") && !iClass && text != null && text != "") {
				listBold.push(elem);
			}
		}
		var objStrongs = document.getElementsByTagName("STRONG");
		for (var i = 0; i < objStrongs.length; i++) {
			var elem = objStrongs[i];
			var text = elem.innerText;
			var iClass = parseInt(elem.getAttribute("KMContentClass"));
			var isHide = elem.getAttribute("KMContentHide");
			if  ((!isHide || isHide != "1") && !iClass && text != null && text != "") {
				listBold.push(elem);
			}
		}
		// 将DOM对象序列化
		for (var i=0; i<listBold.length; i++) {
			listBold[i] = serializer.serializeToString(listBold[i]);
		}
		//console.log("GetBold" + listBold);
		return listBold;
	}
	////
	////==========================================================================================================================
	////添加目录形式【id="WizKMContent_XXX"】的大纲
	function PrintContent() {
		if (listContent.length > 0) {
			var htmlContent = "";
			for (i=0; i<listContent.length; i++) {
				var elem = listContent[i];
				//alert(elem.getAttribute("KMContentClass") + " : " + elem.innerText);
				iClass = parseInt(elem.getAttribute('KMContentClass'));
				htmlContent += getRepStr("KMContent_Begin", iClass-1);
				if (elem.name){htmlContent += "<li><a href=\"javascript:void(0);\" onclick=\"gotoElem('" + elem.getAttribute("offsetTop") + "');\">" + elem.name + "</a>";}
				else {htmlContent += "<li><a href=\"javascript:void(0);\" onclick=\"gotoElem('" + elem.getAttribute("offsetTop") + "');\">" + elem.innerText + "</a>";}
				htmlContent += " <a class=\"function-button\" href=\"javascript:void(0);\" onclick=\"ClassContent('"+ i + "',-1);\"><</a>";
				//htmlContent += " <a class=\"function-button\" href=\"javascript:void(0);\" onclick=\"UnContent('"+ i + "');\">X</a>";
				htmlContent += " <a class=\"function-button\" href=\"javascript:void(0);\" onclick=\"ContentToOutline('" + i + "');\">0</a>";
				htmlContent += " <a class=\"function-button\" href=\"javascript:void(0);\" onclick=\"ClassContent('"+ i + "',1);\">></a></li>";
				htmlContent += getRepStr("KMContent_End", iClass-1);
			}
			//
			while (htmlContent.length > htmlContent.replace(/KMContent_EndKMContent_Begin/g,"").length) {
				htmlContent = htmlContent.replace(/KMContent_EndKMContent_Begin/g,"");
			}
			htmlContent = htmlContent.replace(/KMContent_Begin/g,"<UL style=\"MARGIN: 0px 0px 0px 30px\">");
			htmlContent = htmlContent.replace(/KMContent_End/g,"</UL>");
			//
			htmlContent = "<div class=\"block-title\">自定义目录 :</div><UL class=\"block-list\">" + htmlContent + "</UL><hr class=\"seperator\">";
			document.getElementById("divKMContent").innerHTML = htmlContent;
			document.getElementById("divKMContent").style.display = "";
			
			CheckIfContentExist();
		}
		else {
			document.getElementById("divKMContent").style.display = "none";
		}
	}
	//
	//添加书签形式【<a name="bookmarkname">】的大纲
	function PrintBookmark() {
		if (listBookmark.length > 0) {
			var htmlBookmark = "";
			for (i=0; i<listBookmark.length; i++) {
				var elem = listBookmark[i];
				if (elem.getAttribute("KMContentHide") == "1" || elem.id == "KMContentPageTopID") { continue; }
				if (elem.name) { elem.innerText = elem.name; htmlBookmark += getHtmlString(1, i, elem.getAttribute("offsetTop"), elem.innerText); }
			}
			if (htmlBookmark.length>0){
				htmlBookmark = "<div class=\"block-title\">Bookmarks :</div><ul style=\"margin:0px 0px 0px 20px\">" + htmlBookmark + "</ul><hr class=\"seperator\">";
				document.getElementById("divKMBookmark").innerHTML = htmlBookmark;
				document.getElementById("divKMBookmark").style.display = "";
				CheckIfBookmarkExist();
			}
		}
		else {
			document.getElementById("divKMBookmark").style.display = "none";
		}
	}
	//
	//添加 google code wiki 大纲
	/*
	function PrintWiki() {
		if (listWiki.length > 0) {
			var htmlWiki = "";
			for (i=0; i<listWiki.length; i++) {
				var elem = listWiki[i];
				if (elem.getAttribute("KMContentHide") == "1") { continue; }
				htmlWiki += getHtmlString(2, i, elem.getAttribute("offsetTop"), elem.innerText);
			}
			if (htmlWiki.length>0) {
				htmlWiki = "<div class=\"block-title\">Wiki outline :</div><ul style=\"margin:0px 0px 0px 20px\">" + htmlWiki + "</ul><hr class=\"seperator\">";
				document.getElementById("divKMWiki").innerHTML = htmlWiki;
				document.getElementById("divKMWiki").style.display = "";
			}
		}
		else {
			document.getElementById("divKMWiki").style.display = "none";
		}
	}
	*/
	//
	//添加标题样式【<h1>,<h2>,<h3>,<h4>,<h5>,<h6>】的大纲
	function PrintH16() {
		if (listH16.length > 0) {
			var htmlH16 = "";
			for (i=0; i<listH16.length; i++) {
				var elem = listH16[i];
				if (elem.getAttribute("KMContentHide") == "1") { continue; }
				iClass = parseInt(elem.tagName.substr(1,1));
				htmlH16 += getRepStr("KMContent_Begin", iClass-1);
				htmlH16 += getHtmlString(3, i, elem.getAttribute("offsetTop"), elem.innerText);
				htmlH16 += getRepStr("KMContent_End", iClass-1);
			}
			if (htmlH16.length>0) {
				while (htmlH16.length > htmlH16.replace(/KMContent_EndKMContent_Begin/g,"").length) {
					htmlH16 = htmlH16.replace(/KMContent_EndKMContent_Begin/g,"");
				}
				htmlH16 = htmlH16.replace(/KMContent_Begin/g,"<UL style=\"MARGIN: 0px 0px 0px 30px\">");
				htmlH16 = htmlH16.replace(/KMContent_End/g,"</UL>");
				htmlH16 = "<div class=\"block-title\">H1~H6 大纲 :</div><ul style=\"margin:0px 0px 0px 20px\">" + htmlH16 + "</ul><hr class=\"seperator\">";
				document.getElementById("divKMH16").innerHTML = htmlH16;
				document.getElementById("divKMH16").style.display = "";
				CheckIfOutlineExist();
			}
		}
		else {
			document.getElementById("divKMH16").style.display = "none";
		}
	}
	//
	//添加加粗样式【<strong>,<b>】的大纲
	function PrintBold() {
		if (listBold.length > 0) {
			var htmlBold = "";
			for (i=0; i<listBold.length; i++) {
				var elem = listBold[i];
				if (elem.getAttribute("KMContentHide") == "1") { continue; }
				htmlBold += getHtmlString(4, i, elem.getAttribute("offsetTop"), elem.innerText);
			}
			if (htmlBold.length>0) {
				htmlBold = "<div class=\"block-title\">Bold outline :</div><ul style=\"margin:0px 0px 0px 20px\">" + htmlBold + "</ul><hr class=\"seperator\">";
				document.getElementById("divKMBold").innerHTML = htmlBold;
				document.getElementById("divKMBold").style.display = "";
			}
		}
		else {
			document.getElementById("divKMBold").style.display = "none";
		}
	}
	////
	////==========================================================================================================================
	//// 起始函数下游
	function GetAndPrintContent() {
		if (objCheckboxContent.checked) {
			//将函数注入目标浏览器
			objBrowser.ExecuteScript(GetContent.toString(), function(ret){
				//调用目标浏览器内注入的函数
				objBrowser.ExecuteFunction0("GetContent", function(ret){
					if (ret) {
						//console.log(ret);
						listContent = ArrayToElements(ret);
						// 将大纲在插件下拉菜单中打印出来
						PrintContent();
					}
				});
			});
			
		}
		else {
			document.getElementById("divKMContent").style.display = "none";
		}
	}
	//
	function GetAndPrintBookmark() {
		if (objCheckboxBookmark.checked) {
			//将函数注入目标浏览器
			objBrowser.ExecuteScript(GetBookmark.toString(), function(ret){
				//调用目标浏览器内注入的函数
				objBrowser.ExecuteFunction0("GetBookmark", function(ret){
					if (ret) {
						//console.log(ret);
						listBookmark = ArrayToElements(ret);
						// 显示在下拉菜单中
						PrintBookmark();
					}
					
				});
			});
			
		}
		else {
			document.getElementById("divKMBookmark").style.display = "none";
		}
	}
	//
	/*
	function GetAndPrintWiki() {
		if (objCheckboxWiki.checked) {
			//将函数注入目标浏览器
			objBrowser.ExecuteScript(GetWiki.toString(), function(ret){
				//调用目标浏览器内注入的函数
				objBrowser.ExecuteFunction0("GetWiki", function(ret){
					if (ret) {
						//console.log(ret);
						listWiki = ArrayToElements(ret);
						PrintWiki();
					}
					
				});
			});
			
		}
		else {
			document.getElementById("divKMWiki").style.display = "none";
		}
	}
	*/
	//
	function GetAndPrintH16() {
		if (objCheckboxH16.checked) {
			//将函数注入目标浏览器
			objBrowser.ExecuteScript(GetH16.toString() + getRandomInt.toString(), function(ret){
				//调用目标浏览器内注入的函数
				objBrowser.ExecuteFunction0("GetH16", function(ret){
					if (ret) {
						//console.log(ret);
						listH16 = ArrayToElements(ret);
						PrintH16();
					}
					
				});
			});
			
		}
		else {
			document.getElementById("divKMH16").style.display = "none";
		}
	}
	//
	function GetAndPrintBold() {
		if (objCheckboxBold.checked) {
			//将函数注入目标浏览器
			objBrowser.ExecuteScript(GetBold.toString(), function(ret){
				//调用目标浏览器内注入的函数
				objBrowser.ExecuteFunction0("GetBold", function(ret){
					if (ret) {
						//console.log(ret);
						listBold = ArrayToElements(ret);
						PrintBold();
					}
					
				});
			});
			
		}
		else {
			document.getElementById("divKMBold").style.display = "none";
		}
	}
	////
	////==========================================================================================================================
	//// 生成大纲条目
	function getHtmlString(itype,i,pos,text) {
		// 【itype】是指大纲类型，【i】是指该项目在list中的位置
		var str = "";
		str += "<li><a href=\"javascript:void(0);\" onclick=\"gotoElem('" + pos + "');\">"  + text + "</a>";
		str += " <a class=\"function-button\" href=\"javascript:void(0);\" onclick=\"OutlineToContent(" + itype + "," + i + ",1);\">1</a>";
		str += " <a class=\"function-button\" href=\"javascript:void(0);\" onclick=\"OutlineToContent(" + itype + "," + i + ",2);\">2</a>";
		str += " <a class=\"function-button\" href=\"javascript:void(0);\" onclick=\"OutlineToContent(" + itype + "," + i + ",3);\">3</a>";
		str += " <a class=\"function-button\" href=\"javascript:void(0);\" onclick=\"OutlineToContent(" + itype + "," + i + ",4);\">4</a>";
		str += " <a class=\"function-button\" href=\"javascript:void(0);\" onclick=\"OutlineToContent(" + itype + "," + i + ",5);\">5</a>";
		str += " <a class=\"function-button\" href=\"javascript:void(0);\" onclick=\"UnOutline(" + itype + "," + i + ");\">X</a></li>";
		return str;
	}
	
	////
	////==========================================================================================================================
	////后面那些【12345X】的功能
	//
	//大纲项转为目录项(content)
	function OutlineToContent(itype,i,iClass) {
		// 判断
		if (objApp.IsCurrentDocumentEditing() && !objWindow.CurrentDocument.IsMarkdown()) {
			// 书签形式【<a name="bookmarkname">】的大纲
			if (itype == 1) {
				elem = listBookmark[i];
				listBookmark.splice(i,1);
				PrintBookmark();
				InsertBookmarkToDoc(1);
				CheckIfBookmarkExist();
			}
			// google code wiki 大纲
			/*
			else if (itype == 2) {
				elem = listWiki[i];
				listWiki.splice(i,1);
				PrintWiki();
			}
			*/
			// 标题样式【<h1>,<h2>,<h3>,<h4>,<h5>,<h6>】的大纲
			else if (itype == 3) {
				elem = listH16[i];
				listH16.splice(i,1);
				PrintH16();
				CheckIfOutlineExist();
				InsertOutlineToDoc(1);
			}
			// 加粗样式【<strong>,<b>】的大纲
			else if (itype == 4) {
				elem = listBold[i];
				listBold.splice(i,1);
				PrintBold();
			}
			
			// 获取该元素id，并设置iClass
			var id = elem.id;
			elem.setAttribute("KMContentClass", iClass);
			// 给该元素添加自定义iClass属性，需要传入文档浏览器执行
			function addiClassToElem(id, iClass, objApp){
				var elem = document.getElementById(id);
				elem.setAttribute("KMContentClass", iClass);
				objApp.SetNoteModifiedByPlugin();
			}	
			//注入
			objBrowser.ExecuteScript(addiClassToElem.toString(), function(ret){
				objBrowser.ExecuteFunction3("addiClassToElem", id, iClass, objApp, null);
			});	
			// 放入目录列表
			listContent.push(elem);
			listContent.sort(getCompare);
			if (objCheckboxContent.checked) { PrintContent(); }
			InsertContentToDoc(1);	
		} else if (objApp.IsCurrentDocumentEditing() && objWindow.CurrentDocument.IsMarkdown()){
			objWindow.ShowMessage("该插件不支持Markdown文档", "", 0);
			return false;
		} else if (!objApp.IsCurrentDocumentEditing()) {
			objWindow.ShowMessage("请在编辑状态下插入大纲", "", 0);
			return false;
		}

	}
	//目录项转为大纲项
	function ContentToOutline(i) {
		// 判断
		if (objApp.IsCurrentDocumentEditing() && !objWindow.CurrentDocument.IsMarkdown()) {
			var elem = listContent[i];
			var id = elem.id;
			elem.setAttribute("KMContentClass", "");
			listContent.splice(i,1);
			//注入浏览器执行
			function cancelContent(id, objApp){
				var elem = document.getElementById(id);
				elem.setAttribute("KMContentClass", "");
				objApp.SetNoteModifiedByPlugin();
			}	
			// 注入
			objBrowser.ExecuteScript(cancelContent.toString(), function(ret){
				objBrowser.ExecuteFunction2("cancelContent", id, objApp, null);
			});
			// 书签形式【<a name="bookmarkname">】的大纲
			if (elem.tagName=="A" && elem.name!=null && elem.name!="") {
				listBookmark.push(elem);
				listBookmark.sort(getCompare);
				if (objCheckboxBookmark.checked) { PrintBookmark(); }
				InsertBookmarkToDoc(1);
				CheckIfBookmarkExist();
			}
			// google code wiki 大纲
			/*
			else if (elem.tagName == "DIV" && elem.innerText.search(/^=[^<>]+=$/) > -1) {
				listWiki.push(elem);
				listWiki.sort(getCompare);
				if (objCheckboxWiki.checked) { PrintWiki(); }
			}
			*/
			// 标题样式【<h1>,<h2>,<h3>,<h4>,<h5>,<h6>】的大纲
			else if ("H1H2H3H4H5H6".indexOf(elem.tagName) != -1)  {
				listH16.push(elem);
				listH16.sort(getCompare);
				console.log(listH16);
				if (objCheckboxH16.checked) { PrintH16(); }
				InsertOutlineToDoc(1);
				CheckIfOutlineExist();
			}
			// 加粗样式【<strong>,<b>】的大纲
			else if (elem.tagName == "STRONG" || elem.tagName == "B") {
				listBold.push(elem);
				listBold.sort(getCompare);
				if (objCheckboxBold.checked) { PrintBold(); }
			}
			//
			PrintContent();
			InsertContentToDoc(1);
			CheckIfContentExist();	
		} else if (objApp.IsCurrentDocumentEditing() && objWindow.CurrentDocument.IsMarkdown()){
			objWindow.ShowMessage("该插件不支持Markdown文档", "", 0);
			return false;
		} else if (!objApp.IsCurrentDocumentEditing()) {
			objWindow.ShowMessage("请在编辑状态下插入大纲", "", 0);
			return false;
		}
		
	}
	//
	//改变目录项级别
	function ClassContent(i,dClass) {
		var elem = listContent[i];
		if (elem) {
			var iClass = parseInt(elem.getAttribute("KMContentClass")) + parseInt(dClass);
			if (iClass<1) { iClass = 1; }
			if (iClass>5) { iClass = 5; }
			//elem.style.fontSize = (20-2*iClass).toString() + "pt";
			elem.setAttribute("KMContentClass", iClass);
		}
		PrintContent();
		InsertContentToDoc(1);
		CheckIfContentExist();
	}
	
	/*
	// 删除节点
	function WizRemoveNode(node, removeChildren) {
		try {
			if (removeChildren) {
				node.parentNode.removeChild(node);
			}
			else {
				var p = node.parentNode;
				var childrens = node.childNodes;
				while(childrens && childrens.length > 0) {
					p.insertBefore(childrens[0], node);
				}
				//
				p.removeChild(node);
			}
		}
		catch (e) {
		}
	}
	//
	//取消目录项，似乎是删除功能
	function UnContent(i) {
		var elem = listContent[i];
		listContent.splice(i,1);
		// 注入文档浏览器
		
		if (elem) {
			WizRemoveNode(elem, false);
			var objLinkTop = document.getElementById(elem.id + "_Top");
			if (objLinkTop) {
				objLinkTop.parentNode.removeChild(objLinkTop);
			}
		}
		
		PrintContent();
		InsertContentToDoc(1);
		CheckIfContentExist();
		document.body.setAttribute("wizKMDocumentModified", "1", 0);
	}
	*/
	//
	//
	function UnOutline(itype,i) {
		// 书签形式【<a name="bookmarkname">】的大纲
		if (itype == 1) {
			var elem = listBookmark[i];
			var id = elem.id;
			listBookmark.splice(i,1);
			PrintBookmark();
			InsertBookmarkToDoc(1);
		}
		// google code wiki 大纲
		/*
		else if (itype == 2) {
			var elem = listWiki[i];
			var id = elem.id;
			listWiki.splice(i,1);
			PrintWiki();
		}
		*/
		// 标题样式【<h1>,<h2>,<h3>,<h4>,<h5>,<h6>】的大纲
		else if (itype == 3) {
			var elem = listH16[i];
			var id = elem.id;
			listH16.splice(i,1);
			PrintH16();
			InsertOutlineToDoc(1);
			CheckIfOutlineExist();
		}
		// 加粗样式【<strong>,<b>】的大纲
		else if (itype == 4) {
			var elem = listBold[i];
			var id = elem.id;
			listBold.splice(i,1);
			PrintBold();
		}
		//注入文档浏览器
		function hideDocElem(id, objApp){
			var elem = document.getElementById(id);
			elem.setAttribute("KMContentHide", "1");
			objApp.SetNoteModifiedByPlugin();
		}
		objBrowser.ExecuteScript(hideDocElem.toString(), function(ret){
			objBrowser.ExecuteFunction2("hideDocElem", id, objApp, null)
		})
	}
	////
	////==========================================================================================================================
	////
	//
	function SetCheckStatus(ynStatus,iPosition, objApp) {
		if (!objAPageTop) {
			objAPageTop = document.createElement("a");
			objAPageTop.id="KMContentPageTopID";
			document.body.insertBefore(objAPageTop,document.body.firstChild);
			var strCheckStatus = strCheckStatusDefault;
		}
		else if (!objAPageTop.KMCheckStatus) { var strCheckStatus = strCheckStatusDefault; }
		else {var strCheckStatus = objAPageTop.KMCheckStatus; }
		strCheckStatus = strCheckStatus.substr(0,iPosition) + getCheckStatus(ynStatus,0) + strCheckStatus.substring(iPosition+1, strCheckStatus.length);
		objAPageTop.KMCheckStatus = strCheckStatus;
		objApp.SetNoteModifiedByPlugin();
	}
	////
	////==========================================================================================================================
	//// 大纲展示的选项
	function onclickContent() {
		GetAndPrintContent();
		objBrowser.ExecuteScript(SetCheckStatus.toString(), function(ret){
			objBrowser.ExecuteFunction3("SetCheckStatus", objCheckboxContent.checked, 0, objApp, null)
		});
	}
	//
	function onclickBookmark() {
		GetAndPrintBookmark();
		objBrowser.ExecuteScript(SetCheckStatus.toString(), function(ret){
			objBrowser.ExecuteFunction3("SetCheckStatus", objCheckboxBookmark.checked, 1, objApp, null)
		});
	}
	//
	function onclickWiki() {
		GetAndPrintWiki();
		objBrowser.ExecuteScript(SetCheckStatus.toString(), function(ret){
			objBrowser.ExecuteFunction3("SetCheckStatus", objCheckboxWiki.checked, 2, objApp, null)
		});
	}
	//
	function onclickH16() {
		GetAndPrintH16();
		objBrowser.ExecuteScript(SetCheckStatus.toString(), function(ret){
			objBrowser.ExecuteFunction3("SetCheckStatus", objCheckboxH16.checked, 3, objApp, null)
		});
	}
	//
	function onclickBold() {
		GetAndPrintBold();
		objBrowser.ExecuteScript(SetCheckStatus.toString(), function(ret){
			objBrowser.ExecuteFunction3("SetCheckStatus", objCheckboxBold.checked, 4, objApp, null)
		});
	}
	////
	////==========================================================================================================================
	////添加文档顶部书签
	function AddPageTopAnchor() {
		var objAPageTop = document.getElementById("KMContentPageTopID");
		if (objAPageTop) {
			if (document.body.firstChild.id!="KMContentPageTopID"){
				objAPageTop.parentNode.removeChild(objAPageTop);
				objAPageTop = document.createElement("a");
				objAPageTop.id="KMContentPageTopID";
				objAPageTop.name = "KMContentPageTopID";
				//					objAPageTop.innerText = "返回文档顶部";
				//					objAPageTop.style.display = "none";
				document.body.insertBefore(objAPageTop,document.body.firstChild);
			}
		}
		else {
			objAPageTop = document.createElement("a");
			objAPageTop.id="KMContentPageTopID";
			objAPageTop.name = "KMContentPageTopID";
			//				objAPageTop.innerText = "返回文档顶部";
			//				objAPageTop.style.display = "none";
			document.body.insertBefore(objAPageTop,document.body.firstChild);
		}
	}
	////
	////==========================================================================================================================
	////
	//插入目录【wizhelpler content】到文档顶部
	function InsertContentToDoc(isUpdate) {
		if (listContent.length > 0) {
			var htmlContentLink = "";
			for (i=0; i<listContent.length; i++) {
				var elem = listContent[i];
				iClass = parseInt(elem.getAttribute("KMContentClass"));
				htmlContentLink += getRepStr("KMContent_Begin", iClass-1);
				htmlContentLink += "<li><a href=\"#" + elem.id + "\"; >" + elem.innerText + "</a></li>";
				htmlContentLink += getRepStr("KMContent_End", iClass-1);
			}
			//
			while (htmlContentLink.length > htmlContentLink.replace(/KMContent_EndKMContent_Begin/g,"").length) {
				htmlContentLink = htmlContentLink.replace(/KMContent_EndKMContent_Begin/g,"");
			}
			htmlContentLink = htmlContentLink.replace(/KMContent_Begin/g,"<UL>");
			htmlContentLink = htmlContentLink.replace(/KMContent_End/g,"</UL>");
			htmlContentLink = "<ul class=\"kmdiv-box\">" + htmlContentLink + "</ul>";
			
			// 定义需要注入的函数
			function InsertContent(isUpdate, htmlContentLink, objApp, pluginPath){
				var objCommon = objApp.CreateWizObject("WizKMControls.WizCommonUI");
				var objdivContent = document.getElementById("divKMContent");
				if (!objdivContent) {
					if (isUpdate==1) { return; }
					else {
						var objdivContent = document.createElement("div");
						objdivContent.id="divKMContent";
						objdivContent.className = "divKM";
						document.body.insertBefore(objdivContent,document.body.firstChild);
					}
				}
				// 准备大纲样式
				var styleText = objCommon.LoadTextFromFile(pluginPath + "kmdiv.css");
				var divStyleStr = "<style>" + styleText + "</style>";
				// 插入
				objdivContent.innerHTML = divStyleStr + htmlContentLink;
				AddPageTopAnchor();
				objApp.SetNoteModifiedByPlugin();
			}
			// 将函数注入目标浏览器
			if( objApp.IsCurrentDocumentEditing() && !objWindow.CurrentDocument.IsMarkdown()){
				objBrowser.ExecuteScript(InsertContent.toString() + AddPageTopAnchor.toString(), function(ret){
					//调用目标浏览器内注入的函数
					objBrowser.ExecuteFunction4("InsertContent", isUpdate, htmlContentLink, objApp, pluginPath, function(ret){
						// 更改按钮状态
						CheckIfContentExist();
					});
				});
			} else if (objApp.IsCurrentDocumentEditing() && objWindow.CurrentDocument.IsMarkdown()){
				objWindow.ShowMessage("该插件不支持Markdown文档", "", 0);
			} else if (!objApp.IsCurrentDocumentEditing()) {
				objWindow.ShowMessage("请在编辑状态下插入大纲", "", 0);
			}
		}
		else{
			function deleteContentDiv(objApp){
				var objdivContent = document.getElementById("divKMContent");
				if (objdivContent) {
					objdivContent.parentNode.removeChild(objdivContent);
				}
			}
			objBrowser.ExecuteScript(deleteContentDiv.toString(), function(ret){
				objBrowser.ExecuteFunction1("deleteContentDiv", objApp, function(ret){
					CheckIfContentExist();
				})
			})
			
		}
		
	}
	//
	//删除文档顶部的目录列表
	function DeleteContentToDoc() {
		function DeleteContent(objApp){
			var objdivContent = document.getElementById("divKMContent");
			if (objdivContent) {
				objdivContent.parentNode.removeChild(objdivContent);
				objApp.SetNoteModifiedByPlugin();
			}
		}
		
		//将函数注入目标浏览器
		if(objApp.IsCurrentDocumentEditing()){
			objBrowser.ExecuteScript(DeleteContent.toString(), function(ret){
				//调用目标浏览器内注入的函数
				objBrowser.ExecuteFunction1("DeleteContent", objApp, function(ret){
					// 检查按钮状态
					CheckIfContentExist();
				});
			});
		} else if (objApp.IsCurrentDocumentEditing() && objWindow.CurrentDocument.IsMarkdown()){
			objWindow.ShowMessage("该插件不支持Markdown文档", "", 0);
		} else if (!objApp.IsCurrentDocumentEditing()) {
			objWindow.ShowMessage("请在编辑状态下删除大纲", "", 0);
		}

	}
	//
	//检查是否有文档顶部目录
	function CheckIfContentExist() {
		// 注入浏览器文档
		objBrowser.ExecuteScript("(function(){if(document.getElementById('divKMContent')) return true}())", function(ret){
			var objdivContent = ret;
			if (!objdivContent && !listContent.length == 0) {
				document.getElementById("btnInsertContentToDoc").style.display = "";
				document.getElementById("btnDeleteContentToDoc").style.display = "none";
				return true;
			} else if (!objdivContent && listContent.length == 0) {
				document.getElementById("btnInsertContentToDoc").style.display = "none";
				document.getElementById("btnDeleteContentToDoc").style.display = "none";
				return false;
			} else if (objdivContent && !listContent.length == 0) {
				document.getElementById("btnInsertContentToDoc").style.display = "none";
				document.getElementById("btnDeleteContentToDoc").style.display = "";
				return false;
			} else {
				document.getElementById("btnInsertContentToDoc").style.display = "";
				document.getElementById("btnDeleteContentToDoc").style.display = "none";
				return true;
			}
			
		})
	}
	////
	////==========================================================================================================================
	////插入书签【Bookmark】到文档顶部
	function InsertBookmarkToDoc(isUpdate) {
		if (listBookmark.length > 0) {
			var htmlBookmarkLink = "";
			for (i=0; i<listBookmark.length; i++) {
				var elem = listBookmark[i];
				if (elem.getAttribute("KMContentHide") == "1") { continue; }
				//var name = elem.name.replace(/\"|'|`/g,"");
				htmlBookmarkLink += "<li><a href=\"#" + elem.id + "\"; >" + elem.name + "</a></li>";
			}
			htmlBookmarkLink = "<ul class=\"kmdiv-box\">" + htmlBookmarkLink + "</ul>";
			
			// 定义注入函数
			function InsertBookmark(isUpdate, htmlBookmarkLink, objApp, pluginPath){
				var objCommon = objApp.CreateWizObject("WizKMControls.WizCommonUI");
				var objdivBookmark = document.getElementById("divKMBookmark");
				if (!objdivBookmark) {
					if (isUpdate==1) { return; }
					else {
						var objdivBookmark = document.createElement("div");
						objdivBookmark.id="divKMBookmark";
						objdivBookmark.className="divKM";
						var objdivContent = document.getElementById("divKMContent");
						var objdivOutline = document.getElementById("divKMOutline");
						if (objdivOutline) {
							document.body.insertBefore(objdivBookmark,objdivOutline.nextSibling);
						}
						else if(objdivContent){
							document.body.insertBefore(objdivBookmark,objdivContent.nextSibling);
						}
						else {
							document.body.insertBefore(objdivBookmark,document.body.firstChild);
						}
					}}
				
				// 准备大纲样式
				var styleText = objCommon.LoadTextFromFile(pluginPath + "kmdiv.css");
				var divStyleStr = "<style>" + styleText + "</style>";
				//
				objdivBookmark.innerHTML = divStyleStr + htmlBookmarkLink;
				AddPageTopAnchor();
				objApp.SetNoteModifiedByPlugin();	
			}
			
			//将函数注入目标浏览器
				if( objApp.IsCurrentDocumentEditing() && !objWindow.CurrentDocument.IsMarkdown()){
					objBrowser.ExecuteScript(InsertBookmark.toString() + AddPageTopAnchor.toString(), function(ret){
						//调用目标浏览器内注入的函数
						objBrowser.ExecuteFunction4("InsertBookmark", isUpdate, htmlBookmarkLink, objApp, pluginPath, function(ret){
							// 更改按钮状态
							CheckIfBookmarkExist();
						});
					});
				} else if (objApp.IsCurrentDocumentEditing() && objWindow.CurrentDocument.IsMarkdown()){
					objWindow.ShowMessage("该插件不支持Markdown文档", "", 0);
				} else if (!objApp.IsCurrentDocumentEditing()) {
					objWindow.ShowMessage("请在编辑状态下插入大纲", "", 0);
				}
			

		}
		else{
			function deleteBookmarkDiv(objApp){
				var objdivBookmark = document.getElementById("divKMBookmark");
				if (objdivBookmark) {
					objdivBookmark.parentNode.removeChild(objdivBookmark);
				}	
			}
			
			objBrowser.ExecuteScript(deleteBookmarkDiv.toString(), function(ret){
				objBrowser.ExecuteFunction1("deleteBookmarkDiv", objApp, function(ret){
					CheckIfBookmarkExist();
				})
			})
		}
	}
	//
	//删除文档顶部的书签列表
	function DeleteBookmarkToDoc() {
		function DeleteBookmark(){
			var objdivBookmark = document.getElementById("divKMBookmark");
			if (objdivBookmark) {
				objdivBookmark.parentNode.removeChild(objdivBookmark);
				document.body.setAttribute("wizKMDocumentModified", "1", 0);
			}	
		}
		//将函数注入目标浏览器
		if(objApp.IsCurrentDocumentEditing()){
			objBrowser.ExecuteScript(DeleteBookmark.toString(), function(ret){
				//调用目标浏览器内注入的函数
				objBrowser.ExecuteFunction1("DeleteBookmark", objApp, function(ret){
					// 检查按钮状态
					CheckIfBookmarkExist();
				});
			});
		} else if (objApp.IsCurrentDocumentEditing() && objWindow.CurrentDocument.IsMarkdown()){
			objWindow.ShowMessage("该插件不支持Markdown文档", "", 0);
		} else if (!objApp.IsCurrentDocumentEditing()) {
			objWindow.ShowMessage("请在编辑状态下删除大纲", "", 0);
		}
	}
	//
	//检查是否有文档顶部书签列表
	function CheckIfBookmarkExist() {
		objBrowser.ExecuteScript("(function(){if(document.getElementById('divKMBookmark')) return true}())", function(ret){
			var objdivBookmark = ret;
			if (!objdivBookmark) {
				document.getElementById("btnInsertBookmarkToDoc").style.display = "";
				document.getElementById("btnDeleteBookmarkToDoc").style.display = "none";
			}
			else {
				document.getElementById("btnInsertBookmarkToDoc").style.display = "none";
				document.getElementById("btnDeleteBookmarkToDoc").style.display = "";
			}
		})
	}
	////
	////==========================================================================================================================
	////插入【<h1>,<h2>,<h3>,<h4>,<h5>,<h6>】大纲到文档顶部
	// 
	function InsertOutlineToDoc(isUpdate) {
		if (listH16.length > 0) {
			var htmlH16Link = "";
			for (i=0; i<listH16.length; i++) {
				var elem = listH16[i];
				if (elem.getAttribute("KMContentHide") == "1") { continue; }
				//h1~h6在Get时就生成了id
				//if (!elem.id || elem.id.indexOf("WizKMOutline_")==0) {elem.id = "WizKMOutline_" + getRandomInt(); }
				iClass = parseInt(elem.tagName.substr(1,1));
				htmlH16Link += getRepStr("KMContent_Begin", iClass-1);
				htmlH16Link += "<li><a href=\"#" + elem.id + "\" >" + elem.innerText + "</a></li>";
				htmlH16Link += getRepStr("KMContent_End", iClass-1);
			}
			if (htmlH16Link.length>0) {
				while (htmlH16Link.length > htmlH16Link.replace(/KMContent_EndKMContent_Begin/g,"").length) {
					htmlH16Link = htmlH16Link.replace(/KMContent_EndKMContent_Begin/g,"");
				}
				htmlH16Link = htmlH16Link.replace(/KMContent_Begin/g,"<UL>");
				htmlH16Link = htmlH16Link.replace(/KMContent_End/g,"</UL>");
				htmlH16Link = "<ul class=\"kmdiv-box\" >" + htmlH16Link + "</ul>";
				
				//定义需要注入的函数
				function InsertOutline(isUpdate, htmlH16Link, objApp, pluginPath){
					var objCommon = objApp.CreateWizObject("WizKMControls.WizCommonUI");
					var objdivOutline = document.getElementById("divKMOutline");
					if (!objdivOutline) {
						// 如果是更新内容，那么久不用再创建objdivOutlie了
						if (isUpdate==1) { return; } 
						else {
							var objdivOutline = document.createElement("div");
							objdivOutline.id="divKMOutline";
							objdivOutline.className = "divKM";
							var objdivContent = document.getElementById("divKMContent");
							if (objdivContent){
								document.body.insertBefore(objdivOutline,objdivContent.nextSibling);
							}
							else {
								document.body.insertBefore(objdivOutline,document.body.firstChild);
							}
						}
					}
					// 准备大纲样式
					var styleText = objCommon.LoadTextFromFile(pluginPath + "kmdiv.css");
					var divStyleStr = "<style>" + styleText + "</style>";
					// 更改大纲内容
					objdivOutline.innerHTML = divStyleStr + htmlH16Link;
					AddPageTopAnchor();
					objApp.SetNoteModifiedByPlugin();
				}
				
				//将函数注入目标浏览器
				if( objApp.IsCurrentDocumentEditing() && !objWindow.CurrentDocument.IsMarkdown()){
					objBrowser.ExecuteScript(InsertOutline.toString() + AddPageTopAnchor.toString(), function(ret){
						//调用目标浏览器内注入的函数
						objBrowser.ExecuteFunction4("InsertOutline", isUpdate, htmlH16Link, objApp, pluginPath, function(ret){
							// 更改按钮状态
							CheckIfOutlineExist();
						});
					});
				} else if (objApp.IsCurrentDocumentEditing() && objWindow.CurrentDocument.IsMarkdown()){
					objWindow.ShowMessage("该插件不支持Markdown文档", "", 0);
				} else if (!objApp.IsCurrentDocumentEditing()) {
					objWindow.ShowMessage("请在编辑状态下插入大纲", "", 0);
				}
				
			}
			
		}
		else{
			function deleteH16Div(){
				var objdivOutline = document.getElementById("divKMOutline");
				if (objdivOutline) {
					objdivOutline.parentNode.removeChild(objdivOutline);
				}
			}
			objBrowser.ExecuteScript(deleteH16Div.toString(), function(ret){
				objBrowser.ExecuteFunction1("deleteH16Div", objApp, function(ret){
					CheckIfOutlineExist();
				})
			})
			
		}
	}
	//
	//删除【<h1>,<h2>,<h3>,<h4>,<h5>,<h6>】大纲
	function DeleteOutlineToDoc() {
		function DeleteOutline(objApp){
			var objdivOutline = document.getElementById("divKMOutline");
			if (objdivOutline) {
				objdivOutline.parentNode.removeChild(objdivOutline);
				objApp.SetNoteModifiedByPlugin();
			}
		}
		//将函数注入目标浏览器
		if(objApp.IsCurrentDocumentEditing()){
			objBrowser.ExecuteScript(DeleteOutline.toString(), function(ret){
				//调用目标浏览器内注入的函数
				objBrowser.ExecuteFunction1("DeleteOutline", objApp, function(ret){
					// 检查按钮状态
					CheckIfOutlineExist();
				});
			});
		} else if (objApp.IsCurrentDocumentEditing() && objWindow.CurrentDocument.IsMarkdown()){
			objWindow.ShowMessage("该插件不支持Markdown文档", "", 0);
		} else if (!objApp.IsCurrentDocumentEditing()) {
			objWindow.ShowMessage("请在编辑状态下删除大纲", "", 0);
		}
	}
	//
	//检查【<h1>,<h2>,<h3>,<h4>,<h5>,<h6>】大纲
	function CheckIfOutlineExist() {
		objBrowser.ExecuteScript("(function(){if(document.getElementById('divKMOutline')) return true}())", function(ret){
			var objdivOutline = ret;
			if (!objdivOutline) {
				// 更改按钮显示状态
				document.getElementById("btnInsertOutlineToDoc").style.display = "";
				document.getElementById("btnDeleteOutlineToDoc").style.display = "none";
			}
			else {
				document.getElementById("btnInsertOutlineToDoc").style.display = "none";
				document.getElementById("btnDeleteOutlineToDoc").style.display = "";
			}
		});
	}

	////
	////==========================================================================================================================
	////
	function WizSetDocModified() {
		document.body.setAttribute("wizKMDocumentModified", "1");
	}
	////