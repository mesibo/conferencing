
/* If you are hosting Mesibo backend on your own server, change this accordingly.
 * Refer https://github.com/mesibo/messenger-app-backend
 */
const MESSENGER_API_URL = "https://messenger.mesibo.com";
/* App ID used to create a user token - change it to match your app */
var MESSENGER_APP_ID = "com.mesibo.firstapp";
var MESSENGER_TOKEN_KEY = "MESSENGER_DEMO_TOKEN";

function redirect_url(ur) {
	window.location.replace(url);
}

function saveLoginToken(token){
	localStorage.setItem(MESSENGER_TOKEN_KEY, token);
	return 0;
}

function deleteTokenInStorage(){
	localStorage.removeItem(MESSENGER_TOKEN_KEY);
}

var mesibo_demo_token = null;
function getLoginToken(){
	if(mesibo_demo_token) return mesibo_demo_token;

	var token = localStorage.getItem(MESSENGER_TOKEN_KEY);
	if(token && token.length > 16) {
		mesibo_demo_token = token;
		return token;
	}

	return null;
}

function getAppId(){
	return MESSENGER_APP_ID;
}

function login_init() {
	console.log('start login');
	var token = getLoginToken();
	if(token) return true;
	return false;
}

function login_start(name, phone, otp, on_login) {
	if(phone[0] == '+'){
		phone = phone.substr(1); 
	}

	var p = {};
	p['op'] = 'login';
	p['appid'] = MESSENGER_APP_ID;
	p['name'] = name;
	p['phone'] = phone;
	p['dt'] = 5;

	if(otp && otp.length > 4){
		p['otp'] = otp;
	}
		
	var http = Mesibo.getInstance().createhttpRequest();
	http.setUrl(MESSENGER_API_URL);
        http.setPostData(p, true);
        http.send(null, function(cbdata, response) {
                console.log(response);
		var resp = JSON.parse(response);
		if(resp.result != "OK") {
			if(on_login) on_login(false, resp);
			console.log(resp);
			return;
		}
	
		var token = resp.token;
		if(token && token.length > 16){
			console.log("Login Successfull");
			saveLoginToken(token);
		}

		if(on_login) on_login(true, resp);

        });
}



