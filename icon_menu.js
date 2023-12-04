const icon_size = 60;

class iconMenu {
	elem_id;
	root_elem;
	window_elem;
	selected_elem;
	options = [];
	selected = null;

	constructor(elem_id){
		this.elem_id = elem_id;

		this.root_elem = document.getElementById(elem_id);
		this.root_elem.classList.add('dropdown_container');
		const html = `
		<div>
			<button type="button" class="btn btn-primary"><span id="${elem_id}_selected">アイドル1▼</span></button>
			<div id="${elem_id}_window" class="popup"></div>
		</div>
		`;
		this.root_elem.innerHTML=html;

		this.window_elem = document.getElementById(`${elem_id}_window`);
		this.window_elem.style.width = `${icon_size*10+2}px`;

		this.selected_elem = document.getElementById(`${elem_id}_selected`);

		this.initMenuBehaviour();
		this.addDefaultIdols();
	};
	addDefaultIdols(){
		const unselected_option = this.addOption(null, 'Unselected', 'icons/unselected.png', '#000', 1);//非選択用
		//非選択用アイコンを選択（表示）する
		this.selected_elem.innerHTML = this.labelSpan(unselected_option, 40);
		
		//this.select("unselected");

		for (const idol of defalult_idols){
			this.addOption(idol.label, idol.label, idol.icon, idol.color, idol.size);
		}

	}
	onChange(){
		idol_changed();
	}
	select(selected){
		let selected_value = null;
		for (const option of this.options){
			if(option.value === selected){
				selected_value = selected;
				break;
			}
		}
		const selected_option = this.options.find((option) => option.value === selected_value);
		this.selected_elem.innerHTML = this.labelSpan(selected_option, 40);

		if (this.selected !== selected_value){
			this.selected = selected_value
			this.onChange();
		}
		

		

		return;

	}
	labelSpan(option, height){
		let span = "";
		if (option.icon){
			span = `
				<img
					src="${option.icon}"
					height="${height-2}"
					alt="${option.label}"
					title="${option.label}"
					style="
						border-radius: 40%;
						border: 1px solid ${option.color};					
					"
					onMouseOver="
					this.style.boxShadow = '0 0 3px 4px ${option.color}';
					"
					onMouseOut="
						this.style.boxShadow = '0 0 0 0px #fff';
					"
				>
			`;
		} else {
			span = `
				<span
					style="
						border-radius: 0.4em;
						border: 1px solid ${option.color};
						color: ${option.color};
						background-color: white;
						margin:auto;
						max-height: 100%;
						overflow: hidden;
					"

				>
					${option.label}
				</span>
			`;
		}
		const html = `
		<div
			style="
				height: ${height}px;
				//width: ${height}px;
				padding: 1px;
				display: flex;
			"
		>
			${span}
		</div>
		`;
		return html;
	}
	initMenuBehaviour(){
		//アイドル一覧メニューの表示・非表示処理
		Array.from(document.getElementsByClassName('dropdown_container')).forEach(function(element){
			function isLefty(elem){
				const rect = elem.getBoundingClientRect();
				const w = window.innerWidth;
				const h = window.innerHeight;
				const left_gap = rect.left;
				const right_gap = w - rect.right;
				return left_gap < right_gap;
			}

			element.addEventListener('mouseover', function(){
				Array.from(this.getElementsByClassName('popup')).forEach(function(popup){
					popup.style.display = 'inline-block';
					if (isLefty(element)){
						popup.classList.add('left0');
						popup.classList.remove('right0');				
					} else {
						popup.classList.remove('left0');
						popup.classList.add('right0');	
					}
				});
			});
			element.addEventListener('mouseout', function(){
				Array.from(this.getElementsByClassName('popup')).forEach(function(popup){
					popup.style.display = 'none';
				});
			});
		});
	};
	//メニューを追加する。成功したら追加したオプションを返す
	addOption(value, label="", icon="", color="#111", size=0.6){
		//重複は追加しない
		if (this.options.find((option) => option.value === value) !== undefined) return;

		const lbl = label ? label : value;
		const option = {
			value,
			label: lbl,
			icon,
			color,
		}
		this.options.push(option);

		const html = `
			<div
				id="${this.elem_id}_${value}"
				style="
					float:left;

				"
			>
				<span>${this.labelSpan(option, icon_size*size)}</span>
			</div>
		`;

		const tempEl = document.createElement('div');
		tempEl.innerHTML = html;
		this.window_elem.appendChild(tempEl.firstElementChild);

		const elem = document.getElementById(`${this.elem_id}_${value}`);
		console.log(elem)
		elem.addEventListener('click', () => {
			console.log(value);
			this.select(value);
		})

		return option;
	}
	
}

const default_idols_text = `春香	haruka	#e22b30	1
千早	chihaya	#2743d2	1
美希	miki	#b4e04b	1
雪歩	yukiho	#d3dde9	1
やよい	yayoi	#f39939	1
真	makoto	#515558	1
伊織	iori	#fd99e1	1
貴音	takane	#a6126a	1
律子	ritsuko	#01a860	1
あずさ	azusa	#9238be	1
亜美	ami	#ffe43f	1
真美	mami	#ffe43e	1
響	hibiki	#01adb9	1
未来	mirai	#ea5b76	1
静香	shizuka	#6495cf	1
翼	tsubasa	#fed552	1
琴葉	kotoha	#92cfbb	1
エレナ	elena	#9bce92	1
美奈子	minako	#58a6dc	1
恵美	megumi	#454341	1
まつり	matsuri	#5abfb7	1
星梨花	serika	#ed90ba	1
茜	akane	#eb613f	1
杏奈	anna	#7e6ca8	1
ロコ	roco	#fff03c	1
百合子	yuriko	#c7b83c	1
紗代子	sayoko	#7f6575	1
亜利沙	arisa	#b54461	1
海美	umi	#e9739b	1
育	iku	#f7e78e	1
朋花	tomoka	#bee3e3	1
エミリー	emily	#554171	1
志保	shiho	#afa690	1
歩	ayumu	#e25a9b	1
ひなた	hinata	#d1342c	1
可奈	kana	#f5ad3b	1
奈緒	nao	#788bc5	1
千鶴	chizuru	#f19557	1
このみ	konomi	#f1becb	1
環	tamaki	#ee762e	1
風花	fuka	#7278a8	1
美也	miya	#d7a96b	1
のり子	noriko	#eceb70	1
瑞希	mizuki	#99b7dc	1
可憐	karen	#b63b40	1
莉緒	rio	#f19591	1
昴	subaru	#aeb49c	1
麗花	reika	#6bb6b0	1
桃子	momoko	#efb864	1
ジュリア	julia	#d7385f	1
紬	tsumugi	#ebe1ff	1
歌織	kaori	#274079	1
小鳥	kotori	#F7E200	1
美咲	misaki	#67C0C3	1
社長	takagi	#000	1
そら	sora	#3A547C	1
プロデューサー	producer	#000	1
黒井社長	kuroi	#000	1
玲音	leon	#5A2B8D	1
詩花	shika	#85AC84	1
リトルミズキ	littlemizuki	#99b7dc	0.8
ジュニオール	junior	#777175	0.8
チュパカブラ	chupacabra	#C1CE49	0.8
でんでんむすくん	dendenmusukun	#4A3B2E	0.8
謎の猫	nazononeko	#857575	0.8
例の星	reinohoshi	#FFE8B6	0.8
ハム蔵	hamzo	#F1BE85	0.8
いぬ美	inumi	#5A371D	0.8
ハリ子	hariko	#94929F	0.8
うさちゃん	usachan	#FDE3F8	0.8
ユニコーン	unicorn	#FEB5EE	0.8
こぶん	kobun	#BC8D64	0.8
とらたん	toratan	#F9D597	0.8
けるちゃん	keruchan	#FDF9BE	0.8
チーフプロデューサー	chiefproducer	#292631	0.8
源P	genp	#444341	0.8
一ノ瀬志希	shiki	#A01B50	0.8
宮本フレデリカ	frederica	#9E1861	0.8
`;
const default_idols_lines = default_idols_text.split('\n');
let defalult_idols = [];
for (const defalult_idol_line of default_idols_lines){
	const items = defalult_idol_line.split('\t');
	if (items.length < 3) continue;
	defalult_idols.push({
		id: items[1],
		label: items[0],
		icon: 'icons/'+ items[1] + '.jpg',
		color: items[2],
		size: items[3],
	})
}
