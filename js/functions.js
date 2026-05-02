function dialogue(args) { //未完成
	if (args[1] === "html") {
		document.getElementById("p_textbox").innerHTML = args[0];
	} else {
		document.getElementById("p_textbox").textContent = args[0];
	}
}
function sc_if(args) {
	
}
function dispIMG(args) {
	
}
function stateIMG(args) {
	
}
function sympleBGchange(args) { //テスト用 パス つける[0/1] 消す[0/1]
	const obj = document.getElementById("background");
	if (args[1] === "1") {
		obj.style.width = "calc(100vh * 9 / 16)";
		obj.style.height = "70%";
		obj.innerHTML = `<img src="${ASSETS.imgs[args[0]]}" style="width: calc(100vh * 9 / 16); height: 100%;"/>`;

	}
	if (args[2] === "1") {
		obj.innerHTML = "";
	}
	if (args[3] === "1") {
		return "do_next";
	}
}