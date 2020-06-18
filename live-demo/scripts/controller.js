var myApp = angular.module('mlApp',  []);

myApp.directive('onFinishRender', function ($timeout) {
	console.log("onFinishRender-directive");
	return {
		link: function (scope, element, attr) {
			if (scope.$last === true) {
				$timeout(function () {
					scope.$emit(attr.onFinishRender);
				});
			}
		}
	}
});

myApp.directive('onFullScreenRender', function ($timeout) {
	console.log("onFullScreenRender-directive");
	return {
		link: function (scope, element, attr) {
			$timeout(function () {
				scope.$emit(attr.onFullScreenRender);
			});
		}
	}
});



myApp.controller('roomController', ['$scope', '$window', '$compile', '$timeout', '$anchorScroll', function ($scope, $window, $compile, $timeout, $anchorScroll) {

	const DEFAULT_GRID_MODE = 1;
	const DEFAULT_STREAMS_PER_PAGE = 16;
	const DEFAULT_ASPECT_RATIO = 16/9;
	const BS_MAX_COLUMN_LEVEL = 12;

	const STREAM_CAMERA = 1;
	const STREAM_SCREEN = 2;

	$scope.participant_type_publisher = 1;
	$scope.participant_type_subscriber = 2;

	$scope.mesibo_connected = false;
	// $scope.can_publish = false; //Show stream options only when you have permission to publish
	$scope.streams = [];
	$scope.participants = [];
	$scope.current_selected_stream = null;
	$scope.current_selected_participant = null;
	$scope.screen_share = false;
	$scope.ticker_messages = [];  	
	$scope.participant_count = null;
	$scope.full_screen_selected = null;
	$scope.full_screen_init = false;
	$scope.ultra_full_screen_selected = null;
	$scope.display_names = true;
	$scope.group_messsage_notification = '';
	$scope.display_names_placeholder = '*';
	$scope.participant_list_placeholder = "Participants yet to join";
	$scope.popup_grid_map = {};

	$scope.is_fit_full_screen = true;

	$scope.toggle_source = STREAM_CAMERA;
	$scope.publisher = {'isConnected': false, 'streamOptions': false};
	$scope.user = {'token':''};
	$scope.room = {'id':'', 'name':''};
	$scope.addressBook = {}; //To match participant name with address


	$scope.grid_mode = DEFAULT_GRID_MODE;
	$scope.max_streams_per_page = DEFAULT_STREAMS_PER_PAGE;

	//Popup
	const POPUP_WIDTH = 310;
	const POPUP_HEIGHT = 250;
	$scope.messageSession = {};
	const MAX_MESSAGES_READ = 200;

	$scope.mesibo = {}; 

	//Files
	$scope.selected_file = {};
	$scope.input_file_caption = "";


	$scope.refresh = function(){
		$scope.$applyAsync();
	}

	$scope.scrollToLastMsg = function(identifier) {
		$scope.$$postDigest(function () {
			MesiboLog('scroll to end', "messages_end_"+identifier);
			$anchorScroll("messages_end_"+identifier);
		});
	}

	$scope.toggleSelfVideo = function() {
		$scope.publisher.toggleMute(true);
		if($scope.publisher.muteStatus(true))
			$scope.addTicker('You have muted your video');
		else
			$scope.addTicker('You have unmuted your video');
	}

	$scope.toggleSelfAudio = function() {
		$scope.publisher.toggleMute(false);
		if($scope.publisher.muteStatus(false))
			$scope.addTicker('You have muted your audio');
		else
			$scope.addTicker('You have unmuted your audio');
	}

	$scope.scrollToLastTicker = function() {
		$scope.$$postDigest(function () {
			var tDiv = document.getElementById("ticker_messages_area");
			tDiv.scrollTop = tDiv.scrollHeight;
		});
	}

	$scope.addTicker = function(message){
		var tm = {};
		tm.time = $scope.getTime();
		tm.message = message;
		$scope.ticker_messages.push(tm);
		$scope.refresh();
		$scope.scrollToLastTicker();
	}

	$scope.getTime = function(){
		var time = new Date();
		return time.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
	}


	$scope.getMesibo = function(){
		return $scope.mesibo;
	}

	$scope.isSent = function(msg){
		if(!isValid(msg))
			return false;
		return isSentMessage(msg.status);
	}

	$scope.isReceived = function(msg){
		if(!isValid(msg))
			return false;
		return !isSentMessage(msg.status);
	}


	$scope.onKeydown = function(event) {
		console.log(event);
	}

	$scope.isGroup = function(user) {
		return isGroup(user);
	}


	$scope.getMessageStatusClass = function(m){
		if(!isValid(m))
			return "";

		if($scope.isReceived(m)){
			return "";
		}

		var status = m.status;
		var status_class = getStatusClass(status);
		if(!isValidString(status_class))
			return -1;

		return status_class;
	}

	$scope.getMessageStatusColor = function(m){
		// MesiboLog("getMessageStatusColor", m);
		if(!isValid(m))
			return "";

		if($scope.isReceived(m))
			return "";

		var status = m.status;
		var status_color = getStatusColor(status);
		if(!isValidString(status_color))
			return "";

		return status_color;
	}

	$scope.logout = function(){
		$scope.mesibo.stop();
		$scope.exitRoom();
	}

	$scope.exitRoom = function(){
		_resetRoomCredentials();
		$scope.publisher.hangup();
		window.open("login.html", "_self");
	}

	$scope.exitRoomForm = function(){
		$('#ModalExitForm').modal("show");
	}

	$scope.getFileIcon = function(f){
		return getFileIcon(f);
	}

	$scope.getParticipantFromMessage = function(m){
		if(!isValid(m))
			return;

		if(isValid(m.groupid) && m.groupid>0)
			return; // defaults to group chat

		if(isValid(m.peer)){
			for (var i = $scope.participants.length - 1; i >= 0; i--) {
				if($scope.participants[i].getAddress() == m.peer)
					return $scope.participants[i];
			}
		}

		return;			
	}


	$scope.clickUploadFile = function(peer, groupid){
		MesiboLog('====> clickUploadFile');
		setTimeout(function () {
			MesiboLog('====> clickUploadFile timeout');
			angular.element('#upload').trigger('click');
			var send_file_button = document.getElementById("popup-send-file");
			send_file_button.setAttribute('onclick', "getScope().sendFile('"+peer+"',"+groupid+");");
			$compile(send_file_button)($scope);
		}, 500);

	}


	$scope.onFileSelect = function(element){
		$scope.$apply(function(scope) {
			var file = element.files[0];
			if(!isValid(file)){
				MesiboLog("Invalid file");
				return -1;
			}

			MesiboLog("Selected File =====>", file);

			$scope.selected_file = file;
			$scope.showFilePreview(file);

			MesiboLog('Reset', element.value);	
			element.value = '';             
		});
	}

	$scope.showFilePreview = function(f) {
		var reader = new FileReader();
		$('#image-preview').attr('src', "");
		$('#video-preview').attr('src', "");
		$('#video-preview').hide();

		reader.onload = function(e) {
			if(isValidFileType(f.name, 'image'))
				$('#image-preview').attr('src', e.target.result);
			else if(isValidFileType(f.name, 'video')){
				$('#video-preview').attr('src', e.target.result);
				$('#video-preview').show();
			}
		}

		reader.readAsDataURL(f);

		var s = document.getElementById("fileModalLabel");
		if (s) {
			s.innerText = "Selected File " + f.name;
		}

		$('#fileModal').modal("show");
	}

	$scope.closeFilePreview = function() {
		$('#fileModal').modal("hide");
		//Clear selected file button attr

	}

	$scope.sendFile = function(peer, groupid){
		MesiboLog('sendFile', peer, groupid);
		$scope.closeFilePreview();
		$scope.file.uploadSendFile(peer, groupid);
	}

	$scope.isFileMsg = function(m){
		if(!isValid(m))
			return false;
		return (undefined != m.filetype);
	}

	$scope.isImageMsg = function(m){
		// MesiboLog('isImageMsg', MESIBO_FILETYPE_IMAGE == m.filetype);
		if(!isValid(m))
			return false;
		if(!$scope.isFileMsg(m))
			return false;
		return (MESIBO_FILETYPE_IMAGE == m.filetype);
	}

	$scope.isVideoMsg = function(m){
		if(!isValid(m))
			return false;
		if(! $scope.isFileMsg(m))
			return false;
		return (MESIBO_FILETYPE_VIDEO == m.filetype);
	}


	$scope.isAudioMsg = function(m){
		if(!isValid(m))
			return false;
		if(! $scope.isFileMsg(m))
			return false;
		return (MESIBO_FILETYPE_AUDIO == m.filetype);
	}

	$scope.isOtherMsg = function(m){
		if(!isValid(m))
			return false;
		if(! $scope.isFileMsg(m))
			return false;
		return (m.filetype >= MESIBO_FILETYPE_LOCATION);
	}


	$scope.Mesibo_OnConnectionStatus = function(status, value){
		MesiboLog("MesiboNotify.prototype.Mesibo_OnConnectionStatus: " + status);

		if(MESIBO_STATUS_SIGNOUT == status){
			$scope.addTicker('You have been logged out');
			alert('You have been logged out');
			$scope.logout();
		}

		if(MESIBO_STATUS_AUTHFAIL == status){
			_resetRoomCredentials();
			_resetLoginCredentials();
			$scope.addTicker('Auth failed while connecting to mesibo. Exiting room..');
			alert('Auth failed while connecting to mesibo. Exiting room..');
			$scope.exitRoom();
		}

		if(MESIBO_STATUS_ONLINE == status){
			$scope.mesibo_connected = true;
			document.getElementById('mesibo_live_main_navbar').style.backgroundColor = "#00868b";
			
			if(isValid($scope.room.publish) && $scope.room.publish == 1)
				$scope.publish();			

			$scope.addTicker('You are Online');	    	
		}

		if(MESIBO_STATUS_OFFLINE == status){
			$scope.mesibo_connected = true;
			toastr.error('You are Offline. Please check your connection..');
			document.getElementById('mesibo_live_main_navbar').style.backgroundColor = "#800000";
			$scope.addTicker('You are Offline');
		}

		$scope.refresh();
	}

		$scope.Mesibo_OnMessage = function(m, data) {
			MesiboLog("Mesibo_onMessage", m, data);

			var ticker_message = 'You have a new message';
			if(isValid($scope.addressBook[m.peer]))
				ticker_message = 'You have a new message from '+ $scope.addressBook[m.peer];

			if(isValid(m.groupid) && m.groupid>0)
				ticker_message = 'You have a new group message from ' + $scope.addressBook[m.peer] ;

			$scope.addTicker(ticker_message);


			MesiboLog('scrollToLastMsg', m.peer, m.groupid, isValidString(m.peer), isValid(m.groupid));

			var popup_identifier = (isValid(m.groupid) && m.groupid>0) ? m.groupid : m.peer ;


			if(isValid(popup_identifier)){
				var popup_div = document.getElementById('popup_chat_'+popup_identifier)	; 
				if(!isValid(popup_div)){ //Popup does not exist
					var participant = $scope.getParticipantFromMessage(m);
					if(isValid(participant) || ( isValid(m.groupid) && m.groupid>0)){
						$scope.showPopupChat(participant);
						return;
					}					
				}			

				if($scope.isHidden(popup_div)){
					if(isValid(m.groupid) && m.groupid >0){
						$scope.showPopupChat(participant);
					}
					// MesiboLog('Mesibo_onMessage', !isValid(popup_div) , $scope.isHidden(popup_div));						
					var participant_chat_icon = document.getElementById('chat_popup_participant_'+m.peer);
					if(!isValid(participant_chat_icon)) return;
					participant_chat_icon.style.color = 'green';
					toastr.info(ticker_message);				
				}
				else{
					$scope.refresh();
					$scope.scrollToLastMsg(popup_identifier);
				}

			}
	

			

			
	}

	$scope.Mesibo_OnMessageStatus = function(m){
		MesiboLog("MesiboNotify.prototype.Mesibo_OnMessageStatus: from " + m.peer +
			" status: " + m.status, 'id', m.id);
		$scope.refresh();
	}

	$scope.Mesibo_OnPermission = function(on) {
		MesiboLog("Mesibo_onPermission: " + on);
		if(on == true){
			MesiboLog('Show permission prompt');
			// document.getElementById('permissions-prompt').style.display = 'block';
		}

		if(on == false){
			MesiboLog('Hide permission prompt');
			// document.getElementById('permissions-prompt').style.display = 'none';
		}
	}

	$scope.Mesibo_OnLocalMedia = function(m) {
		MesiboLog("Mesibo_OnLocalMedia: ", m);
		//show permission prompt
	}

	$scope.Mesibo_OnParticipants = function(all, latest) {

		MesiboLog('Mesibo_OnParticipants', all, latest);
		for(var i in latest) {
			var p = latest[i];
			if(isValid(p.getAddress) && isValid(p.getName()))
				$scope.addressBook[p.getAddress()] = p.getName();
			$scope.subscribe(p);			
			playSound('assets/audio/join');
			$scope.addTicker(p.getName() + ' has entered the room');
		}
	}

	$scope.Mesibo_OnParticipantUpdated = function(all, p) {
		MesiboLog('Mesibo_OnParticipantsUpdated',all, p);
		MesiboLog('Mesibo_OnParticipantsUpdated',p.getName(), p.muteStatus(false, true), p.muteStatus(true, true));	    
		$scope.updateStreams(p);
		$scope.updateParticipants(p);
	}

		$scope.Mesibo_OnError = function(e){
		ErrorLog(e);
	}

	$scope.Mesibo_OnSubscriber = function(s){
		MesiboLog('==> Mesibo_onSubscriber', s);
		if(isValid(s) && isValid(s.address) && isValid(s.name))
			$scope.addressBook[s.address] = s.name;
		
	}



	$scope.on_attached = function(e){
		MesiboLog('on_attached', e);
	}


	$scope.on_stream = function(p) {
		MesiboLog('on_stream', p, 'isLocal?', p.isLocal());
		if(p.isLocal()) {
			p.attach("video-publisher", $scope.on_attached, 100, 50);
			MesiboLog($scope.room);			
			return;
		}

		if($scope.full_screen_selected){
			if($scope.full_screen_selected.getId() == p.getId()){
				$scope.full_screen_selected = p;
				$scope.full_screen_selected.attach("full-screen-video-"+ $scope.full_screen_selected.getId(), $scope.on_attached, 100, 2);									
			}
			$scope.setupStrip();
		}					
		else
			p.attach("video-" + p.getId(), $scope.on_attached, 100, 2);	

		$scope.refresh();

	}

	$scope.on_hangup = function(p, remote) {
		MesiboLog('on_hangup', p, remote, p.isLocal());
		if(p.isLocal()){
			var rv = $scope.publisher.hangup();
			MesiboLog('hangup returned', rv);
			if(rv == false) return;
			$scope.addTicker('You have hanged up');
			$scope.publisher.isConnected = false;
			$scope.publisher.streamOptions = true;
			$scope.refresh();
			return;
		}						

		for(var i = 0; i < $scope.streams.length; i++){
			if ( $scope.streams[i] === p) {
					
					if(!remote){
						$scope.participants[i].isVisible = false;
						$scope.streams[i].hangup();
					}

					$scope.streams.splice(i, 1);

					if(remote){
						$scope.removeParticipant(p);
						$scope.addTicker(p.getName() + ' has left the room');
					}
					var isGridChange = $scope.setGrid($scope.streams.length);
					$scope.refresh();	                    				
									

					$timeout(function(){
						if($scope.full_screen_selected){
							$scope.full_screen_selected.attach("full-screen-video-"+ $scope.full_screen_selected.getId(), $scope.on_attached, 100, 10);
							for(var i = 0; i < $scope.streams.length; i++){ 
								if($scope.streams[i] != $scope.full_screen_selected){
									$scope.streams[i].attach("video-small-"+ $scope.streams[i].getId(), $scope.on_attached, 100, 10);
									$scope.streams[i].isFullScreen = false;
									$scope.setStreamContainerDimensions($scope.streams[i], 'video-small', DEFAULT_ASPECT_RATIO);									
								}
							}
						}
						else{
							for (var i = 0; i < $scope.streams.length ; i++) {
								$scope.streams[i].attach("video-"+ $scope.streams[i].getId(), $scope.on_attached, 100, 50);																			
								$scope.setStreamContainerDimensions($scope.streams[i], 'video', DEFAULT_ASPECT_RATIO);										
							}
						}
					},0,false);	
								
					return 0;
			}
		}
	}

	$scope.on_status = function(p, status, video, q) {
	
		MesiboLog('====> on_status', ' stream ', 'uid', p.getId(), p.getName(), 'local?', p.isLocal(), ' status: 0x'+status.toString(16), video, q);

		if(p.isLocal()) {
			if(MESIBO_CALLSTATUS_CHANNELUP == status){
				MesiboLog('hide spinner-publisher');
				$scope.publisher.isConnected = true;
			}
			else if(MESIBO_CALLSTATUS_RECONNECTING == status){
				MesiboLog('show spinner-publisher');
				$scope.publisher.isConnected = false;
			}
			else if(MESIBO_CALLSTATUS_CANCEL == status){
				MesiboLog('Screen sharing stopped* . Switch to camera');
				$scope.toggle_source = STREAM_CAMERA;
				$scope.publish();
			}			

			MesiboLog('updating local stream status', $scope.publisher);
			return;
		}

		for(var i = 0; i < $scope.streams.length; i++){ 
			if ( $scope.streams[i] === p) { 


				if(MESIBO_CALLSTATUS_COMPLETE  == status){
					$scope.on_hangup(p, true);
				}

				else if(MESIBO_CALLSTATUS_CHANNELUP == status){
					$scope.streams[i].isConnected = true;
				}
				else if(MESIBO_CALLSTATUS_RECONNECTING == status){
					MesiboLog('show-spinner');
					$scope.streams[i].isConnected = false;
				}

				else if(MESIBO_CALLSTATUS_MUTE == status && !video){
					MesiboLog('show-audio-muted');
					$scope.addTicker('Audio Muted by '+ p.getName());
					$scope.streams[i].isRemoteMutedAudio = true;
				
				}

				else if(MESIBO_CALLSTATUS_MUTE == status && video){
					MesiboLog('show-video-muted');
					$scope.addTicker('Video Muted by '+ p.getName());
					$scope.streams[i].isRemoteMutedVideo = true;
				}

				else if(MESIBO_CALLSTATUS_UNMUTE == status && !video){
					MesiboLog('hide-audio-muted');
					$scope.addTicker('Audio unmuted by '+ p.getName());
					$scope.streams[i].isRemoteMutedAudio = false;

				}

				else if(MESIBO_CALLSTATUS_UNMUTE == status && video){
					MesiboLog('hide-video-muted');
					$scope.addTicker('Video unmuted by '+ p.getName());
					$scope.streams[i].isRemoteMutedVideo = false;
				}

				break;

			}
		}

		$scope.refresh();	
	}

	$scope.setGrid = function(stream_count){
		MesiboLog('==> setGrid', 'stream_count', stream_count, 'grid_mode', $scope.grid_mode);
		var isGridChange = false;
		var previous_grid_mode = $scope.grid_mode;

		if(!isValid(stream_count) || stream_count <= 0){
			$scope.grid_mode = DEFAULT_GRID_MODE;
			return isGridChange;
		}
		

		if(1 == stream_count)
			$scope.grid_mode = 1;
		else if(stream_count >=2 && stream_count <=4 )
			$scope.grid_mode = 2;
		else if(stream_count >=5 && stream_count <=9 )
			$scope.grid_mode = 3;
		else if(stream_count >=10 && stream_count <=16 )
			$scope.grid_mode = 4;
		else
			$scope.grid_mode = 4; /** Maximum 16 thumbnails can be displayed for now **/

		MesiboLog('==> setGrid', 'stream_count', stream_count, 'grid_mode', $scope.grid_mode);

		if(previous_grid_mode != $scope.isGridChange)
			isGridChange = true;

		$scope.refresh();

		return isGridChange;
	}

	$scope.removeParticipant = function(p){
		for(var i = 0; i < $scope.participants.length; i++){
			if ( $scope.participants[i] === p) {				
				$scope.participants.splice(i, 1);
				return;
			}
		}
	}


	$scope.updateParticipants = function(p){
		MesiboLog('updateParticipants', p, $scope.participants, $scope.streams);
		if(!isValid(p))
			return;

		for(var i = 0; i < $scope.participants.length; i++){ 
			if ( $scope.participants[i].getId() === p.getId()) { 
				MesiboLog('updateParticipants','existing');
				$scope.participants[i] = p;
				return;
			}
		}

		$scope.participants.push(p);
	}

	$scope.updateStreams = function(p, iAudio, iVideo){
		MesiboLog('updateStreams', p, iAudio, iVideo);
		if(!isValid(p))
			return;

		for(var i = 0; i < $scope.streams.length; i++){ 
			if ( $scope.streams[i].getId() === p.getId()) { 
				MesiboLog('updateStreams','existing');
				$scope.streams[i] = p;
				return;
			}
		}
		
		$scope.streams.push(p);		
		$scope.setGrid($scope.streams.length);

		$scope.$applyAsync(function()  {
			MesiboLog('connectStream updateStreams', p, document.getElementById("video-"+ p.getId()));
			$scope.connectStream(null, p, "video-"+ p.getId(), iAudio, iVideo);
		});

	}

	$scope.subscribe = function(p, iAudio, iVideo) {
		MesiboLog('subscribe', p, iAudio, iVideo);

		p.isVisible = true;
		p.isSelected = false;
		p.isFullScreen = false;
		p.isConnected = true;

		$scope.updateParticipants(p);		
		$scope.updateStreams(p, iAudio, iVideo);	

	}
	
	$scope.toggleNameDisplay = function(){
		$scope.display_names = !$scope.display_names;
		if($scope.display_names)
			$scope.display_names_placeholder = '*';
		else
			$scope.display_names_placeholder = '';
		$scope.refresh();
	} 

	$scope.getSelectedStream = function(stream_index){
		//Returns matching stream object from streams array
		/** Review Logic **/
		if(stream_index > $scope.streams.length)
			return null;
		var selected_stream = $scope.streams[stream_index];

		return selected_stream;
	}

	$scope.isExistingStream = function(stream){
		for (var i = $scope.streams.length - 1; i >= 0; i--) {
			if($scope.streams[i] == stream)
				return true;    		
		}

		return false;
	}

	$scope.getParticipantFromId = function(pUid){
		if(!isValid(pUid) || !(pUid > 0))
			return null;

		for (var i = $scope.participants.length - 1; i >= 0; i--) {
			var uid = $scope.participants[i].getId();
			if(uid == pUid)
				return $scope.participants[i];
		}

		return null;
	}

	$scope.getStreamFromId = function(pUid){
		if(!isValid(pUid) || !(pUid > 0))
			return null;

		for (var i = $scope.streams.length - 1; i >= 0; i--) {
			var uid = $scope.streams[i].getId();
			if(uid == pUid)
				return $scope.streams[i];
		}

		return null;
	}

	/*
	 * Updates current stream and current participant
	 */
	$scope.updateCurrentSelected = function(participant){

		if(!isValid(participant))
			return -1;

		var selected_stream = $scope.getStreamFromId(participant.getId());

		if(isValid(selected_stream)){
			selected_stream.isSelected = true;
			if(isValid($scope.current_selected_stream)){
				$scope.current_selected_stream.isSelected = false;
			}

			$scope.current_selected_stream = selected_stream;
		}

		if(isValid($scope.current_selected_participant)){
			$scope.current_selected_participant.isSelected = false;
		}

		$scope.current_selected_participant = participant;						

	}

	$scope.selectStream = function(participant){
		MesiboLog('selectStream');
		if(!isValid(participant))
			return;

		if(!$scope.isExistingStream(participant))
			return;

		participant.isSelected = true;
		$scope.updateCurrentSelected(participant);

		$scope.refresh();
	}


	$scope.toggleStreamVisibility = function(participant){
		MesiboLog('toggleStreamVisibility');
		if(!isValid(participant))
			return;

		var selected_stream = $scope.getStreamFromId(participant.getId());
		if(!isValid(selected_stream))
			return -1;

		selected_stream.isVisible = !selected_stream.isVisible;

		$scope.refresh();

	}

	$scope.getAudioStatusColor = function(stream){
		// MesiboLog('getAudioStatusColor', stream);
		if(!isValid(stream))
			return 'grey';

		if(stream.muteStatus(false) == true){
			return '#FF6347';
		}

		return 'green';
	}

	$scope.getVideoStatusColor = function(stream){
		// MesiboLog('getVideoStatusColor', stream);
		if(!isValid(stream))
			return 'grey';

		if(stream.muteStatus(true) == true)
			return '#FF6347';

		return 'green';
	}

	$scope.getAudioStatusClass = function(stream){
		if(!isValid(stream))
			return "";

		if(stream.muteStatus(false) == true)
			return "fas fa-microphone-slash";

		return "fas fa-microphone";
	}

	$scope.getVideoStatusClass = function(stream){
		if(!isValid(stream))
			return "";

		if(stream.muteStatus(true) == true)
			return "fas fa-video-slash";

		return "fas fa-video";
	}


	$scope.toggleAudioMute = function(stream_index){
		var selected_stream = $scope.getSelectedStream(stream_index);
		if(!isValid(selected_stream))
			return -1;

		selected_stream.toggleMute(false); //false for audio
		$scope.refresh();
		return 0;
	}

	$scope.toggleVideoMute = function(stream_index){
		var selected_stream = $scope.getSelectedStream(stream_index);
		if(!isValid(selected_stream))
			return -1;

		selected_stream.toggleMute(true); //true for video
		$scope.refresh();
		return 0;
	}

	$scope.getFullScreenStatusClass = function(stream){
		// MesiboLog('getFullstreamstatusClass');
		if(!isValid(stream))
			return "";

		// if(stream.isFullScreen)
		// 	return "fa fa-compress";
		if($scope.full_screen_selected === stream || stream.isFullScreen)
			return "fa fa-compress";


		return "fa fa-expand";
	}


	function getElementWidth(ele_id){
		if(!isValidString(ele_id))
			return -1;
		var elem = document.getElementById(ele_id);
		if(!isValid(elem))
			return -1;
		return elem.offsetWidth;
	}

	function getElementHeight(ele_id){
		if(!isValidString(ele_id))
			return -1;
		var elem = document.getElementById(ele_id);
		if(!isValid(elem))
			return -1;
		return elem.offsetHeight;
	}

	

	$scope.adjustFullScreenWidth = function(column_level){
		var bottom_strip_height = getElementHeight('horizontal-strip-body');
		// if(bottom_strip_height > 0)
		// 	bottom_strip_height = 140;

		// var sa = document.getElementById("streams-area");
		var h = getElementHeight('streams-area');
		var w = getElementWidth('streams-area');;

		h = 0.9*h;

		var available_height = h - bottom_strip_height;
		var adjusted_width = available_height * DEFAULT_ASPECT_RATIO;
		if(adjusted_width > w) {
			// adjusted_width = 0.8*w;
			adjusted_width = w;
			available_height = adjusted_width/DEFAULT_ASPECT_RATIO;
		}
		

		var fs = document.getElementById("full-screen-container");
		column_level = parseInt((adjusted_width*12)/w);
		fs.className = 'col-'+ column_level + ' stream-thumbnail-block pr-0 pl-0 mx-0';

		// fs.style.width = adjusted_width + 'px';
		// fs.style.height = available_height +'px';

		return 0;
	}

	$scope.setupStrip = function(){
		for(var i = 0; i < $scope.streams.length; i++){ 
			if($scope.streams[i] != $scope.full_screen_selected){
				$scope.streams[i].attach("video-small-"+ $scope.streams[i].getId(), $scope.on_attached, 100, 50);
				$scope.streams[i].isFullScreen = false;
			}
		}
	}

	$scope.closeFullScreen = function(){
		MesiboLog('closeFullScreen');
		$scope.full_screen_selected = null;
		$scope.full_screen_init = false;

		$timeout(function()  {
			MesiboLog('toggleFullScreen','Returning to normal mode: reattach');
			for(var i = 0; i < $scope.streams.length; i++){ 
				$scope.streams[i].attach("video-"+ $scope.streams[i].getId(), $scope.on_attached, 100, 10);
				$scope.setStreamContainerDimensions($scope.streams[i], 'video', DEFAULT_ASPECT_RATIO);
			}
		});		
	}

	/**
	* Switch from normal mode to fullscreen mode for selected stream
	* Full screen mode consists of expanded video and a bottom thumbanail strip of other streams
	* Calls attahc for selected stream to the full screen element 
	* When returning from full screen mode to normal mode, 
	* since grid is setup again re attach needs to be called  
	*/

	$scope.toggleFullScreen = function(selected_stream){
		MesiboLog('toggleFullScreen', selected_stream);

		if(!isValid(selected_stream)){
			$scope.closeFullScreen();
			return -1;
		}

		selected_stream.isFullScreen = !selected_stream.isFullScreen;

		MesiboLog('toggleFullScreen','selected_stream.isFullScreen', selected_stream.isFullScreen);
		if(!selected_stream.isFullScreen){ //For hiding full screen
			$scope.closeFullScreen();
			return 0;
		}
			

		$scope.full_screen_selected = selected_stream;
		// $scope.full_screen_selected.id = stream_index;

		$scope.$$postDigest(function()  {
			if(!$scope.full_screen_init){ 
				$scope.adjustFullScreenWidth(BS_MAX_COLUMN_LEVEL);
				$scope.full_screen_init = true;	
			}
		});

		$scope.$applyAsync(function()  {
			MesiboLog('toggleFullScreen','Attaching fullscreen to:', $scope.full_screen_selected.getId(), $scope.full_screen_selected );			
			$scope.full_screen_selected.attach("full-screen-video-"+ $scope.full_screen_selected.getId(), $scope.on_attached, 100, 50);
			
			$scope.setupStrip();
		
		});

		return 0;

	}

	$scope.hideFullScreen = function(stream_index){
		$scope.full_screen_selected = null;
		$('#fullScreenModal').modal("hide");
		$('body').removeClass('modal-open');
		$('.modal-backdrop').remove();
	}

	$scope.isHidden = function(el) {
		// MesiboLog('isHidden', el, bHidden);
		if(!isValid(el))
			return true;

		var style = window.getComputedStyle(el);
		var bHidden = (style.display === 'none'); 
		// MesiboLog('isHidden', el, bHidden);
		return bHidden;
	}

	$scope.getPopupGridPosition = function(popup_id){
		if(!isValid(popup_id)){
			return -1;
		}

		for(var i=0; i<6; i++){
			if(!$scope.popup_grid_map[i]){ //Empty slot available
				$scope.popup_grid_map[i] = popup_id;
				return i;
			}
		}

		return -1;
	}

	$scope.freePopupGridPosition = function(popup_id){
		if(!isValid(popup_id))
			return -1;

		for(var i=0; i<6; i++){
			if(popup_id == $scope.popup_grid_map[i]){
				$scope.popup_grid_map[i] = null; //Free Slot
				return i;
			}
		}
		return -1;	
	}

	$scope.placePopupInGrid = function(popup_div, popup_identifier){
		if(!isValid(popup_div) || !isValid(popup_identifier))
			return null;

		var popup_grid_pos = $scope.getPopupGridPosition(popup_identifier);
		if(!isValid(popup_grid_pos) || popup_grid_pos < 0 ){
			MesiboLog('Invalid popup grid position');
			return null;
		}

		var shift_right = ((POPUP_WIDTH*(popup_grid_pos % 3))) +'px';
		var shift_bottom = (10+ (POPUP_HEIGHT*(Math.floor(popup_grid_pos /3))))+'px';
		MesiboLog('Dynamic postioning of popup', popup_grid_pos , shift_right, shift_bottom);
		popup_div.style.right = shift_right;
		popup_div.style.bottom = shift_bottom;

		return popup_div;
	}

    $scope.sessionReadMessages = function(session_key, user, count){
    	if(!isValid(session_key) || !isValid(user) || !isValid(count) || count<=0){
    		ErrorLog('Error:', 'sessionReadMessages', 'Invalid input');
    		return -1;
    	}


        MesiboLog("sessionReadMessages", user);
        var peer = user.peer;
        var groupid = user.groupid;

        MesiboLog("sessionReadMessages ", session_key, peer+ " "+" groupid "+ groupid+ " "+ count);

        $scope.messageSession[session_key] =  $scope.mesibo.readDbSession(peer, groupid, null,
            function on_read(count) {
            MesiboLog("sessionReadMessages complete", session_key, count);
            MesiboLog($scope.messageSession[session_key].getMessages());
            
            $scope.refresh();

			if(isValid(groupid) && groupid >0)
				$scope.scrollToLastMsg(groupid);

			if(isValidString(peer))
				$scope.scrollToLastMsg(peer);
         
        });

        if(!isValid($scope.messageSession[session_key])){
            ErrorLog('Error:','sessionReadMessages', "Invalid messageSession");
            return -1;
        }

        $scope.messageSession[session_key].enableReadReceipt(true, true);
        $scope.messageSession[session_key].read(count);

    }

	$scope.showPopupChat = function(participant){
		MesiboLog('showPopupChat', participant)
		var selected = {};
		var popup_identifier;
		if(!isValid(participant)){
			//Default to Group Messaging
			selected.peer = null;
			selected.groupid = $scope.room.gid;
			selected.name = $scope.room.name;
			popup_identifier = selected.groupid;
		}
		else{
			//One-to-One messaging
			var uid = participant.getId();
			if(!isValid(uid) || !(uid>0))
				return; 			
			selected = participant;
			selected.peer = selected.getAddress();
			selected.name = selected.getName();
			selected.groupid = 0;
			popup_identifier = selected.peer;
		}	

		var popup_div	= document.getElementById('popup_chat_'+ popup_identifier);

		/*Needs more testing. Beccause making it grey out means message has been read*/
		var participant_chat_icon = document.getElementById('chat_popup_participant_'+popup_identifier);
		if(isValid(participant_chat_icon))
			participant_chat_icon.style.color = 'grey';

		if(isValid(selected.groupid) && selected.groupid >0)
			$scope.group_messsage_notification = '';


		$('.mesibo_popup_'+popup_identifier).toggle();
		
		if(isValid(popup_div)){	


			if(!$scope.isHidden(popup_div)){
				//Open existing popup

				MesiboLog('=====> opening popup, enabling read receipt');
				// $scope.sessionReadMessages(popup_identifier, selected, MAX_MESSAGES_READ);
				if(!isValid($scope.messageSession) || !isValid($scope.messageSession[popup_identifier])){
					ErrorLog('Invalid Message Session');
					return;	
					}
				$scope.messageSession[popup_identifier].enableReadReceipt(true, true);
				$scope.messageSession[popup_identifier].read(MAX_MESSAGES_READ);
				
				// $scope.placePopupInGrid(popup_div, popup_identifier);				
				return;				
			}			

			return; //Popup Already Exists On Screen
		}

		MesiboLog('creating popup_template', selected);

		var popup_template = document.getElementById('popup_chat'),
			popup_clone = popup_template.cloneNode(true); 

		popup_clone.id = "popup_chat_"+popup_identifier;

		var class_name = ' mesibo_popup_'+ popup_identifier;
		popup_clone.className += class_name;

		$scope.placePopupInGrid(popup_clone, popup_identifier);


		popup_clone.getElementsByClassName('Messenger_header')[0].id = 'popup_chat_'+popup_identifier+'_header';

		popup_clone.getElementsByClassName('popup_display_name')[0].id = 'popup_display_name_'+popup_identifier;
		popup_clone.getElementsByClassName('popup_display_name')[0].innerHTML = selected.name;

		popup_clone.getElementsByClassName('popup-message-area')[0].setAttribute('ng-repeat', "m in messageSession['"+popup_identifier+"'].getMessages()");
		popup_clone.getElementsByClassName('popup-message-area-1')[0].setAttribute('ng-class', "{'outgoing_msg': m && isSent(m),'incoming_msg':m && isReceived(m)}");

		popup_clone.getElementsByClassName('popup-message-area-2')[0].setAttribute('ng-class', "{'sent_msg':isSent(m), 'received_msg':isReceived(m)}");

		popup_clone.getElementsByClassName('popup-message-area-file')[0].setAttribute('ng-if', "isFileMsg(m)");
		popup_clone.getElementsByClassName('popup-message-area-file')[0].setAttribute('ng-href', "{{isFileMsg(m)? m.fileurl:''}}");

		popup_clone.getElementsByClassName('popup-message-area-image')[0].setAttribute('ng-if', "isImageMsg(m)");
		popup_clone.getElementsByClassName('popup-message-area-image-src')[0].setAttribute('ng-src', "{{m.fileurl}}");
		popup_clone.getElementsByClassName('popup-message-area-video')[0].setAttribute('ng-if', "isVideoMsg(m)");
		popup_clone.getElementsByClassName('popup-message-area-video-src')[0].setAttribute('ng-src', "{{m.fileurl}}");
		popup_clone.getElementsByClassName('popup-message-area-audio')[0].setAttribute('ng-if', "isAudioMsg(m)");
		popup_clone.getElementsByClassName('popup-message-area-audio-src')[0].setAttribute('ng-src', "{{m.fileurl}}");
		popup_clone.getElementsByClassName('popup-message-area-other')[0].setAttribute('ng-if', "isOtherMsg(m)");

		popup_clone.getElementsByClassName('popup-message-area-message-text')[0].innerHTML = '{{m.title ? m.title : m.message}}';
		popup_clone.getElementsByClassName('popup-message-area-sender-name')[0].setAttribute('ng-show', 'm.groupid!=0 && isReceived(m)');
		popup_clone.getElementsByClassName('popup-message-area-sender-name')[0].innerHTML = '{{addressBook[m.peer]}}';
		popup_clone.getElementsByClassName('popup-message-area-message-time')[0].innerHTML = '{{m.date.time}} &nbsp;';

		popup_clone.getElementsByClassName('popup-message-area-message-time')[0].setAttribute('ng-style', "{'float': isSent(m) ? 'left':'right'}");
		popup_clone.getElementsByClassName('popup-message-area-details-1')[0].setAttribute('ng-style', "{'margin-left': isReceived(m) ? '0!important':'0'}");

		MesiboLog(popup_clone);
		popup_clone.getElementsByClassName('popup-message-area-message-status')[0].setAttribute('ng-class', "getMessageStatusClass(m)");
		popup_clone.getElementsByClassName('popup-message-area-message-status')[0].setAttribute('ng-style', "{'color':getMessageStatusColor(m)}");

		MesiboLog("$event.keyCode === 13 && sendMessage("+selected.peer+','+selected.groupid+")");
		popup_clone.getElementsByClassName('popup-message-area-message-input')[0].setAttribute('ng-keydown', "$event.keyCode === 13 && sendMessage('"+selected.peer+"',"+selected.groupid+")");
		popup_clone.getElementsByClassName('popup-message-area-message-input')[0].setAttribute('id', "popup_message_area_message_input_"+popup_identifier);
		popup_clone.getElementsByClassName('popup-message-area-message-input')[0].setAttribute('ng-model', "input_message_text['"+popup_identifier+"']");

		popup_clone.getElementsByClassName('popup-message-area-message-input-send')[0].setAttribute('ng-click', "sendMessage('"+selected.peer+"',"+selected.groupid+")");

		popup_clone.getElementsByClassName('popup-message-area-upload-file')[0].setAttribute('ng-click', "clickUploadFile('"+selected.peer+"',"+selected.groupid+")");

		popup_clone.getElementsByClassName('popup-message-area-anchor-end')[0].id = 'messages_end_'+popup_identifier;

		// if(isValidString(selected.peer)){
		// 	popup_clone.getElementsByClassName('popup-make-video-call')[0].setAttribute('ng-click', "makeVideoCall('"+selected.peer+"')");
		// 	popup_clone.getElementsByClassName('popup-make-voice-call')[0].setAttribute('ng-click', "makeVoiceCall('"+selected.peer+"')");
		// }
		// else{
		// 	popup_clone.getElementsByClassName('popup-make-video-call')[0].setAttribute('ng-if', "false");
		// 	popup_clone.getElementsByClassName('popup-make-voice-call')[0].setAttribute('ng-if', "false");
		// }

		popup_clone.getElementsByClassName('chat_close')[0].id = 'mesibo_popup_'+popup_identifier;
		popup_clone.getElementsByClassName('chat_close')[0].setAttribute('ng-click', "closePopupChat('"+'mesibo_popup_'+popup_identifier+"')");

		MesiboLog('reading messageSession for', selected.peer, selected.groupid)
		if(!isValid(selected.peer))
			selected.peer = '';

		$scope.sessionReadMessages(popup_identifier, selected, MAX_MESSAGES_READ);

		var chat_parent = document.getElementById('Smallchat');
		chat_parent.appendChild(popup_clone);
		$('.mesibo_popup_'+popup_identifier).toggle();

		$compile(popup_clone)($scope);

		// Make the DIV element draggable:
		makePopupDraggable(document.getElementById('popup_chat_'+popup_identifier));
	}

	$scope.closePopupChat = function(popup_class){
		if(!isValidString(popup_class))
			return -1;

		popup_identifier = popup_class.split("_");
		MesiboLog(popup_identifier);
		popup_identifier = popup_identifier[popup_identifier.length -1];
		MesiboLog('=====> closePopupChat, disabling read receipt', popup_identifier, $scope.messageSession[popup_identifier]);
		$scope.messageSession[popup_identifier].enableReadReceipt(false);
		$scope.freePopupGridPosition(popup_identifier);


		MesiboLog('closePopupChat', popup_class);
		if(!isValid(popup_class))
			return;
	
		if(!$scope.isHidden(document.getElementById('mesibo_popup_'+popup_identifier))){
			$('.mesibo_popup_'+popup_identifier).toggle();
		}	

		if($scope.active_popup_chat_count>0)
			$scope.active_popup_chat_count--;
	}


	//Send text message to peer(selected user) by reading text from input area
	$scope.sendMessage = function(peer, groupid){
		MesiboLog('sendMessage', peer, groupid);
		if(!isValidString(peer) && !isValid(groupid))
			return; //Neither a valid one-to-one to group message

		if(groupid!=0){
			var value = $scope.input_message_text[groupid];
			$scope.input_message_text[groupid] = "";
		}
		else{
			var value = $scope.input_message_text[peer];
			$scope.input_message_text[peer] = "";
		}

		MesiboLog(value, $scope.input_message_text);
		if (!isValidString(value))
			return -1;

		MesiboLog(value);

		MesiboLog($scope.selected_user);
		var m = {}
		m.id = $scope.mesibo.random();
		if(isValidString(peer))
			m.peer = peer;	
		m.groupid = groupid;
		m.flag = MESIBO_FLAG_DEFAULT;
		m.message = value;


		MesiboLog('sendMessage', m.peer, m.groupid, m, m.id, m.message);
		$scope.mesibo.sendMessage(m, m.id, value);
		$scope.refresh();

		MesiboLog('scrollToLastMsg', m.peer, m.groupid, isValidString(m.peer), isValid(m.groupid));
		if(isValid(m.groupid) && m.groupid!=0){
			MesiboLog('scrollToLastMsg', m.groupid);
			$scope.scrollToLastMsg(m.groupid);
		}
		else if(isValidString(m.peer)){
			MesiboLog('scrollToLastMsg', m.peer);
			$scope.scrollToLastMsg(m.peer);
		}


		var popup_identifier = m.peer ? m.peer : m.groupid;
		MesiboLog('clear input', 'document.getElementById("popup_message_area_message_input_'+popup_identifier+'").value = ""');
		var pInput = document.getElementById("popup_message_area_message_input_"+popup_identifier);
		$scope.refresh();      
	}

	$scope.initMesibo = function(){
		$scope.mesibo = new Mesibo();

		//Initialize Mesibo

		MesiboLog(MESIBO_APP_ID, $scope.user.token, 'initMesibo');
		$scope.mesibo.setAppName(MESIBO_APP_ID);
		if( false == $scope.mesibo.setCredentials($scope.user.token))
			return -1;

		$scope.mesibo.setListener($scope);
		$scope.mesibo.setDatabase("mesibo");
		$scope.mesibo.start();

		$scope.live = $scope.mesibo.initGroupCall();        
		$scope.live.setRoom($scope.room.gid);
		$scope.publisher = $scope.live.getLocalParticipant($scope.user.name, $scope.user.address);
		if(!isValid($scope.publisher))
			return -1;        


		MesiboLog('publisher', $scope.publisher);

		$scope.call = new MesiboCall($scope);
		$scope.file = new MesiboFile($scope);

		$scope.refresh();

		return 0;
	}



	$scope.publish = function() {
		var o = {};
		o.peer = 0;
		o.name = $scope.room.name;
		o.groupid = $scope.room.gid;	
		o.source = $scope.toggle_source;

		$scope.publisher.streamOptions = false;	
		$scope.connectStream(o, $scope.publisher, 'video-publisher', $scope.room.init.audio, $scope.room.init.video);
		$scope.refresh();
	}

	$scope.connectStream = function(o, stream, element_id, iAudio, iVideo){
		MesiboLog('connectStream params', o, stream, element_id, iAudio, iVideo)
		if(!isValid(stream) || !isValidString(element_id))
			return -1;

		
		if(isValid($scope.room) && isValid($scope.room.init)){
			if(!isValid(o)){
				o = {};
			}
			o.audio = $scope.room.init.audio;
			o.video = $scope.room.init.video;			
			MesiboLog('======> Initialize Room', o, stream.getId());
		}
		// Over Ride. iAudio & iVideo are optional params
		if(isValid(iAudio)){
			o.audio = iAudio;
			MesiboLog('======> Initialize Audio', o, stream.getId());
		}

		if(isValid(iVideo)){
			o.video = iVideo;
			MesiboLog('======> Initialize Video', o, stream.getId());
		}

		MesiboLog('connectStream', stream, o, element_id, document.getElementById(element_id));
		stream.call(o, element_id, $scope.on_stream, $scope.on_status);
	}

	$scope.streamFromCamera = function() {
		MesiboLog('streamFromCamera');
		$scope.toggle_source = STREAM_CAMERA;
		$scope.publish();
	}

	$scope.streamFromScreen = function() {
		MesiboLog('streamFromScreen');
		$scope.toggle_source = STREAM_SCREEN;
		$scope.publish();
	}

	$scope.callParticipant = function(participant, audio, video){
		MesiboLog('callParticipant', participant, audio, video);

		if(!isValid(audio) || !isValid(video) || !isValid(participant))
			return;

		var stream = $scope.getStreamFromId(participant.getId());
		MesiboLog(stream);

		if(isValid(stream)){
			ErrorLog('Participant already subscribed');
			toastr.error('Participant already subscribed');
			return;
		}

		$scope.subscribe(participant, audio, video);

	}	

	$scope.openFullscreen = function(video_elem, stream_uid, stream) {

		MesiboLog('openFullscreen',video_elem, stream_uid, stream);

		if(!isValid(stream) || !isValid(stream_uid) || !isValid(video_elem))
			return;

		$scope.ultra_full_screen_selected = stream;
		// stream.fullScreen(true);

		var elem_id = video_elem + stream_uid;

		var elem = document.getElementById(elem_id);
		if(!isValid(elem)){
			MesiboLog('openFullscreen', 'element does not exist');
			return -1;
		}

		if (elem.requestFullscreen) {
			elem.requestFullscreen();
		} else if (elem.mozRequestFullScreen) { /* Firefox */
			elem.mozRequestFullScreen();
		} else if (elem.webkitRequestFullscreen) { /* Chrome, Safari & Opera */
			elem.webkitRequestFullscreen();
		} else if (elem.msRequestFullscreen) { /* IE/Edge */
			elem.msRequestFullscreen();
		}

		return 0;
	}



	$scope.update_streams = function(i) {
		console.log(i);
		if(i < 0) return;
		var e = document.getElementById('video-' + $scope.streams[i].name);
		console.log(e);
	}


	$scope.$on('onStreamsRendered', function(e) {
		console.log("onStreamsRendered", e);

		for (var i = $scope.streams.length - 1; i >= 0; i--) {
			$scope.setStreamContainerDimensions($scope.streams[i], 'video', DEFAULT_ASPECT_RATIO);
		}

		$scope.refresh();
	});

	$scope.$on('onFullScreenRendered', function(e) {
		console.log("onFullScreenRendered", e);
		if(!isValid($scope.full_screen_selected)) return;
		$scope.setStreamContainerDimensions($scope.full_screen_selected, 'full-screen-video', 1);
		//For full screen no modifications	
	});


	$scope.$on('onStripRendered', function(e) {
		console.log("onStripRendered", e);		
		for (var i = $scope.streams.length - 1; i >= 0; i--) {				
			$scope.setStreamContainerDimensions($scope.streams[i], 'video-small', DEFAULT_ASPECT_RATIO);
		}

		$scope.refresh();
	});


	$scope.setStreamContainerDimensions = function(stream, stream_id_string, aspect_ratio){
		if(!isValid(stream) || !isValid(stream_id_string) || !isValid(aspect_ratio) || aspect_ratio <0)
			return;

		var adjusted_height = $scope.getAdjustedHeight(stream_id_string +'-'+stream.getId(), aspect_ratio);	
		MesiboLog('setStreamContainerDimensions', stream_id_string+'-'+ stream.getId(), adjusted_height);
		if(!isValid(adjusted_height) || !(adjusted_height > 0 )){
			ErrorLog('setStreamContainerDimensions', 'Invalid height for', stream.getName());
			return;
		}

		var stream_container = document.getElementById(stream_id_string + '-container-' + stream.getId());
		MesiboLog('setStreamContainerDimensions', stream_container);
		if(!isValid(stream_container)){
			ErrorLog('setStreamContainerDimensions', 'Invalid Stream container', stream_container);
			return;
		}
		stream_container.style.height = adjusted_height +'px'; 
	}

	$scope.getHiddenWidth = function(stream_id, aspect_ratio){
		MesiboLog('getHiddenWidth');
		
		var parent_id = "#parent-"+ stream_id;
		var previousCss  = $(parent_id).attr("style");

		$(parent_id).css({
		    position:   'absolute', 
		    visibility: 'hidden',
		    display:    'block'
		});

		var parent_height = $('#'+stream_id).parent().height();
		var parent_width = $('#'+stream_id).parent().width();

		$(parent_id).attr("style", previousCss ? previousCss : "");
		return parent_width;

	}

	$scope.getAdjustedHeight = function(stream_id, aspect_ratio){
		MesiboLog('getAdjustedHeight', 'sid', stream_id, 'ar', aspect_ratio);
		if(!isValid(stream_id) || !(isValid(aspect_ratio) || aspect_ratio < 0))
			return -1;


		MesiboLog(document.getElementById(stream_id));
		var parent_height = $('#'+stream_id).parent().height();
		var parent_width = $('#'+stream_id).parent().width();

		if(!isValid(parent_width) || !isValid(parent_height) || !parent_width || !parent_height){
			//In case of horizontal strip, stream panel might be hidden
			MesiboLog('getHiddenWidth');
			parent_width = $scope.getHiddenWidth(stream_id, aspect_ratio);
		}
		
		//In case of full-screen , make no adjustments to height
		var adjusted_height = aspect_ratio == 1 ? parent_height : parent_width / aspect_ratio;

		if(!isValid(adjusted_height)) return -1;

		MesiboLog('getAdjustedHeight', 'parent_width', parent_width, 'parent_height', parent_height);
		MesiboLog('getAdjustedHeight', 'adjusted_height', adjusted_height);

		return adjusted_height;
	}

	$scope.getAdjustedWidth = function(stream_id){
		MesiboLog('getAdjustedWidth', stream_id);
		if(!isValid(stream_id))
			return;
		MesiboLog(document.getElementById(stream_id));
		var parent_height = $('#'+stream_id).parent().height();
		var parent_width = $('#'+stream_id).parent().width();

		//Always maintain 4:3 Aspect Ratio
		var adjusted_width = (DEFAULT_ASPECT_RATIO) * parent_height;
		MesiboLog('parent_width', parent_width, 'parent_height', parent_height);
		MesiboLog('adjusted_width', adjusted_width);
		return adjusted_width;
	}

	$scope.initGridWidth = function(){
		var sa = document.getElementById("streams-area");
		var h = sa.offsetHeight;
		var w = sa.offsetWidth;

		// h = 0.90*h;

		var adjusted_width = h*DEFAULT_ASPECT_RATIO;
		if(adjusted_width > w) {
			adjusted_width = w;
		}

		document.getElementById("grid-container").style.width = adjusted_width + 'px'; 
	}


	$scope.initPublisherHeight = function(){
		MesiboLog('initPublisherHeight');
		var publisher_height =  $scope.getAdjustedHeight('video-publisher', DEFAULT_ASPECT_RATIO);
		if(!isValid(publisher_height) || publisher_height <= 0){
			ErrorLog('initPublisherHeight','Invalid publisher_height');
			return -1;		
		}

		document.getElementById("video-publisher").style.height = publisher_height + 'px'; 
	}
	

	$scope.isFullScreenChanged = function(){
		MesiboLog('isFullScreenChanged');
		var stream = $scope.ultra_full_screen_selected;

		if(!isValid(stream)){
			MesiboLog('Invalid ultra_full_screen_selected')
			return;    	
		}

		if (document.fullscreenElement) {
			if(!isValid(stream))return;
			MesiboLog(`Element: ${document.fullscreenElement.id} entered full-screen mode with stream `+ stream.getId());    
			stream.fullScreen(true); 
		} 
		else {
			if(!isValid(stream))return;
			MesiboLog('Leaving full-screen mode. '+ stream.getId());    
			stream.fullScreen(false);
			$scope.ultra_full_screen_selected = false;
		}
	}

	$scope.copyInviteText =function(publisher_type){
		MesiboLog('copyInviteText', publisher_type);

		var element_id;
		if(publisher_type == $scope.participant_type_publisher)
			element_id = 'invite-text-publisher';

		if(publisher_type == $scope.participant_type_subscriber)
			element_id = 'invite-text-subscriber';

		MesiboLog(element_id);
		var invite_text = document.getElementById(element_id);
		if(!isValid(invite_text)){
			ErrorLog('Invalid Invite Text');
			return;
		}

		MesiboLog(invite_text.innerHTML);
		invite_text = invite_text.value;
		MesiboLog(invite_text);
		// $('.'+element_id+'').html(invite_text.replace(/\n/g,"<br>"));


		$("#"+element_id).select();
		document.execCommand("copy");

		toastr.success("Copied Invite Text");
		
	}

	$scope.init = function(){
		MesiboLog('init called');

		$scope.user =  _initLoginCredentialsFromStorage();

		MesiboLog($scope.user);
		if(!isValid($scope.user)){
			MesiboLog('Unable to initialize login credentials from storage');
			window.open("login.html","_self");
			return;
		}

		var roomid = getParameterByName('roomid', window.location.href);
		if(!isValidString(roomid)){
			MesiboLog(roomid);
			window.open("login.html", "_self");
			return;
		}

		roomid = parseInt(roomid);
		if(roomid < 0)
			return;

		$scope.room = _initRoomCredentialsFromStorage(roomid);
		MesiboLog($scope.room);
		if(!isValid($scope.room)){
			MesiboLog('Unable to initialize room from storage');
			window.open("login.html","_self");
			return;
		}

		var rv = $scope.initMesibo();
		MesiboLog('Mesibo-Live-Demo init', rv == 0 ? 'success' : 'failed');
		if(-1 == rv){
			toastr.error('Room initialization failed. Exiting room..');
			$scope.exitRoom();
		}

		["fullscreenchange", "webkitfullscreenchange", "mozfullscreenchange", "msfullscreenchange"].forEach(
			eventType => document.addEventListener(eventType, $scope.isFullScreenChanged, false)
		);

		$scope.initGridWidth();
		$scope.initPublisherHeight();

	}


	$scope.init();

}]);


function makePopupDraggable(elmnt) {
	var pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
	if (document.getElementById(elmnt.id + "_header")) {
		// if present, the header is where you move the DIV from:
		document.getElementById(elmnt.id + "_header").onmousedown = popupDragMouseDown;
	} else {
		// otherwise, move the DIV from anywhere inside the DIV:
		elmnt.onmousedown = popupDragMouseDown;
	}

	function popupDragMouseDown(e) {
		e = e || window.event;
		e.preventDefault();
		// get the mouse cursor position at startup:
		pos3 = e.clientX;
		pos4 = e.clientY;
		document.onmouseup = closePopupDraggable;
		// call a function whenever the cursor moves:
		document.onmousemove = popupElementDrag;
	}

	function popupElementDrag(e) {
		e = e || window.event;
		e.preventDefault();
		// calculate the new cursor position:
		pos1 = pos3 - e.clientX;
		pos2 = pos4 - e.clientY;
		pos3 = e.clientX;
		pos4 = e.clientY;
		// set the element's new position:
		elmnt.style.top = (elmnt.offsetTop - pos2) + "px";
		elmnt.style.left = (elmnt.offsetLeft - pos1) + "px";
	}

	function closePopupDraggable() {
		// stop moving when mouse button is released:
		document.onmouseup = null;
		document.onmousemove = null;
	}
}


//For debugging purposes only
function getScope(){
	return angular.element(document.getElementById('mesiboliveapp')).scope();
};

/**
 * Plays a sound using the HTML5 audio tag. Provide mp3 and ogg files for best browser support.
 * @param {string} filename The name of the file. Omit the ending!
 */
function playSound(filename){
	var mp3Source = '<source src="' + filename + '.mp3" type="audio/mpeg">';
	var oggSource = '<source src="' + filename + '.ogg" type="audio/ogg">';
	var embedSource = '<embed hidden="true" autostart="true" loop="false" src="' + filename +'.mp3">';
	document.getElementById("sound").innerHTML='<audio autoplay="autoplay">' + mp3Source + oggSource + embedSource + '</audio>';
}

function textAreaAdjust(o) {
	o.style.height = "1px";
	o.style.height = (25+o.scrollHeight)+"px";
}

window.onkeydown=function(event){
	if(event.keyCode==13){
		if(event.preventDefault) event.preventDefault(); 
		return false;
	}
}

$(document).keyup(function(e) {
	if (e.keyCode === 27){    // esc
		MesiboLog('Hide permission prompt');
		document.getElementById('permissions-prompt').style.display = 'none';
	}
});


function getParameterByName(name, url){
	MesiboLog('getParameterByName', name, url);
	if (!url) url = window.location.href;
	name = name.replace(/[\[\]]/g, '\\$&');
	var regex = new RegExp('[?&]' + name + '(=([^&#]*)|&|#|$)'),
		results = regex.exec(url);
	if (!results) return false;
	if (!results[2]) return '';
	return decodeURIComponent(results[2].replace(/\+/g, ' '));
}

 function isMobileDetected() {
  let check = false;
  (function(a){if(/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino/i.test(a)||/1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0,4))) check = true;})(navigator.userAgent||navigator.vendor||window.opera);
  return check;
}

function isBrowserOutdated() {
  var browser = platform.name;
  var version = platform.version;
  version = version.slice(0, version.indexOf('.'));

  MesiboLog('=======> platform', browser, version);
  if ( ( browser == "Chrome" && version < 70 ) || ( browser == "Firefox" && version < 53 ) || ( browser == "Safari" && version < 5 ) || ( browser == "IE" && version < 11 ) || ( browser == "Opera" && version < 52 ) ) {
      return true;

    return false;
  }
}




