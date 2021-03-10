/**
* This is a basic demo app built using mesibo conferencing APIS
* You can hold a group call upto 4 members in this basic demo
* You can try an advanced conferencing demo, with more features at 
* https://mesibo.com/livedemo
*
* To use this basic demo, 
* First create a mesibo group 
* and set DEMO_GROUP_ID to the group-id you obtained 
*
* Then, create users with the same appid as MESIBO_APP_ID 
* and add them as members to the group created earlier
*
* Refer to Documentation: https://mesibo.com/documentation/api/conferencing
*/

const DEMO_GROUP_ID = 0;
const DEMO_GROUP_NAME = "ConfBasic";

const MESIBO_APP_ID = 'com.confbasic.web';

var demo users = [
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
var api = null;

var selected_user = null;
var live = null;
var publisher = null;

var callInProgressListener = null;
var globalCallListener = null;

var streams = [];
const MAX_STREAMS_COUNT = 4;

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
		s.innerText = selected_user.name + " is online";                
		
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


function GroupCallListener() {

}


GroupCallListener.prototype.MesiboGroupcall_OnPublisher = function(p, joined) {	
	if(!p)
		return;

	console.log("GroupCallListener.MesiboGroupcall_OnPublisher: "+ p.getName() + " joined: "+ joined);
	if(joined)
		connectStream(p);
}

GroupCallListener.prototype.MesiboGroupcall_OnSubscriber = function(p, joined) {	
	
}


function GroupCallInProgressListener() {

}


GroupCallInProgressListener.prototype.MesiboGroupcall_OnVideo = function(p) {
	console.log('MesiboGroupcall_OnVideo');

	//Local Stream
	if(p.isLocal()) {
		p.setVideoView("video-publisher", function(){
			console.log("Set video for "+ p.getName())
		}, 10, 20);
		return;
	}

	//Remote Stream
	console.log('===> on_video', p.element_id, 'attach');
	p.setVideoView(p.element_id, function(){
		console.log("Set video for "+ p.getName())
	}, 10, 20);
}


GroupCallInProgressListener.prototype.MesiboGroupcall_OnConnected = function(p, connected){
	console.log('MesiboGroupcall_OnConnected', p.getId(), p.getName(), 'local?', p.isLocal(), connected);


	if(connected){
		console.log(p.getName()+ ' is connected');
	}
}

GroupCallInProgressListener.prototype.MesiboGroupcall_OnHangup = function(p, reason) {
	console.log('MesiboGroupcall_OnHangup', p.getName(), reason);
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

GroupCallInProgressListener.prototype.MesiboGroupcall_OnMute = function(p, audioMuted, videoMuted, remote) {
	console.log('MesiboGroupcall_OnMute');
}

// TODO: Talking detection 
// You can use p.isTalking() to check whether a participant is talking
GroupCallInProgressListener.prototype.MesiboGroupcall_OnTalking = function(p, talking) {
	console.log('MesiboGroupcall_OnTalking');
}

function login(user_index){
	selected_user = demo_users[user_index];

	api = new Mesibo();
	api.setAppName(MESIBO_APP_ID);

	var notify = new MesiboNotify();
	api.setListener(notify);
	api.setCredentials(selected_user.token);
	api.setDatabase("mesibo");
	api.start();

	initStreams();

	//Create group call object

	if(!DEMO_GROUP_ID){
		alert('Invalid group id');
		return;
	}

	globalCallListener = new GroupCallListener();
	live = api.groupCall(globalCallListener, DEMO_GROUP_ID);
	if(!live){
		console.log("Group call not initialized!");
		return;
	}
	live.join(globalCallListener);
	
	
	document.getElementById("exit").style.display = "block";
	
	// Create a local participant, where we will stream camera/screen
	publisher = live.createPublisher(0);
	if(!publisher){
		console.log("Invalid call to publish!");
		return;
	}
	// Ideally you can set a call in progress listener for each participant
	// But, in this simple demo we will create one global in progress listener
	// and use it for all participants
	callInProgressListener = new GroupCallInProgressListener();
	
	// Automatically start streaming from camera
	// call will be started automatically as soon as the user is online
	streamFromCamera();
	
	document.getElementById("conference-area").style.display = 'flex';
	document.getElementById("login-options").style.display = 'none';

}


function streamFromCamera() {
	console.log('streamFromCamera');

	publisher.setVideoSource(MESIBOCALL_VIDEOSOURCE_CAMERADEFAULT);
	publisher.call(true, true, callInProgressListener);
	publisher.setName(selected_user.name);

}

function streamFromScreen() {
	console.log('streamFromScreen');

	publisher.setVideoSource(MESIBOCALL_VIDEOSOURCE_SCREEN);
	publisher.call( true, true, callInProgressListener);
	publisher.setName(selected_user.name +"'s screen");

}


function initStreams(){
	for (var i = 0; i < MAX_STREAMS_COUNT; i++) {
		streams[i] = null;
	}
}


function selfHangup(){
	publisher.hangup();
}

function exitRoom(){
	console.log("Exiting Room.. Cleaning up and resetting..");
	if(!live)
		return;

	live.leave();
	
	window.location.reload();
}


function toggleSelfVideo() {
	publisher.toggleVideoMute();
}

function toggleSelfAudio() {
	publisher.toggleAudioMute();
}

function toggleRemoteVideo(i) {
	var s = streams[i];
	if(s)
		s.toggleVideoMute();
}

function toggleRemoteAudio(i) {
	var s = streams[i];
	if(s)
		s.toggleAudioMute();
}

function hangup(i, reason) {
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
			streams[i].setVideoView(element);
			return;
		}
	}
}


function subscribe(p) {
	console.log('====> subscribe', p.getId(), callInProgressListener);
	//Subscribing to both audio and video  of  a participant
	p.call( true, true, callInProgressListener);
}

function redial(index){
	if(streams[index])
		subscribe(streams[index]);
}

