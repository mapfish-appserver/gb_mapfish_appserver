/**
 *
 */
Ext.define('GbZh.base.Login', {
	requires: ['GbZh.base.ViewerState'],
	singleton: true,

	constructor: function () {
		GbZh.base.ViewerState.on('dologin', this.onDoLogin, this);
		GbZh.base.ViewerState.on('dologout', this.onDoLogout, this);
	},

	onDoLogin: function () {
		var formLogin = new Ext.FormPanel({
			tryLogin: function (form) {
				form.submit({
					clientValidation: true,
					url: '/session/sign_in',
					success: function (form, action) {
						Ext.util.Cookies.set("gbuser", Ext.encode(action.result.user));
						form.owner.ownerCt.doClose();
						GbZh.base.ViewerState.fireEvent('userchanged', action.result.user);
					},
					failure: function (form, action) {}
				});
			},
			frame: false,
			border: false,
			bodyPadding: 5,
			buttonAlign: 'right',
			url: '/session/sign_in',
			method: 'POST',
			id: 'frmLogin',
			items: [{
				xtype: 'textfield',
				fieldLabel: 'Benutzer',
				id: 'userlogin',
				name: 'user[login]',
				allowBlank: false
			}, {
				xtype: 'textfield',
				fieldLabel: 'Passwort',
				id: 'userpassword',
				name: 'user[password]',
				allowBlank: false,
				inputType: 'password',
				enableKeyEvents: true,
				listeners: {
					specialkey: function (f, k) {
						if (k.getKey() === k.ENTER) {
							var form = this.ownerCt.getForm();
							form.tryLogin(form);
						}
					}
				}
			}],
			buttons: [{
				text: 'Abbrechen',
				action: 'cancel',
				handler: function () {
					this.up('window').doClose();
				}
			}, {
				text: 'Anmelden',
				action: 'login',
				handler: function () {
					var form = this.up('form').getForm();
					form.tryLogin(form);
				}
			}]
		});

		var winLogin = new Ext.Window({
			title: 'Login',
			layout: 'fit',
			width: 340,
			modal: true,
			resizable: false,
			id: 'winLogin',
			closable: false,
			items: [formLogin]
		});

		winLogin.show();
		Ext.getCmp('userlogin').focus('', 10);
	},

	onDoLogout: function () {
		Ext.Ajax.request({
			url: '/session/sign_out',
			success: function (response, opts) {
//				console.log('logout: - server-side success with status code ' + response.status);
				Ext.util.Cookies.clear('gbuser');
				GbZh.base.ViewerState.fireEvent('userchanged', null);
			},
			failure: function (response, opts) {
				Ext.util.Cookies.clear('gbuser');
				GbZh.base.ViewerState.fireEvent('userchanged', null);
				alert('logout: - server-side failure with status code ' + response.status);
			}
		});
	}

});