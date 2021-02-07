//https://www.koreyome.com/make-spreadsheet-to-json-at-google-apps-script/

let ml_members_data = [];

// ページ読み込み後の処理
window.onload = function () {
    // 【main-script】 を実行

    getJsonp_GAS();
    /*
    const data = load_data();
    ml_members_data = process_raw_data(data);
    init_menu();
    update_content('', '');
    */
}

// 【main-script】 スプレッドシート内の記述をjsonデータとして読み込み html 内へ入れ込む
function getJsonp_GAS() {
    $.ajax({
        type: 'GET',
        url: 'https://script.google.com/macros/s/AKfycbwLXU0EfApHHon_kMdD2H8KCALCKiQlqjnu6hr7HfBEEYtsiMSPhpDepg/exec',
        dataType: 'jsonp',
        jsonpCallback: 'jsondata',
        success: function (json) {
            save_data(json);
            ml_members_data = process_raw_data(json);
            init_menu();
            update_content('', '');

            
        }
    });
}

function save_data(data){
    localStorage.setItem('ml_members', JSON.stringify(data));
}

function load_data(){
    const json = JSON.parse(localStorage.getItem('ml_members'));
    return json;
}

function idol_changed(){
    const idol1 = document.getElementById('idols1').value;
    const idol2 = document.getElementById('idols2').value;
    update_content(idol1, idol2);
}

document.getElementById('idols1').addEventListener('change', function(){
    idol_changed();
});
document.getElementById('idols2').addEventListener('change', function(){
    idol_changed();
});
function process_raw_data(json){
    let processed = [];
    for (let i = 0; i < json.length; i++){
        const event = json[i];
        let members = [];
        for (let j = 1; j < 7; j++){
            const members_str = event['登場人物' + j];
            members = members.concat(members_str.split(/[、,・\n]/));
        }
        members = members.filter(v => v);
        members = members.map(function(item){
            return normalize_name(item.trim());
        });
        processed.push({
            type: event['種類'],
            group: event['グループ'],
            title: event['タイトル'],
            members: members,
            url: event['URL'],
            view: event['閲覧'],
            mv: event['MV'],
        });
    }
    return processed;
}
function get_person_list(data, key){
    let persons = [];
    for (let i = 0; i< data.length; i++){
        persons = persons.concat(data[i][key]);
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
function init_menu(){

    const idol_list = get_person_list(ml_members_data, 'members');

    //アイドルフィルターメニュー作成
    let options_html = '';
    for (let idol of idol_list){
        options_html += `<option value="${idol}">${idol}</option>`;
    }

    document.getElementById('idols1').innerHTML = '<option value="">登場人物1</option>' + options_html;
    document.getElementById('idols2').innerHTML = '<option value="">登場人物2</option>' + options_html;

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

function get_link_str(url, text){
    const img = youtube_img(url);
    return (img ? `<img src="${img}">` : text);
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

function update_content(idol1, idol2){
    let html = '';
    html += '<table class="table table-sm table-striped">'
    html += `<thead class="thead-dark">
                <tr>
                    <th>カテゴリー</th>
                    <th>イベント</th>
                    <th>タイトル</th>
                    <th>メンバー</th>
                    <th>アクセス</th>
                </tr>
            </thead>
            <tbody class="">`;

    for (let content of  ml_members_data){

        if ((content.members.indexOf(idol1) >= 0 || idol1 == '') && (content.members.indexOf(idol2) >= 0 || idol2 == '')){
            //URLデータがあるものはリンクをはる
            let view = content_link(content, 'view');

            //フィルター対象アイドルの名前を強調
            let members_str = content.members.join(', ');
            if (idol1.length > 0) members_str = members_str.replace(idol1, `<b>${idol1}</b>`);
            if (idol2.length > 0) members_str = members_str.replace(idol2, `<b>${idol2}</b>`);

            html += `
            <tr>
                <td>${content.type}</td>
                <td>${content.group}</td>
                <td>${content.title}</td>
                <td>${members_str}</td>
                <td>${view}</td>
            </tr>`;
        }
    }
    html += `
        </tbody>
    </table>`;
    document.getElementById('whole').innerHTML = html;
}

function normalize_name(name){
    const long_name = `天海春香
    如月千早
    星井美希
    萩原雪歩
    高槻やよい
    菊地真
    水瀬伊織
    四条貴音
    秋月律子
    三浦あずさ
    双海亜美
    双海真美
    我那覇響
    春日未来
    最上静香
    伊吹翼
    田中琴葉
    島原エレナ
    佐竹美奈子
    所恵美
    徳川まつり
    箱崎星梨花
    野々原茜
    望月杏奈
    ロコ
    七尾百合子
    高山紗代子
    松田亜利沙
    高坂海美
    中谷育
    天空橋朋花
    エミリー
    北沢志保
    舞浜歩
    木下ひなた
    矢吹可奈
    横山奈緒
    二階堂千鶴
    馬場このみ
    大神環
    豊川風花
    宮尾美也
    福田のり子
    真壁瑞希
    篠宮可憐
    百瀬莉緒
    永吉昴
    北上麗花
    周防桃子
    ジュリア
    白石紬
    桜守歌織
    音無小鳥
    青羽美咲
    `;
    const short_name = `
    春香
千早
美希
雪歩
やよい
真
伊織
貴音
律子
あずさ
亜美
真美
響
未来
静香
翼
琴葉
エレナ
美奈子
恵美
まつり
星梨花
茜
杏奈
ロコ
百合子
紗代子
亜利沙
海美
育
朋花
エミリー
志保
歩
ひなた
可奈
奈緒
千鶴
このみ
環
風花
美也
のり子
瑞希
可憐
莉緒
昴
麗花
桃子
ジュリア
紬
歌織
小鳥
美咲
    `;
    const l_names = multiline_string_to_list(long_name);
    const s_names = multiline_string_to_list(short_name);

    for (let i = 0; i < l_names.length; i++){
        const idol_name = l_names[i];
        if (name.startsWith(idol_name)){
            return s_names[i];
        }
        
    }
    return name;
}

function multiline_string_to_list(string){
    let members = string.split('\n');
    members = members.map(function(item){
    	return item.trim();
    });
    members = members.filter(v => v);

    return members;
}