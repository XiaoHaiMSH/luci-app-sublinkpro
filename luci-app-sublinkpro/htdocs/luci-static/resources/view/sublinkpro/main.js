'use strict';
'require view';
'require form';
'require uci';
'require rpc';
'require poll';

var callServiceList = rpc.declare({
	object: 'service',
	method: 'list',
	params: ['name'],
	expect: { '': {} }
});

function getServiceStatus() {
	return L.resolveDefault(callServiceList('sublinkpro'), {}).then(function (res) {
		var running = false;
		try {
			var instances = res['sublinkpro']['instances'] || {};
			running = Object.keys(instances).some(function (k) { return instances[k].running; });
		} catch (e) {}
		return running;
	});
}

function statusHtml(running) {
	return '<span style="width:8px;height:8px;border-radius:50%;background:' + (running ? '#5cb85c' : '#d9534f') + ';display:inline-block;"></span>' +
		'<span style="font-size:13px;font-weight:600;color:' + (running ? '#3c763d' : '#a94442') + ';margin-left:6px;">' +
		(running ? _('运行中') : _('未运行')) + '</span>';
}

function injectTapCss() {
	if (document.getElementById('sublinkpro_tap_css')) return;
	var style = document.createElement('style');
	style.id = 'sublinkpro_tap_css';
	style.textContent =
		'@keyframes sublinkpro_tap { 0% { transform:scale(1); } 50% { transform:scale(0.94); opacity:0.75; } 100% { transform:scale(1); } }' +
		'.sublinkpro_tap { animation: sublinkpro_tap 0.3s ease; }';
	document.head.appendChild(style);
}

return view.extend({
	load: function () {
		return Promise.all([uci.load('sublinkpro'), getServiceStatus()]);
	},

	render: function (data) {
		var state = { running: data[1] };
		var m, s, o;

		m = new form.Map('sublinkpro', _('SublinkPro'),
			'<div id="sublinkpro_status_wrap" style="margin-top:6px;display:flex;align-items:center;">' +
			statusHtml(state.running) +
			'</div>');

		s = m.section(form.NamedSection, 'main', 'sublinkpro', _('基本设置'));
		s.anonymous = true;

		o = s.option(form.Button, '_open_panel', _('Web 面板'));
		o.inputstyle = 'action';
		o.inputtitle = _('打开面板');
		o.onclick = function (ev) {
			injectTapCss();
			var btn = (ev && (ev.currentTarget || ev.target)) || null;
			if (btn) {
				btn.classList.remove('sublinkpro_tap');
				void btn.offsetWidth;
				btn.classList.add('sublinkpro_tap');
			}
			if (!state.running) {
				return;
			}
			var port = uci.get('sublinkpro', 'main', 'port') || '8000';
			var base = uci.get('sublinkpro', 'main', 'web_base_path') || '';
			if (base && base.charAt(0) !== '/') base = '/' + base;
			window.open('http://' + window.location.hostname + ':' + port + base + '/', '_blank');
		};

		o = s.option(form.Flag, 'enabled', _('启用'));
		o.rmempty = false;

		o = s.option(form.Value, 'port', _('监听端口'));
		o.datatype = 'port';
		o.default = '8000';

		o = s.option(form.Flag, 'open_firewall', _('放行局域网访问'));
		o.default = '0';

		o = s.option(form.Value, 'web_base_path', _('Web 访问路径前缀'));
		o.placeholder = '/admin';
		o.validate = function (section_id, value) {
			if (value && value.charAt(0) !== '/')
				return _('路径必须以 / 开头');
			return true;
		};

		o = s.option(form.Value, 'db_path', _('数据目录'));
		o.default = '/etc/sublinkpro';
		o.rmempty = false;

		o = s.option(form.Value, 'log_path', _('日志目录'));
		o.default = '/var/log/sublinkpro';

		o = s.option(form.ListValue, 'log_level', _('日志级别'));
		o.value('debug', 'debug');
		o.value('info', 'info');
		o.value('warn', 'warn');
		o.value('error', 'error');
		o.value('fatal', 'fatal');
		o.default = 'info';

		o = s.option(form.ListValue, 'captcha_mode', _('验证码模式'));
		o.value('1', _('关闭'));
		o.value('2', _('图形验证码'));
		o.value('3', _('Cloudflare Turnstile'));
		o.default = '2';

		o = s.option(form.Value, 'login_fail_count', _('登录失败次数上限'));
		o.datatype = 'uinteger';
		o.default = '5';

		o = s.option(form.Value, 'login_fail_window', _('失败统计窗口 (分钟)'));
		o.datatype = 'uinteger';
		o.default = '1';

		o = s.option(form.Value, 'login_ban_duration', _('封禁时长 (分钟)'));
		o.datatype = 'uinteger';
		o.default = '10';

		o = s.option(form.Value, 'expire_days', _('登录有效天数'));
		o.datatype = 'uinteger';
		o.default = '14';

		o = s.option(form.Value, 'dsn', _('数据库 DSN'));
		o.password = true;
		o.rmempty = true;

		poll.add(function () {
			return getServiceStatus().then(function (running) {
				state.running = running;
				var el = document.getElementById('sublinkpro_status_wrap');
				if (el) el.innerHTML = statusHtml(running);
			});
		});

		return m.render();
	}
});
