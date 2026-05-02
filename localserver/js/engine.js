let is_localStorage_allowed = false;
let last_sc_line = 0; //見た目上の話。
//臨時に関数間を超えて実行する。
let do_inaninstant = false;
let SCENARIO = [];
let current_display = "index";

console.log("engine.js起動")

window.ASSETS = {
	"html": {},
	"imgs": {},
	"audio": {}
};
async function setASSETS() {
	//htmlのプリロード
    const html_res = await fetch("ASSETScontents_html.txt");
    const text = await html_res.text();
    const html_paths = text
        .split("\n")
        .map(line => line.trim())
        .filter(line => line.length > 0);
	let i = 0;
    for (const path of html_paths) {
        const res = await fetch(path);
        ASSETS.html[path] = await res.text();
		i++;
		document.getElementById("progress-bar").setAttribute('width', 300 * (i / html_paths.length));
		document.getElementById("loadprogress_discription").textContent = path;
    }
	// image のプリロード
	const image_res = await fetch("ASSETScontents_image.txt");
	const img_data = await image_res.text();
	const image_paths = img_data
		.split("\n")
		.map(line => line.trim())
		.filter(line => line.length > 0);

	i = 0;
	for (const path of image_paths) {
		const res = await fetch(path);
		const blob = await res.blob(); //画像は blob で受け取る
		ASSETS.imgs[path] = URL.createObjectURL(blob); //URL に変換して保存
		i++;
		document.getElementById("progress-bar").setAttribute('width', 300 * (i / image_paths.length));
		document.getElementById("loadprogress_discription").textContent = path;
	}
	// audio のプリロード
	const audio_res = await fetch("ASSETScontents_audio.txt");
	const audio_data = await audio_res.text();
	const audio_paths = audio_data
		.split("\n")
		.map(line => line.trim())
		.filter(line => line.length > 0);
	i = 0;
	for (const path of audio_paths) {
		const audio = new Audio(path);
		await new Promise(resolve => {
			audio.oncanplaythrough = resolve;
			audio.load();
		});
		ASSETS.audio[path] = audio; // ← Audio オブジェクトを保存
		i++;
		document.getElementById("progress-bar").setAttribute('width', 300 * (i / audio_paths.length));
		document.getElementById("loadprogress_discription").textContent = path;
	}
}
//シナリオファイルの読み込み
async function loadAndParse() {
    const text = await fetch("scenario/1.sc").then(r => r.text());

    const result = text
        .trim()
        .split("\n") // 行ごとに分割
        .map(line => {
            const parts = line.trim().split(/\s+/); // スペース区切り
            const cmd = parts[0];

            // 引数部分を \s → " " に変換
            const args = parts.slice(1).map(arg =>
                arg.replace(/\\s/g, " ")
            );

            return [cmd, args];
        });

    return result;
}

//localStorageの許可を取得 実行順序1
document.getElementById("localStorage_accept").addEventListener('click', async () => {
	is_localStorage_allowed = true;
	localStorage.setItem("is_localStorage_allowed", "true");
	await first_display_change();
	});
document.getElementById('localStorage_not_accept').addEventListener('click', async () => {
	is_localStorage_allowed = false;
	await first_display_change();
});

//ローカルストレージが有効だったら変数を更新する:実行順序2
if (localStorage.getItem("is_localStorage_allowed") == "true") {
	is_localStorage_allowed = true;
	await first_display_change();
}

//最初の画面遷移, body_contents移植
async function loadBody(url) {
	if (ASSETS.html[url] == undefined) {
		const res = await fetch(url);
		ASSETS.html[url] = await res.text();
	}
	const parser = new DOMParser();
	const doc = parser.parseFromString(ASSETS.html[url], "text/html");
	return doc.body.innerHTML;
}

//最初の画面遷移, body_contents移植
async function first_display_change() {
	//scファイル読み取り
	if (current_display === "index") {
		document.getElementById("forusertonoticeloading").textContent = "データの読み込み中です";
		document.getElementById("localStorage_accept").setAttribute("disabled", true);
		document.getElementById("localStorage_not_accept").setAttribute("disabled", true);
		SCENARIO = await loadAndParse();
		document.getElementById("loadprogress").style.display = "block";
		await setASSETS();
	}
	
	loadBody("HTML/title.html").then(bodyContent => {
		document.getElementById("body_contents").innerHTML = bodyContent;
		  
		//ローカルストレージに途中までのデータがあったら「途中からストーリーを再開する」ボタンを設置
		const last_saved_scenario = Number(localStorage.getItem("last_sc_line") || 0);
		if (last_saved_scenario > 0 || last_sc_line > 0) {
			const newbutton_in_buttonblock = document.createElement("Button");
			newbutton_in_buttonblock.textContent = "途中からストーリーを再開する";
			newbutton_in_buttonblock.classList.add("titlebutton");
			newbutton_in_buttonblock.id = "restartbutton";
			document.getElementById("buttonblock").prepend(newbutton_in_buttonblock);
			document.getElementById("restartbutton").addEventListener('click', async () => {
				if (last_saved_scenario > last_sc_line) {
					last_sc_line = last_saved_scenario;
				}
				await display_change_toStoryContinue(last_saved_scenario);
			});
		}
		//各タイトル画面のボタンに対してイベントリスナーを設定する
		document.getElementById("storybutton").addEventListener('click', async () => {
			last_sc_line = 0;
			localStorage.setItem("last_sc_line", "0");
			await display_change_toStory();
		});
		current_display = "title";
	});
	
}

//ストーリーモードへの画面遷移
async function display_change_toStory() {
	current_display = "story";
	const bodyContent = await loadBody("HTML/mode_story.html");
	document.getElementById("body_contents").innerHTML = bodyContent;
	
		document.getElementById("body_contents").innerHTML = bodyContent;
		//各タイトル画面のボタンに対してイベントリスナーを設定する
		//メインメニューは暫定的にシナリオ番号を保存したのちにタイトル画面へ
		document.getElementById("mainmenu").addEventListener('click', async () => {
			if (is_localStorage_allowed) {
				localStorage.setItem("last_sc_line", String(last_sc_line));
			} else {
				if (window.confirm('localStorageが有効ではないためページを閉じるとデータが失われます。\nlocalStorageを有効にしますか？\n※メニューに戻ってもページを離れなければデータは失われません')) {
					is_localStorage_allowed = true;
					localStorage.setItem("is_localStorage_allowed", "true");
					localStorage.setItem("last_sc_line", String(last_sc_line));
				}
			}
			await first_display_change();
		});
		//進むボタンで次のsc実施
		document.getElementById("proceed_sc").addEventListener("click", () => {
			last_sc_line++;
			if (last_sc_line <= SCENARIO.length) {
				do_scenario(last_sc_line);
				if (Number(localStorage.getItem("last_sc_line") || 0) > last_sc_line) {
					last_sc_line = Number(localStorage.getItem("last_sc_line") || 0);
				}
			} else {
				end_of_scenario();
			}
		});
		//最初のシナリオを表示する
		if (!(Number(localStorage.getItem("last_sc_line") || 0) >= 1)) {
			do_scenario(1);
			last_sc_line = 1;
		}
}

async function display_change_toStoryContinue(lss) {
	current_display = "continue";
	await display_change_toStory();
	//シーン切り替え
	do_inaninstant = true;
	for (let i = 1; i <= lss; i++) {
		do_scenario(i);
		if (Number(localStorage.getItem("last_sc_line") || 0) > last_sc_line) {
			i = Number(localStorage.getItem("last_sc_line") || 0);
		}
	}
	do_inaninstant = false;
}

//指定の行番号を探して実行する
/*
function do_scenario(num) {
	let func_return = "do_next";
	function main_doing() {
		//引数のnumは見た目の番号
		num--;
		//scファイルを読む
		const function_name = SCENARIO[num][0];
		const args = SCENARIO[num][1];// 引数配列

		if (typeof window[function_name] === "function") {
			func_return = window[function_name](args);
		} else {
			console.error("未定義の関数:", function_name);
		}	
		localStorage.setItem("last_sc_line", String(num + 1));
	}
	while (func_return === "do_next") {
		main_doing();
		num++;
	}
}
*/
function do_scenario(num) {
    // num は見た目の行番号（1-based）
    let index = num - 1; // 配列用に 0-based に変換

    while (true) {
        const function_name = SCENARIO[index][0];
        const args = SCENARIO[index][1];

        let result = window[function_name](args);

        // セーブ
        localStorage.setItem("last_sc_line", String(index + 1));

        // do_next なら次の行へ
        if (result === "do_next") {
            index++;
            continue;
        }

        // それ以外なら停止
        break;
    }
}


function end_of_scenario() {
	alert("シナリオの終わりです");
}