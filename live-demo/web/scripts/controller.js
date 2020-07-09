/** Copyright (c) 2019 Mesibo
 * https://mesibo.com
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the terms and condition mentioned
 * on https://mesibo.com as well as following conditions are met:
 *
 * Redistributions of source code must retain the above copyright notice, this
 * list of conditions, the following disclaimer and links to documentation and
 * source code repository.
 *
 * Redistributions in binary form must reproduce the above copyright notice,
 * this list of conditions and the following disclaimer in the documentation
 * and/or other materials provided with the distribution.
 *
 * Neither the name of Mesibo nor the names of its contributors may be used to
 * endorse or promote products derived from this software without specific prior
 * written permission.
 *
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
 * AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
 * IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
 * ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER OR CONTRIBUTORS BE
 * LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR
 * CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF
 * SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS
 * INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN
 * CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
 * ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
 * POSSIBILITY OF SUCH DAMAGE.
 *
 * Documentation
 * https://mesibo.com/documentation/
 *
 * Source Code Repository
 * https://github.com/mesibo/conferencing/blob/master/live-demo/web/
 *
 *
 */


var mesiboLive = angular.module('mlApp', []);

mesiboLive.directive('onFinishRender', function($timeout) {
	console.log('onFinishRender-directive');
	return {
		link: function(scope, element, attr) {
			if (scope.$last === true) {
				$timeout(function() {
					scope.$emit(attr.onFinishRender);
				});
			}
		}
	};
});

mesiboLive.directive('onExpandedScreenRender', function($timeout) {
	console.log('onExpandedScreenRender-directive');
	return {
		link: function(scope, element, attr) {
			$timeout(function() {
				scope.$emit(attr.onExpandedScreenRender);
			});
		}
	};
});


mesiboLive.controller('roomController', ['$scope', '$window', '$compile', '$timeout', '$anchorScroll', function($scope, $window, $compile, $timeout, $anchorScroll) {

	const DEFAULT_GRID_MODE = 1;
	const MAX_STREAMS_PER_PAGE = 16;
	const PLATFORM_IS_MOBILE = isMobileDetected();
	const DEFAULT_ASPECT_RATIO =  PLATFORM_IS_MOBILE ? 9 / 16 : 16 / 9;
	const MAX_GRID_MODE = PLATFORM_IS_MOBILE ? 2 : 4;
	const BS_MAX_COLUMN_LEVEL = 12;

	const MAX_WIDTH_INCREASE_FACTOR = 1.2; 
	const MIN_WIDTH_INCREASE_FACTOR = 1.05;
	var MAX_STREAM_AREA_WIDTH = 0;
	var MIN_STREAM_AREA_WIDTH = 0;
	var MAX_STREAM_AREA_HEIGHT_INIT = 0;
	var MAX_STREAM_AREA_WIDTH_INIT = 0;
	const MAX_BOTTOM_STRIP_HEIGHT = 100;

	const STREAM_CAMERA = 1;
	const STREAM_SCREEN = 2;


	$scope.participant_type_publisher = 1;
	$scope.participant_type_subscriber = 2;

	$scope.mesibo_connection_status = 0;
	$scope.streams = [];
	$scope.participants = [];
	$scope.current_selected_stream = null;
	$scope.current_selected_participant = null;
	$scope.screen_share = false;
	$scope.ticker_messages = [];
	$scope.participant_count = null;
	$scope.expanded_video_selected = null;
	$scope.expanded_video_init = false;
	$scope.ultra_expanded_video_selected = null;
	$scope.ultra_full_screen_mode = false;
	$scope.display_names = true;
	$scope.group_messsage_notification = '';
	$scope.display_names_placeholder = '*';
	$scope.participant_list_placeholder = 'Participants yet to join';
	$scope.popup_grid_map = {};

	$scope.toggle_source = STREAM_CAMERA;
	$scope.publisher = {'isConnected': false, 'streamOptions': false, 'isPublished': false};
	$scope.local_screens = [];

	$scope.user = {'token': ''};
	$scope.room = {'id': '', 'name': ''};
	$scope.addressBook = {}; //To match participant name with address


	$scope.grid_mode = DEFAULT_GRID_MODE;
	$scope.max_streams_per_page = MAX_STREAMS_PER_PAGE;
	$scope.grid_width = 0;
	$scope.grid_height = 0;

	//Popup
	const POPUP_WIDTH = 310;
	const POPUP_HEIGHT = 250;
	$scope.messageSession = {};
	const MAX_MESSAGES_READ = 200;
	
	$scope.mesibo = {};

	//Files
	$scope.selected_file = {};
	$scope.input_file_caption = '';


	$scope.refresh = function() {
		$scope.$applyAsync();
	};

	$scope.scrollToLastMsg = function(identifier) {
		$scope.$$postDigest(function() {
			MesiboLog('scroll to end', 'messages_end_' + identifier);
			$anchorScroll('messages_end_' + identifier);
		});
	};

	$scope.toggleSelfVideo = function() {
		$scope.publisher.toggleMute(true);
		if ($scope.publisher.muteStatus(true))
			$scope.addTicker('You have muted your video');
		else
			$scope.addTicker('You have unmuted your video');
	};

	$scope.toggleSelfAudio = function() {
		$scope.publisher.toggleMute(false);
		if ($scope.publisher.muteStatus(false))
			$scope.addTicker('You have muted your audio');
		else
			$scope.addTicker('You have unmuted your audio');
	};

	$scope.scrollToLastTicker = function() {
		$scope.$$postDigest(function() {
			var tDiv = document.getElementById('ticker_messages_area');
			if (!isValid(tDiv))return;
			tDiv.scrollTop = tDiv.scrollHeight;
		});
	};

	$scope.addTicker = function(message) {
		if(!message)
			return;
		var tm = {};
		tm.time = $scope.getTime();
		tm.message = message;
		$scope.ticker_messages.push(tm);
		$scope.refresh();
		$scope.scrollToLastTicker();
	};

	$scope.getTime = function() {
		var time = new Date();
		return time.toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'});
	};


	$scope.getMesibo = function() {
		return $scope.mesibo;
	};

	$scope.isSent = function(msg) {
		if (!isValid(msg))
			return false;
		return isSentMessage(msg.status);
	};

	$scope.isReceived = function(msg) {
		if (!isValid(msg))
			return false;
		return !isSentMessage(msg.status);
	};


	$scope.onKeydown = function(event) {
		console.log(event);
	};

	$scope.isGroup = function(user) {
		return isGroup(user);
	};


	$scope.getMessageStatusClass = function(m) {
		if (!isValid(m))
			return '';

		if ($scope.isReceived(m)) {
			return '';
		}

		var status = m.status;
		var status_class = getStatusClass(status);
		if (!isValidString(status_class))
			return -1;

		return status_class;
	};

	$scope.getMessageStatusColor = function(m) {
		// MesiboLog("getMessageStatusColor", m);
		if (!isValid(m))
			return '';

		if ($scope.isReceived(m))
			return '';

		var status = m.status;
		var status_color = getStatusColor(status);
		if (!isValidString(status_color))
			return '';

		return status_color;
	};

	$scope.logout = function() {
		$scope.mesibo.stop();
		$scope.exitRoom();
	};

	$scope.exitRoom = function() {
		_resetRoomCredentials();
		if($scope.publisher && $scope.publisher.hangup)
			$scope.publisher.hangup();
		window.open('login.html', '_self');
	};

	$scope.exitRoomForm = function() {
		$('#ModalExitForm').modal('show');
	};

	$scope.getFileIcon = function(f) {
		return getFileIcon(f);
	};

	$scope.getParticipantFromMessage = function(m) {
		if (!isValid(m))
			return;

		if (isValid(m.groupid) && m.groupid > 0)
			return; // defaults to group chat

		if (isValid(m.peer)) {
			for (var i = $scope.participants.length - 1; i >= 0; i--) {
				if ($scope.participants[i].getAddress() == m.peer)
					return $scope.participants[i];
			}
		}

		return;
	};


	$scope.clickUploadFile = function(peer, groupid) {
		MesiboLog('====> clickUploadFile');
		setTimeout(function() {
			MesiboLog('====> clickUploadFile timeout');
			angular.element('#upload').trigger('click');
			var send_file_button = document.getElementById('popup-send-file');
			send_file_button.setAttribute('onclick', "getScope().sendFile('" + peer + "'," + groupid + ');');
			$compile(send_file_button)($scope);
		}, 500);

	};


	$scope.onFileSelect = function(element) {
		$scope.$apply(function(scope) {
			var file = element.files[0];
			if (!isValid(file)) {
				MesiboLog('Invalid file');
				return -1;
			}

			MesiboLog('Selected File =====>', file);

			$scope.selected_file = file;
			$scope.showFilePreview(file);

			MesiboLog('Reset', element.value);
			element.value = '';
		});
	};

	$scope.showFilePreview = function(f) {
		var reader = new FileReader();
		$('#image-preview').attr('src', '');
		$('#video-preview').attr('src', '');
		$('#video-preview').hide();

		reader.onload = function(e) {
			if (isValidFileType(f.name, 'image'))
				$('#image-preview').attr('src', e.target.result);
			else if (isValidFileType(f.name, 'video')) {
				$('#video-preview').attr('src', e.target.result);
				$('#video-preview').show();
			}
		};

		reader.readAsDataURL(f);

		var s = document.getElementById('fileModalLabel');
		if (s) {
			s.innerText = 'Selected File ' + f.name;
		}

		$('#fileModal').modal('show');
	};

	$scope.closeFilePreview = function() {
		$('#fileModal').modal('hide');
		//Clear selected file button attr

	};

	$scope.sendFile = function(peer, groupid) {
		MesiboLog('sendFile', peer, groupid);
		$scope.closeFilePreview();
		$scope.file.uploadSendFile(peer, groupid);
	};

	$scope.isFileMsg = function(m) {
		if (!isValid(m))
			return false;
		return (undefined != m.filetype);
	};

	$scope.isImageMsg = function(m) {
		// MesiboLog('isImageMsg', MESIBO_FILETYPE_IMAGE == m.filetype);
		if (!isValid(m))
			return false;
		if (!$scope.isFileMsg(m))
			return false;
		return (MESIBO_FILETYPE_IMAGE == m.filetype);
	};

	$scope.isVideoMsg = function(m) {
		if (!isValid(m))
			return false;
		if (! $scope.isFileMsg(m))
			return false;
		return (MESIBO_FILETYPE_VIDEO == m.filetype);
	};


	$scope.isAudioMsg = function(m) {
		if (!isValid(m))
			return false;
		if (! $scope.isFileMsg(m))
			return false;
		return (MESIBO_FILETYPE_AUDIO == m.filetype);
	};

	$scope.isOtherMsg = function(m) {
		if (!isValid(m))
			return false;
		if (! $scope.isFileMsg(m))
			return false;
		return (m.filetype >= MESIBO_FILETYPE_LOCATION);
	};

	$scope.isMesiboConnected = function() {
		if ($scope.mesibo_connection_status == MESIBO_STATUS_ONLINE)
			return true;

		return false;
	};

	$scope.Mesibo_OnConnectionStatus = function(status) {
		MesiboLog('MesiboNotify.prototype.Mesibo_OnConnectionStatus: ' + status);
		$scope.mesibo_connection_status = status;

		if (MESIBO_STATUS_SIGNOUT == status) {
			$scope.addTicker('You have been logged out');
			alert('You have been logged out');
			$scope.logout();
		}

		if (MESIBO_STATUS_AUTHFAIL == status) {
			_resetRoomCredentials();
			_resetLoginCredentials();
			$scope.addTicker('Auth failed while connecting to mesibo. Exiting room..');
			alert('Auth failed while connecting to mesibo. Exiting room..');
			$scope.exitRoom();
		}

		if (MESIBO_STATUS_ONLINE == status) {
			var navbar = document.getElementById('mesibo_live_main_navbar');
			if (navbar)
				navbar.style.backgroundColor = '#00868b';

			$scope.addTicker('You are Online');
			MesiboLog('======> You are online');

			if (isValid($scope.publisher) && !$scope.publisher.isPublished && $scope.room.publish == 1) {
				$scope.publish($scope.publisher);
			}
		}

		if (MESIBO_STATUS_OFFLINE == status) {
			toastr.error('You are Offline. Please check your connection..');
			var navbar = document.getElementById('mesibo_live_main_navbar');
			if (navbar)
				navbar.style.backgroundColor = '#800000';
			$scope.addTicker('You are Offline');
		}

		$scope.refresh();
	};

	$scope.Mesibo_OnMessage = function(m, data) {
		MesiboLog('Mesibo_onMessage', m, data);

		if(!(m && m.peer && $scope.addressBook[m.peer])){
			return;
		}

		var ticker_message = '';				
		ticker_message = 'You have a new message from ' + $scope.addressBook[m.peer];

		if (m.groupid && m.peer)
			ticker_message = 'You have a new group message from ' + $scope.addressBook[m.peer];

		$scope.addTicker(ticker_message);


		MesiboLog('scrollToLastMsg', m.peer, m.groupid, isValidString(m.peer), isValid(m.groupid));

		var popup_identifier = (isValid(m.groupid) && m.groupid > 0) ? m.groupid : m.peer;


		if (isValid(popup_identifier)) {
			var popup_div = document.getElementById('popup_chat_' + popup_identifier);
			if (!isValid(popup_div)) { //Popup does not exist
				var participant = $scope.getParticipantFromMessage(m);
				if (isValid(participant) || (isValid(m.groupid) && m.groupid > 0)) {
					$scope.showPopupChat(participant);
					return;
				}
			}

			if ($scope.isHidden(popup_div)) {
				if (isValid(m.groupid) && m.groupid > 0) {
					$scope.showPopupChat(participant);
				}
				// MesiboLog('Mesibo_onMessage', !isValid(popup_div) , $scope.isHidden(popup_div));
				var participant_chat_icon = document.getElementById('chat_popup_participant_' + m.peer);
				if (!isValid(participant_chat_icon)) return;
				participant_chat_icon.style.color = 'green';
				toastr.info(ticker_message);
			}
			else {
				$scope.refresh();
				$scope.scrollToLastMsg(popup_identifier);
			}

		}

	};

	$scope.Mesibo_OnMessageStatus = function(m) {
		MesiboLog('MesiboNotify.prototype.Mesibo_OnMessageStatus: from ' + m.peer +
			' status: ' + m.status, 'id', m.id);
		$scope.refresh();
	};

	$scope.Mesibo_OnPermission = function(on) {
		MesiboLog('Mesibo_onPermission: ' + on);
		if (on == true) {
			MesiboLog('Show permission prompt');
			if(document.getElementById('permissions-prompt'))
				document.getElementById('permissions-prompt').style.display = 'block';
		}

		if (on == false) {
			MesiboLog('Hide permission prompt');
			if(document.getElementById('permissions-prompt'))
				document.getElementById('permissions-prompt').style.display = 'none';
		}
	};

	$scope.Mesibo_OnLocalMedia = function(m) {
		MesiboLog('Mesibo_OnLocalMedia: ', m);
		//show permission prompt
	};

	$scope.Mesibo_OnParticipants = function(all, latest) {

		MesiboLog('Mesibo_OnParticipants', all, latest);
		if(! (latest && latest.length))
			return;

		for (var i in latest) {
			var p = latest[i];
			if (isValid(p.getAddress) && isValid(p.getName()))
				$scope.addressBook[p.getAddress()] = p.getName();
			$scope.subscribe(p);
			playSound('assets/audio/join');
			MesiboLog(getStreamId(p), p.getId(), p.getType(), p.getName() + ' has entered the room <=========');
			if(p.getType && p.getType() > 0)
				$scope.addTicker(p.getName()+ ' is sharing the screen-'+ p.getType());
			else
				$scope.addTicker(p.getName() + ' has entered the room');

		}
	};

	$scope.Mesibo_OnParticipantUpdated = function(all, p) {
		MesiboLog('Mesibo_OnParticipantsUpdated', all, p);
		MesiboLog('Mesibo_OnParticipantsUpdated', p.getName(), 'talking', p.isTalking(), p.muteStatus(false, true), p.muteStatus(true, true));
		if(getStreamFromId(getStreamId(p))){ 
			$scope.updateStreams(p);
		}
		$scope.updateParticipants(p);
	};

	$scope.Mesibo_OnError = function(e) {
		ErrorLog('====> Mesibo_OnError', e);
	};

	$scope.Mesibo_OnSubscriber = function(s) {
		MesiboLog('==> Mesibo_onSubscriber', s);
		if (isValid(s) && isValid(s.address) && isValid(s.name))
			$scope.addressBook[s.address] = s.name;

	};



	$scope.on_attached = function(e) {
		MesiboLog('on_attached', e);
	};


	$scope.on_stream = function(p) {
		MesiboLog('on_stream', p, 'isLocal?', p.isLocal(), p.getType());
		if (p.isLocal()) {
			if (p.getType() > 0) //Type screen
				return;

			p.attach('video-publisher', $scope.on_attached, 100, 50);

			MesiboLog($scope.room);
			return;
		}

		if ($scope.expanded_video_selected) {
			if (getStreamId($scope.expanded_video_selected) == getStreamId(p)) {
				$scope.expanded_video_selected = p;
				$scope.expanded_video_selected.attach('expanded-screen-video-' + getStreamId($scope.expanded_video_selected), $scope.on_attached, 100, 2);
			}
			$scope.setupStrip();
		}
		else {
			p.attach('video-' + getStreamId(p), $scope.on_attached, 100, 2);											
		}

		$scope.refresh();

	};

	$scope.removeScreen = function(s) {
		for (var i = $scope.local_screens.length - 1; i >= 0; i--) {
			if ($scope.local_screens[i] === s) {
				$scope.local_screens[i].hangup();
				$scope.local_screens.splice(i, 1);
				$scope.refresh();
				return 0;
			}
		}

		return -1; //Screen not found
	};

	$scope.on_hangup = function(p, remote) {
		MesiboLog('on_hangup', p, remote, p.isLocal());
		if (p.isLocal()) {
			if (p.getType() > 0) {
				p.hangup();
				$scope.removeScreen(p);
				return;
			}
			var rv = $scope.publisher.hangup();
			MesiboLog('hangup returned', rv);
			if (rv == false) return;
			$scope.addTicker('You have hanged up');
			$scope.publisher.isConnected = false;
			$scope.publisher.streamOptions = true;
			$scope.refresh();
			return;
		}

		for (var i = 0; i < $scope.streams.length; i++) {
			if ($scope.streams[i] === p) {

				if (!remote) {
					$scope.streams[i].hangup();
				}
				
				if (remote) {
					$scope.removeParticipant(p);
					if(p.getType()>0)
						$scope.addTicker(p.getName() + ' has stopped sharing the screen '+ getStreamName(p));
					else
						$scope.addTicker(p.getName() + ' has left the room');
				}

				$scope.streams.splice(i, 1);

				var isGridChange = $scope.setGridMode($scope.streams.length);
				$scope.refresh();


				$timeout(function() {
					if ($scope.expanded_video_selected) {
						$scope.expanded_video_selected.attach('expanded-screen-video-' + getStreamId($scope.expanded_video_selected), $scope.on_attached, 100, 10);
						for (var i = 0; i < $scope.streams.length; i++) {
							if ($scope.streams[i] != $scope.expanded_video_selected) {
								$scope.streams[i].attach('video-small-' + getStreamId($scope.streams[i]), $scope.on_attached, 100, 10);
								$scope.streams[i].isExpandedScreen = false;
								$scope.setStripVideoDimensions($scope.streams[i], 'video-small', DEFAULT_ASPECT_RATIO);
							}
						}
					}
					else {
						for (var i = 0; i < $scope.streams.length; i++) {
							$scope.streams[i].attach('video-' + getStreamId($scope.streams[i]), $scope.on_attached, 100, 50);
							$scope.setGridVideoDimensions($scope.streams[i], 'video', DEFAULT_ASPECT_RATIO);
						}
					}
				},0, false);

				return 0;
			}
		}
	};

	$scope.on_status = function(p, status) {

		MesiboLog('====> on_status', ' stream ', 'uid', p.getId(), p.getName(), 'local?', p.isLocal(), ' status: 0x' + status.toString(16));

		if (p.isLocal()) {
			if (MESIBO_CALLSTATUS_CHANNELUP == status) {
				MesiboLog('hide spinner-publisher');
				$scope.publisher.isConnected = true;
			}
			else if (MESIBO_CALLSTATUS_RECONNECTING == status) {
				MesiboLog('show spinner-publisher');
				$scope.publisher.isConnected = false;
			}
			else if (MESIBO_CALLSTATUS_CANCEL == status) {
				$scope.on_hangup(p, true);
				// MesiboLog('Screen sharing stopped* . Switch to camera');
				// $scope.toggle_source = STREAM_CAMERA;
				// $scope.publish($scope.publisher);
			}
			else if(MESIBO_CALLSTATUS_COMPLETE == status){
				$scope.on_hangup(p, true)
			}

			MesiboLog('updating local stream status', $scope.publisher);
			return;
		}

		for (var i = 0; i < $scope.streams.length; i++) {
			if ($scope.streams[i] === p) {

				if (MESIBO_CALLSTATUS_COMPLETE == status) {
					$scope.on_hangup(p, true);
				}

				else if (MESIBO_CALLSTATUS_CHANNELUP == status) {
					$scope.streams[i].isConnected = true;
				}
				else if (MESIBO_CALLSTATUS_RECONNECTING == status) {
					MesiboLog('show-spinner');
					$scope.streams[i].isConnected = false;
				}

				break;

			}
		}

		$scope.refresh();
	};

	$scope.setGridMode = function(stream_count) {
		MesiboLog('==> setGridMode', 'stream_count', stream_count, 'grid_mode', $scope.grid_mode);
		var isGridChange = false;
		var previous_grid_mode = $scope.grid_mode;

		if (!isValid(stream_count) || stream_count <= 0) {
			$scope.grid_mode = DEFAULT_GRID_MODE;
			return isGridChange;
		}


		if (1 == stream_count)
			$scope.grid_mode = 1;
		else if (stream_count >= 2 && stream_count <= 4)
			$scope.grid_mode = 2;
		else if (stream_count >= 5 && stream_count <= 9)
			$scope.grid_mode = 3;
		else if (stream_count >= 10 && stream_count <= 16)
			$scope.grid_mode = 4;
		else
			$scope.grid_mode = 4; /** Maximum 16 thumbnails can be displayed for now **/

		if($scope.grid_mode > MAX_GRID_MODE)
			$scope.grid_mode = MAX_GRID_MODE;

		MesiboLog('==> setGridMode', 'stream_count', stream_count, 'grid_mode', $scope.grid_mode);

		if (previous_grid_mode != $scope.isGridChange)
			isGridChange = true;

		$scope.refresh();

		return isGridChange;
	};

	$scope.removeParticipant = function(p) {
		for (var i = 0; i < $scope.participants.length; i++) {
			if ($scope.participants[i] === p) {
				$scope.participants.splice(i, 1);
				return;
			}
		}
	};


	$scope.updateParticipants = function(p) {
		MesiboLog('updateParticipants', p, $scope.participants, $scope.streams);
		if (!isValid(p))
			return;

		for (var i = 0; i < $scope.participants.length; i++) {
			if ($scope.participants[i].getId() === p.getId()) {
				MesiboLog('updateParticipants', p.getName() + ' already exists');
				// $scope.participants[i] = p;
				// $scope.refresh();
				return;
			}
		}

		$scope.participants.push(p);
		$scope.refresh();
	};

	$scope.updateStreams = function(p, iAudio, iVideo) {
		MesiboLog('updateStreams', p, iAudio, iVideo, p.getType(), p.getId(), getStreamId(p));
		if (!isValid(p))
			return;

		for (var i = 0; i < $scope.streams.length; i++) {
			if (getStreamId($scope.streams[i]) === getStreamId(p)) {
				MesiboLog('updateStreams', 'existing');
				$scope.streams[i] = p;
				$scope.refresh();
				return;
			}
		}

		$scope.streams.push(p);
		$scope.setGridMode($scope.streams.length);

		$scope.$applyAsync(function()  {
			MesiboLog('connectStream updateStreams', p, document.getElementById('video-' + getStreamId(p)));
			$scope.connectStream(null, p, 'video-' + getStreamId(p), iAudio, iVideo);
		});

	};

	$scope.getStreamId = function(s){
		return getStreamId(s);
	}

	$scope.getStreamName = function(s){
		return getStreamName(s);
	}

	$scope.subscribe = function(p, iAudio, iVideo) {
		MesiboLog('subscribe', p, iAudio, iVideo);

		p.isVisible = true;
		p.isSelected = false;
		p.isExpandedScreen = false;
		p.isConnected = true;
		
		$scope.updateParticipants(p);
		$scope.updateStreams(p, iAudio, iVideo);

	};

	$scope.toggleNameDisplay = function() {
		$scope.display_names = !$scope.display_names;
		if ($scope.display_names)
			$scope.display_names_placeholder = '*';
		else
			$scope.display_names_placeholder = '';
		$scope.refresh();
	};

	$scope.getSelectedStream = function(stream_index) {
		//Returns matching stream object from streams array
		/** Review Logic **/
		if (stream_index > $scope.streams.length)
			return null;
		var selected_stream = $scope.streams[stream_index];

		return selected_stream;
	};

	$scope.isExistingStream = function(stream) {
		for (var i = $scope.streams.length - 1; i >= 0; i--) {
			if ($scope.streams[i] == stream)
				return true;
		}

		return false;
	};

	$scope.getParticipantFromId = function(pSid) {
		if (!isValid(pSid) || !(pSid > 0))
			return null;

		for (var i = $scope.participants.length - 1; i >= 0; i--) {
			var sid = getStreamId($scope.participants[i]);
			if (sid == pSid)
				return $scope.participants[i];
		}

		return null;
	};

	$scope.getStreamFromId = function(pSid) {
		if (!pSid)
			return null;

		for (var i = $scope.streams.length - 1; i >= 0; i--) {
			var sid = getStreamId($scope.streams[i]);
			if (sid == pSid)
				return $scope.streams[i];
		}

		return null;
	};

	/*
	 * Updates current stream and current participant
	 */
	$scope.updateCurrentSelected = function(participant) {

		if (!isValid(participant))
			return -1;

		var selected_stream = $scope.getStreamFromId(getStreamId(participant));

		if (isValid(selected_stream)) {
			selected_stream.isSelected = true;
			if (isValid($scope.current_selected_stream)) {
				$scope.current_selected_stream.isSelected = false;
			}

			$scope.current_selected_stream = selected_stream;
		}

		if (isValid($scope.current_selected_participant)) {
			$scope.current_selected_participant.isSelected = false;
		}

		$scope.current_selected_participant = participant;

	};

	$scope.selectStream = function(participant) {
		MesiboLog('selectStream');
		if (!isValid(participant))
			return;

		if (!$scope.isExistingStream(participant))
			return;

		participant.isSelected = true;
		$scope.updateCurrentSelected(participant);

		$scope.refresh();
	};


	$scope.toggleStreamVisibility = function(participant) {
		MesiboLog('toggleStreamVisibility');
		if (!isValid(participant))
			return;

		var selected_stream = $scope.getStreamFromId(getStreamId(participant));
		if (!isValid(selected_stream))
			return -1;

		selected_stream.isVisible = !selected_stream.isVisible;

		$scope.refresh();

	};

	$scope.getAudioStatusColor = function(stream) {
		// MesiboLog('getAudioStatusColor', stream);
		if (!isValid(stream))
			return 'grey';

		if (stream.muteStatus(false) == true) {
			return '#FF6347';
		}

		return 'green';
	};

	$scope.getVideoStatusColor = function(stream) {
		// MesiboLog('getVideoStatusColor', stream);
		if (!isValid(stream))
			return 'grey';

		if (stream.muteStatus(true) == true)
			return '#FF6347';

		return 'green';
	};

	$scope.getAudioStatusClass = function(stream) {
		if (!isValid(stream))
			return '';

		if (stream.muteStatus && stream.muteStatus(false) == true)
			return 'fas fa-microphone-slash';

		return 'fas fa-microphone';
	};

	$scope.getVideoStatusClass = function(stream) {
		if (!(stream && stream.getType && stream.isLocal && stream.muteStatus))
			return '';

		if (stream.getType() > 0 && stream.isLocal()) {
			if (stream.muteStatus(true))
				return 'fa fa-play-circle';
			else
				return 'fa fa-pause-circle';
		}

		if (stream.muteStatus(true))
			return 'fas fa-video-slash';

		return 'fas fa-video';
	};

	$scope.getStatusIndicator = function(status) {
		var status_color = '#FF6347';
		if (!isValid(status))
			return status_color;
		switch (status) {
			case MESIBO_STATUS_CONNECTING:
				status_color = '#FFA500';
				break;

			case MESIBO_STATUS_ONLINE:
				status_color = '#90EE90';
				break;

			case MESIBO_STATUS_SIGNOUT:
				MesiboLog('Signed out');
				break;

			case MESIBO_STATUS_AUTHFAIL:
				MesiboLog('Disconnected: Bad Token or App ID');
				break;

		}

		return status_color;
	};

	$scope.getBodyPadding = function() {
		var padding = ($scope.ultra_full_screen_mode ? BODY_PADDING_FULLSCREEN : BODY_PADDING_NORMAL) + 'px';
		return padding;
	};

	$scope.isConnected = function(status) {
		if (!isValid(status))return false;

		if (MESIBO_STATUS_ONLINE == status)
			return true;

		return false;
	};

	$scope.toggleAudioMute = function(stream_index) {
		var selected_stream = $scope.getSelectedStream(stream_index);
		if (!isValid(selected_stream))
			return -1;

		selected_stream.toggleMute(false); //false for audio
		$scope.refresh();
		return 0;
	};

	$scope.toggleVideoMute = function(stream_index) {
		var selected_stream = $scope.getSelectedStream(stream_index);
		if (!isValid(selected_stream))
			return -1;

		selected_stream.toggleMute(true); //true for video
		$scope.refresh();
		return 0;
	};

	$scope.getFullScreenStatusClass = function(stream) {
		// MesiboLog('getFullstreamstatusClass');
		if (!isValid(stream))
			return '';

		// if(stream.isExpandedScreen)
		// 	return "fa fa-compress";
		if ($scope.expanded_video_selected === stream || stream.isExpandedScreen)
			return 'fa fa-compress';


		return 'fa fa-expand';
	};


	function getElementWidth(ele_id) {
		if (!isValidString(ele_id))
			return -1;
		var elem = document.getElementById(ele_id);
		if (!isValid(elem))
			return -1;
		return elem.offsetWidth;
	}

	function getElementHeight(ele_id) {
		if (!isValidString(ele_id))
			return -1;
		var elem = document.getElementById(ele_id);
		if (!isValid(elem))
			return -1;
		return elem.offsetHeight;
	}

	$scope.visibleHeight = function(element) {
	    if(!(element))
	    	return -1;

	    if(!(window && window.innerHeight))
	    	return -1;
    

	    let viewportHeight = window.innerHeight;
	    let elementTop = element.offsetTop;

	    return viewportHeight - elementTop;
	}

	$scope.setExpandedScreenDimensions = function() {

		var sa = document.getElementById("streams-area");
		var h = $scope.visibleHeight(sa);
		if(h <= 0 ){
			ErrorLog("setExpandedScreenDimensions", 'Invalid height', h);
			return;
		}
		
		ErrorLog("setExpandedScreenDimensions", 'height', h);

		var w = sa.offsetWidth;

		MesiboLog('===> setExpandedScreenDimensions', 'h: ',h, 'w: ', w);		

		var available_height = h - MAX_BOTTOM_STRIP_HEIGHT;
		var adjusted_width = available_height * DEFAULT_ASPECT_RATIO;
		if (adjusted_width > w) {
			adjusted_width = w;
			available_height = adjusted_width / DEFAULT_ASPECT_RATIO;
		}
		
		var fs = document.getElementById('expanded-screen-container');				

		fs.style.width = adjusted_width +'px';
		fs.style.height = available_height +'px';
		MesiboLog('===> setExpandedScreenDimensions', fs.style.height, fs.style.width, fs);

		document.getElementById('horizontal-strip-body').style.width = w + 'px';
		document.getElementById('horizontal-strip-body').style.height = MAX_BOTTOM_STRIP_HEIGHT +'px';

		return 0;
	};


	$scope.setupStrip = function() {
		for (var i = 0; i < $scope.streams.length; i++) {
			if ($scope.streams[i] != $scope.expanded_video_selected) {
				$scope.streams[i].attach('video-small-' + getStreamId($scope.streams[i]), $scope.on_attached, 100, 50);
				$scope.setStripVideoDimensions($scope.streams[i], 'video-small', DEFAULT_ASPECT_RATIO);
				$scope.streams[i].isExpandedScreen = false;
			}
		}
	};

	$scope.closeFullScreen = function() {
		MesiboLog('closeFullScreen');
		$scope.expanded_video_selected = null;
		$scope.expanded_video_init = false;

		$timeout(function()  {
			MesiboLog('toggleExpandScreen', 'Returning to normal mode: reattach');
			for (var i = 0; i < $scope.streams.length; i++) {
				$scope.streams[i].attach('video-' + getStreamId($scope.streams[i]), $scope.on_attached, 100, 10);
				$scope.setGridVideoDimensions($scope.streams[i], 'video', DEFAULT_ASPECT_RATIO);
			}
		});
	};

	/**
	 * Switch from normal mode to expanded mode for selected stream
	 * Expanded screen mode consists of expanded video and a bottom thumbanail strip of other streams
	 * Calls attach for selected stream to the expanded screen element
	 * When returning from expanded screen mode to normal mode,
	 * since grid is setup attach needs to be called again
	 */

	$scope.toggleExpandScreen = function(selected_stream) {
		MesiboLog('toggleExpandScreen', selected_stream);

		if (!isValid(selected_stream)) {
			$scope.closeFullScreen();
			return -1;
		}

		selected_stream.isExpandedScreen = !selected_stream.isExpandedScreen;

		MesiboLog('toggleExpandScreen', 'selected_stream.isExpandedScreen', selected_stream.isExpandedScreen);
		if (!selected_stream.isExpandedScreen) { //For hiding full screen
			$scope.closeFullScreen();
			return 0;
		}

		$scope.expanded_video_selected = selected_stream;

		$scope.$$postDigest(function()  {
			if (!$scope.expanded_video_init) {
				$scope.setExpandedScreenDimensions();
				$scope.expanded_video_init = true;
			}
		});

		$scope.on_expanded_attached = function(p){
			MesiboLog('======== on_expanded_attached ==========', p);
		}

		$scope.$applyAsync(function()  {
			MesiboLog('toggleExpandScreen', 'Attaching fullscreen to:', getStreamId($scope.expanded_video_selected), $scope.expanded_video_selected, 'expanded-screen-video-' + getStreamId($scope.expanded_video_selected));
			MesiboLog(document.getElementById('expanded-screen-video-' + getStreamId($scope.expanded_video_selected)));
			$scope.expanded_video_selected.attach('expanded-screen-video-' + getStreamId($scope.expanded_video_selected), $scope.on_expanded_attached, 100, 50);

			$scope.setupStrip();

		});
		return 0;

	};

	$scope.hideFullScreen = function(stream_index) {
		$scope.expanded_video_selected = null;
		$('#fullScreenModal').modal('hide');
		$('body').removeClass('modal-open');
		$('.modal-backdrop').remove();
	};

	$scope.isHidden = function(el) {
		// MesiboLog('isHidden', el, bHidden);
		if (!isValid(el))
			return true;

		var style = window.getComputedStyle(el);
		var bHidden = (style.display === 'none');
		// MesiboLog('isHidden', el, bHidden);
		return bHidden;
	};

	$scope.getPopupGridPosition = function(popup_id) {
		if (!isValid(popup_id)) {
			return -1;
		}

		for (var i = 0; i < 6; i++) {
			if (!$scope.popup_grid_map[i]) { //Empty slot available
				$scope.popup_grid_map[i] = popup_id;
				return i;
			}
		}

		return -1;
	};

	$scope.freePopupGridPosition = function(popup_id) {
		if (!isValid(popup_id))
			return -1;

		for (var i = 0; i < 6; i++) {
			if (popup_id == $scope.popup_grid_map[i]) {
				$scope.popup_grid_map[i] = null; //Free Slot
				return i;
			}
		}
		return -1;
	};

	$scope.placePopupInGrid = function(popup_div, popup_identifier) {
		if (!isValid(popup_div) || !isValid(popup_identifier))
			return null;

		var popup_grid_pos = $scope.getPopupGridPosition(popup_identifier);
		if (!isValid(popup_grid_pos) || popup_grid_pos < 0) {
			MesiboLog('Invalid popup grid position');
			return null;
		}

		var shift_right = ((POPUP_WIDTH * (popup_grid_pos % 3))) + 'px';
		var shift_bottom = (10 + (POPUP_HEIGHT * (Math.floor(popup_grid_pos / 3)))) + 'px';
		MesiboLog('Dynamic postioning of popup', popup_grid_pos, shift_right, shift_bottom);
		popup_div.style.right = shift_right;
		popup_div.style.bottom = shift_bottom;

		return popup_div;
	};

	$scope.sessionReadMessages = function(session_key, user, count) {
		if (!isValid(session_key) || !isValid(user) || !isValid(count) || count <= 0) {
			ErrorLog('Error:', 'sessionReadMessages', 'Invalid input');
			return -1;
		}


		MesiboLog('sessionReadMessages', user);
		var peer = user.peer;
		var groupid = user.groupid;

		MesiboLog('sessionReadMessages ', session_key, peer + ' ' + ' groupid ' + groupid + ' ' + count);

		$scope.messageSession[session_key] = $scope.mesibo.readDbSession(peer, groupid, null,
			function on_read(count) {
				MesiboLog('sessionReadMessages complete', session_key, count);
				MesiboLog($scope.messageSession[session_key].getMessages());

				$scope.refresh();

				if (isValid(groupid) && groupid > 0)
					$scope.scrollToLastMsg(groupid);

				if (isValidString(peer))
					$scope.scrollToLastMsg(peer);

			});

		if (!isValid($scope.messageSession[session_key])) {
			ErrorLog('Error:', 'sessionReadMessages', 'Invalid messageSession');
			return -1;
		}

		$scope.messageSession[session_key].enableReadReceipt(true, true);
		$scope.messageSession[session_key].read(count);

	};

	$scope.showPopupChat = function(participant) {
		MesiboLog('showPopupChat', participant);
		var selected = {};
		var popup_identifier;
		if (!isValid(participant)) {
			//Default to Group Messaging
			selected.peer = null;
			selected.groupid = $scope.room.gid;
			selected.name = $scope.room.name;
			popup_identifier = selected.groupid;
		}
		else {
			//One-to-One messaging
			// var uid = participant.getId();
			// if (!isValid(sid) || !(sid > 0))
			// 	return;
			selected = participant;
			selected.peer = selected.getAddress();
			selected.name = selected.getName();
			selected.groupid = 0;
			popup_identifier = selected.peer;
		}

		var popup_div	= document.getElementById('popup_chat_' + popup_identifier);

		/*Making it grey out means message has been read*/
		var participant_chat_icon = document.getElementById('chat_popup_participant_' + popup_identifier);
		if (isValid(participant_chat_icon))
			participant_chat_icon.style.color = 'grey';

		if (isValid(selected.groupid) && selected.groupid > 0)
			$scope.group_messsage_notification = '';


		if (isValid(popup_div)) {
			$('.mesibo_popup_' + popup_identifier).toggle();
			if (!$scope.isHidden(popup_div)) {
				//Open existing popup

				MesiboLog('=====> opening popup, enabling read receipt');
				// $scope.sessionReadMessages(popup_identifier, selected, MAX_MESSAGES_READ);
				if (!isValid($scope.messageSession) || !isValid($scope.messageSession[popup_identifier])) {
					ErrorLog('Invalid Message Session');
					return;
				}
				$scope.messageSession[popup_identifier].enableReadReceipt(true, true);
				$scope.messageSession[popup_identifier].read(MAX_MESSAGES_READ);

				$scope.placePopupInGrid(popup_div, popup_identifier);
				return;
			}
			else {
				$scope.messageSession[popup_identifier].enableReadReceipt(false);
				$scope.freePopupGridPosition(popup_identifier);
			}
			return; //Popup Already Exists On Screen
		}

		MesiboLog('creating popup_template', selected);

		var popup_template = document.getElementById('popup_chat'),
			popup_clone = popup_template.cloneNode(true);

		popup_clone.id = 'popup_chat_' + popup_identifier;

		var class_name = ' mesibo_popup_' + popup_identifier;
		popup_clone.className += class_name;

		$scope.placePopupInGrid(popup_clone, popup_identifier);


		popup_clone.getElementsByClassName('Messenger_header')[0].id = 'popup_chat_' + popup_identifier + '_header';

		popup_clone.getElementsByClassName('popup_display_name')[0].id = 'popup_display_name_' + popup_identifier;
		popup_clone.getElementsByClassName('popup_display_name')[0].innerHTML = selected.name;

		popup_clone.getElementsByClassName('popup-message-area')[0].setAttribute('ng-repeat', "m in messageSession['" + popup_identifier + "'].getMessages()");
		popup_clone.getElementsByClassName('popup-message-area-1')[0].setAttribute('ng-class', "{'outgoing_msg': m && isSent(m),'incoming_msg':m && isReceived(m)}");

		popup_clone.getElementsByClassName('popup-message-area-2')[0].setAttribute('ng-class', "{'sent_msg':isSent(m), 'received_msg':isReceived(m)}");

		popup_clone.getElementsByClassName('popup-message-area-file')[0].setAttribute('ng-if', 'isFileMsg(m)');
		popup_clone.getElementsByClassName('popup-message-area-file')[0].setAttribute('ng-href', "{{isFileMsg(m)? m.fileurl:''}}");

		popup_clone.getElementsByClassName('popup-message-area-image')[0].setAttribute('ng-if', 'isImageMsg(m)');
		popup_clone.getElementsByClassName('popup-message-area-image-src')[0].setAttribute('ng-src', '{{m.fileurl}}');
		popup_clone.getElementsByClassName('popup-message-area-video')[0].setAttribute('ng-if', 'isVideoMsg(m)');
		popup_clone.getElementsByClassName('popup-message-area-video-src')[0].setAttribute('ng-src', '{{m.fileurl}}');
		popup_clone.getElementsByClassName('popup-message-area-audio')[0].setAttribute('ng-if', 'isAudioMsg(m)');
		popup_clone.getElementsByClassName('popup-message-area-audio-src')[0].setAttribute('ng-src', '{{m.fileurl}}');
		popup_clone.getElementsByClassName('popup-message-area-other')[0].setAttribute('ng-if', 'isOtherMsg(m)');

		popup_clone.getElementsByClassName('popup-message-area-message-text')[0].innerHTML = '{{m.title ? m.title : m.message}}';
		popup_clone.getElementsByClassName('popup-message-area-sender-name')[0].setAttribute('ng-show', 'm.groupid!=0 && isReceived(m)');
		popup_clone.getElementsByClassName('popup-message-area-sender-name')[0].innerHTML = '{{addressBook[m.peer]}}';
		popup_clone.getElementsByClassName('popup-message-area-message-time')[0].innerHTML = '{{m.date.time}} &nbsp;';

		popup_clone.getElementsByClassName('popup-message-area-message-time')[0].setAttribute('ng-style', "{'float': isSent(m) ? 'left':'right'}");
		popup_clone.getElementsByClassName('popup-message-area-details-1')[0].setAttribute('ng-style', "{'margin-left': isReceived(m) ? '0!important':'0'}");

		MesiboLog(popup_clone);
		popup_clone.getElementsByClassName('popup-message-area-message-status')[0].setAttribute('ng-class', 'getMessageStatusClass(m)');
		popup_clone.getElementsByClassName('popup-message-area-message-status')[0].setAttribute('ng-style', "{'color':getMessageStatusColor(m)}");

		MesiboLog('$event.keyCode === 13 && sendMessage(' + selected.peer + ',' + selected.groupid + ')');
		popup_clone.getElementsByClassName('popup-message-area-message-input')[0].setAttribute('ng-keydown', "$event.keyCode === 13 && sendMessage('" + selected.peer + "'," + selected.groupid + ')');
		popup_clone.getElementsByClassName('popup-message-area-message-input')[0].setAttribute('id', 'popup_message_area_message_input_' + popup_identifier);
		popup_clone.getElementsByClassName('popup-message-area-message-input')[0].setAttribute('ng-model', "input_message_text['" + popup_identifier + "']");

		popup_clone.getElementsByClassName('popup-message-area-message-input-send')[0].setAttribute('ng-click', "sendMessage('" + selected.peer + "'," + selected.groupid + ')');

		popup_clone.getElementsByClassName('popup-message-area-upload-file')[0].setAttribute('ng-click', "clickUploadFile('" + selected.peer + "'," + selected.groupid + ')');

		popup_clone.getElementsByClassName('popup-message-area-anchor-end')[0].id = 'messages_end_' + popup_identifier;

		// if(isValidString(selected.peer)){
		// 	popup_clone.getElementsByClassName('popup-make-video-call')[0].setAttribute('ng-click', "makeVideoCall('"+selected.peer+"')");
		// 	popup_clone.getElementsByClassName('popup-make-voice-call')[0].setAttribute('ng-click', "makeVoiceCall('"+selected.peer+"')");
		// }
		// else{
		// 	popup_clone.getElementsByClassName('popup-make-video-call')[0].setAttribute('ng-if', "false");
		// 	popup_clone.getElementsByClassName('popup-make-voice-call')[0].setAttribute('ng-if', "false");
		// }

		popup_clone.getElementsByClassName('chat_close')[0].id = 'mesibo_popup_' + popup_identifier;
		popup_clone.getElementsByClassName('chat_close')[0].setAttribute('ng-click', "closePopupChat('" + 'mesibo_popup_' + popup_identifier + "')");

		MesiboLog('reading messageSession for', selected.peer, selected.groupid);
		if (!isValid(selected.peer))
			selected.peer = '';

		$scope.sessionReadMessages(popup_identifier, selected, MAX_MESSAGES_READ);

		var chat_parent = document.getElementById('Smallchat');
		chat_parent.appendChild(popup_clone);
		$('.mesibo_popup_' + popup_identifier).toggle();

		$compile(popup_clone)($scope);

		// Make the DIV element draggable:
		makePopupDraggable(document.getElementById('popup_chat_' + popup_identifier));
	};

	$scope.closePopupChat = function(popup_class) {
		if (!isValidString(popup_class))
			return -1;

		var popup_identifier = popup_class.split('_');
		MesiboLog(popup_identifier);
		popup_identifier = popup_identifier[popup_identifier.length - 1];
		MesiboLog('=====> closePopupChat, disabling read receipt', popup_identifier, $scope.messageSession[popup_identifier]);
		$scope.messageSession[popup_identifier].enableReadReceipt(false);
		$scope.freePopupGridPosition(popup_identifier);


		MesiboLog('closePopupChat', popup_class);
		if (!isValid(popup_class))
			return;

		if (!$scope.isHidden(document.getElementById('mesibo_popup_' + popup_identifier))) {
			$('.mesibo_popup_' + popup_identifier).toggle();
		}

		if ($scope.active_popup_chat_count > 0)
			$scope.active_popup_chat_count--;
	};


	//Send text message to peer(selected user) by reading text from input area
	$scope.sendMessage = function(peer, groupid) {
		MesiboLog('sendMessage', peer, groupid);
		if (!isValidString(peer) && !isValid(groupid))
			return; //Neither a valid one-to-one to group message

		if (groupid != 0) {
			var value = $scope.input_message_text[groupid];
			$scope.input_message_text[groupid] = '';
		}
		else {
			var value = $scope.input_message_text[peer];
			$scope.input_message_text[peer] = '';
		}

		MesiboLog(value, $scope.input_message_text);
		if (!isValidString(value))
			return -1;

		MesiboLog(value);

		MesiboLog($scope.selected_user);
		var m = {};
		m.id = $scope.mesibo.random();
		if (isValidString(peer))
			m.peer = peer;
		m.groupid = groupid;
		m.flag = MESIBO_FLAG_DEFAULT;
		m.message = value;


		MesiboLog('sendMessage', m.peer, m.groupid, m, m.id, m.message);
		$scope.mesibo.sendMessage(m, m.id, value);
		$scope.refresh();

		MesiboLog('scrollToLastMsg', m.peer, m.groupid, isValidString(m.peer), isValid(m.groupid));
		if (isValid(m.groupid) && m.groupid != 0) {
			MesiboLog('scrollToLastMsg', m.groupid);
			$scope.scrollToLastMsg(m.groupid);
		}
		else if (isValidString(m.peer)) {
			MesiboLog('scrollToLastMsg', m.peer);
			$scope.scrollToLastMsg(m.peer);
		}


		var popup_identifier = m.peer ? m.peer : m.groupid;
		MesiboLog('clear input', 'document.getElementById("popup_message_area_message_input_' + popup_identifier + '").value = ""');
		var pInput = document.getElementById('popup_message_area_message_input_' + popup_identifier);
		$scope.refresh();
	};

	$scope.initMesibo = function() {
		$scope.mesibo = new Mesibo();

		//Initialize Mesibo

		MesiboLog(MESIBO_APP_ID, $scope.user.token, 'initMesibo');
		$scope.mesibo.setAppName(MESIBO_APP_ID);
		if (false == $scope.mesibo.setCredentials($scope.user.token))
			return -1;

		$scope.mesibo.setListener($scope);
		$scope.mesibo.setDatabase('mesibo');
		$scope.mesibo.start();

		$scope.live = $scope.mesibo.initGroupCall();
		$scope.live.setRoom($scope.room.gid);

		if (!isValid($scope.room.publish) || $scope.room.publish != 1) {
			toastr.error('You do not have the permission to publish');
		}
		else {
			$scope.publisher = $scope.live.getLocalParticipant(0, $scope.user.name, $scope.user.address);		
		}

		MesiboLog('publisher', $scope.publisher);

		$scope.file = new MesiboFile($scope);

		$scope.refresh();

		return 0;
	};



	$scope.publish = function(stream) {
		if (!isValid(stream))
			return;
		MesiboLog('========> publish called', 'for stream: ', stream);
		var o = {};
		o.peer = 0;
		o.name = $scope.room.name;
		o.groupid = $scope.room.gid;

		o.source = STREAM_CAMERA;
		var init_audio = $scope.room.init.audio;
		var init_video = $scope.room.init.video;
		var stream_element_id = 'video-publisher';


		if (isValid(stream.getType) && stream.getType() > 0) {
			o.source = STREAM_SCREEN;
			init_audio = false;
			stream_element_id =   null;
		}

		stream.streamOptions = false;
		stream.isPublished = true;

		var rv = $scope.connectStream(o, stream, stream_element_id, init_audio, init_video);

		$scope.refresh();

		return rv;
	};

	$scope.connectStream = function(o, stream, element_id, iAudio, iVideo) {
		MesiboLog('connectStream params', o, stream, element_id, iAudio, iVideo);
		if (!isValid(stream))
			return -1;


		if (isValid($scope.room) && isValid($scope.room.init)) {
			if (!isValid(o)) {
				o = {};
			}
			o.audio = $scope.room.init.audio;
			o.video = $scope.room.init.video;
			MesiboLog('======> Initialize Room', o, getStreamId(stream));
		}
		// Over Ride. iAudio & iVideo are optional params
		if (isValid(iAudio)) {
			o.audio = iAudio;
			MesiboLog('======> Initialize Audio', o, getStreamId(stream));
		}

		if (isValid(iVideo)) {
			o.video = iVideo;
			MesiboLog('======> Initialize Video', o, getStreamId(stream));
		}

		MesiboLog('connectStream', stream, o, element_id, document.getElementById(element_id));
		var rv = stream.call(o, element_id, $scope.on_stream, $scope.on_status);

		return rv;
	};

	$scope.streamFromCamera = function() {
		MesiboLog('streamFromCamera');
		// $scope.toggle_source = STREAM_CAMERA;
		$scope.publish($scope.publisher);
	};


	$scope.getLocalScreen = function(screen_id){
		if(!isValid(screen_id) || screen_id <= 0)
			return null

		var screen = null;

		for (var i = $scope.local_screens.length - 1; i >= 0; i--) {
			screen = $scope.local_screens[i];
			if(screen.getType() === screen_id)
				return screen;
		}

		//No existing screen with that id, create & return a new one
		screen = $scope.live.getLocalParticipant(screen_id, $scope.user.name, $scope.user.address);
		if(!isValid(screen))
			return null;

		$scope.local_screens.push(screen);

		return screen;
	}

	$scope.streamFromScreen = function(screen_id) {
		MesiboLog('streamFromScreen');

		//All screen_id will be greater than 0
		if(!(screen_id && screen_id > 0)){
			let screen_count = $scope.local_screens.length;
			if(screen_count == 1)
				toastr.warning('You are sharing more than one screen');
			screen_id = screen_count + 1; //create new screen
		}

		var screen = $scope.getLocalScreen(screen_id);
		if(!(screen && screen.getType && screen.getType() > 0)){
			ErrorLog('streamFromScreen', 'Invalid Screen');
			return -1;
		}
		
		var rv = $scope.publish(screen);
		$scope.refresh();

		return rv;
	};

	
	$scope.openScreenSharePreview = function(screen) {
		if(!(screen && screen.attach && screen.getType))
			return;

		if(!(screen.getType()>0))
			return;

		$('#screenSharePreview').modal('show');
		document.getElementById('screen-share-id').innerHTML = 'Sharing Screen-'+ screen.getType();
		screen.attach('screen-share-preview', $scope.on_attached, 100, 10);
	};

	$scope.closeScreenSharePreview = function(){
		$('#screenSharePreview').modal('hide');
	};

	$scope.callParticipant = function(participant, audio, video) {
		MesiboLog('callParticipant', participant, audio, video);

		if (!isValid(audio) || !isValid(video) || !isValid(participant))
			return;

		var stream = $scope.getStreamFromId(getStreamId(participant));
		MesiboLog(stream);

		if (isValid(stream)) {
			ErrorLog('Participant already subscribed');
			toastr.error('Participant already subscribed');
			return;
		}

		$scope.subscribe(participant, audio, video);

	};

	$scope.openFullscreen = function(video_elem, stream_uid, stream) {

		MesiboLog('openFullscreen', video_elem, stream_uid, stream);

		if (!isValid(stream) || !isValid(stream_uid) || !isValid(video_elem))
			return;

		$scope.ultra_expanded_video_selected = stream;
		// stream.fullScreen(true);

		var elem_id = video_elem + stream_uid;

		var elem = document.getElementById(elem_id);
		if (!isValid(elem)) {
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
	};

	$scope.enterFullScreenMode = function() {
		var element = document.body;
	    var requestMethod = element.requestFullScreen || element.webkitRequestFullScreen || element.mozRequestFullScreen || element.msRequestFullScreen;

	    if (requestMethod) { // Native full screen.
	        requestMethod.call(element);
	    } else if (typeof window.ActiveXObject !== 'undefined') { // Older IE.
	        var wscript = new ActiveXObject('WScript.Shell');
	        if (wscript !== null) {
	            wscript.SendKeys('{F11}');
	        }
	    }

	    $scope.ultra_full_screen_mode = true;
	    $scope.refresh();

	};

	$scope.update_streams = function(i) {
		console.log(i);
		if (i < 0) return;
		var e = document.getElementById('video-' + $scope.streams[i].name);
		console.log(e);
	};


	$scope.$on('onStreamsRendered', function(e) {
		console.log('onStreamsRendered', e);

		for (var i = $scope.streams.length - 1; i >= 0; i--) {
			$scope.setGridVideoDimensions($scope.streams[i], 'video', DEFAULT_ASPECT_RATIO);
		}

		$scope.refresh();
	});

	$scope.$on('onExpandedScreenRendered', function(e) {
		console.log('onExpandedScreenRendered', e);
		if (!isValid($scope.expanded_video_selected)) return;
		$scope.setExpandedVideoDimensions($scope.expanded_video_selected, 'expanded-screen-video', DEFAULT_ASPECT_RATIO);
	});


	$scope.$on('onStripRendered', function(e) {
		console.log('onStripRendered', e);
		for (var i = $scope.streams.length - 1; i >= 0; i--) {
			$scope.setStripVideoDimensions($scope.streams[i], 'video-small', DEFAULT_ASPECT_RATIO);
		}
	});


	$scope.setGridVideoDimensions = function(stream, stream_id_string, aspect_ratio) {
		if (!isValid(stream) || !isValid(stream_id_string) || !isValid(aspect_ratio) || aspect_ratio < 0)
			return;

        var sa = document.getElementById("streams-area"); 

	    var h = sa.offsetHeight;
	    var w = sa.offsetWidth;
	    MesiboLog('===> setGridVideoDimensions', 'h', h, 'w', w);


	    var adjusted_width = h * DEFAULT_ASPECT_RATIO;
	    var available_height = h;

	    if (adjusted_width > w) {
	            adjusted_width = w;
	            available_height = adjusted_width / DEFAULT_ASPECT_RATIO;
	    }

	    var columns_count = $scope.grid_mode;
	    if(PLATFORM_IS_MOBILE && $scope.streams.length >=1 )
	    	columns_count = MAX_GRID_MODE;

		var adjusted_height = available_height/columns_count;
		if($scope.gri)
		
		MesiboLog('setGridVideoDimensions', stream_id_string + '-' + getStreamId(stream), adjusted_height);
		if (!adjusted_height) {
			ErrorLog('setGridVideoDimensions', 'Invalid height for', stream.getName());
			return;
		}

		var stream_container = document.getElementById(stream_id_string + '-container-' + getStreamId(stream));
		MesiboLog('setGridVideoDimensions', stream_container);
		if (!isValid(stream_container)) {
			ErrorLog('setGridVideoDimensions', 'Invalid Stream container', stream_container);
			return;
		}
		
		stream_container.style.height = adjusted_height + 'px';
	};

	$scope.setExpandedVideoDimensions = function(stream, stream_id_string, aspect_ratio) {
		if (!isValid(stream) || !isValid(stream_id_string) || !isValid(aspect_ratio) || aspect_ratio < 0)
			return;

		var stream_container = document.getElementById(stream_id_string + '-container-' + getStreamId(stream));
		
		if (!isValid(stream_container)) {
			ErrorLog('setExpandedVideoDimensions', 'Invalid Stream container', stream_container);
			return;
		}

		var adjusted_width = document.getElementById('expanded-screen-container').style.width;
		var adjusted_height = document.getElementById('expanded-screen-container').style.height;
		MesiboLog('setExpandedVideoDimensions', adjusted_height);

		stream_container.style.width = adjusted_width;
		stream_container.style.height = adjusted_height;

		MesiboLog('setExpandedVideoDimensions', stream_container);
	};

	$scope.setStripVideoDimensions = function(stream, stream_id_string, aspect_ratio) {
		if (!isValid(stream) || !isValid(stream_id_string) || !isValid(aspect_ratio) || aspect_ratio < 0)
			return;

		var stream_container = document.getElementById(stream_id_string + '-container-' + getStreamId(stream));
		MesiboLog('setStripVideoDimensions', stream_container);
		if (!isValid(stream_container)) {
			ErrorLog('setStripVideoDimensions', 'Invalid Stream container', stream_container);
			return;
		}

		var adjusted_height = MAX_BOTTOM_STRIP_HEIGHT;
		
		stream_container.style.height = adjusted_height + 'px';
		stream_container.style.width = (adjusted_height*DEFAULT_ASPECT_RATIO) + 'px';
	};

	$scope.setGridWidth = function() {
		MesiboLog('====> setGridWidth');
		var sa = document.getElementById('streams-area');
		var h = $scope.visibleHeight(sa);
		var w = sa.offsetWidth;

		if(!(MAX_STREAM_AREA_WIDTH && MIN_STREAM_AREA_WIDTH)){
			MAX_STREAM_AREA_WIDTH = w * MAX_WIDTH_INCREASE_FACTOR;
			MIN_STREAM_AREA_WIDTH = w * MIN_WIDTH_INCREASE_FACTOR;
		}
	

		MesiboLog('setGridWidth', w, h, sa);
		var adjusted_width = h * DEFAULT_ASPECT_RATIO;
		if (adjusted_width > w) {
			adjusted_width = w;
		}

		MesiboLog('setGridWidth', adjusted_width);
		document.getElementById('grid-container').style.width = adjusted_width + 'px';
	};

	$scope.initPublisherHeight = function() {
		MesiboLog('initPublisherHeight');
		var publisher_height = document.getElementById('video-publisher-container').offsetWidth/ DEFAULT_ASPECT_RATIO;
		if (!isValid(publisher_height) || publisher_height <= 0) {
			ErrorLog('initPublisherHeight', 'Invalid publisher_height');
			return -1;
		}

		document.getElementById('video-publisher').style.height = publisher_height + 'px';
	};

	$scope.redrawGrid = function(orig_w){
		var sa = document.getElementById("streams-area"); 
	    var w = sa.offsetWidth;	    

		MesiboLog('=======>$scope.redrawGrid: orig: ' + orig_w + ", w:" + w);
		MesiboLog('=======>$scope.redrawGrid: ', $scope.ultra_full_screen_mode, ($scope.ultra_full_screen_mode &&(w < MAX_STREAM_AREA_WIDTH)), (!$scope.ultra_full_screen_mode && (w > MIN_STREAM_AREA_WIDTH)));
		MesiboLog((w < MAX_STREAM_AREA_WIDTH), (w > MIN_STREAM_AREA_WIDTH), MAX_STREAM_AREA_WIDTH, MIN_STREAM_AREA_WIDTH);
		if(($scope.ultra_full_screen_mode &&(w < MAX_STREAM_AREA_WIDTH)) || (!$scope.ultra_full_screen_mode && (w > MIN_STREAM_AREA_WIDTH))) {
            MesiboLog('timeout redrawGrid');
            setTimeout(function() { $scope.redrawGrid(orig_w); }, 300)
            return;
        }
		
		// Expanded Mode
		if($scope.expanded_video_selected){
			$scope.setExpandedScreenDimensions();
			$scope.setExpandedVideoDimensions($scope.expanded_video_selected, 'expanded-screen-video', DEFAULT_ASPECT_RATIO);
			$scope.expanded_video_selected.attach('expanded-screen-video-' + getStreamId($scope.expanded_video_selected), $scope.on_attached, 100, 50);
			$scope.setupStrip();			
		}
		//Grid Mode
		else{ 
			$scope.setGridWidth();
			for (var i = 0; i < $scope.streams.length; i++) {
				$scope.streams[i].attach('video-' + getStreamId($scope.streams[i]), $scope.on_attached, 100, 10);
				$scope.setGridVideoDimensions($scope.streams[i], 'video', DEFAULT_ASPECT_RATIO);
			}
		}

	}

	$scope.onFullScreenChange = function() {
		MesiboLog('onFullScreenChange');
		var stream = $scope.ultra_expanded_video_selected;
        
		var sa = document.getElementById("streams-area"); 
	    	var orig_w = sa.offsetWidth;

		if (document.fullscreenElement) {

			$scope.ultra_full_screen_mode = true;

			MesiboLog(`Element: ${document.fullscreenElement.id} entered full-screen mode with stream`);

			if (isValid(stream)) {
				stream.fullScreen(true);
				return;
			}
			
			document.getElementById('streams-area').classList.remove('col-9');
			document.getElementById('streams-area').classList.add('col-12');
			
		}

		else {
			$scope.ultra_full_screen_mode = false;
			MesiboLog('Leaving full-screen mode..');

			if (isValid(stream)) {
				stream.fullScreen(false);
				$scope.ultra_expanded_video_selected = false;
				return;
			}

			document.getElementById('streams-area').classList.add('col-9');
			document.getElementById('streams-area').classList.remove('col-12');	
				
		}

		$scope.$applyAsync(function()  {
			MesiboLog('onFullScreenChange', 'redrawGrid', orig_w);
			$scope.redrawGrid(orig_w);
		});
						
	};

	$scope.copyInviteText = function(publisher_type) {
		MesiboLog('copyInviteText', publisher_type);

		var element_id;
		if (publisher_type == $scope.participant_type_publisher)
			element_id = 'invite-text-publisher';

		if (publisher_type == $scope.participant_type_subscriber)
			element_id = 'invite-text-subscriber';

		MesiboLog(element_id);
		var invite_text = document.getElementById(element_id);
		if (!isValid(invite_text)) {
			ErrorLog('Invalid Invite Text');
			return;
		}

		MesiboLog(invite_text.innerHTML);
		invite_text = invite_text.value;
		MesiboLog(invite_text);
		// $('.'+element_id+'').html(invite_text.replace(/\n/g,"<br>"));


		$('#' + element_id).select();
		document.execCommand('copy');

		toastr.success('Copied Invite Text');

	};

	$scope.init = function() {
		MesiboLog('init called');

		$scope.user = _initLoginCredentialsFromStorage();

		MesiboLog($scope.user);
		if (!isValid($scope.user)) {
			MesiboLog('Unable to initialize login credentials from storage');
			window.open('login.html', '_self');
			return;
		}

		var roomid = getParameterByName('room', window.location.href);
		if (!isValidString(roomid)) {
			MesiboLog(roomid);
			window.open('login.html', '_self');
			return;
		}

		roomid = parseInt(roomid);
		if (roomid < 0)
			return;

		$scope.room = _initRoomCredentialsFromStorage(roomid);
		MesiboLog($scope.room);
		if (!isValid($scope.room)) {
			MesiboLog('Unable to initialize room from storage');
			window.open('login.html', '_self');
			return;
		}

		var rv = $scope.initMesibo();
		MesiboLog('Mesibo-Live-Demo init', rv == 0 ? 'success' : 'failed');
		if (-1 == rv) {
			toastr.error('Room initialization failed. Exiting room..');
			$scope.exitRoom();
		}

['fullscreenchange', 'webkitfullscreenchange', 'mozfullscreenchange', 'msfullscreenchange'].forEach(
			eventType => document.addEventListener(eventType, $scope.onFullScreenChange, false)
		);

		$scope.setGridWidth();
		$scope.initPublisherHeight();

	};


	$scope.init();

}]);



