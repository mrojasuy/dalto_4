(function() {
	'use strict';

	var config = window.ModoDaltonicoConfig || {};
	var KEY_ACTIVE = 'md_active';
	var KEY_MODE   = 'md_contrast_type';

	var filterSvgId = 'md-svg-filters';
	var filterDefs = {
		protanopia:
			'<filter id="md-filter-protanopia" color-interpolation-filters="linearRGB">' +
				'<feColorMatrix type="matrix" values="' +
					'0.567, 0.433, 0,     0, 0 ' +
					'0.558, 0.442, 0,     0, 0 ' +
					'0,     0.242, 0.758, 0, 0 ' +
					'0,     0,     0,     1, 0" />' +
			'</filter>',
		deuteranopia:
			'<filter id="md-filter-deuteranopia" color-interpolation-filters="linearRGB">' +
				'<feColorMatrix type="matrix" values="' +
					'0.625, 0.375, 0,     0, 0 ' +
					'0.7,   0.3,   0,     0, 0 ' +
					'0,     0.3,   0.7,   0, 0 ' +
					'0,     0,     0,     1, 0" />' +
			'</filter>',
		tritanopia:
			'<filter id="md-filter-tritanopia" color-interpolation-filters="linearRGB">' +
				'<feColorMatrix type="matrix" values="' +
					'0.95, 0.05,  0,     0, 0 ' +
					'0,    0.433, 0.567, 0, 0 ' +
					'0,    0.475, 0.525, 0, 0 ' +
					'0,    0,     0,     1, 0" />' +
			'</filter>'
	};

	function getStored(key, fallback) {
		try {
			var val = localStorage.getItem(key);
			return val !== null ? val : fallback;
		} catch (e) {
			return fallback;
		}
	}

	function setStored(key, value) {
		try {
			localStorage.setItem(key, value);
		} catch (e) {
			// localStorage unavailable
		}
	}

	function injectSvgFilters() {
		if (document.getElementById(filterSvgId)) {
			return;
		}
		var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
		svg.setAttribute('id', filterSvgId);
		svg.setAttribute('aria-hidden', 'true');
		svg.style.position = 'absolute';
		svg.style.width = '0';
		svg.style.height = '0';
		svg.style.overflow = 'hidden';

		var defs = '<defs>' +
			filterDefs.protanopia +
			filterDefs.deuteranopia +
			filterDefs.tritanopia +
			'</defs>';
		svg.innerHTML = defs;
		document.body.insertBefore(svg, document.body.firstChild);
	}

	function applyFilter(mode) {
		var html = document.documentElement;
		html.classList.remove('md-protanopia', 'md-deuteranopia', 'md-tritanopia');
		if (mode && filterDefs[mode]) {
			html.classList.add('md-' + mode);
		}
	}

	function removeFilter() {
		var html = document.documentElement;
		html.classList.remove('md-protanopia', 'md-deuteranopia', 'md-tritanopia');
	}

	function updateUI(isActive, mode) {
		var btn   = document.getElementById('md-toggle-btn');
		var badge = document.getElementById('md-badge');
		var panel = document.getElementById('md-mode-panel');

		if (!btn) {
			return;
		}

		btn.setAttribute('aria-pressed', isActive ? 'true' : 'false');
		btn.title = isActive
			? (config.activeLabel || 'Active')
			: (config.inactiveLabel || 'Inactive');

		if (badge) {
			var strings = config.strings || {};
			if (isActive) {
				var modeLabel = strings[mode] || mode;
				badge.textContent = (strings.indicador_activo || 'Mode active') + ': ' + modeLabel;
				badge.classList.add('md-badge-visible');
			} else {
				badge.classList.remove('md-badge-visible');
			}
		}

		if (panel) {
			if (isActive) {
				panel.classList.add('md-visible');
			} else {
				panel.classList.remove('md-visible');
			}
		}

		if (isActive) {
			applyFilter(mode);
		} else {
			removeFilter();
		}
	}

	function toggleActive() {
		var current = getStored(KEY_ACTIVE, 'false');
		var newState = current !== 'true';
		setStored(KEY_ACTIVE, String(newState));

		var mode = getStored(KEY_MODE, config.contrastType || 'protanopia');
		updateUI(newState, mode);
	}

	function changeMode(newMode) {
		var validModes = ['protanopia', 'deuteranopia', 'tritanopia'];
		if (validModes.indexOf(newMode) === -1) {
			return;
		}
		setStored(KEY_MODE, newMode);

		var isActive = getStored(KEY_ACTIVE, 'false') === 'true';
		if (isActive) {
			applyFilter(newMode);
		}
		updateUI(isActive, newMode);
	}

	function createWidget() {
		var container = document.createElement('div');
		container.className = 'md-toggle-container';

		var badge = document.createElement('div');
		badge.id = 'md-badge';
		badge.className = 'md-badge';
		badge.setAttribute('aria-live', 'polite');

		var panel = document.createElement('div');
		panel.id = 'md-mode-panel';
		panel.className = 'md-mode-selector';

		var select = document.createElement('select');
		select.id = 'md-mode-select';
		var strings = config.strings || {};
		var modes = [
			{ value: 'protanopia',   label: strings.protanopia   || 'Protanopia' },
			{ value: 'deuteranopia', label: strings.deuteranopia || 'Deuteranopia' },
			{ value: 'tritanopia',   label: strings.tritanopia   || 'Tritanopia' }
		];

		var currentMode = getStored(KEY_MODE, config.contrastType || 'protanopia');

		for (var i = 0; i < modes.length; i++) {
			var opt = document.createElement('option');
			opt.value = modes[i].value;
			opt.textContent = modes[i].label;
			if (modes[i].value === currentMode) {
				opt.selected = true;
			}
			select.appendChild(opt);
		}
		panel.appendChild(select);

		var btn = document.createElement('button');
		btn.id = 'md-toggle-btn';
		btn.className = 'md-toggle';
		btn.type = 'button';
		btn.setAttribute('aria-pressed', 'false');
		btn.title = config.inactiveLabel || 'Inactive';
		btn.innerHTML = '&#x1f441;';

		container.appendChild(badge);
		container.appendChild(panel);
		container.appendChild(btn);
		document.body.appendChild(container);

		btn.addEventListener('click', function() {
			toggleActive();
		});

		select.addEventListener('change', function() {
			changeMode(this.value);
		});
	}

	function init() {
		injectSvgFilters();
		createWidget();

		var storedActive = getStored(KEY_ACTIVE, null);
		var storedMode   = getStored(KEY_MODE, null);

		if (storedActive === null) {
			var initial = config.initialActive !== undefined ? config.initialActive : false;
			setStored(KEY_ACTIVE, String(initial));
			storedActive = String(initial);
		}

		if (storedMode === null) {
			storedMode = config.contrastType || 'protanopia';
			setStored(KEY_MODE, storedMode);
		}

		var isActive = storedActive === 'true';
		var selEl = document.getElementById('md-mode-select');
		if (selEl) {
			selEl.value = storedMode;
		}

		updateUI(isActive, storedMode);
	}

	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', init);
	} else {
		init();
	}
})();
