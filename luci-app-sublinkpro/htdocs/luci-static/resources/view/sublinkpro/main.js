'use strict';
'require form';
'require poll';
'require rpc';
'require uci';
'require view';

var callServiceList = rpc.declare({
	object: 'service',
	method: 'list',
	params: [ 'name' ],
	expect: { '': {} }
});

function isRunning() {
	return L.resolveDefault(callServiceList('sublinkpro'), {}).then(function(res) {
		try {
			var inst = res['sublinkpro']['instances'] || {};
			return Object.keys(inst).some(function(k) { return inst[k].running; });
		} catch (e) {
			return false;
		}
	});
}

function webUrl() {
	var port = uci.get('sublinkpro', 'main', 'port') || '8000';
	var base = uci.get('sublinkpro', 'main', 'web_base_path') || '';
	if (base && base.charAt(0) !== '/')
		base = '/' + base;
	return location.protocol + '//' + location.hostname + ':' + port + base;
}

function renderStatus(running) {
	var children = [
		E('span', {
			'style': 'font-weight:bold;color:' + (running ? 'green' : 'red')
		}, running ? _('SublinkPro is running') : _('SublinkPro is not running'))
	];

	if (running) {
		children.push(' ');
		children.push(E('input', {
			'type': 'button',
			'class': 'cbi-button cbi-button-action',
			'value': _('Open Web UI'),
			'click': function() { window.open(webUrl(), '_blank'); }
		}));
	}

	return E('p', {}, children);
}

return view.extend({
	load: function() {
		return Promise.all([
			uci.load('sublinkpro'),
			isRunning()
		]);
	},

	render: function(data) {
		var m, s, o;
		var statusEl = E('div', { 'id': 'sublinkpro_status' }, renderStatus(data[1]));

		m = new form.Map('sublinkpro', _('SublinkPro'),
			_('Self-hosted proxy subscription manager and converter. Default account on first run is admin / 123456, please change it right after logging in.'));

		s = m.section(form.NamedSection, 'main', 'sublinkpro');
		s.anonymous = true;
		s.addremove = false;

		s.tab('basic', _('Basic Settings'));
		s.tab('security', _('Login Security'));
		s.tab('advanced', _('Advanced Settings'));

		/* basic */
		o = s.taboption('basic', form.Flag, 'enabled', _('Enable'));
		o.rmempty = false;

		o = s.taboption('basic', form.Value, 'port', _('Listen port'));
		o.datatype = 'port';
		o.default = '8000';
		o.rmempty = false;

		o = s.taboption('basic', form.Flag, 'open_firewall', _('Allow access from LAN'),
			_('Automatically add a firewall rule for the listen port on the LAN zone while the service is running.'));
		o.default = '0';

		o = s.taboption('basic', form.Value, 'web_base_path', _('Web base path'),
			_('Hide the Web UI entrance behind a path, e.g. /admin. Leave empty to disable. Does not affect the API or subscription links.'));
		o.placeholder = '/admin';
		o.validate = function(section_id, value) {
			if (value && value.charAt(0) !== '/')
				return _('Path must start with /');
			return true;
		};

		o = s.taboption('basic', form.Value, 'admin_password', _('Initial admin password'),
			_('Only takes effect when the database is created for the first time. To reset it later use: /etc/init.d/sublinkpro reset_password <new password>'));
		o.password = true;
		o.rmempty = true;

		/* security */
		o = s.taboption('security', form.ListValue, 'captcha_mode', _('Captcha mode'));
		o.value('1', _('Disabled (LAN only)'));
		o.value('2', _('Image captcha'));
		o.value('3', _('Cloudflare Turnstile'));
		o.default = '2';

		o = s.taboption('security', form.Value, 'login_fail_count', _('Max login failures'));
		o.datatype = 'uinteger';
		o.default = '5';

		o = s.taboption('security', form.Value, 'login_fail_window', _('Failure window (minutes)'));
		o.datatype = 'uinteger';
		o.default = '1';

		o = s.taboption('security', form.Value, 'login_ban_duration', _('Ban duration (minutes)'));
		o.datatype = 'uinteger';
		o.default = '10';

		o = s.taboption('security', form.Value, 'expire_days', _('Token expire days'));
		o.datatype = 'uinteger';
		o.default = '14';

		/* advanced */
		o = s.taboption('advanced', form.Value, 'db_path', _('Data directory'),
			_('SQLite database, config.yaml and GeoIP data are stored here. Point it to a USB drive or disk to reduce flash wear.'));
		o.default = '/etc/sublinkpro';
		o.rmempty = false;

		o = s.taboption('advanced', form.Value, 'log_path', _('Log directory'));
		o.default = '/var/log/sublinkpro';

		o = s.taboption('advanced', form.ListValue, 'log_level', _('Log level'));
		o.value('debug', 'debug');
		o.value('info', 'info');
		o.value('warn', 'warn');
		o.value('error', 'error');
		o.value('fatal', 'fatal');
		o.default = 'info';

		o = s.taboption('advanced', form.Value, 'dsn', _('Database DSN'),
			_('Leave empty to use SQLite. Example: mysql://user:pass@tcp(host:3306)/sublink?charset=utf8mb4&parseTime=True&loc=Local'));
		o.password = true;
		o.rmempty = true;

		return m.render().then(function(node) {
			poll.add(function() {
				return isRunning().then(function(running) {
					var el = document.getElementById('sublinkpro_status');
					if (el) {
						el.innerHTML = '';
						el.appendChild(renderStatus(running));
					}
				});
			}, 5);

			return E([ statusEl, node ]);
		});
	}
});
