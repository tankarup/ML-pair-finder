//https://www.koreyome.com/make-spreadsheet-to-json-at-google-apps-script/

let ml_members_data = [];
let chart;

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
            ml_members_data = ml_members_data.concat(process_raw_data(json));
            init_menu();
            const idol1 = getParam('idol1');
            const idol2 = getParam('idol2');

            update_content(idol1, idol2);
            get_4koma_Jsonp_GAS();

            
        }
    });
}
function get_4koma_Jsonp_GAS() {
    $.ajax({
        type: 'GET',
        url: 'https://script.google.com/macros/s/AKfycbxpOMNXs_wQA0H-i2Y3KXlTOa-fMKz6ltr1eUwMCD8LQJ94QDsg8GEY/exec',
        dataType: 'jsonp',
        jsonpCallback: 'jsondata',
        success: function (json) {
            let yonkoma_list = [];
            for (let i = 0; i < json.length; i++){
                const story = json[i];
                if (story['タイトル'].length < 1) continue;
                let idol = [];
                //アイドルを追加
                for (let j=0; j<7; j++){
                    const key = '登場人物' + (j+1);
                    if (story[key].length < 1) continue;
                    idol.push(story[key]);
                }
                //社長、プロデューサー、そらさんを追加
                const staffs = ['社長', 'プロデューサー', 'そら'];
                for (let staff of staffs){
                    if (story[staff] != ''){
                        idol.push(staff);
                    }
                }
                yonkoma_list.push({
                    type: '漫画',
                    group: '4コマ',
                    section: '',
                    subtitle: '',
                    title: story['タイトル'],
                    members: idol,
                    url: story['URL'],
                    view: 'ナビ＞コミック＞4コマ, Twitter',
                    mv: '',
                });

            }
            ml_members_data = ml_members_data.concat(yonkoma_list);
            init_menu();
            const idol1 = getParam('idol1');
            const idol2 = getParam('idol2');
            update_content(idol1, idol2);

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
    const type = document.getElementById('type').value;
    update_content(idol1, idol2, type);
}
document.getElementById('type').addEventListener('change', function(){
    idol_changed();
});
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
        for (let j = 1; j < 10; j++){
            const members_str = event['登場人物' + j];
            if (members_str) {
                members = members.concat(members_str.split(/[、,・，\n]/));
            }

        }
        members = members.filter(v => v);
        members = members.map(function(item){
            return normalize_name(item.trim());
        });
        processed.push({
            type: event['種類'],
            group: event['グループ'],
            title: event['タイトル'],
            section: event['話数'],
            subtitle: event['サブタイトル'],
            members: members,
            url: event['Music'],
            view: event['閲覧'],
            mv: event['MV'],
        });
    }
    return processed;
}

function get_type_list(data){
    let type_list = [];
    for (let item of data){
        const type = item.type;
        if (!type) continue;
        if (type_list.indexOf(type) < 0){
            type_list.push(type);
        }
    }
    return type_list;
}

function add_type_menu(type_list){
    let options_html = '';
    for (let type of type_list){
        options_html += `<option value="${type}">${type}</option>`;
    }
    document.getElementById('type').innerHTML = '<option value="">種類</option>' + options_html;
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

    add_type_menu(get_type_list(ml_members_data));

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

function update_content(idol1_name, idol2_name, type_str){
    const idol1 = idol1_name ? idol1_name : '';
    const idol2 = idol2_name ? idol2_name : '';
    const type = type_str ? type_str : '';
    document.getElementById('idols1').value = idol1;
    document.getElementById('idols2').value = idol2;
    document.getElementById('type').value = type;
    let html = '';
    html += '<table class="table table-sm table-striped">'
    html += `<thead class="thead-dark">
                <tr>
                    <th>種類</th>
                    <th>イベント</th>
                    <th>タイトル</th>
                    <th>メンバー</th>
                    <th>アクセス</th>
                </tr>
            </thead>
            <tbody class="">`;
    let filtered_contents = [];
    for (let content of  ml_members_data){

        if ((content.members.indexOf(idol1) >= 0 || !idol1) && (content.members.indexOf(idol2) >= 0 || !idol2) && (content.type.indexOf(type) >= 0 || !type)){
            filtered_contents.push(content);
            //URLデータがあるものはリンクをはる
            let view = content_link(content, 'view');

            //フィルター対象アイドルの名前を強調
            let members_str = '';
            for (let member of content.members){
                if (member == idol1 || member == idol2){
                    members_str += `<b>${member}</b>`;
                } else {
                    members_str += member;
                }
                members_str += ', ';
            }
            //最後に付けた', 'を削除
            members_str = members_str.slice(0, -2);

            html += `
            <tr>
                <td>${content.type}</td>
                <td>${content.group}</td>
                <td>${content.title} ${content.section} ${content.subtitle}</td>
                <td>${members_str}</td>
                <td>${view}</td>
            </tr>`;
        }
    }
    html += `
        </tbody>
    </table>`;
    document.getElementById('whole').innerHTML = html;
    update_graph(filtered_contents);
}
function init_graph(){

    chart = Highcharts.chart('graph-container', {
        chart: {
            type: 'column'
        },
        title: {
            text: '登録データ数'
        },
        subtitle: {
            text: '註：各データの粒度が違うので数値の比較はできません'
        },
        xAxis: {
            categories: []
        },
        yAxis: {
            min: 0,
            title: {
                text: '登録データ数'
            },
            stackLabels: {
                enabled: true,
                style: {
                    fontWeight: 'bold',
                    color: ( // theme
                        Highcharts.defaultOptions.title.style &&
                        Highcharts.defaultOptions.title.style.color
                    ) || 'gray'
                }
            }
        },
        legend: {
            align: 'right',
            x: -30,
            verticalAlign: 'top',
            y: 70,
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
        idol_list = idol_list.concat(content.members);
    }
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
        for (let idol_name of content.members){
            count_dic[idol_name][content.type] += 1;
            count_dic[idol_name]['total'] += 1;
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

function normalize_name(name){
    const idol_names = `
    春香,天海春香
    千早,如月千早
    美希,星井美希
    雪歩,萩原雪歩
    やよい,高槻やよい
    真,菊地真
    伊織,水瀬伊織
    貴音,四条貴音
    律子,秋月律子
    あずさ,三浦あずさ
    亜美,双海亜美
    真美,双海真美
    響,我那覇響
    未来,春日未来
    静香,最上静香
    翼,伊吹翼
    琴葉,田中琴葉
    エレナ,島原エレナ
    美奈子,佐竹美奈子
    恵美,所恵美
    まつり,徳川まつり
    星梨花,箱崎星梨花
    茜,野々原茜
    杏奈,望月杏奈
    ロコ,ロコ
    百合子,七尾百合子
    紗代子,高山紗代子
    亜利沙,松田亜利沙
    海美,高坂海美
    育,中谷育
    朋花,天空橋朋花
    エミリー,エミリー
    志保,北沢志保
    歩,舞浜歩
    ひなた,木下ひなた
    可奈,矢吹可奈
    奈緒,横山奈緒
    千鶴,二階堂千鶴
    このみ,馬場このみ
    環,大神環
    風花,豊川風花
    美也,宮尾美也
    のり子,福田のり子
    瑞希,真壁瑞希
    可憐,篠宮可憐
    莉緒,百瀬莉緒
    昴,永吉昴
    麗花,北上麗花
    桃子,周防桃子
    ジュリア,ジュリア
    紬,白石紬
    歌織,桜守歌織
    小鳥,音無小鳥
    美咲,青羽美咲
    社長,高木順二朗
    劇子,劇場の魂
    
    `;

    let idols = idol_names.split('\n');
    for (let idol of idols){
        let names = idol.split(',');
        names = names.map(function(name){
            return name.trim();
        });
        for (let i = 1; i < names.length; i++){
            if (name.startsWith(names[i])){
                return names[0];
            }
        }
    }
    return name;
}
