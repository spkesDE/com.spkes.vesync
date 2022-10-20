// noinspection JSUnusedGlobalSymbols,JSUnresolvedVariable
// noinspection JSUnresolvedVariable
function onSave(){
  Homey.set('username', document.getElementById('username').value, (err) => {
    if (err) return Homey.alert(err);
  });
  Homey.set('passwordRaw', document.getElementById('password').value, (err) => {
    if (err) return Homey.alert(err);
  });
}

function onReset(){
  Homey.unset('username');
  Homey.unset('passwordRaw');
  Homey.unset('password');
  document.getElementById('username').value = '';
  document.getElementById('password').value = '';
}

function onHomeyReady(Homey) {
  Homey.get('username', (err, username) => {
    if (err) return Homey.alert(err);
    document.getElementById('username').value = username;
  });
  Homey.ready();
}


