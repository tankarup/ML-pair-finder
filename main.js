//https://www.koreyome.com/make-spreadsheet-to-json-at-google-apps-script/

let ml_members_data = [];
let chart;
let shown_contents;
let to_update_group_menu = false;

//アイドル選択メニュー
let idol_menu1, idol_menu2;

class DataManager {
	allData =[];
	shownData = [];
	constructor(){
		console.log('Data manager constructed');
		document.getElementById('refresh_data_button').addEventListener('click', () => {
			this.loadDataFromServer();
		});
	}
	loadData(){
		if(!this.loadDataFromStorage()){
			this.loadDataFromServer();
		}
	}
	loadPairData(){
		document.getElementById('loading_text').innerText = 'Loading Game data...';
		document.getElementById('loading').style.visibility="visible";
		$.ajax({
			type: 'GET',
			url: 'https://script.google.com/macros/s/AKfycbwLXU0EfApHHon_kMdD2H8KCALCKiQlqjnu6hr7HfBEEYtsiMSPhpDepg/exec',
			dataType: 'jsonp',
			jsonpCallback: 'jsondata',
			success:  (json) => {//アロー関数にしないと、この中でthisが使えない　https://pisuke-code.com/javascript-class-this-in-callback/
				
				this.allData = this.allData.concat(process_raw_data(json));
				this.shownData = this.allData;

				ml_members_data = this.allData;
				shown_contents = ml_members_data;

				this.saveData();

				init_menu();
				const idol1 = getParam('idol1');
				const idol2 = getParam('idol2');
	
				update_content(idol1, idol2);

				this.load4komaData();
	
				
			},
			error: function () {
				console.log('game data loading error');
			}
		});
	}
	load4komaData(){
		document.getElementById('loading_text').innerText = 'Loading 4koma...';
		document.getElementById('loading').style.visibility="visible";
		$.ajax({
			type: 'GET',
			url: 'https://script.google.com/macros/s/AKfycby9pjvZZlvKwKp23P8DRyzoXKkR4BWVwW9XHIHElP1M7X4NHaHe5bW2kosqZZ92F4_S/exec',
			dataType: 'jsonp',
			jsonpCallback: 'jsondata',
			success: (json) => {
				let yonkoma_list = [];
				for (let i = 0; i < json.length; i++){
					const story = json[i];
					if (story['タイトル'].length < 1) continue;
					let idol = [];
					//アイドルを追加
					for (let j=0; j<8; j++){
						const key = '登場人物' + (j+1);
						idol = idol.concat(story[key].split(/[、,，\n]/).filter(v => v).map(function(item){return member_dic(item.trim());}));
						//idol = idol.concat(story[key].split(/\s*[,、]\s*/));//カンマ区切りで複数のアイドルに分割し、名前の前後に入っている空白は削除する
					}
					//ちょい役アイドルを追加
					let referreds = story['言及'].split(/[、,，\n]/).filter(v => v).map(function(item){return member_dic(item.trim());});//カンマ区切りで複数のアイドルに分割し、名前の前後に入っている空白は削除する
					
					//名前を規格化
					//idol = idol.map(function(item){return member_dic(item)});
					//referreds= referreds.map(function(item){return member_dic(item)});

					const date = new Date(story['公開日']);
					const dateString = 
	
					yonkoma_list.push({
						type: '4コマ',
						group: story['シリーズ'],
						section: '',
						subtitle: '',
						title: story['タイトル'],
						members: idol,
						url: story['URL'],
						view: 'ナビ＞コミック＞4コマ ',
						mv: '',
						refer: referreds,
						date: Number.isNaN(date.getTime()) ? '' : date.toLocaleDateString("ja-JP", {year: "numeric",month: "2-digit",day: "2-digit"}), //無効な日付の場合は空文字にする,
					});
	
				}
				this.allData = this.allData.concat(yonkoma_list);
				this.shownData = this.allData;
				ml_members_data = this.allData;
				shown_contents = this.allData;
				//show_uncouple();
				//save_data(ml_members_data);
				this.saveData();
				init_menu();
				const idol1 = getParam('idol1');
				const idol2 = getParam('idol2');
				update_content(idol1, idol2);
	
				document.getElementById('loading_text').innerText = '';
				//document.getElementById('loading').style.display="none";
	
			},
			error: function () {
				console.log('4koma data loading error');
			}
		});
	}
	loadDataFromStorage(){
		const item = localStorage.getItem('ml_members');
		document.getElementById('loading_text').innerText = '';
		if (item) {
			this.allData = JSON.parse(item);
			this.shownData = this.allData;

			ml_members_data = this.allData;
			shown_contents = this.allData;

			init_menu();
			const idol1 = getParam('idol1');
			const idol2 = getParam('idol2');

			update_content(idol1, idol2);

			return true;
		} else {
			return false;
		}
	}
	loadDataFromServer(){
		this.allData = [];
		this.loadPairData();

	}
	saveData(){
		localStorage.setItem('ml_members', JSON.stringify(this.allData));
	}
}
const dataManager = new DataManager();

// ページ読み込み後の処理
window.onload = function () {

	dataManager.loadData();

}

function show_uncouple(){
	/* カプ数
	cp_count = {
		春香: {
			春香: 0,
			千早: 10,
			美希: 15,
			
		},
		千早: {
			春香: 10,
			千早: 0,
			美希: 20,
		}
	}
	*/
	let cp_count = {};
	//初期化
	for (let i = 0; i < 52; i++){
		cp_count[idol_name_standard_list[i]] = {};
		for (let j = 0; j < 52; j++){
			cp_count[idol_name_standard_list[i]][idol_name_standard_list[j]] = 0;
		}
	}
	//組み合わせ登場回数をカウント
	for (data of ml_members_data){
		const members = data.members;
		for (let i = 0; i < members.length; i++){
			//52人以外のメンバーはスキップ
			if(!cp_count[members[i].id]) continue;
			//名前の順番がバラバラなので、意図的にダブルカウントするためj=0から始めている
			for (let j = 0; j < members.length; j++){
				cp_count[members[i].id][members[j].id] += 1;
			}
		}
	}
	//カウント数がゼロの組み合わせを表示
	for (let i = 0; i < 52; i++){
		const name1 = idol_name_standard_list[i];
		for (let j = 0; j < 52; j++){
			const name2 = idol_name_standard_list[j];
			const count = cp_count[name1][name2];
			if (count == 0) console.log(name1, name2, count);
		}
	}

}

function save_data(data){
    localStorage.setItem('ml_members', JSON.stringify(data));
}

function load_data(){
    const json = JSON.parse(localStorage.getItem('ml_members'));
    return json;
}

function idol_changed(){
	console.log('idol_changed')
	document.getElementById('loading').style.visibility="visible";
	update_url();
	//ローディングを表示するためにちょっと待つ
	setTimeout(() => {
		const idol1 = idol_menu1.selected;//document.getElementById('idols1').value;
		const idol2 = idol_menu2.selected;//document.getElementById('idols2').value;
		const type = document.getElementById('type').value;
		const group = document.getElementById('group').value;
		update_content(idol1, idol2, type, group);
	}, 10);

}



//urlに選択したメニュー項目を追加
function update_url(){
	const idol1 = idol_menu1.selected;//document.getElementById('idols1').value;
	const idol2 = idol_menu2.selected;//document.getElementById('idols2').value;
	const type = document.getElementById('type').value;
	const group = document.getElementById('group').value;

	let params = [];
	params[0] = idol1 ? `idol1=${idol1}`: '';
	params[1] = idol2 ?  `idol2=${idol2}`: '';
	//params[2] = type ? `type=${type}` : '';
	//params[3] = group ? `group=${group}` : '';
	
	const out1 = params.filter(function(value){
		return value;
	}).join('&');
	const out2 = out1 ? `?${out1}` : '';

	history.replaceState(null, null, 'index.html' + out2);
}

document.getElementById('type').addEventListener('change', function(){
	console.log('type menu changed')
    idol_changed();
	//大分類メニューが変更されたら、中分類メニューを合わせて変更
	document.getElementById('group').value = '';
	to_update_group_menu = true;
});
document.getElementById('group').addEventListener('change', function(){
    idol_changed();
});
/*
document.getElementById('idols1').addEventListener('change', function(){
    idol_changed();
});
document.getElementById('idols2').addEventListener('change', function(){
    idol_changed();
});
*/
document.getElementById('include_all_idols').addEventListener('change', function(){
	update_graph(shown_contents);
});

/*
名前が「びっきー(我那覇響)」という形式で登録されている場合、びっきー：役名、我那覇響：アイドル名、として扱い、
{
	label: びっきー,
	id: 響
}
という形式にする。
*/
function member_dic(member_str){
    let member = member_str.trim();
    if (!member) return null;
    const matched = member.match(/(.*)\((.*)\)/);
    if (matched){
		const name = normalize_name(matched[2]);
        return {
            label: `${matched[1]}(${name})`,
            id: name,
        };
    } else {
		const name = normalize_name(member);
        return {
            label: name,
            id: name,
        };
    }
}

function process_raw_data(json){
    let processed = [];
    for (let i = 0; i < json.length; i++){
        const event = json[i];
        let members = [];
        for (let j = 1; j < 10; j++){
            const members_str = event['登場人物' + j];
            if (members_str) {
                members = members.concat(members_str.split(/[、,，\n]/).map(function(item){return member_dic(item)}));
                members = members.filter(v => v);
            }

        }

		const date = new Date(event['開始']);


        processed.push({
            type: event['種類'],
            group: event['グループ'],
            title: event['タイトル'],
            section: event['話数'],
            subtitle: String(event['サブタイトル']),
            members: members,
            url: event['Music'] ? event['Music'] : event['twitter'],
            view: event['閲覧'],
            mv: event['MV'],
            refer: event['言及のみ'].split(/[、,，\n]/).filter(v => v).map(function(item){return member_dic(item.trim());}),
			date: Number.isNaN(date.getTime()) ? '' : date.toLocaleDateString("ja-JP", {year: "numeric",month: "2-digit",day: "2-digit"}), //無効な日付の場合は空文字にする
        });

    }
    return processed;
}

function get_category_list(data, category){
    let category_list = [];
    for (let item of data){
        const type = item[category];
        if (!type) continue;
        if (category_list.indexOf(type) < 0){
            category_list.push(type);
        }
    }
    return category_list;
}

function create_type_menu(){
	const type_list = get_category_list(ml_members_data, 'type');

    let options_html = '';
    for (let type of type_list){
        options_html += `<option value="${type}">${type}</option>`;
    }
    document.getElementById('type').innerHTML = '<option value="">大分類</option>' + options_html;
}
function create_group_menu(){
	let group_menus = [];
	const type = document.getElementById('type').value;
	for (const item of ml_members_data){
		if (type === item.type || type === '') group_menus.push(item.group);
	}
	group_menus = Array.from(new Set(group_menus)).filter(Boolean);

    let options_html = '';
    for (let type of group_menus){
        options_html += `<option value="${type}">${type}</option>`;
    }
    document.getElementById('group').innerHTML = '<option value="">中分類</option>' + options_html;
}


function get_person_list(data, key){
    let persons = [];
    for (let i = 0; i< data.length; i++){
        persons = persons.concat(data[i][key].map(function(item){return item ? item.id : null;}));
    }
    //重複を削除
    let person_list = persons.filter(function (x, i, self) {
        return self.indexOf(x) === i;
    });
    //空白除去
    person_list = person_list.filter(n => n);

    //ソート
    person_list.sort(function(a,b){
        if( a < b ) return -1;
        if( a > b ) return 1;
        return 0;
    });
    return person_list;
}

/*
アイドルの名前一覧
標準的な名前の並びと、標準リストに載らなかった分を追加したもの
[春香, 千早, ... , 志希, ...]
*/
function get_idol_list(){
	const person_list = get_person_list(ml_members_data, 'members');
	let idol_list = idol_name_standard_list;

	for (let person of person_list){
		if (idol_list.indexOf(person) == -1) idol_list.push(person);
	}
	return idol_list;

}

function init_menu(){

    const idol_list = get_idol_list();

    //アイドルフィルターメニュー作成
    let options_html = '';
    for (let idol of idol_list){
        //options_html += `<option value="${idol}">${idol}</option>`;
    }

    //document.getElementById('idols1').innerHTML = '<option value="">登場人物1</option>' + options_html;
    //document.getElementById('idols2').innerHTML = '<option value="">登場人物2</option>' + options_html;

	idol_menu1 = new iconMenu('idol_selector1');
	idol_menu2 = new iconMenu('idol_selector2');
	for (let idol of idol_list){
		idol_menu1.addOption(idol);
		idol_menu2.addOption(idol);
		
	}


    create_type_menu();
	create_group_menu();

    init_graph();
}
//https://www-creators.com/archives/4463
function getParam(name, url) {
    if (!url) url = window.location.href;
    name = name.replace(/[\[\]]/g, "\\$&");
    var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
        results = regex.exec(url);
    if (!results) return null;
    if (!results[2]) return '';
    return decodeURIComponent(results[2].replace(/\+/g, " "));
}

function youtube_img(url){
    if (url.indexOf('www.youtube.com') > -1){
        const v = getParam('v', url);
        return (v ? `http://img.youtube.com/vi/${v}/2.jpg` : null);
    }
    if (url.indexOf('youtu.be') > -1){
        const match = url.match(/youtu\.be\/([^?]*)/)
        //https://youtu.be/SbDazb8934I?t=112
        return (match[1] ? `http://img.youtube.com/vi/${match[1]}/2.jpg` : null);
    }
    return null;

}

function get_link_str(url, default_text){
    
	//youtubeのリンクだったら
	const img = youtube_img(url);
	if (img){
		return `<img src="${img}">`;
	}
	//twitterのリンクだったら
	if (url.indexOf('twitter') > -1){
		return `<img src="twitter.png" style="width: 16px; height:16px;">`;
	}

	return default_text;
    return (img ? `<img src="${img}">` : default_text);
}

function content_link(content, key){

    let crlf = false;
    let title = content[key];
    if (title.length < 2) crlf = true;

    if (content.url.length > 1){
        const link_str = get_link_str(content.url, '<img src="open.png" style="width: 16px; height:16px;">');
        if (!crlf) title += '<br>';
        title += ` <a target="_blank" href="${content.url}">${link_str}</a>`;
        crlf = true;
    }
    if (content.mv.length > 1){
        const link_str = get_link_str(content.mv, '[MV]');
        if (!crlf) title += '<br>';
        title += ` <a target="_blank" href="${content.mv}">${link_str}</a>`;
    }

    return title;
}

function members_id_list(members){
    return members.map(function(item){
        return item ? item.id : null;
    });
}

function update_content(idol1_name, idol2_name, type_str, group_str){
	//ローディング表示
	console.log('update_content: ', idol1_name, idol2_name, type_str, group_str);
	document.getElementById('loading').style.visibility="visible";

    const idol1 = idol1_name ? idol1_name : '';
    const idol2 = idol2_name ? idol2_name : '';
    const type = type_str ? type_str : '';
	const group = group_str ? group_str : '';
    idol_menu1.select(idol1);
    idol_menu2.select(idol2);
    document.getElementById('type').value = type;
	document.getElementById('group').value = group;

    let html = '';
    let index = 1;

	//表示内容をクリア
	vue_pairs.reset();

    let filtered_contents = [];
    for (let content of  ml_members_data){
        const all_members = members_id_list(content.members.concat(content.refer));
		const refered_members = members_id_list([].concat(content.refer));
		


        if ((all_members.indexOf(idol1) >= 0 || !idol1)
			 && (all_members.indexOf(idol2) >= 0 || !idol2)
			 && (content.type.indexOf(type) >= 0 || !type)
			 && (content.group.indexOf(group) >= 0 || !group)){

				
				//指定されたアイドルが全員言及のみの場合はリストに入れない
				if (refered_members.indexOf(idol1) >= 0 && refered_members.indexOf(idol2) >= 0){
					continue;
				}
				

			//リストに追加	
            filtered_contents.push(content);

            //URLデータがあるものはリンクをはる
            let view = content_link(content, 'view');

            //フィルター対象アイドルの名前を強調
            function get_decorated_members_str(members, idol1, idol2){
                let members_str = '';
                for (let member of members){
                    if (member.id == idol1 || member.id == idol2){
                        members_str += `<b>${member.label}</b>`;
                    } else {
                        members_str += member.label;
                    }
                    members_str += ', ';
                }
                //最後に付けた', 'を削除
                members_str = members_str.slice(0, -2);
                return members_str;
            }
            const members_str = get_decorated_members_str(content.members, idol1, idol2);
            const referred_members_str = content.refer ? get_decorated_members_str(content.refer, idol1, idol2) : '';


            let title = content.title;
            if (String(content.section).length > 0) title += `<span style="font-size: smaller; font-style: italic;"> ${'　'+content.section}</span>`;
            if (content.subtitle.length > 0) title += `<span style="font-size: smaller; font-style: italic;"> ${'　'+content.subtitle}</span>`;



			/*
            html += `
            <tr>
                <td>${index}</td>
                <td>${content.type}</td>
                <td>${content.group}</td>
                <td>${title}</td>
                <td>${members_str}</td>
                <td>${referred_members_str}</td>
                <td style="font-size:smaller;">${view}</td>
            </tr>`;
			*/
			if (index >1000) continue;
			vue_pairs.items.push({
				index: index,
				type: content.type,
				group: content.group,
				title: title,
				members: members_str,
				referred_members: referred_members_str,
				view: view,
				date: content.date,

			});
            index += 1;
			

        }


    }
	/*
	let tbody = document.getElementById('pairs-table-body');
	tbody.innerHTML = '';
	tbody.insertAdjacentHTML('beforeend', html);
	*/
	update_graph(filtered_contents);
	shown_contents = filtered_contents;
	show_additional_information(idol1, idol2);

	//中分類メニューを必要に応じて更新
	if (to_update_group_menu) {
		create_group_menu();
		to_update_group_menu = false;
	}

	//ローディング非表示
	document.getElementById('loading').style.visibility="hidden";
}
//シアター52人のアイドルか？
function is_theater_idol(idol){
	const index = idol_name_standard_list.indexOf(idol);
	if (index < 0) return false;
	if (index > 52 -1) return false;
	return true;
}
function show_additional_information(idol1, idol2){

	const list_item_class = "list-group-item py-1";
	
	let html = '';
	if (is_theater_idol(idol1) || is_theater_idol(idol2)){
		html += '<h2 class="h3 bg-info text-light">外部ページを探す</h2>'
		html += '<ul class="list-group">';
		if (is_theater_idol(idol1) && is_theater_idol(idol2)){
			html += `<li class="list-group-item py-2 list-group-item-info">グリマス日和：<a target="_blank" href="https://greemas.doorblog.jp/search?q=${idol1}+${idol2}背景出演カードまとめ"><mark>${idol1}</mark>のカードの背景に<mark>${idol2}</mark>が出演してるかも</a>, <a target="_blank" href="https://greemas.doorblog.jp/search?q=${idol2}+${idol1}背景出演カードまとめ"><mark>${idol2}</mark>のカードの背景に<mark>${idol1}</mark>が出演してるかも</a></li>`;
		}
		if (is_theater_idol(idol1)){
			html += `<li class="${list_item_class}">${idol_info[idol1].name}の情報まとめ：<a target="_blank" href="https://imasml-theater-wiki.gamerch.com/${idol_info[idol1].fullname}">ミリシタ攻略まとめwiki</a>, <a target="_blank" href="https://imas.gamedbs.jp/mlth/chara/show/${idol_info[idol1].id}">ミリシタDB</a>, <a target="_blank" href="https://w.atwiki.jp/ml-story/tag/${idol_info[idol1].fullname}">ミリシタストーリーまとめ</a></li>`;
		}
		if (is_theater_idol(idol2)){
			html += `<li class="${list_item_class}">${idol_info[idol2].name}の情報まとめ：<a target="_blank" href="https://imasml-theater-wiki.gamerch.com/${idol_info[idol2].fullname}">ミリシタ攻略まとめwiki</a>, <a target="_blank" href="https://imas.gamedbs.jp/mlth/chara/show/${idol_info[idol2].id}">ミリシタDB</a>, <a target="_blank" href="https://w.atwiki.jp/ml-story/tag/${idol_info[idol2].fullname}">ミリシタストーリーまとめ</a></li>`;

		}


		html += '</ul>';
	}


	document.getElementById('additional_info').innerHTML = html;
}
function init_graph(){

    chart = Highcharts.chart('graph-container', {
        chart: {
            type: 'column'
        },
        title: {
            text: 'アイドルの登場回数(登録データ数)',
            verticalAlign: 'bottom',
            y: -10,
        },
        subtitle: {
            text: '註：各データの粒度が違うので数値の比較はできません',
            verticalAlign: 'bottom',
        },
        xAxis: {
            categories: []
        },
        yAxis: {
            min: 0,
            title: {
                text: '登録データ数(言及のみのケースを除く)',
				style: {
					color: 'black',
				}
            },
            stackLabels: {
                enabled: true,
                style: {
                    fontWeight: 'normal',
                    color: ( // theme
                        Highcharts.defaultOptions.title.style &&
                        Highcharts.defaultOptions.title.style.color
                    ) || 'black'
                }
            }
        },
        legend: {
            align: 'right',
            x: 0,
            verticalAlign: 'top',
            y: 0,
            floating: true,
            backgroundColor:
                Highcharts.defaultOptions.legend.backgroundColor || 'white',
            borderColor: '#CCC',
            borderWidth: 1,
            shadow: false
        },

        plotOptions: {
            column: {
                stacking: 'normal',
                dataLabels: {
                    enabled: false
                }
            }
        },
        series: [{}]
    });
}

function content_type_list(contents){
    //種類の一覧を作成
    let type_names = [];
    for (let content of contents){
        const type_name = content.type;
        if (type_names.indexOf(type_name) == -1){
            type_names.push(type_name);
        }
    }
    return type_names;
}

function idol_name_list(contents){
    //アイドルの名前一覧を作成
    let idol_list = [];
    for (let content of contents){
        for (let member of content.members){
            idol_list.push(member.id);
        }
    }
	//-------
	
	//データ数がゼロのアイドルもグラフに入れる
	//ミリシタ52人だけ
	if (document.getElementById('include_all_idols').checked){
		for (let i = 0; i < 52; i++){
			const name = idol_name_standard_list[i];
			//リストに無かったら追加
			if (idol_list.indexOf(name) == -1){
				idol_list.push(name);
			}
		}
	}

	
	//--------

    //アイドルの名前一覧
    const idol_names = idol_list.filter(function (x, i, self) {
        return self.indexOf(x) === i;
    });

    return idol_names;
}

function update_graph(contents){
    while(chart.series.length > 0)
        chart.series[0].remove(true);


    const type_names = content_type_list(contents);
    const count_list = toCountList(contents);

    let idol_names = [];
    for (let item of count_list){
        idol_names.push(item.name);
    }
    //document.getElementById('graph').innerHTML = JSON.stringify(toCountList(idol_list));
	


    chart.xAxis[0].setCategories(idol_names);
    //chart.series[0].data[0].update({y: 80000});
    let new_series = {};
    for (let type_name of type_names){
        let new_data = [];
        for (let item of count_list){
            new_data.push(item[type_name]);
        }
        chart.addSeries({
            name: type_name,
            data: new_data,
        });
    }


    chart.redraw();

}

/*
    [{
        name: ロコ,
        total: 10,
        漫画: 3,
        ドラマCD: 5,
    }]
*/
function toCountList(contents) {

    //アイドルの名前一覧
    const idol_list = idol_name_list(contents);

    //種類の一覧を作成
    let type_names = content_type_list(contents);

    //辞書形式で種類ごとにデータ個数をカウント
    let count_dic = {};
    //辞書の初期化
    for (let idol_name of idol_list){
        count_dic[idol_name] = {};
        for (let type of type_names){
            count_dic[idol_name][type] = 0;
        }
        count_dic[idol_name]['total'] = 0;
    }
    //カウント
    for (let content of contents){
        for (let idol of content.members){
            count_dic[idol.id][content.type] += 1;
            count_dic[idol.id]['total'] += 1;
        }
    }
    //console.log(count_dic);
    //データを並べ替えたいので配列に変更
    let count_list = [];
    for (let key in count_dic){
        let new_list = count_dic[key];
        new_list['name'] = key;
        count_list.push(new_list);
    }


    count_list.sort(function(a,b){
        if( a.total > b.total ) return -1;
        if( a.total < b.total ) return 1;
        return 0;
    });

    return count_list;
}

let idol_name_standard_list = [];// 標準的なアイドル名の並び　[春香, 千早, ...]
let idol_name_dic = {}; //idol_name_dic[天海春香] → 春香
/*
normalize_name(天海春香)→ 春香
*/
function normalize_name(name){
    const nomalized_name = idol_name_dic[name];
    return nomalized_name ? nomalized_name : name;
}

const idol_names = `春香	天海春香	
千早	如月千早	
美希	星井美希	
雪歩	萩原雪歩	
やよい	高槻やよい	
真	菊地真	
伊織	水瀬伊織	
貴音	四条貴音	
律子	秋月律子	
あずさ	三浦あずさ	
亜美	双海亜美	
真美	双海真美	
響	我那覇響	
未来	春日未来	
静香	最上静香	
翼	伊吹翼	
琴葉	田中琴葉	
エレナ	島原エレナ	
美奈子	佐竹美奈子	
恵美	所恵美	
まつり	徳川まつり	
星梨花	箱崎星梨花	
茜	野々原茜	
杏奈	望月杏奈	
ロコ	路子	伴田路子
百合子	七尾百合子	
紗代子	高山紗代子	
亜利沙	松田亜利沙	
海美	高坂海美	
育	中谷育	
朋花	天空橋朋花	
エミリー	エミリースチュアート	エミリー スチュアート	エミリー　スチュアート	エミリー・スチュアート
志保	北沢志保	
歩	舞浜歩	
ひなた	木下ひなた	
可奈	矢吹可奈	
奈緒	横山奈緒	
千鶴	二階堂千鶴	
このみ	馬場このみ	
環	大神環	
風花	豊川風花	
美也	宮尾美也	
のり子	福田のり子	
瑞希	真壁瑞希	
可憐	篠宮可憐	
莉緒	百瀬莉緒	
昴	永吉昴	
麗花	北上麗花	
桃子	周防桃子	
ジュリア	ジュリア	
紬	白石紬	
歌織	桜守歌織	
小鳥	音無小鳥	
美咲	青羽美咲	
社長	高木順二朗	高木社長
げき子	劇場の魂	劇子
黒井社長	黒井崇男	
でんでんむすくん	でんでんむす君	
いぬ美	イヌ美
源P	源Ｐ
ハリ子	はり子
例の星	スタナビ	スタナビ君	スターナビゲーター
謎の猫	例の猫
`;

let idol_info = {};
/* 
idol_info = {
	春香:{
		fullname: 天海春香,
		id: 1,
		name: 春香,
	},

*/
let idol_lines = idol_names.split('\n');
let index = 1;
for (let idol_line of idol_lines){
	if (idol_line.length < 1) continue;
    let names = idol_line.split('\t');
    names = names.map(function(name){
        return name.trim();
    });
	idol_name_standard_list.push(names[0]);
    for (let i = 0; i < names.length; i++){
        if (idol_name_dic[names[i]]) continue;
        idol_name_dic[names[i]] = names[0];
    }
	idol_info[names[0]] = {
		fullname: names[1],
		id: index,
		name: names[0],
	};
	index += 1;

}


const vue_pairs = Vue.createApp({
	data() {
	  return {
		items: [
		],
		display_per_page: 10000,
		current_page: 1,
		min_page:1,
		do_sort: false,
	  }
	},
	computed: {
		display_items(){
			const start_index = (this.current_page-1)*this.display_per_page;
			return this.sorted_items.slice(start_index, start_index + this.display_per_page);
		},
		max_page(){
			return Math.ceil(this.items.length/this.display_per_page);
		},
		sorted_items(){
			if (!this.do_sort) return this.items;

			return this.items.toSorted((a,b) => {
				//日付が入っていなかったら後ろにまわす
				if (!a.date && b.date) return 1;
				if(a.date && !b.date) return -1;
				if (!a.date && !b.date) return 0; 
				//ソート
				if (a.date > b.date){
					return 1;
				} else if (a.date < b.date){
					return -1;
				} else {
					return 0;
				}
			});
		},
	},
	methods: {
		reset(){
			this.items = [];
			this.current_page = 1;
		},
		move_page(move){
			this.current_page += move;
			if (this.current_page < this.min_page) this.current_page = this.min_page;
			if (this.current_page > this.max_page) this.current_page = this.max_page;			
		},
		toggle_sort(){
			this.do_sort = !this.do_sort;
		},
	},
}).mount('#pairs');


  