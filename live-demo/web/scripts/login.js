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


const _credentialLoginRecord = 'mesibo_credential_login_record';
const _credentialRoomRecord = 'mesibo_credential_room_record';


const PARTICIPANT_CAN_VIEW = 0;
const PARTICIPANT_CAN_PUBLISH = 1;

const STREAM_RESOLUTION_DEFAULT = 0;
const STREAM_RESOLUTION_QVGA = 1;
const STREAM_RESOLUTION_VGA = 2;
const STREAM_RESOLUTION_HD = 3;
const STREAM_RESOLUTION_FHD = 4;
const STREAM_RESOLUTION_UHD = 5;


var init_room = {};
init_room.audio = true;
init_room.video = true;

var myRooms = [];

var isLoginValid = false;
var gLoginEmail = '';

function sendRequest(url, callback, postData) {
    var req = createXMLHTTPObject();
    if (!req) return;

    var usePost = true;

    if (req.setRequestHeader == 'undefined' || typeof req.setRequestHeader == 'undefined')
        usePost = false;

    var method = (postData && usePost) ? 'POST' : 'GET';

    if (postData) {
        if (!usePost) {
            url = url + '?' + postData;
            postData = null;
        }
    }

    req.open(method, url, true);
    if (postData && typeof(postData) != 'object') {
        req.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
    }

    req['processed'] = false;
    function onData() {
            if (callback && !req.processed) {
            req.processed = true;
            callback(req.responseText);
            }
    }

    if (req.onload != 'undefined' && typeof req.onload != 'undefined')
        req.onload = onData;

    req.onreadystatechange = function() {
        if (req.readyState != 4) return;
        if (req.status != 200 && req.status != 304) {
         // toastr.error('HTTP error ' + req.status);
            return;
        }

        if (callback && !req.processed) {
            req.processed = true;
            callback(req.response);
        }
    };

    //http://cypressnorth.com/programming/internet-explorer-aborting-ajax-requests-fixed/
    if (typeof XDomainRequest != 'undefined') {
        req.onprogress = function() { };
        req.ontimeout = function() { };
        req.onerror = function() { };
        if (req.readyState == 4) return;

        setTimeout(function() { req.send(); }, 0);
        return;
    }

    if (req.readyState == 4) return;
    req.send(postData);
}

var XMLHttpFactories = [
    function() {return new XDomainRequest();},
    function() {return new XMLHttpRequest()},
    function() {return new ActiveXObject('Microsoft.XMLHTTP')},
    function() {return new ActiveXObject('Msxml2.XMLHTTP')},
    function() {return new ActiveXObject('Msxml3.XMLHTTP')}
];

function createXMLHTTPObject() {
    var xmlhttp = false;
    for (var i = 0; i < XMLHttpFactories.length; i++) {
        try {
            xmlhttp = XMLHttpFactories[i]();
        }
        catch (e) {
            continue;
        }
        break;
    }
    return xmlhttp;
}



  function _getPhoneNumber() {
    var phone = document.getElementById('phone').value;
    if (!isValidString(phone))
      return '';

    //xxx:Validate Phone Number
    if (phone[0] != '+') {
        toastr.error('Enter phone number with country code, (without spaces) starting with + .Example, if country code is 91 enter: +91XXXXXXXXXX');
        return '';
    }
    phone = phone.substr(1); //Strip +
    return phone;
  }

  function _getVerificationCode() {
    var code = document.getElementById('otp').value;
    if (!isValidString(code))
      return '';

    //xxx:Validate code
    return code;
  }

  function _getName() {
    var name = document.getElementById('name').value;
    if (!isValidString(name)) {
      toastr.error('Enter valid name');
      return '';
    }

    //xxx:Validate name
    return name;
  }

  function _getEmail() {
    var email = document.getElementById('email').value;
    var mailformat = /^([A-Za-z0-9_\-\.])+\@([A-Za-z0-9_\-\.])+\.([A-Za-z]{2,4})$/;
    if (!isValidString(email) || mailformat.test(email) == false) {
      toastr.error('Enter valid email');
      return '';
    }

    return email;
  }

  function _getAppId() {
    if (!isValidString(MESIBO_APP_ID))
      return '';

    return MESIBO_APP_ID;
  }

  function getMesiboDemoAppToken() {

      var appid = _getAppId();
      var name = _getName();
      var email = _getEmail();
      var code = _getVerificationCode();
      console.log('appid', appid, 'name', name, 'email', email);

      if (isValidString(code) && isLoginValid) {
          //Login with OTP
          document.getElementById('login-button').disabled = true;
          document.getElementById('login-spinner').style.display = 'inline-block';

          console.log('login with otp');
          MesiboLog(MESIBO_API_BACKEND + '?op=login&appid=' + appid + '&email=' + email + '&name=' + name + '&code=' + code);
          sendRequest(MESIBO_API_BACKEND, loginCallback, 'op=login&appid=' + appid + '&email=' + email + '&name=' + name + '&code=' + code);
      }
      else if (isValidString(name) && isValidString(email)) {
          //Send OTP to email
          MesiboLog('send otp to email');
          document.getElementById('login-button').disabled = true;
          document.getElementById('login-spinner').style.display = 'inline-block';

          grecaptcha.ready(function() {
            grecaptcha.execute(MESIBO_CAPTCHA_TOKEN, {action: 'login'}).then(function(token) {
                // MesiboLog('token', token);
                if (!isValidString(token)) {
                _displayError('Invalid captcha');
                return -1;
                }

                MesiboLog(MESIBO_CAPTCHA_TOKEN);

                MesiboLog(MESIBO_API_BACKEND + '?op=login&appid=' + appid + '&email=' + email + '&name=' + name + '&captcha=' + token);        
                sendRequest(MESIBO_API_BACKEND, loginCallback, 'op=login&appid=' + appid + '&email=' + email  + '&name=' + name + '&captcha=' + token);

              });
            });
          }

  }

  function _displayError(error) {
    if (!isValidString(error))
      return;
    console.log('Error: ' + error);
    toastr.error(error);
  }


  function _storeLoginCredentials(login) {
    MesiboLog('_storeLoginCredentials', login);
    if (!isValid(login))
      return -1;

    var login_creds = {};

    if (isValidString(login['token']));
      login_creds.token = login['token'];

    if (isValidString(login['address']));
    login_creds.address = login['address'];

    if (isValidString(login['email']));
    login_creds.email = login['email'];

    if (isValidString(login['name']));
      login_creds.name = login['name'];

    if (isValid(login['uid']));
      login_creds.uid = login['uid'];

    if (isValid(login['ts']))
      login_creds.ts = login['ts'];

    var rv = localStorage.setItem(_credentialLoginRecord, JSON.stringify(login_creds));
    return rv;
  }

  function _getStoredCredentialItem(key) {
    if (!isValidString(key))
      return;

    return localStorage.getItem(key);
  }

  function _initLoginCredentialsFromStorage() {
    var login_creds = localStorage.getItem(_credentialLoginRecord);
    if (!isValidString(login_creds))
      return null;

    login_creds = JSON.parse(login_creds);

    return login_creds;
  }

  function _initRoomCredentialsFromStorage(group_id) {
   if (!isValid(group_id))
    return null;
   var room_creds = localStorage.getItem(_credentialRoomRecord + '_group_' + group_id);

   if (!isValidString(room_creds))
    return null;
   room_creds = JSON.parse(room_creds);

    return room_creds;

  }


  function _resetLoginCredentials() {
    localStorage.removeItem(_credentialLoginRecord);
  }

  function _resetRoomCredentials(group_id) {
    localStorage.removeItem(_credentialRoomRecord + '_group_' + group_id);
  }

  function logOut() {
    _resetLoginCredentials();
    window.open('login.html', '_self');
  }


  function _storeRoomCredentials(room) {
    if (!isValid(room))
      return -1;

    var room_creds = {};

    MesiboLog('room', room, room_creds);
    //Check if all params are valid

    if (isValidString(room['gid']))
      room_creds.gid = room['gid'];

    if (isValidString(room['name']))
      room_creds.name = room['name'];

    if (isValid(room['publish']))
      room_creds.publish = room['publish'];

    if (isValidString(room['type']))
      room_creds.type = room['type'];

    if (isValidString(room['spin']))
      room_creds.spin = room['spin'];

    if (isValidString(room['pin']))
      room_creds.pin = room['pin'];

    if (isValidString(room['resolution']))
      room_creds.resolution = room['resolution'];

    if (isValid(room['ts']))
      room_creds.ts = room['ts'];
    else
      room_creds.ts = + new Date;

    if (isValid(init_room))
      room_creds.init = init_room;

    MesiboLog('room_creds', room_creds);

    localStorage.setItem(_credentialRoomRecord + '_group_' + room_creds.gid, JSON.stringify(room_creds));
    MesiboLog('_storeRoomCredentials', localStorage.getItem(_credentialRoomRecord + '_group_' + room_creds.gid));

    return 0;
  }

  function loginCallback(r) {
    document.getElementById('login-button').disabled = false;
    document.getElementById('login-spinner').style.display = 'none';

    var resp = JSON.parse(r);
    console.log(resp);
    var token = resp['token'];
    if (resp.result == 'OK') {
        isLoginValid = true;

        gLoginEmail = document.getElementById('email').value;

        document.getElementById('name').readOnly = true;
        document.getElementById('email').readOnly = true;
        document.getElementById('email-otp-prompt').innerHTML = 'Enter the OTP sent to ' + gLoginEmail;
        document.getElementById('otp-input').style.display = 'block';
        document.getElementById('otp').innerHTML = '';

        if (isValidString(token)) {
            console.log('Login Successful');

            resp.email = gLoginEmail;
            _storeLoginCredentials(resp);
            hideLoginScreen();
            showJoinRoomScreen();
        }
    }
    else {
        _displayError('Login Failed: Please try again with a valid email & OTP');
        document.getElementById('name').readOnly = false;
        document.getElementById('email').readOnly = false;
      }
  }

  function clearLoginEntry() {
    document.getElementById('name').value = '';
    document.getElementById('email').value = '';
  }

  function showLoginScreen() {
    var login = document.getElementById('main-login-form');
    if(login)
      login.style.display = 'block';
    clearLoginEntry();
  }

  function hideLoginScreen() {
    var login = document.getElementById('main-login-form');
    if(login)
      login.style.display = 'none';
    clearLoginEntry();
  }

  function clearRoomEntry() {
    document.getElementById('roomid').value = '';
    document.getElementById('roomname').value = '';
    document.getElementById('roompin').value = '';
  }

  function showJoinRoomScreen() {
    var room = document.getElementById('main-room-form');
    if(room)
      room.style.display = 'block';
    clearRoomEntry();
  }

  function hideJoinRoomScreen() {
    var room = document.getElementById('main-room-form');
    if(room)
      room.style.display = 'none';
    clearRoomEntry();
  }

  function loadLoginWindow() {
    showLoginScreen();
  }

  function _storeCredentialItem(key, value) {
    if (!isValidString(key))
      return -1;
    if (!isValid(value))
      return -1;
    localStorage.setItem(key, value);

    return 0;
  }

  function getTokenFromStorage() {
    var token = '';
    var login = localStorage.getItem(_credentialLoginRecord);
    if (!isValidString(login))
      return '';

    login = JSON.parse(login);

    if (isValidString(login['token']))
      token = login['token'];

    return token;
  }

  function enterRoomForm(e) {
    if (! e.value == 'enter')
      return;
    console.log('enterRoomForm');
    document.getElementById('room_id_div').style.display = 'block';
    document.getElementById('roomid').value = '';
    document.getElementById('roompin').value = '';
    document.getElementById('room_name_div').style.display = 'none';
    document.getElementById('room_password_div').style.display = 'block';
    document.getElementById('stream-quality-options').style.display = 'none';
    document.getElementById('room_password_label').innerHTML = 'Enter Pin';
    document.getElementById('join-room-button-text').innerHTML = 'Enter Room';
    document.getElementById('join-room-button').setAttribute('onclick', 'enterRoom()');
    // console.log(document.getElementById("join-room-button"));

    document.getElementById('my-rooms-button').style.display = 'inline-block';
    document.getElementById('my-rooms-button').setAttribute('onclick', 'showMyRooms()');
    document.getElementById('my-rooms-button-text').innerHTML = 'My Rooms';
  }

  function createRoomForm(e) {
    if (! e.value == 'create')
      return;
    console.log('createRoomForm');
    document.getElementById('room_id_div').style.display = 'none';
    document.getElementById('my-rooms-list').style.display = 'none';
    document.getElementById('roomname').value = '';
    document.getElementById('roompin').value = '';
    document.getElementById('room_name_div').style.display = 'block';
    document.getElementById('stream-quality-options').style.display = 'flex';
    document.getElementById('room_password_div').style.display = 'none';
    document.getElementById('join-room-button-text').innerHTML = 'Create Room';
    document.getElementById('quality-default').checked = true;
    document.getElementById('join-room-button').setAttribute('onclick' , 'createRoom()');

    document.getElementById('my-rooms-button').style.display = 'none';

    // console.log(document.getElementById("join-room-button"))

  }



  function _getRoomName() {
    var roomname = document.getElementById('roomname').value;
    return roomname;
  }

  function _getRoomId() {
    var roomid = document.getElementById('roomid').value;
    return roomid;
  }

  function _getRoomPin() {
    var roompin = document.getElementById('roompin').value;
    return roompin;
  }

  //Get the chosen quality level- default/qvga/vga/hd/fhd
  function _getRoomQuality() {
    var room_quality = document.querySelector('input[name = "optquality"]:checked').value;
    if (!isValidString(room_quality))
      return null;

    console.log('=====> Chosen room quality', room_quality);


    switch (room_quality) {
      case 'default':
        room_quality = STREAM_RESOLUTION_DEFAULT;
        break;
      case 'qvga':
        room_quality = STREAM_RESOLUTION_QVGA;
        break;
      case 'vga':
        room_quality = STREAM_RESOLUTION_VGA;
        break;
      case 'hd':
        room_quality = STREAM_RESOLUTION_HD;
        break;
      case 'fhd':
        room_quality = STREAM_RESOLUTION_FHD;
        break;
      case 'uhd':
        room_quality = STREAM_RESOLUTION_UHD;
        break;
    }

    return room_quality;

  }


  function _getToken() {
    var stored_token = getTokenFromStorage();
    if (isValidString(stored_token)) {
      return stored_token;
    }

    return ''; //No valid token present in config or local storage
  }

  function openRoom(groupid) {
	if (!isValid(groupid) || groupid <= 0)
	  return -1;

	var room_page = isMobileDetected() ? 'mobile.html' : 'index.html';
        MesiboLog('===========> openRoom', room_page, isMobileDetected());
        window.open(room_page + '?room=' + groupid, '_self');
  }

  function enterRoomCallback(r) {
    document.getElementById('join-room-button').disabled = false;
    document.getElementById('join-room-spinner').style.display = 'none';

    var resp = JSON.parse(r);

    if ('OK' == resp.result) {
        MesiboLog('Enter Room Successful');
        MesiboLog(resp);
        toastr.success('Enter Room Successful');
        var rv = _storeRoomCredentials(resp);
        MesiboLog(rv);
        if (-1 == rv || !isValid(rv)) {
          _displayError('Unable to store room');
          return -1;
        }


    	hideJoinRoomScreen();
    	openRoom(resp.gid);
    }
    else {
        MesiboLog(resp);
        _resetRoomCredentials(resp.gid);
        if ('AUTHFAIL' == resp.error) {
          _resetLoginCredentials();
          _displayError('Authorization Failed');
          hideJoinRoomScreen();
          showLoginScreen();
        }
        else
          _displayError('Enter Room Failed. Please enter valid Room-ID and pin');
      }
  }


  function enterRoom(room) {

    if (!isValid(room)) {
      room = {};
      room.gid = _getRoomId();

      room.pin = _getRoomPin();
    }

    if (!isValidString(room.gid)) {
        toastr.error('Invalid room id', 'Enter Room');
        return -1;
    }

    if (!isValid(room.pin)) {
        toastr.error('Invalid pin', 'Enter Room');
        return -1;
    }

    room.token = _getToken();
      if (!isValidString(room.token)) {
        toastr.error('Invalid access token', 'Enter Room');
        _resetLoginCredentials();
        window.open('login.html', '_self');
        return -1;
      }

    document.getElementById('join-room-button').disabled = true;
    document.getElementById('join-room-spinner').style.display = 'inline-block';

    grecaptcha.ready(function() {
      grecaptcha.execute(MESIBO_CAPTCHA_TOKEN, {action: 'login'}).then(function(token) {
          // MesiboLog(token);
          if (!isValidString(token)) {
            _displayError('Invalid captcha');
            return -1;
          }

          MesiboLog(MESIBO_API_BACKEND + '?token=' + room.token + '&op=joingroup&gid=' + room.gid + '&pin=' + room.pin + '&captcha=' + token);
          var request = 'token=' + room.token + '&op=joingroup&gid=' + room.gid + '&pin=' + room.pin + '&captcha=' + token;

          sendRequest(MESIBO_API_BACKEND, enterRoomCallback, request);

         });
    });

  }

  function createRoomCallback(r) {
    document.getElementById('join-room-button').disabled = false;
    document.getElementById('join-room-spinner').style.display = 'none';

    MesiboLog(r);
    var resp = JSON.parse(r);
    MesiboLog(resp);

    if ('OK' == resp.result) {
        MesiboLog('Create Room Successful');
        MesiboLog(resp);
        toastr.success('Create Room Successful');
        var rv = _storeRoomCredentials(resp);
        MesiboLog(rv);
        if (-1 == rv || !isValid(rv)) {
          _displayError('Unable to store room');
          return -1;
        }

        hideJoinRoomScreen();
    	openRoom(resp.gid);
    }
    else {
        MesiboLog(resp);
        _resetRoomCredentials(resp.gid);
        if ('AUTHFAIL' == resp.error) {
          _resetLoginCredentials();
          _displayError('Authorization Failed');
          hideJoinRoomScreen();
          showLoginScreen();

        }
        else
          _displayError('Create Room Failed');
      }
  }

  function createRoom() {
    MesiboLog('createRoom');

    var room = {};
    room.token = _getToken();
    if (!isValidString(room.token)) {
      toastr.error('Invalid access token', 'Create Room');
      _resetLoginCredentials();
      if (isMobileDetected())
	    window.open('mobile.html', '_self');
      else
	    window.open('index.html', '_self');
      return -1;
    }


    room.name = _getRoomName();
     if (!isValidString(room.name)) {
      toastr.error('Enter valid room name', 'Create Room');
      return -1;
    }


    room.quality = _getRoomQuality();
    if (!isValid(room.quality)) {
      room.quality = STREAM_RESOLUTION_DEFAULT;
    }


    document.getElementById('join-room-button').disabled = true;
    document.getElementById('join-room-spinner').style.display = 'inline-block';

    grecaptcha.ready(function() {
      grecaptcha.execute(MESIBO_CAPTCHA_TOKEN, {action: 'login'}).then(function(token) {
          // MesiboLog(token);
          if (!isValidString(token)) {
            _displayError('Invalid captcha');
            return -1;
          }

          MesiboLog(MESIBO_API_BACKEND+"?token=" + room.token +"&op=setgroup&name=" + room.name + "&type=" + room.type+ "&resolution=" + room.quality + "&pin=" + room.pin+ "&captcha=" + token);
          var request = 'token=' + room.token + '&op=setgroup&name=' + room.name + '&resolution=' + room.quality + '&captcha=' + token;

          sendRequest(MESIBO_API_BACKEND, createRoomCallback, request);

         });
    });

  }

  function hideRooms() {
    document.getElementById('my-rooms-button-text').innerHTML = 'My Rooms';
    document.getElementById('room_id_div').style.display = 'block';
    document.getElementById('room_password_div').style.display = 'block';
    document.getElementById('my-rooms-button').setAttribute('onclick' , 'showMyRooms()');
    document.getElementById('my-rooms-list').style.display = 'none';
  }

  function selectRoom(i) {
    if (!isValid(i) || i < 0 || !myRooms.length || i > myRooms.length - 1) {
      return;
    }

    var r = myRooms[i];

    var enter_room_button = document.getElementById('join-room-button');
    enter_room_button.setAttribute('onclick', 'enterSelectedRoom(' + i + ')');

  }

  function enterSelectedRoom(i) {

    if (!isValid(i) || i < 0 || !myRooms.length || i > myRooms.length - 1) {
      return;
    }

    var room = myRooms[i];
    if (!isValid(room))
      return -1;

    if (!isValid(room.gid) || !isValid(room.pin) || !isValid(room.spin))
      return -1; //You can enter room only as a creator of the room. If you are creator, then you have both pin & spin

    enterRoom(room);
  }

  function displayRoomsList(rooms, count) {
    if (!isValid(count) || count <= 0)
      return;

    if (!isValid(rooms) || !isValid(rooms.length) || rooms.length <= 0)
      return;

    var room_list = document.getElementById('my-rooms-list');
    if (!isValid(room_list))
      return;

    room_list.innerHTML = null;
    for (var i = 0; i < count; i++) {
      var r = rooms[i];
      var room_item = document.createElement('BUTTON');
      room_item.type = 'button';
      room_item.className = 'list-group-item list-group-item-action';
      
      if(rooms[i].pin && rooms[i].spin){
        room_item.innerHTML = 'Created Room #' + rooms[i].gid + ': ' + rooms[i].name;
        room_item.setAttribute('style', 'text-overflow: ellipsis;white-space: nowrap;overflow: hidden; background-color: #f9f9f9');
      }
      else{
        room_item.innerHTML = 'Room #' + rooms[i].gid + ': ' + rooms[i].name;
        room_item.setAttribute('style', 'text-overflow: ellipsis;white-space: nowrap;overflow: hidden;');
      }
    
      room_item.setAttribute('onclick', 'selectRoom(' + i + ')');
      room_item.setAttribute('ondblclick', 'enterSelectedRoom(' + i + ')');


      room_list.append(room_item);
    }

  }

  function disableShowRooms() {
    document.getElementById('my-rooms-button').disabled = true;
  }

  function showRoomsCallback(r) {
    document.getElementById('my-rooms-button').disabled = false;
    document.getElementById('my-rooms-spinner').style.display = 'none';

    var resp = JSON.parse(r);


    if ('OK' == resp.result) {
        if (resp.count == 0) {
          _displayError('There are no rooms created by you');
          return -1;
        }

        if (!isValid(resp.rooms) || resp.rooms.length <= 0) {
          _displayError('An error occured while fetching your rooms');
          return -1;
        }

        myRooms = resp.rooms;

        document.getElementById('my-rooms-button-text').innerHTML = 'Other Room';
        document.getElementById('my-rooms-button').setAttribute('onclick' , 'hideRooms()');


        document.getElementById('room_id_div').style.display = 'none';
        document.getElementById('room_password_div').style.display = 'none';

        document.getElementById('my-rooms-list').style.display = 'block';

        displayRoomsList(resp.rooms, resp.count);

    }
    else {
        MesiboLog(resp);
        if ('AUTHFAIL' == resp.error) {
          _resetLoginCredentials();
          _displayError('Authorization Failed');
          hideJoinRoomScreen();
          showLoginScreen();

        }
        else
          _displayError('Unable to show your rooms');
      }
  }

  function showMyRooms() {
    MesiboLog('showMyRooms');
    // return;

    var room = {};
    room.token = _getToken();
    if (!isValidString(room.token)) {
      toastr.error('Invalid access token', 'Create Room');
      _resetLoginCredentials();
      window.open('login.html', '_self');
      return -1;
    }

    document.getElementById('my-rooms-button').disabled = true;
    document.getElementById('my-rooms-spinner').style.display = 'inline-block';

    var request = 'token=' + room.token + '&op=rooms';
    sendRequest(MESIBO_API_BACKEND, showRoomsCallback, request);

    return;

  }


  function _getInviteeName() {
    var name = document.getElementById('invitee-name').value;
    return name;
  }

  function _getInviteeEmail() {
    var email = document.getElementById('invitee-email').value;
    var mailformat = /^([A-Za-z0-9_\-\.])+\@([A-Za-z0-9_\-\.])+\.([A-Za-z]{2,4})$/;
    if (!isValidString(email) || mailformat.test(email) == false) {
      return email = '';
    }

    return email;
  }

  function _getInviteePublishType() {

    var publish_type = document.querySelector('input[name = "optpublish"]:checked').value;
    if (!isValid(publish_type))
      return -1;

    if (publish_type == 'publish')
      return PARTICIPANT_CAN_PUBLISH;

   if (publish_type == 'view')
      return PARTICIPANT_CAN_VIEW;

  }


  function showInviteForm() {
    $('#ModalInviteForm').modal('show');
  }

  function closeInviteForm() {
    $('#ModalInviteForm').modal('hide');
  }

  function showSelfInfoForm() {
    $('#ModalSelfInfo').modal('show');
  }

  function closeSelfInfoForm() {
    $('#ModalSelfInfo').modal('hide');
  }

  function toggleDefualtAudioMute() {
    init_room.audio = !init_room.audio;
    if (init_room.audio) {
      document.getElementById('default_audio_init').style.color = 'green';
      document.getElementById('default_audio_init').className = 'fas fa-microphone';
      document.getElementById('default_audio_init').title = 'Audio Enabled';
      toastr.warning('Audio Enabled');
    }
    else {
      document.getElementById('default_audio_init').style.color = 'red';
      document.getElementById('default_audio_init').className = 'fas fa-microphone-slash';
      document.getElementById('default_audio_init').title = 'Audio Disabled';
      toastr.warning('Audio Disabled');
    }

  }

  function toggleDefaultVideoMute() {
    init_room.video = !init_room.video;
    if (init_room.video) {
      document.getElementById('default_video_init').style.color = 'green';
      document.getElementById('default_video_init').className = 'fas fa-video';
      document.getElementById('default_audio_init').title = 'Video Enabled';
      toastr.warning('Video Enabled');
    }
    else {
      document.getElementById('default_video_init').style.color = 'red';
      document.getElementById('default_video_init').className = 'fas fa-video-slash';
      document.getElementById('default_audio_init').title = 'Video Disabled';
      toastr.warning('Video Disabled');
    }
  }

// disable mousewheel on a input number field when in focus
$('form').on('focus', 'input[type=number]', function(e) {
  $(this).on('wheel.disableScroll', function(e) {
    e.preventDefault();
  });
});
$('form').on('blur', 'input[type=number]', function(e) {
  $(this).off('wheel.disableScroll');
});

function isMobileDetected() {
  let check = false;
  (function(a) {if (/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino/i.test(a) || /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0, 4))) check = true;})(navigator.userAgent || navigator.vendor || window.opera);
  return check;
}
