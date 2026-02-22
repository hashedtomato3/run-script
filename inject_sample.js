/*
	www.google.comの画面に対して、以下を実施するjs のinjection codeを生成して。
	画面上にボタンを配置、クリックすると、検索ワードの選択枝を表示。
	クリックすると検索窓に入力される。
*/


(function () {
	if (window.__rs_inject_done) return;
	window.__rs_inject_done = true;

	const SUGGESTIONS = [
		'天気',
		'ニュース',
		'猫 画像',
		'JavaScript チュートリアル',
		'レシピ'
	];

	const css = `
	#rs-suggest-btn {
		position: fixed;
		right: 18px;
		bottom: 18px;
		z-index: 2147483647;
		background: #1a73e8;
		color: #fff;
		border-radius: 50%;
		width: 52px;
		height: 52px;
		display: flex;
		align-items: center;
		justify-content: center;
		box-shadow: 0 6px 18px rgba(32,33,36,.28);
		cursor: pointer;
		font-size: 20px;
	}
	#rs-suggest-menu {
		position: fixed;
		right: 18px;
		bottom: 82px;
		z-index: 2147483647;
		background: #fff;
		border-radius: 8px;
		box-shadow: 0 6px 20px rgba(0,0,0,0.15);
		padding: 8px;
		min-width: 200px;
		font-family: Arial, Helvetica, sans-serif;
		display: none;
	}
	#rs-suggest-menu ul { list-style: none; margin: 0; padding: 4px; }
	#rs-suggest-menu li {
		padding: 8px 10px;
		border-radius: 6px;
		cursor: pointer;
	}
	#rs-suggest-menu li:hover {
		background: #f1f3f4;
	}
	`;

	function injectStyles() {
		const s = document.createElement('style');
		s.id = 'rs-suggest-styles';
		s.textContent = css;
		document.head.appendChild(s);
	}

	function buildUI() {
		const btn = document.createElement('button');
		btn.id = 'rs-suggest-btn';
		btn.title = '検索候補';
		btn.type = 'button';
		btn.textContent = '🔎';

		const menu = document.createElement('div');
		menu.id = 'rs-suggest-menu';

		const ul = document.createElement('ul');
		for (const s of SUGGESTIONS) {
			const li = document.createElement('li');
			li.textContent = s;
			li.addEventListener('click', () => {
				applySuggestion(s);
				hideMenu();
			});
			ul.appendChild(li);
		}
		menu.appendChild(ul);

		document.body.appendChild(btn);
		document.body.appendChild(menu);

		btn.addEventListener('click', (e) => {
			e.stopPropagation();
			toggleMenu();
		});

		document.addEventListener('click', (e) => {
			if (!menu.contains(e.target) && e.target !== btn) hideMenu();
		});

		document.addEventListener('keydown', (e) => {
			if (e.key === 'Escape') hideMenu();
		});
	}

	function toggleMenu() {
		const menu = document.getElementById('rs-suggest-menu');
		if (!menu) return;
		menu.style.display = menu.style.display === 'block' ? 'none' : 'block';
	}
	function hideMenu() {
		const menu = document.getElementById('rs-suggest-menu');
		if (!menu) return;
		menu.style.display = 'none';
	}

	function findSearchInput() {
		// Try several selectors used by Google variants
		const selectors = [
			'textarea[name="q"]',
			'input[name="q"]',
			'input[aria-label="検索"]',
			'input[aria-label="Search"]',
			'input[type="search"]',
			'input[type="text"]'
		];
		for (const sel of selectors) {
			const el = document.querySelector(sel);
      //console.log("el", el);
			if (el && !el.disabled && el.offsetParent !== null) return el;
		}
		return null;
	}

	function applySuggestion(text) {
		const input = findSearchInput();
		if (!input) {
			alert('検索入力欄が見つかりません');
			return;
		}
		input.focus();
		input.value = text;
		// Dispatch input events so pages react (Google listens to input events)
		const ev = new Event('input', { bubbles: true });
		input.dispatchEvent(ev);
		const ev2 = new Event('change', { bubbles: true });
		input.dispatchEvent(ev2);
	}

	// Initialize
	injectStyles();
	buildUI();

	// If search input appears later (SPA), try to re-run findSearchInput periodically for user convenience
	let retries = 0;
	const interval = setInterval(() => {
		retries += 1;
		if (findSearchInput() || retries > 20) clearInterval(interval);
	}, 500);

})();

