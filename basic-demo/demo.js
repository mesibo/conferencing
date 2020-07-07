
const DEMO_GROUP_ID = 0;
const DEMO_GROUP_NAME = "xxxx";

const MESIBO_APP_ID = 'web';

var demo_users = [ 
{
     'token' : 'TOKEN_USER_0'
     ,'address'  : 'ADDRESS_USER_0'
     ,'name'    : 'User-0' 
    },

    {
     'token' : 'TOKEN_USER_1'
     ,'address'  : 'ADDRESS_USER_1'
     ,'name'    : 'User-1' 
    },

    {
     'token' : 'TOKEN_USER_2'
     ,'address'  : 'ADDRESS_USER_2'
     ,'name'    : 'User-2' 
    },

    {
     'token' : 'TOKEN_USER_3'
     ,'address'  : 'ADDRESS_USER_3'
     ,'name'    : 'User-3' 
    },

    {
     'token' : 'TOKEN_USER_4'
     ,'address'  : 'ADDRESS_USER_4'
     ,'name'    : 'User-4' 
    },

] 

var live = null;
var publisher = null;
var streams = [];
const MAX_STREAMS_COUNT = 4;
const STREAM_CAMERA = 1;
const STREAM_SCREEN = 2;

function MesiboNotify() {
}

MesiboNotify.prototype.Mesibo_OnPermission = function(on) {
	console.log("Mesibo_onPermission: " + on);
	//show permission prompt
}

MesiboNotify.prototype.Mesibo_OnConnectionStatus = function(status) {
	console.log("Mesibo_OnConnectionStatus: " + status);
	var s = document.getElementById("cstatus");
	if(!s) return;

	if(MESIBO_STATUS_ONLINE == status) {
                s.classList.replace("btn-danger", "btn-success");
                s.innerText = publisher.getName() + " is online";                

            	streamFromCamera();

                return;
        }

	s.classList.replace("btn-success", "btn-danger");
	
	switch(status) {
		case MESIBO_STATUS_CONNECTING:
			s.innerText = "Connecting";
			break;

		case MESIBO_STATUS_CONNECTFAILURE:
			s.innerText = "Connection Failed";
			break;

		case MESIBO_STATUS_SIGNOUT:
			s.innerText = "Signed out";
			break;

		case MESIBO_STATUS_AUTHFAIL:
			s.innerText = "Disconnected: Bad Token or App ID";
			break;

		default:
			s.innerText = "You are offline";
			break;
	}

}

MesiboNotify.prototype.Mesibo_OnParticipants = function(all, latest) {	
	for(var i in latest) {
		console.log("Mesibo_Onparticipants: " + latest[i].getId());
		var p = latest[i];
		connectStream(p);
	}
}

function login(user_index){
	var selected_user = demo_users[user_index];

	var api = new Mesibo();
	api.setAppName(MESIBO_APP_ID);
	api.setListener(new MesiboNotify());
	api.setCredentials(selected_user.token);
	api.setDatabase("mesibo");
	api.start();

	initStreams();

	//Create group call object
	var live = api.initGroupCall();
	console.log(live);
	if(!DEMO_GROUP_ID){
		alert('Invalid group id');
		return;
	}
	live.setRoom(DEMO_GROUP_ID);

	// Create a local participant, Set Publisher name and address
	console.log('====>create participant', selected_user.name, selected_user.address);
	publisher = live.getLocalParticipant(0, selected_user.name, selected_user.address);


	document.getElementById("conference-area").style.display = 'flex';
	document.getElementById("login-options").style.display = 'none';

}


function streamFromCamera() {
	console.log('streamFromCamera');

	var o = {};
	o.video = true;
	o.audio = true;

	console.log('local publisher', o, publisher, publisher.getName(), publisher.getId());

	publisher.call(o, "video-publisher", on_stream, on_status);
}

function streamFromScreen() {
        console.log('streamFromScreen');
	
	var o = {};
	o.peer = 0;
	o.name = DEMO_GROUP_NAME;
	o.groupid = DEMO_GROUP_ID;
	o.source = STREAM_SCREEN; 

	console.log('local publisher', o);

	publisher.call(o, "video-publisher", on_stream, on_status);
}


function initStreams(){
	for (var i = 0; i < MAX_STREAMS_COUNT; i++) {
		streams[i] = null;
	}
}


function selfHangup(){
	publisher.hangup();
}

function toggleSelfVideo() {
	publisher.toggleMute(true, false);
}

function toggleSelfAudio() {
	publisher.toggleMute(false, false);
}

function toggleRemoteVideo(i) {
	var s = streams[i];
	if(s)
		s.toggleMute(true, false);
}

function toggleRemoteAudio(i) {
	var s = streams[i];
	if(s)
		s.toggleMute(false, false);
}

function hangup(i) {
	var s = streams[i];
	if(s){		
		s.hangup();
	}
}

function connectStream(stream){
	for (var i = 0; i < streams.length; i++) {
		if(streams[i] == null){
			streams[i] = stream;
			streams[i].element_id = 'video-remote-'+ i;
			subscribe(streams[i]);
			return;
		}
	}
}

function attachStream(stream){
	var uid = stream.getId();
	for (var i = 0; i < streams.length; i++) {
		if(streams[i].getId() == uid){
			var element = streams[i].element_id;
			console.log('===> attach', element);
			streams[i].attach(element);
			return;
		}
	}
}


function subscribe(p) {
	console.log('====> subscribe', p.getId(), p.element_id);
	p.call(null, p.element_id, on_stream, on_status);
}

function on_stream(p) {
	console.log('on_stream');

	//Local Stream
	if(p.isLocal()) {
		p.attach("video-publisher");
		return;
	}

	//Remote Stream
	console.log('===> on_stream', p.element_id, 'attach');
	p.attach(p.element_id);
}


function on_status(p, status){
	console.log('on_status', p.getId(), p.getName(), 'local?', p.isLocal(), ' status: 0x'+status.toString(16));


	if(MESIBO_CALLSTATUS_CHANNELUP == status){
		console.log(p.getName()+ ' is connected');
	}

	if(MESIBO_CALLSTATUS_COMPLETE == status){
		console.log(p.getName()+ ' has disconnected');
		on_hangup(p);
	}
}

function on_hangup(p) {
    console.log('on_hangup');
    if(p.isLocal()) {
            return;
    }
    for(var i = 0; i < streams.length; i++){
            if ( streams[i].getId() === p.getId()) {
                    streams[i] = null; //Free up slot
                    return;
            }
    }
}

function redial(index){
	if(streams[index])
		subscribe(streams[index]);
}

