/** Copyright (c) 2021 Mesibo
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
 * https://mesibo.com/documentation/api/conferencing
 *
 * Source Code Repository
 * https://github.com/mesibo/conferencing/tree/master/live-demo/web
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

  //Bottom-Strip Area
  const MAX_BOTTOM_STRIP_HEIGHT = 120;
  const BOTTOM_STRIP_MARGIN_X = 120;
  $scope.is_strip_overlapping = true;

  $scope.speaker_preview = null;	
  //Modified by setSpeakerPreviewDimensions
  var MAX_WIDTH_SPEAKER_PREVIEW = 184; //Init
  var MAX_HEIGHT_SPEAKER_PREVIEW = 104; 
  $scope.participant_last_talking_ts = {};

  $scope.mesibo_connection_status = 0;

  $scope.streams = []; //All the available streams the grid
  $scope.preview_streams = []; // All streams from a user
  $scope.thumbnail_streams = []; //All streams to be shown in thumbnail area
  $scope.gAttachCount = 0;
  $scope.gArrangeCount = 0;


  $scope.participants = [];
  $scope.current_selected_stream = null;
  $scope.current_selected_participant = null;
  $scope.screen_share = false;
  $scope.ticker_messages = [];
  $scope.participant_count = null;

  //Expanded Mode
  $scope.expanded_video_selected = null;
  $scope.expanded_video_init = false;
  $scope.override_expanded_mode  = false;
  $scope.ultra_expanded_video_selected = null;
  $scope.ultra_full_screen_mode = false;

  //Focused mode(In Mobile)
  $scope.focused_stream = null;
  $scope.override_focused_mode  = false;	

  //Actvie Speaker Mode is Expande Mode + Talk Detection
  $scope.in_active_speaker_mode = false;
  $scope.active_speaker_mode_prompt = "Enable Active Speaker Mode";
  $scope.current_speaker = null; //Keep tracking the participant who is talking
  $scope.auto_hide_other_speakers = true;
  $scope.always_show_other_speakers = false; //To display speakers in the bottom strip
  $scope.active_speaker_timeout = null; //If set, will return to grid mode after time out
  $scope.bottom_strip_hide_timeout = null; //If set, it will hide the bottom strip
  $scope.show_speaker_preview = {};

  const MIN_HIDE_BOTTOM_STRIP_TIMEOUT = 10000; //Auto hide bottom strip in expnaded mode after 5 seconds
  const MIN_AUTO_GRID_TIMEOUT = 5000; //Return to grid mode if no one talks for 5 seconds 

  $scope.display_names = true;
  $scope.group_messsage_notification = '';
  $scope.display_names_placeholder = 'Hide Names';
  $scope.participant_list_placeholder = 'Participants yet to join';
  $scope.popup_grid_map = {};

  $scope.toggle_source = MESIBOCALL_VIDEOSOURCE_CAMERADEFAULT;
  $scope.publisher = {'isConnected': false, 'streamOptions': false, 'isPublished': false};
  $scope.local_screens = [];
  $scope.local_screen_count = 0;

  $scope.user = {'token': ''};
  $scope.room = {'id': '', 'name': ''};
  $scope.nameBook = {}; //To map articipant name with their address
  $scope.localMuteRecord = {};


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

  //Drawingboard
  const TYPE_CANVAS_MESSAGE = 7;
  $scope.canvasObjects = [];
  $scope._canvas = null;
  $scope.isBoardMode = false;


  $scope.showConfLimits = false;

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
    $scope.publisher.toggleVideoMute();
    if ($scope.publisher.getMuteStatus(true))
      $scope.addTicker('You have muted your video');
    else
      $scope.addTicker('You have unmuted your video');
  };

  $scope.toggleSelfAudio = function() {
    $scope.publisher.toggleAudioMute();
    if ($scope.publisher.getMuteStatus(false))
      $scope.addTicker('You have muted your audio');
    else
      $scope.addTicker('You have unmuted your audio');
  };

  /*
    For each participant store the mute status in a map locally.
    Every update overwrites the old entry if it exists
    */
  $scope.updateLocalMuteRecord = function(stream){
    if(!stream)
      return;

    var sid = getStreamId(stream);
    if(!sid) 
      return;

    var muteRecord = {};
    muteRecord.audio = stream.getMuteStatus(false, false);
    muteRecord.video = stream.getMuteStatus(true, false);

    $scope.localMuteRecord[sid] = muteRecord; 		 
  }

  /*
    toggle audio or video mute of a stream.
    */
  $scope.toggleRemoteMute = function(stream, video){
    if(!stream)
      return;

    if(!(typeof stream.toggleVideoMute == "function"
      && typeof stream.toggleAudioMute == "function")){
      return;
    }

    if(video)
      stream.toggleVideoMute();
    else
      stream.toggleAudioMute();


    $scope.updateLocalMuteRecord(stream);		
  }

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
    if (!msg)
      return false;
    return isSentMessage(msg.status);
  };

  $scope.isReceived = function(msg) {
    if (!msg)
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
    if (!m)
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
    if (!m)
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
    $scope.exitRoom();
  };

  $scope.exitRoom = function() {
    _resetRoomCredentials();

    $scope.live.leave();

    if($scope._canvas && $scope._canvas.dispose)
      $scope._canvas.dispose();

    window.open('login.html', '_self');
  };

  $scope.exitRoomForm = function() {
    $('#ModalExitForm').modal('show');
  };

  $scope.getFileIcon = function(f) {
    return getFileIcon(f);
  };

  $scope.getParticipantFromMessage = function(m) {
    if (!m)
      return;

    if (m.groupid)
      return; // defaults to group chat

    if (!m.peer)
      return; 

    for (var i = $scope.participants.length - 1; i >= 0; i--) {
      if ($scope.participants[i].getAddress() == m.peer)
        return $scope.participants[i];
    }
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
      if (!file) {
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
    if (s && f) {
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
    if (!m)
      return false;
    return (undefined != m.filetype);
  };

  $scope.isImageMsg = function(m) {
    // MesiboLog('isImageMsg', MESIBO_FILETYPE_IMAGE == m.filetype);
    if (!m)
      return false;
    if (!$scope.isFileMsg(m))
      return false;
    return (MESIBO_FILETYPE_IMAGE == m.filetype);
  };

  $scope.isVideoMsg = function(m) {
    if (!m)
      return false;
    if (! $scope.isFileMsg(m))
      return false;
    return (MESIBO_FILETYPE_VIDEO == m.filetype);
  };


  $scope.isAudioMsg = function(m) {
    if (!m)
      return false;
    if (! $scope.isFileMsg(m))
      return false;
    return (MESIBO_FILETYPE_AUDIO == m.filetype);
  };

  $scope.isOtherMsg = function(m) {
    if (!m)
      return false;
    if (! $scope.isFileMsg(m))
      return false;
    return (m.filetype >= MESIBO_FILETYPE_LOCATION);
  };

  $scope.isMesiboConnected = function() {
    if (MESIBO_STATUS_ONLINE == $scope.mesibo_connection_status)
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
    MesiboLog('Mesibo_onMessage');		

    if(m && m.type === TYPE_CANVAS_MESSAGE && m.groupid && m.message){
      if(!$scope.isBoardMode){
        getElementById('drawing-board-icon').style.color = '#FA8072';
      }

      MesiboLog('Calling Board_OnSync');
      MesiboLog($scope._canvas);
      var syncObj = JSON.parse(m.message);
      MesiboLog(syncObj);
      Board_OnSync($scope._canvas, [syncObj]);
      return;
    }
    
    var ticker_message = '';
    
    //Temprarily display the address of the user since name is not available
    var sender_name = $scope.nameBook[m.peer] ? $scope.nameBook[m.peer] : m.peer; 

    if (m.groupid && m.peer && $scope.nameBook[m.peer])
      ticker_message = 'You have a new group message from ' + sender_name; 
    else
      ticker_message = 'You have a new message from ' + sender_name; 

    $scope.addTicker(ticker_message);


    MesiboLog('scrollToLastMsg', m.peer, m.groupid, isValidString(m.peer), isValid(m.groupid));

    var popup_identifier = (isValid(m.groupid) && m.groupid > 0) ? m.groupid : m.peer;


    if (!popup_identifier)
      return; 

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
        //$scope.showPopupChat(participant);
      }
      // MesiboLog('Mesibo_onMessage', !isValid(popup_div) , $scope.isHidden(popup_div));
      var participant_chat_icon = document.getElementById('chat_popup_participant_' + m.peer);
      if (!isValid(participant_chat_icon)) return;
      participant_chat_icon.style.color = 'green';
      toastr.info(ticker_message);
    } else {
      $scope.refresh();
      $scope.scrollToLastMsg(popup_identifier);
    }



  };

  $scope.Mesibo_OnMessageStatus = function(m) {
    MesiboLog('MesiboNotify.prototype.Mesibo_OnMessageStatus: from ' + m.peer +
      ' status: ' + m.status, 'id', m.id, 'groupid', m.groupid, 'rcount', m.rcount, 'rc', m.rc);
    $scope.refresh();
  };

  $scope.Mesibo_OnPermission = function(on) {
    MesiboLog('Mesibo_onPermission: ' + on);
    if (on) {
      MesiboLog('Show permission prompt');
      if(document.getElementById('permissions-prompt'))
        document.getElementById('permissions-prompt').style.display = 'block';
    } else {
      MesiboLog('Hide permission prompt');
      if(document.getElementById('permissions-prompt'))
        document.getElementById('permissions-prompt').style.display = 'none';
    }
  };

  $scope.Mesibo_OnLocalMedia = function(m) {
    MesiboLog('Mesibo_OnLocalMedia: ', m);
  };

  $scope.MesiboGroupcall_OnPublisher = function(p, joined) {

    MesiboLog('MesiboGroupcall_OnPublisher', p, joined);
    if(!p)	
      return;

    if(!joined){
      $scope.removeParticipant(p);
      $scope.addTicker(p.getName() + ' has left the room');
      return;
    }

    if (p.getAddress() && p.getName())
      $scope.nameBook[p.getAddress()] = p.getName();

    $scope.subscribe(p, true, true);

    playSound('assets/audio/join');

    MesiboLog(getStreamId(p), p.getId(), p.getType(), p.getName() + ' has entered the room <=========');
    if(p.getType && p.getType() > 0)
      $scope.addTicker(p.getName()+ ' is sharing the screen-'+ p.getType());
    else
      $scope.addTicker(p.getName() + ' has entered the room');

  };

  $scope.getLastTalkingParticipant =function(talking_participants){
    if(!(talking_participants && talking_participants.length))
      return;

    var last_talking_ts = +new Date;
    for (var i = talking_participants.length - 1; i >= 0; i--) {
      //** Assuming we  are getting talk event only from camera type streams **
      var participant_ts = $scope.participant_last_talking_ts[talking_participants[i].getId()];
      if(participant_ts < last_talking_ts){
        last_talking_ts = participant_ts;
      }
    }

    //Will be undefined if participant doesn't exist in the ts map
    return $scope.participant_last_talking_ts[last_talking_ts];

  }

  $scope.checkOtherTalkingParticipants = function(){

    var talking_participants = [];
    for (var i = $scope.streams.length - 1; i >= 0; i--) {
      if($scope.streams[i].isTalking()){
        talking_participants.push($scope.streams[i]);
      }
    }

    var talking_participant = $scope.getLastTalkingParticipant(talking_participants);

    if(talking_participant){
      $scope.updateTalkingParticipant(talking_participant);

      if(PLATFORM_IS_MOBILE){
        $scope.focusStream(talking_participant);
      }

    }
    else {
      if(PLATFORM_IS_MOBILE){
        if($scope.streams.length)
          $scope.focusStream($scope.streams[0]);
        else
          $scope.focusStream($scope.publisher);
        return;
      }
      MesiboLog('otherTalkingParticipants', 'No one is talking!', 'Return to grid mode in', MIN_AUTO_GRID_TIMEOUT);
      $scope.active_speaker_timeout = setTimeout(function() { $scope.enterGridMode(false);}, MIN_AUTO_GRID_TIMEOUT);
      //Reset timeout if any speaker starts talking within 10 seconds of the previous speaker stopping.			
    }

  }

  $scope.updateTalkingParticipant = function(p){
    if(!(p && p.isTalking))
      return RESULT_FAIL;

    if($scope.current_speaker === p && !p.isTalking() && $scope.in_active_speaker_mode){ 
      // The current speaker has stopped talking
      $scope.current_speaker = null;
      $scope.checkOtherTalkingParticipants();	
    }

    if(p.isTalking()){ //Focus on this speaker
      $scope.current_speaker = p;
      if($scope.active_speaker_timeout && $scope.in_active_speaker_mode){ 
        // At least one person is talking 
        clearTimeout($scope.active_speaker_timeout);
      }

      $scope.participant_last_talking_ts[p.getId()] = Date.now();

      if(PLATFORM_IS_MOBILE){
        $scope.focusStream(p);
        return RESULT_SUCCESS;
      }
    }



    if($scope.in_active_speaker_mode && 
      ($scope.expanded_video_selected != $scope.current_speaker) &&
      !$scope.override_expanded_mode){
      // Only expand if not user has not willfully expanded another screen
      // Example, consider a webinar scenario. User may expand the screen shared by a speaker
      // than the speaker's camera stream
      // override_expanded_mode will be true when user has set it from the UI
      if($scope.streams.length > 1){
        MesiboLog("Focus Talking Participant");
        $scope.expandStream(p, false); //If there are more than one speakers, focus talking speaker
      }
    }

    return RESULT_SUCCESS;
  }

  $scope.MesiboGroupcall_OnTalking = function(p, talking) {
    MesiboLog('MesiboGroupcall_OnTalking', p);

    if(talking)
      $scope.updateTalkingParticipant(p);

    var pSid = getStreamId(p);
    // MesiboLog(pSid);	

    for (var i = $scope.streams.length - 1; i >= 0; i--) {
      var existingSid = getStreamId($scope.streams[i]);	
      // MesiboLog($scope.streams[i].getId(), $scope.streams[i].getType(), existingSid, pSid, i);

      if(existingSid === pSid){
        MesiboLog('Stream exists!');
        $scope.streams[i] = p;				
      }
    }

    $scope.refresh();

    $scope.updateParticipants(p);
  };

  $scope.MesiboGroupcall_OnMute = function(p, audioMuted, videoMuted, remote) {
    MesiboLog('MesiboGroupcall_OnMute', p);

    var pSid = getStreamId(p);
    // MesiboLog(pSid);	

    for (var i = $scope.streams.length - 1; i >= 0; i--) {
      var existingSid = getStreamId($scope.streams[i]);	
      // MesiboLog($scope.streams[i].getId(), $scope.streams[i].getType(), existingSid, pSid, i);

      if(existingSid === pSid){
        MesiboLog('Stream exists!');
        $scope.streams[i] = p;				
      }
    }

    $scope.refresh();

    $scope.updateParticipants(p);
  };

  $scope.Mesibo_OnError = function(e) {
    ErrorLog('====> Mesibo_OnError', e);
  };

  $scope.MesiboGroupcall_OnSubscriber = function(s, joined) {
    MesiboLog('==> Mesibo_OnSubscriber', s, joined);
    if (s && s.address && s.name)
      $scope.nameBook[s.address] = s.name;

  };



  $scope.on_setvideo = function(e) {		
    if(e && ($scope.gArrangeCount == 0)){
      $scope.gAttachCount += 1;
    }

    MesiboLog('on_setvideo', e, PLATFORM_IS_MOBILE, $scope.gAttachCount, $scope.streams.length);

    if(PLATFORM_IS_MOBILE && ($scope.gAttachCount == ($scope.streams.length + 1))){			
      if($scope.gArrangeCount == 0){
        MesiboLog('on_setvideo', 'setvideo complete, arrangeStreams');			
        $scope.gArrangeCount += 1;
        // $scope.arrangeStreams();
      }		
    }
  };


  $scope.MesiboGroupcall_OnVideo = function(p) {
    MesiboLog('MesiboGroupcall_OnVideo', p, 'isLocal?', p.isLocal(), p.getType());
    if (p.isLocal()) {
      if (p.getType() > 0) //Type screen
        return;


      if(PLATFORM_IS_MOBILE){
        $scope.focusStream(p);
        p.setVideoView('video-publisher', $scope.on_focused_setvideo, 100, 50);
      }
      else
        p.setVideoView('video-publisher', $scope.on_setvideo, 100, 50);

      MesiboLog($scope.room);
      return;
    }

    if ($scope.isBoardMode || $scope.expanded_video_selected) {
      if ($scope.expanded_video_selected && 
        (getStreamId($scope.expanded_video_selected) == getStreamId(p))) {
        $scope.expanded_video_selected = p;
        $scope.expanded_video_selected.setVideoView('expanded-video-' + getStreamId($scope.expanded_video_selected), $scope.on_setvideo, 100, 2);
      }
      $scope.setupStreamPreviews();
      $scope.setupThumbnails();
    }
    else {
      MesiboLog("updateStreams", p.iAudio, p.iVideo);
      $scope.updateStreams(p, p.iAudio, p.iVideo);
    }

    if(PLATFORM_IS_MOBILE){
      MesiboLog($scope.streams.length);
      MesiboLog('Focus on new joinee');
      if($scope.streams.length){
        $scope.focusStream(p);
      }
    }

    $scope.refresh();

  };

  $scope.isHorizontal = function(p){
    if(!p)
      return false;

    var ele = p.getVideoView();
    if(!ele)
      return false;

    var w = ele.videoWidth;
    var h = ele.videoHeight;
    p.isHorizontal = w > h;

    return p.isHorizontal;  
  }

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

  $scope.MesiboGroupcall_OnHangup = function(p, reason) {
    MesiboLog('MesiboGroupcall_OnHangup', p, reason, p.isLocal());
    if (p.isLocal()) {
      if (p.getType() > 0) {
        p.hangup();
        $scope.removeScreen(p);
        return;
      }

      $scope.publisher.hangup();

      $scope.addTicker('You have hanged up');
      $scope.publisher.isConnected = false;
      $scope.publisher.streamOptions = true;
      $scope.refresh();
      return;
    }

    for (var i = 0; i < $scope.streams.length; i++) {
      if ($scope.streams[i] === p) {

        if (MESIBOCALL_HANGUP_REASON_USER == reason) {
          $scope.streams[i].hangup();
        }

        if (MESIBOCALL_HANGUP_REASON_REMOTE == reason) {
          $scope.removeParticipant(p);					

          if(p.getType()>0)
            $scope.addTicker(p.getName() + ' has stopped sharing the screen '+ getStreamName(p));
        }


        $scope.streams.splice(i, 1);
        MesiboLog('Removed the stream!', $scope.streams);

        if(PLATFORM_IS_MOBILE && ($scope.focused_stream === p)){
          $scope.checkOtherTalkingParticipants();
        }

        for (var i = $scope.preview_streams.length - 1; i >= 0; i--) {
          if($scope.preview_streams[i] === p)
            $scope.preview_streams.splice(i, 1);
        }

        if($scope.isBoardMode){					
          $scope.setupThumbnails();
          return;
        }

        var isGridChange = $scope.setGridMode($scope.streams.length);
        $scope.refresh();


        $timeout(function() {
          if ($scope.expanded_video_selected || $scope.isBoardMode) {
            if($scope.expanded_video_selected)
              $scope.expanded_video_selected.setVideoView('expanded-video-' + getStreamId($scope.expanded_video_selected), $scope.on_setvideo, 100, 10);
            for (var i = 0; i < $scope.streams.length; i++) {
              if ($scope.isBoardMode || $scope.streams[i] != $scope.expanded_video_selected) {
                $scope.streams[i].setVideoView('video-small-' + getStreamId($scope.streams[i]), $scope.on_setvideo, 100, 10);
                $scope.streams[i].isExpandedScreen = false;
                $scope.setStripVideoDimensions($scope.streams[i], 'video-small', DEFAULT_ASPECT_RATIO);
              }
            }
          }
          else {
            for (var i = 0; i < $scope.streams.length; i++) {
              if(PLATFORM_IS_MOBILE){
                if($scope.streams[i]!= $scope.focused_stream)
                  $scope.streams[i].setVideoView('video-' + getStreamId($scope.streams[i]), $scope.on_setvideo, 100, 50);
              }
              else
                $scope.streams[i].setVideoView('video-' + getStreamId($scope.streams[i]), $scope.on_setvideo, 100, 50);
              $scope.setGridVideoDimensions($scope.streams[i], 'video', DEFAULT_ASPECT_RATIO);
            }
          }
        },0, false);

        return 0;
      }
    }
  };

  $scope.MesiboGroupcall_OnConnected = function(p, connected) {

    MesiboLog('====> MesiboGroupcall_OnConnected', ' stream ', 'uid', p.getId(), p.getName(), 'local?', p.isLocal(), ' status: 0x' + status.toString(16));

    if (p.isLocal()) {
      if (connected) {
        MesiboLog('hide spinner-publisher');
        $scope.publisher.isConnected = true;
      }
      else{
        MesiboLog('show spinner-publisher');
        $scope.publisher.isConnected = false;
      }
      
      $scope.refresh();
      return;
    }

    for (var i = 0; i < $scope.streams.length; i++) {
      if ($scope.streams[i] === p) {


        if (connected) {
          $scope.streams[i].isConnected = true;
        }
        else{
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

    if (!stream_count) {
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
    if (!p)
      return;

    for (var i = 0; i < $scope.participants.length; i++) {
      if ($scope.participants[i].getId() === p.getId()) {
        MesiboLog('updateParticipants', p.getName() + ' already exists');
        $scope.participants[i] = p;
        $scope.refresh();
        return;
      }
    }

    $scope.participants.push(p);
    $scope.refresh();
  };

  $scope.updateStreams = function(p, iAudio, iVideo) {
    MesiboLog('updateStreams', p, iAudio, iVideo, p.getType(), p.getId(), getStreamId(p));
    if (!p)
      return;

    for (var i = 0; i < $scope.streams.length; i++) {
      if (getStreamId($scope.streams[i]) === getStreamId(p)) {
        MesiboLog('updateStreams', $scope.streams[i].getId(), $scope.streams[i].getType(), getStreamId($scope.streams[i]) , 'existing', p.getId(), p.getType(), getStreamId(p));
        $scope.streams[i] = p;
        $scope.refresh();
        
        $scope.$applyAsync(function()  {
          p.setVideoView('video-' + getStreamId(p), $scope.on_setvideo, 100, 2);											
        });
        return;
      }
    }

    $scope.streams.push(p);		
    $scope.setGridMode($scope.streams.length);

    $scope.$applyAsync(function()  {
      p.setVideoView('video-' + getStreamId(p), $scope.on_setvideo, 100, 2);											
    });

  };

  $scope.getStreamId = function(s){
    return getStreamId(s);
  }

  $scope.getStreamName = function(s){
    if(!s)
      return;

    if($scope.publisher.getId() == s.getId())
      return 'You';

    var name = getStreamName(s);
    if(name == null || name == undefined){
      name = "";
    } 
    return name;
  }

  $scope.subscribe = function(p, iAudio, iVideo) {
    MesiboLog('subscribe', p, iAudio, iVideo);

    p.isVisible = true;
    p.isSelected = false;
    p.isExpandedScreen = false;
    p.isConnected = true;
    p.iAudio = iAudio;
    p.iVideo = iVideo;

    p.initStreamId = _generateStreamId(p.getId(), p.getType());

    p.call(iAudio, iVideo, $scope);	

    $scope.updateParticipants(p);

  };

  $scope.on_focused_setvideo = function(e){

    if(!e)
      return;

    var focus = $scope.focused_stream;
    if(!focus)
      return;		

    var ele = focus.getVideoView();
    if(!ele)
      return;

    var w = ele.videoWidth;
    var h = ele.videoHeight;

    //TODO: using timeouts here is hacky. Use onloadedmetadata event or similar 
    if(!(w && h)){
      setTimeout(function() { $scope.on_focused_setvideo(true); }, 50);
      return;
    }

    var ar = w/h;		

    if(!getElementById('focus-area'))
      return;

    var aWidth = getElementById('focus-area').offsetWidth;
    // Changes for horizontal mobile. 
    // On mobile h > w. So, we will have to multiply width by aspect ratio, 
    // (instead of dividing it)
    var aHeight = aWidth*DEFAULT_ASPECT_RATIO;   

    var maxHeight = getElementById('main-container').offsetHeight;
    maxHeight = 0.5*maxHeight; //Half of the available height

    if(ar < 1){
      aHeight = maxHeight;
    }


    MesiboLog('on_focused_setvideo', 'mH', maxHeight, 'aH', aHeight);

    var fa = getElementById('focus-area');
    var vpc =  getElementById('video-publisher-container');
    var sa = getElementById('streams-area');

    if(fa){
      fa.style.setProperty("width", aWidth + 'px', "important");
      fa.style.setProperty("height", aHeight + 'px', "important");
    }

    if(vpc){
      vpc.style.setProperty("width", aWidth + 'px', "important");
      vpc.style.setProperty("height", aHeight + 'px', "important");		
    }

    MesiboLog('on_focused_setvideo', aHeight, fa, vpc);
  }

  $scope.focusStream = function(p){
    MesiboLog('focusStream', p);

    if(!p)
      return;

    if($scope.focused_stream === $scope.publisher){
      var sid = $scope.getStreamFromId(getStreamId($scope.focused_stream));
      if(!sid){ //Stream doesn't exist in the array
        $scope.streams.push($scope.focused_stream);
      }
    }				

    $scope.focused_stream = p;
    $scope.refresh();

    $scope.$$postDigest(function()  {

      p.setVideoView('video-publisher', $scope.on_focused_setvideo, 100, 50);

      for (var i = 0; i < $scope.streams.length; i++) {
        if($scope.streams[i] != $scope.focused_stream){
          $scope.streams[i].setVideoView('video-' + getStreamId($scope.streams[i]), $scope.on_setvideo, 100, 10);
        }
        $scope.setGridVideoDimensions($scope.streams[i], 'video', DEFAULT_ASPECT_RATIO);										
      }									
    });				

  }

  $scope.toggleNameDisplay = function() {
    $scope.display_names = !$scope.display_names;
    if ($scope.display_names)
      $scope.display_names_placeholder = 'Hide Names';
    else
      $scope.display_names_placeholder = 'Show Names';
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
    if (!pSid)
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

    if (!participant)
      return;

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
    if (!participant)
      return;

    if (!$scope.isExistingStream(participant))
      return;

    participant.isSelected = true;
    $scope.updateCurrentSelected(participant);

    $scope.refresh();
  };


  $scope.toggleStreamVisibility = function(participant) {
    MesiboLog('toggleStreamVisibility');
    if (!participant)
      return;

    var selected_stream = $scope.getStreamFromId(getStreamId(participant));
    if (!isValid(selected_stream))
      return -1;

    selected_stream.isVisible = !selected_stream.isVisible;

    $scope.refresh();

  };

  $scope.getAudioStatusColor = function(stream) {
    // MesiboLog('getAudioStatusColor', stream);
    if (!stream)
      return 'grey';

    if (stream.getMuteStatus(false) == true) {
      return '#FF6347';
    }

    return 'green';
  };

  $scope.getVideoStatusColor = function(stream) {
    // MesiboLog('getVideoStatusColor', stream);
    if (!stream)
      return 'grey';

    if (stream.getMuteStatus(true) == true)
      return '#FF6347';

    return 'green';
  };

  $scope.getAudioStatusClass = function(stream) {
    if (!stream)
      return '';

    if (stream.getMuteStatus(false) == true)
      return 'fas fa-microphone-slash';

    return 'fas fa-microphone';
  };

  $scope.getVideoStatusClass = function(stream) {
    if (!stream)
      return '';
    
    
    if (stream.getSid() > 0 && stream.isLocal()) {
      if (stream.getMuteStatus(true))
        return 'fa fa-play-circle';
      else
        return 'fa fa-pause-circle';
    }

    if (stream.getMuteStatus(true))
      return 'fas fa-video-slash';

    return 'fas fa-video';
  };

  $scope.getStatusIndicator = function(status) {
    var status_color = '#FF6347';
    if (!status)
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
    if (!selected_stream)
      return -1;

    selected_stream.toggleAudioMute(); //false for audio
    $scope.refresh();
    return 0;
  };

  $scope.toggleVideoMute = function(stream_index) {
    var selected_stream = $scope.getSelectedStream(stream_index);
    if (!selected_stream)
      return -1;

    selected_stream.toggleVideoMute(); //true for video
    $scope.refresh();
    return 0;
  };

  $scope.getExpandedScreenStatusClass = function(stream) {
    // MesiboLog('getFullstreamstatusClass');
    if (!stream)
      return '';

    if ($scope.expanded_video_selected === stream || stream.isExpandedScreen)
      return 'fas fa-compress';


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

    var w = sa.offsetWidth;
    // var h = sa.offsetHeight;

    MesiboLog('===> setExpandedScreenDimensions', 'h: ',h, 'w: ', w);		

    // var available_height = h - MAX_BOTTOM_STRIP_HEIGHT;
    var available_height = h;
    var adjusted_width = available_height * DEFAULT_ASPECT_RATIO;
    if (adjusted_width > w) {
      adjusted_width = w;
      available_height = adjusted_width / DEFAULT_ASPECT_RATIO;
    }

    var fs = document.getElementById('expanded-screen-container');				

    fs.style.width = adjusted_width +'px';
    fs.style.height = available_height +'px';

    if((available_height + MAX_BOTTOM_STRIP_HEIGHT) < h){
      $scope.is_strip_overlapping = false;
      $scope.refresh();
    }

    // fs.style.width = w +'px';
    // fs.style.height = h +'px';
    MesiboLog('===> setExpandedScreenDimensions', fs.style.height, fs.style.width, fs);
    var horizontal_strip = getElementById('horizontal-strip-body');
    if(horizontal_strip){
      horizontal_strip.style.width = (w - BOTTOM_STRIP_MARGIN_X) + 'px';
      horizontal_strip.style.height = MAX_BOTTOM_STRIP_HEIGHT +'px';
    }

    return 0;
  };

  $scope.setSpeakerPreviewDimensions = function(){
    var sa = getElementById("streams-area");
    if(!sa)
      return;
    var h = $scope.visibleHeight(sa);
    if(!h)
      return;

    $scope.max_speaker_preview_height = h * 0.25;
    $scope.MAX_WIDTH_SPEAKER_PREVIEW = $scope.max_speaker_preview_height * DEFAULT_ASPECT_RATIO;

    $scope.refresh();
  }


  $scope.setupThumbnails = function() {
    $scope.thumbnail_streams = [];
    for (var i=0; i < $scope.streams.length; i++) {

      //Show all streams as thumbnails when in board mode
      if ($scope.isBoardMode || ($scope.streams[i] != $scope.expanded_video_selected)) {
        var thumbnail = $scope.streams[i];
        var sid = getStreamId(thumbnail);

        if( $scope.isBoardMode || !$scope.isExistingPreview(thumbnail) && thumbnail!=$scope.publisher){
          $scope.thumbnail_streams.push(thumbnail); 
        }								
      }
    }

    $scope.$applyAsync(function()  {
      if(!($scope.thumbnail_streams && $scope.thumbnail_streams.length))
        return;

      for(var i=0; i < $scope.thumbnail_streams.length; i++){
        var thumbnail = $scope.thumbnail_streams[i];
        var streamId = getStreamId(thumbnail);								
        MesiboLog('setupThumbnails', streamId, thumbnail);
        thumbnail.setVideoView('video-small-' + streamId, $scope.on_setvideo, 100, 50);
        $scope.setStripVideoDimensions(thumbnail, 'video-small', DEFAULT_ASPECT_RATIO);
        thumbnail.isExpandedScreen = false;			
      }	

    });
  }

  $scope.closeExpandedStream = function() {
    MesiboLog('closeExpandedStream');
    $scope.expanded_video_selected = null;
    $scope.expanded_video_init = false;

    if($scope.isBoardMode)
      $scope.isBoardMode = false;

    $timeout(function()  {
      MesiboLog('closeExpandedStream', 'Returning to normal mode');
      for (var i = 0; i < $scope.streams.length; i++) {
        $scope.streams[i].setVideoView('video-' + getStreamId($scope.streams[i]), $scope.on_setvideo, 100, 10);
        $scope.setGridVideoDimensions($scope.streams[i], 'video', DEFAULT_ASPECT_RATIO);
      }
    });
  };

  $scope.hideSpeakersStrip = function(){
    MesiboLog('hideSpeakersStrip');
    if($scope.always_show_other_speakers)
      return;

    hideElementById("stream_list_horizontal");
    hideElementById("next_speaker_button_left");
    hideElementById("next_speaker_button_right");
  }

  $scope.autoHideSpeakersStrip = function(){


    MesiboLog('autoHideSpeakersStrip');
    if($scope.bottom_strip_hide_timeout){			
      clearTimeout($scope.bottom_strip_hide_timeout);
      $scope.bottom_strip_hide_timeout = null;
    }

    //New Timeout
    // MesiboLog('autoHideSpeakersStrip', 'New timeout');
    $scope.bottom_strip_hide_timeout = setTimeout(function() { $scope.hideSpeakersStrip();}, MIN_HIDE_BOTTOM_STRIP_TIMEOUT);				
  }

  $scope.showSpeakersStrip = function(override){


    MesiboLog('showSpeakersStrip', override);

    showElementById("stream_list_horizontal");
    showElementById("next_speaker_button_left");
    showElementById("next_speaker_button_right");

    var sa = document.getElementById("streams-area");
    var h = $scope.visibleHeight(sa);
    if(h <= 0 ){
      ErrorLog("setExpandedScreenDimensions", 'Invalid height', h);
      return;
    }

    var w = sa.offsetWidth;

    var horizontal_strip = getElementById('horizontal-strip-body');
    if(horizontal_strip){
      horizontal_strip.style.width = (w - BOTTOM_STRIP_MARGIN_X) + 'px';
      horizontal_strip.style.height = MAX_BOTTOM_STRIP_HEIGHT +'px';
    }


    if($scope.auto_hide_other_speakers && $scope.is_strip_overlapping && !override){
      $scope.autoHideSpeakersStrip();
    }
  }


  $scope.toggleSpeakersStrip = function(){
    MesiboLog('toggleSpeakersStrip', $scope.expanded_video_selected);		
    if($scope.expanded_video_selected) {
      //Either in expanded or active speaker mode
      $scope.always_show_other_speakers = !$scope.always_show_other_speakers;
    }

    if($scope.always_show_other_speakers)
      $scope.setupThumbnails();							

    $scope.refresh();							
  }

  $scope.enterGridMode = function(user_override){
    $scope.isBoardMode = false;
    $scope.closeExpandedStream();

    if(user_override){
      $scope.override_expanded_mode = false;
    } 

    $scope.thumbnail_streams = [];
    $scope.refresh();	

  }


  $scope.toggleActiveSpeakerMode = function(){

    $scope.in_active_speaker_mode = !$scope.in_active_speaker_mode;

    if($scope.in_active_speaker_mode){
      if(!PLATFORM_IS_MOBILE)
        toastr.success('Enabled Active Speaker Mode');
      if($scope.current_speaker) {
        //Someone already talking
        $scope.updateTalkingParticipant($scope.current_speaker);
      }
    }
    else{
      toastr.error('Disabled Active Speaker Mode');
    }

    if($scope.in_active_speaker_mode && $scope.expanded_video_selected){
      //Scenario: If user has already entered expanded mode, then decides to turn on active speaker mode
      $scope.override_expanded_mode = false;
    }

    $scope.active_speaker_mode_prompt = $scope.in_active_speaker_mode ? 'Disable Active Speaker Mode' : 'Enable Active Speaker Mode';
  } 

  // Get the speaker stream(from camera) if that participant is sharing screen
  // We can now display the screen along with the speaker  
  $scope.getSpeakerStream = function(stream){
    if(!stream)
      return;

    if(!stream.getType() > 0)
      return; // Assume camera type stream is 0

    var pUid = stream.getId();
    for (var i = $scope.streams.length - 1; i >= 0; i--) {
      if(($scope.streams[i].getId() == pUid) && ($scope.streams[i].getType() == 0 )){
        return $scope.streams[i];
      }
    }

    return null; //speaker stream not found
  }

  $scope.on_video_preview_setvideo = function(p){			

  }

  $scope.setupStreamPreviews = function(expanded_stream){
    MesiboLog('setupStreamPreviews');
    if(!expanded_stream)
      return;

    $scope.preview_streams = [];

    var pUid  = expanded_stream.getId();

    for (var i = 0; i < $scope.streams.length; i++) {

      var preview_stream = $scope.streams[i];			
      MesiboLog('setupStreamPreviews', 'Setup preview for', preview_stream.getType());

      if(preview_stream.getId() == pUid && expanded_stream!= preview_stream ){
        MesiboLog('setupStreamPreviews', 'Set preview', preview_stream.getType());																
        $scope.preview_streams.push(preview_stream);
        $scope.removeThumbnail(preview_stream);				
      }			

    }

    MesiboLog('setupStreamPreviews',$scope.preview_streams);

    $scope.$applyAsync(function()  {

      if(!$scope.preview_streams)
        return;

      for(var i=0; i<$scope.preview_streams.length; i++){

        if($scope.preview_streams[i] != expanded_stream){
          var streamId = getStreamId($scope.preview_streams[i]);
          var speaker_preview_ele = 'expanded-speaker-preview-'+ streamId;
          var speaker_preview_video = 'speaker-preview-video-' + streamId;				

          var preview_elem = getElementById(speaker_preview_ele);

          if(preview_elem){
            preview_elem.style.width = MAX_WIDTH_SPEAKER_PREVIEW + 'px';
            preview_elem.style.height = MAX_HEIGHT_SPEAKER_PREVIEW + 'px';
            makeElementDraggable(preview_elem);
          }

          MesiboLog('setupStreamPreviews', 'Set video for',$scope.preview_streams[i].getType(), speaker_preview_video);
          $scope.preview_streams[i].setVideoView(speaker_preview_video, $scope.on_video_preview_setvideo, 100, 50);
        }				
      }	

    });

  }

  $scope.expandSpeakerPreview = function(stream){		
    if(!stream)
      return;

    $scope.preview_streams = [];
    $scope.expandStream(stream, true);						
  }

  $scope.removeSpeakerPreview = function(stream){
    if(!stream)
      return;

    $scope.addThumbnail(stream);
    $scope.removePreview(stream);


    $scope.showSpeakersStrip();
    $scope.setupThumbnails();		
  }

  $scope.isExistingPreview = function(stream){
    if(!stream)
      return;

    for (var i = $scope.preview_streams.length - 1; i >= 0; i--) {
      if($scope.preview_streams[i] === stream)
        return true;
    }

    return false;
  }

  $scope.isExistingThumbnail = function(stream){
    if(!stream)
      return;

    for (var i = $scope.thumbnail_streams.length - 1; i >= 0; i--) {
      if($scope.thumbnail_streams[i] === stream)
        return true;
    }

    return false;
  }

  $scope.addPreview = function(stream){
    MesiboLog('addPreview');
    if(!stream){
      MesiboLog('Invalid');
      return;
    }

    if(!$scope.isExistingPreview(stream)){
      $scope.preview_streams.unshift(stream);
      $scope.removeThumbnail(stream);

      $scope.$applyAsync(function()  {			
        for(var i=0; i<$scope.preview_streams.length; i++){									
          if($scope.preview_streams[i] != $scope.expanded_video_selected){ //Double check
            var streamId = getStreamId($scope.preview_streams[i]);
            var speaker_preview_ele = 'expanded-speaker-preview-'+ streamId;
            var speaker_preview_video = 'speaker-preview-video-' + streamId;				

            var preview_elem = getElementById(speaker_preview_ele);

            if(preview_elem){
              preview_elem.style.width = MAX_WIDTH_SPEAKER_PREVIEW + 'px';
              preview_elem.style.height = MAX_HEIGHT_SPEAKER_PREVIEW + 'px';
              makeElementDraggable(preview_elem);
            }

            MesiboLog('setupStreamPreviews', 'Set video for',$scope.preview_streams[i].getType(), speaker_preview_video);
            $scope.preview_streams[i].setVideoView(speaker_preview_video, $scope.on_video_preview_setvideo, 100, 50);
          }				
        }	
      });
      return true;
    }

    return false;
  }

  $scope.removePreview = function(stream){
    if(!stream)
      return;

    for (var i = $scope.preview_streams.length - 1; i >= 0; i--) {
      if($scope.preview_streams[i] === stream){
        $scope.preview_streams.splice(i, 1);
        $scope.refresh();
        return true;
      }
    }

    return false;
  }

  $scope.addThumbnail = function(stream){
    if(!stream)
      return;

    if(!$scope.isExistingThumbnail(stream)){
      $scope.thumbnail_streams.unshift(stream);
      $scope.refresh();
      return true;
    }

    return false;	
  }

  $scope.removeThumbnail = function(stream){
    if(!stream)
      return;

    for (var i = $scope.thumbnail_streams.length - 1; i >= 0; i--) {
      if($scope.thumbnail_streams[i] === stream){
        $scope.thumbnail_streams.splice(i, 1);
        $scope.refresh();
        return true;
      }
    }

    return false;
  }


  $scope.canShowSpeaker = function(stream){
    if(!stream)
      return;

    var pSid = getStreamId(stream);
    if(!pSid)
      return false;

    return $scope.show_speaker_preview[pSid];
  }

  /**
   * Switch from normal mode to expanded mode for selected stream
   * Expanded screen mode consists of expanded video and a bottom thumbanail strip of other streams
   * Set the video for selected stream to the expanded screen element
   *
   * user_override is true if forced to go into expanded mode by the user
   * false otherwise. Example, In the case of auto-expand with talk detection(Active User Mode)
   *
   */

  $scope.expandStream = function(selected_stream, user_override) {
    MesiboLog('expandStream', selected_stream);

    if (!selected_stream) {
      return RESULT_FAIL;
    }

    if($scope.ultra_expanded_video_selected)
      return;


    if(user_override){
      $scope.override_expanded_mode = true;
      if($scope.bottom_strip_hide_timeout){
        clearTimeout($scope.active_speaker_timeout);
        $scope.bottom_strip_hide_timeout = null;
      }

      if($scope.active_speaker_timeout){
        clearTimeout($scope.active_speaker_timeout);
        $scope.active_speaker_timeout = null;
      }


    }				

    $scope.expanded_video_selected = selected_stream;
    $scope.isBoardMode = false;

    if($scope.expanded_video_selected && user_override){
      $scope.showSpeakersStrip();			
    }

    $scope.$$postDigest(function()  {
      if (!$scope.expanded_video_init) {
        //Init only once
        $scope.setSpeakerPreviewDimensions();
        $scope.setExpandedScreenDimensions();				
        $scope.expanded_video_init = true;				
      }
    });

    $scope.on_expanded_setvideo = function(p){
      MesiboLog('=== on_expanded_setvideo ===', p);
    }

    $scope.$applyAsync(function()  {
      MesiboLog('expandStream', 'Attaching fullscreen to:', getStreamId($scope.expanded_video_selected), $scope.expanded_video_selected, 'expanded-video-' + getStreamId($scope.expanded_video_selected));
      selected_stream.setVideoView('expanded-video-' + getStreamId($scope.expanded_video_selected), $scope.on_expanded_setvideo, 100, 50);			
      MesiboLog('Entering Preview Mode');
      $scope.setupStreamPreviews(selected_stream); //Other streams from the same user	
      $scope.setupThumbnails();									
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

  $scope.getMessageSession = function(session_key, peer, groupid){
    //if($scope.messageSession[session_key])
      //return $scope.messageSession[session_key];

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

    return $scope.messageSession[session_key];
  }

  $scope.sessionReadMessages = function(session_key, user, count) {
    if (!isValid(session_key) || !isValid(user) || !isValid(count) || count <= 0) {
      ErrorLog('Error:', 'sessionReadMessages', 'Invalid input');
      return -1;
    }


    MesiboLog('sessionReadMessages', user);
    var peer = user.peer;
    var groupid = user.groupid;

    MesiboLog('sessionReadMessages ', session_key, peer + ' ' + ' groupid ' + groupid + ' ' + count);
    
    
    var rSession= $scope.getMessageSession(session_key, peer, groupid);
    rSession.enableReadReceipt(true);
    rSession.getUnreadCount( function on_unread(count){
      console.log("getUnreadCount", count);
    }
    );
    rSession.read(count);

  };

$scope.showPopupChat = function(participant) {
  MesiboLog('showPopupChat', participant);
  var selected = {};
  var popup_identifier;
  if (!isValid(participant)) {
    //Default to Group Messaging
    selected.peer = "";
    selected.groupid = $scope.room.gid;
    selected.name = "Group Chat"; 
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

      MesiboLog('=====> opening popup, reading messages for', popup_identifier);
     
      $scope.sessionReadMessages(popup_identifier, selected, MAX_MESSAGES_READ); 

      $scope.placePopupInGrid(popup_div, popup_identifier);
      return;
    }
    else {
      $scope.messageSession[popup_identifier].stop();
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
  popup_clone.getElementsByClassName('popup-message-area')[0].setAttribute('ng-show', "m.type!="+ TYPE_CANVAS_MESSAGE);

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
  popup_clone.getElementsByClassName('popup-message-area-sender-name')[0].innerHTML = '{{nameBook[m.peer] || (m.peer.slice(0, 4) + "...")}}';
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
  makeElementDraggable(document.getElementById('popup_chat_' + popup_identifier));
};

$scope.closePopupChat = function(popup_class) {
  if (!isValidString(popup_class))
    return -1;

  var popup_identifier = popup_class.split('_');
  MesiboLog(popup_identifier);
  popup_identifier = popup_identifier[popup_identifier.length - 1];
  MesiboLog('=====> closePopupChat, disabling read receipt', popup_identifier, $scope.messageSession[popup_identifier]);
  $scope.messageSession[popup_identifier].stop();
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
  
  if(groupid)
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

function saveBoard(resp) {
  MesiboLog(resp);
}

function clearBoard(resp) {
  MesiboLog(resp);
}

function downloadBoard(resp){
  MesiboLog(resp);
}


//Stringify input object and send it to the group 
$scope.sendJsonMessage = function(pObject, pType){

  if(!pObject){
    return -1;
  }

  var m = {};
  m.id = $scope.mesibo.random();
  m.groupid = $scope.room.gid;
  m.flag = MESIBO_FLAG_DEFAULT;
  m.expiry = 0; //Real-time only
  m.type = pType;


  m.message = JSON.stringify(pObject);	    

  MesiboLog('sending object', pObject.type, 'in json of len', m.message.length);

  $scope.mesibo.sendMessage(m, m.id, m.message);

  if($scope.room.publish){
    var room = $scope.room;
    var user = $scope.user;

    var request = 'token=' + user.token + '&op=setboard&gid=' + room.gid + '&pin=' + room.pin + '&obj=' + JSON.stringify(pObject);	   
    sendRequest(MESIBO_API_BACKEND, saveBoard, request);
  }


  return 0;
}

$scope.sendClearEvent = function(clearType){
  var m = {};
  m.id = $scope.mesibo.random();
  m.groupid = $scope.room.gid;
  m.flag = MESIBO_FLAG_DEFAULT;
  m.expiry = 0; //Real-time only	    
  m.type = TYPE_CANVAS_MESSAGE;

  var c = {};
  c.isClear = clearType;
  c.uid = $scope.user.uid;
  //set to 1 to clear only objects created by self
  //set to 2, to clear everything. 	     

  m.message = JSON.stringify(c);

  //Clear local canvas
  clearCanvasHandler($scope._canvas, c);

  //Send signal to clear canvas objects at remote
  $scope.mesibo.sendMessage(m, m.id, m.message);
}

$scope.clearBoard = function(resetType){

  $('#clearCanvasPrompt').modal('hide');

  var room = $scope.room;
  var user = $scope.user;

  if($scope.room.publish){
    request = 'token=' + user.token + '&op=setboard&gid=' + room.gid + '&pin=' + room.pin+ '&reset=' + resetType +'&obj='+ JSON.stringify({"test":"someprop","id":{"muid":user.uid,"uid":user.uid,"ts":1,"mts":1}});
    MesiboLog(MESIBO_API_BACKEND + '?' + request);
    sendRequest(MESIBO_API_BACKEND, clearBoard, request);
  }        

  $scope.sendClearEvent(resetType);
}


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

  $scope.live = $scope.mesibo.groupCall($scope, $scope.room.gid);
  $scope.live.join($scope);


  if ($scope.room.publish != 1) {
    toastr.error('You do not have the permission to publish');
  }
  else {
    if($scope.room){
      var init_audio = $scope.room.init.audio;
      var init_video = $scope.room.init.video;
    }
    $scope.publisher = $scope.live.createPublisher(0);
    MesiboLog('publisher===========>', $scope.publisher);
    
    $scope.publisher.setVideoSource(MESIBOCALL_VIDEOSOURCE_CAMERADEFAULT); 

    $scope.publisher.call();
    if (isValid($scope.publisher) && !$scope.publisher.isPublished && $scope.room.publish == 1) {
      $scope.publish($scope.publisher);	
    }
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

  o.source = MESIBOCALL_VIDEOSOURCE_CAMERADEFAULT;
  var init_audio = $scope.room.init.audio;
  var init_video = $scope.room.init.video;
  var stream_element_id = 'video-publisher';


  if (isValid(stream.getType) && stream.getType() > 0) {
    o.source = MESIBOCALL_VIDEOSOURCE_SCREEN;
    init_audio = false;
    stream_element_id =   null;
  }

  stream.streamOptions = false;
  stream.isPublished = true;

  $scope.connectStream(o, stream, stream_element_id, init_audio, init_video);

  $scope.refresh();
};

$scope.initFromMuteHistory = function(initObject, stream){
  if(!(initObject && stream)){
    ErrorLog('initFromMuteHistory:', 'Invalid input');
    return;
  }

  const sid = getStreamId(stream);
  if(!sid){
    ErrorLog('initFromMuteHistory:', 'Invalid stream id');
    return;
  }

  const muteRecord = $scope.localMuteRecord[sid];
  if(!muteRecord){
    ErrorLog('initFromMuteHistory:', 'Invalid mute record');
    return;
  }

  if(muteRecord['audio'])
    initObject['audio'] = false;

  if(muteRecord['video'])
    initObject['video'] = false;

  return initObject;

}

$scope.connectStream = function(o, stream, element_id, iAudio, iVideo) {
  MesiboLog('connectStream:', 'params', o, stream, element_id, iAudio, iVideo);
  if (!stream)
    return -1;

  //First initialize to room settings
  if (isValid($scope.room) && isValid($scope.room.init)) {
    if (!isValid(o)) {
      o = {};
    }
    o.audio = $scope.room.init.audio;
    o.video = $scope.room.init.video;
    MesiboLog('connectStream:','======> Initialize Room', o, getStreamId(stream));
  }

  //Override. Check and update if there is a history of muting this participant
  if(!$scope.initFromMuteHistory(o, stream))
    MesiboLog('connectStream:','======> Error/No mute history');

  // OverRide. iAudio & iVideo are optional params
  if (isValid(iAudio)) {
    o.audio = iAudio;
    MesiboLog('connectStream:','======> Initialize Audio', o, getStreamId(stream));
  }

  if (isValid(iVideo)) {
    o.video = iVideo;
    MesiboLog('connectStream:','======> Initialize Video', o, getStreamId(stream));
  }



  MesiboLog('connectStream:', stream, o, element_id, document.getElementById(element_id));
  var rv = stream.call(o.audio, o.video, $scope);

  return rv;
};

$scope.streamFromCamera = function() {
  MesiboLog('streamFromCamera');
  // $scope.toggle_source = MESIBOCALL_VIDEOSOURCE_CAMERADEFAULT;
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
  screen = $scope.live.createPublisher(screen_id);
  screen.setVideoSource(MESIBOCALL_VIDEOSOURCE_SCREEN);
  if(!screen)
    return null;

  $scope.local_screens.push(screen);

  return screen;
}

//Creates & Returns a new screen id
$scope.createScreen = function(){
  $scope.local_screen_count +=1;		
  return $scope.local_screen_count;
}

$scope.streamFromScreen = function(screen_id) {
  MesiboLog('streamFromScreen');

  //All screen_id should be greater than 0
  if(!(screen_id && screen_id > 0)){
    if($scope.local_screens.length == 1)
      toastr.warning('You are sharing more than one screen');
    screen_id = $scope.createScreen() ; //create new screen
    if(screen_id <= 0)
      return;
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
  if(!screen)
    return;

  if(!(screen.getType() > 0))
    return;

  $('#screenSharePreview').modal('show');
  document.getElementById('screen-share-id').innerHTML = 'Sharing Screen-'+ screen.getType();
  screen.setVideoView('screen-share-preview', $scope.on_setvideo, 100, 10);
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

  if (!(video_elem && stream_uid && stream)){
    ErrorLog('openFullscreen', 'Invalid input');
    return;
  }

  $scope.ultra_expanded_video_selected = stream;

  MesiboLog("ultra expand");

  var elem_id = video_elem + stream_uid;
  if(video_elem == 'video-publisher'){
    elem_id = 'video-publisher';
  }

  var elem = document.getElementById(elem_id);
  if (!isValid(elem)) {
    MesiboLog('openFullscreen', 'element does not exist');
    return -1;
  }

  MesiboLog("Request Full Screen");
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

$scope.arrangeStreams = function(){
  MesiboLog('arrangeStreams');
  var hStreams = [];
  var vStreams = [];

  for (var i = 0; i < $scope.streams.length; i++) {
    if($scope.isHorizontal($scope.streams[i])){
      $scope.streams[i].isHorizontal = true;
      hStreams.push($scope.streams[i]);
    }
    else{
      $scope.streams[i].isHorizontal = false;
      vStreams.push($scope.streams[i]);
    }
  }

  if((vStreams.length % 2) == 0){ //Even number of vertical streams
    var vs = vStreams.pop();
    vs.isHorizontal = true;
    hStreams.unshift(vs);
  }		

  for(var i = 0; i< vStreams.length; i++){
    MesiboLog('vStreams', vStreams[i].isHorizontal);
  }

  for(var i = 0; i< hStreams.length; i++){
    MesiboLog('hStreams', hStreams[i].isHorizontal);
  }

  $scope.streams = [];


  $scope.$applyAsync(function()  {
    $scope.streams.push(...vStreams);	
    $scope.streams.push(...hStreams);
    $scope.$$postDigest(function()  {
      for (var i = 0; i < $scope.streams.length; i++) {
        MesiboLog('latest streams',$scope.streams[i].isHorizontal, i);
        $scope.setGridVideoDimensions($scope.streams[i], 'video', DEFAULT_ASPECT_RATIO);
        $scope.streams[i].setVideoView('video-' + getStreamId($scope.streams[i]), $scope.on_setvideo, 100, 10);
      };
    });

  });		
}


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
  $scope.setExpandedVideoDimensions($scope.expanded_video_selected, 'expanded-video', DEFAULT_ASPECT_RATIO);
});


$scope.$on('onStripRendered', function(e) {
  console.log('onStripRendered', e);
  for (var i = $scope.streams.length - 1; i >= 0; i--) {
    $scope.setStripVideoDimensions($scope.streams[i], 'video-small', DEFAULT_ASPECT_RATIO);
  }
});

$scope.$on('onPreviewRendered', function(e) {
  console.log('onPreviewRendered', e);		
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


  if (!adjusted_height) {
    ErrorLog('setGridVideoDimensions', 'Invalid height for', stream.getName());
    return;
  }

  var stream_container = document.getElementById(stream_id_string + '-container-' + getStreamId(stream));

  if (!isValid(stream_container)) {
    ErrorLog('setGridVideoDimensions', 'Invalid Stream container', stream_container);
    return;
  }

  if(PLATFORM_IS_MOBILE){

    var sc = getElementById('stream-container-' + getStreamId(stream));
    if(!sc){			
      return;
    }

    var aWidth = sc.offsetWidth;
    if(!aWidth){
      return;
    }

    var w = aWidth / 4;
    var h = w / (4/3);

    // stream_container.style.width = w + 'px';
    stream_container.style.height = h + 'px';

    return;
  }

  stream_container.style.height = adjusted_height + 'px';
  MesiboLog('setGridVideoDimensions', stream_container, '**h**',adjusted_height, '**w**', adjusted_width);


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

$scope.setBoardDimensions = function(){		
  var sa = getElementById('streams-area');
  if(!sa)
    return;
  var canvas = $scope._canvas;
  canvas.setWidth(sa.offsetWidth);
  canvas.setHeight(sa.offsetHeight);
  canvas.calcOffset();

  canvas.renderAll();
  MesiboLog('setBoardDimensions', sa.offsetWidth, sa.offsetHeight);
}

$scope.setStripVideoDimensions = function(stream, stream_id_string, aspect_ratio) {
  if (!(stream && stream_id_string && aspect_ratio)){
    return;
  }

  var scid =  stream_id_string + '-container-' + getStreamId(stream);
  var stream_container = document.getElementById(scid);
  MesiboLog('setStripVideoDimensions', stream_container);
  if (!stream_container) {
    ErrorLog('setStripVideoDimensions', 'Invalid Stream container', stream, scid);
    return;
  }

  var adjusted_height = MAX_BOTTOM_STRIP_HEIGHT;

  var adjusted_width = adjusted_height * aspect_ratio;

  stream_container.style.height = adjusted_height + 'px';


  // stream_container.style.width = adjusted_width + 'px';
};

$scope.setGridWidth = function() {	
  MesiboLog('====> setGridWidth');
  if(PLATFORM_IS_MOBILE)
    return;

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
  var gc = getElementById('grid-container');
  if(gc)
    gc.style.width = adjusted_width + 'px';
};

$scope.initPublisherHeight = function() {

  if(PLATFORM_IS_MOBILE){
    var maxHeight = getElementById('main-container').offsetHeight;
    maxHeight = 0.5*maxHeight; //Half of the available height

    getElementById('focus-area').style.height = maxHeight +'px';
    // getElementById('video-publisher-container').style.height  = maxHeight + 'px';
    // getElementById('video-publisher').style.height  = maxHeight + 'px';

    return;
  }

  MesiboLog('initPublisherHeight');
  var publisher_height = document.getElementById('video-publisher-container').offsetWidth/ DEFAULT_ASPECT_RATIO;
  if (!isValid(publisher_height) || publisher_height <= 0) {
    ErrorLog('initPublisherHeight', 'Invalid publisher_height');
    return -1;
  }


  document.getElementById('video-publisher').style.height = publisher_height + 'px';	
  MesiboLog('initPublisherHeight', DEFAULT_ASPECT_RATIO, document.getElementById('video-publisher-container').offsetWidth,publisher_height);
};

$scope.redrawGrid = function(orig_w){
  var sa = document.getElementById("streams-area"); 
  var w = sa.offsetWidth;	    

  MesiboLog('=======>$scope.redrawGrid: orig: ' + orig_w + ", w:" + w);
  MesiboLog('=======>$scope.redrawGrid: ', $scope.ultra_full_screen_mode, ($scope.ultra_full_screen_mode &&(w < MAX_STREAM_AREA_WIDTH)), (!$scope.ultra_full_screen_mode && (w > MIN_STREAM_AREA_WIDTH)));
  MesiboLog((w < MAX_STREAM_AREA_WIDTH), (w > MIN_STREAM_AREA_WIDTH), MAX_STREAM_AREA_WIDTH, MIN_STREAM_AREA_WIDTH);
  if(($scope.ultra_full_screen_mode &&(w < MAX_STREAM_AREA_WIDTH)) || (!$scope.ultra_full_screen_mode && (w > MIN_STREAM_AREA_WIDTH))) {
    MesiboLog('timeout redrawGrid');
    setTimeout(function() { $scope.redrawGrid(orig_w); }, 100);
    return;
  }

  // Expanded Mode
  if($scope.expanded_video_selected){
    $scope.setExpandedScreenDimensions();
    $scope.setSpeakerPreviewDimensions();
    $scope.setExpandedVideoDimensions($scope.expanded_video_selected, 'expanded-video', DEFAULT_ASPECT_RATIO);
    $scope.expanded_video_selected.setVideoView('expanded-video-' + getStreamId($scope.expanded_video_selected), $scope.on_setvideo, 100, 50);
    $scope.setupStreamPreviews();

    $scope.showSpeakersStrip();
    $scope.setupThumbnails();



  }

  else if($scope.isBoardMode){
    $scope.setBoardDimensions();
    $scope.showSpeakersStrip();
    $scope.setupThumbnails();
  }
  //Grid Mode
  else{ 
    $scope.setGridWidth();
    for (var i = 0; i < $scope.streams.length; i++) {
      $scope.streams[i].setVideoView('video-' + getStreamId($scope.streams[i]), $scope.on_setvideo, 100, 10);
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

    MesiboLog(`Element: ${document.fullscreenElement.id} entered full-screen mode with stream`, stream);

    if (stream) { //Stream is made full screen
      return;
    }

    document.getElementById('streams-area').classList.remove('col-9');
    document.getElementById('streams-area').classList.add('col-12');

  }

  else {
    $scope.ultra_full_screen_mode = false;
    MesiboLog('Leaving full-screen mode..', stream);

    if (stream) { //Stream made full screen is being closed
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

$scope.copyInviteText = function(invitePublisher) {
  MesiboLog('copyInviteText');

  var element_id;
  element_id = invitePublisher ? 'invite-text-publisher' : 'invite-text-subscriber';

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

  MesiboLog('===> Room creds', $scope.room);
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

  if(PLATFORM_IS_MOBILE){
    if(!$scope.in_active_speaker_mode){
      $scope.toggleActiveSpeakerMode();
      //On mobile turn on active speaker mode by default
    }
  }

  $scope.setGridWidth();
  $scope.initPublisherHeight();

  if(SHOW_CONF_LIMITS_ALERT){
    $scope.showConfLimits = true;

    $scope.hideConfLimits = function(){
      $scope.showConfLimits = false;
      $scope.setGridWidth();
      $scope.refresh();
    }

    $scope.showConfLimitsModal = function(){
      MesiboLog("showConfLimitsModal");
      $('#confDemoLimits').modal('show');
    }
  }
};

$scope.initSyncBoard = function(resp){
  if(!resp){
    return RESULT_FAIL;
  }

  // MesiboLog(resp);

  resp = JSON.parse(resp);

  if(resp.result == "OK"){

    // MesiboLog(resp.objs);
    if(resp.count && resp.objs){
      $scope.canvasObjects = resp.objs;
    }


    var wb  = getElementById('expanded_drawingboard_body');
    if(!wb) return;

    var sa = document.getElementById("streams-area");
    if(!sa)
      return;

    if(!$scope._canvas){
      $scope._canvas = initCanvas($scope, document, sa.offsetWidth, sa.offsetHeight);
      if(!$scope._canvas){
        ErrorLog('Error initializing board');
      }
      $scope.isBoardMode = true;
    }							    	   						

    return RESULT_SUCCESS;

  }
  else{
    ErrorLog('Error: initSyncBoard', 'Error in getboard response: ', resp);
    return RESULT_FAIL;
  }

}

$scope.saveBoardPref =function(){
  MesiboLog('Saving drawing preferences', JSON.stringify(gPref));
  localStorage.setItem('mesibo_local_board_pref', JSON.stringify(gPref));
}

$scope.isBoardShown = function(){
  return $scope.isBoardMode;
  // return ($("#drawingBoardModal").data('bs.modal') || {})._isShown ;
}

$scope.toggleBoardMode = function(){	
  // $scope.isBoardMode = !$scope.isBoardMode;
  MesiboLog('toggleBoardMode', $scope.isBoardMode);
  $scope.isBoardMode = !$scope.isBoardMode;

  if(!$scope.isBoardMode){
    $scope.enterGridMode();			
    return;
  }

  if($scope.isBoardMode){
    getElementById('drawing-board-icon').style.color = 'white';

    if(!$scope._canvas){
      //Initialize board for the first time
      $scope.initBoard();
    }

    $scope.expanded_video_selected = null;

    MesiboLog('Show bottom strip');						    		    

    $scope.setupThumbnails();
    $scope.$$postDigest(function()  {		    		        
      $scope.showSpeakersStrip(true);							    									
    });


  }

}

$scope.initBoard = function(){
  // $('#drawingBoardModal').modal('show');
  getElementById('drawing-board-icon').style.color = 'white';

  $('#drawingBoardModal').on('hidden.bs.modal', function () {
    $scope.saveBoardPref();
  });

  var room = $scope.room;
  var user = $scope.user;

  MesiboLog(room);
  request = 'token=' + user.token + '&op=getboard&gid=' + room.gid + '&pin=' + room.pin;
  MesiboLog('initBoard');
  MesiboLog(MESIBO_API_BACKEND+'?'+request);
  sendRequest(MESIBO_API_BACKEND, $scope.initSyncBoard, request);		
}


$scope.init();

}]);


//Modal overlay
$(document).on('show.bs.modal', '.modal', function () {
  var zIndex = 1040 + (10 * $('.modal:visible').length);
  $(this).css('z-index', zIndex);
  setTimeout(function() {
    $('.modal-backdrop').not('.modal-stack').css('z-index', zIndex - 1).addClass('modal-stack');
  }, 0);
});
