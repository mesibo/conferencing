## mesibo Live Demo 

This repository contains the source code for the mesibo sample conferencing app hosted at [https://mesibo.com/livedemo](https://mesibo.com/livedemo), This is a fully functional, Zoom Like Video Conferencing app which you can directly integrate into your website.

It is recommended that you first look at [basic demo](https://github.com/mesibo/conferencing/tree/master/basic-demo) to familiarize yourself with API before diving into this app.

> Please note that this documentation is **under progress** and will be updated. 

## Features:
- Group Voice and Video Call with unlimited members
- Live Streaming
- Screen Sharing
- Fine control over all video & audio parameters and user permissions
- Supports video streaming at various resolutions: Standard, HD, FHD and 4K
- Group Chat
- One-to-One chat
- Invite Participants

We have also hosted the same code at [https://mesibo.com/livedemo](https://mesibo.com/livedemo) so that you can quickly try it out. 

### Configuring the backend

If you want to setup your backend for the conferencing app, refer to the [backend](https://github.com/mesibo/conferencing/tree/master/live-demo/backend) and modify [config.js](https://github.com/mesibo/conferencing/blob/master/live-demo/web/mesibo/config.js) accordingly.

If you choose not to setup the backend, you can use the Mesibo API backend at `https://app.mesibo.com/conf/api.php` and use the default configuration in [config.js](https://github.com/mesibo/conferencing/blob/master/live-demo/web/mesibo/config.js)

# Building a Zoom Like Conferencing app 

![Mesibo Room](mesibo-room.png)

### Prerequisites

- The demo app uses the Mesibo Javascript SDK. So, install Mesibo Javscript SDK by following the instructions [here](https://mesibo.com/documentation/install/javascript/)
- Familiar with Mesibo [User and Group Management APIs](https://mesibo.com/documentation/api/backend-api/#group-management-apis)
- Familiar with the basic concepts Mesibo APIs for streaming and conferencing. It is recommended that you first look at the [basic demo](https://github.com/mesibo/conferencing/tree/master/basic-demo) to familiarize yourself with API before diving into live-demo.
- A web server with HTTPS and PHP support. We assume that your hostname is example.com and the backend is accessible via URL https://example.com/api.php over a **secure connection**
- Camera and Microphone access. Please ensure you have  set up  camera and microphone devices and granted the required permissions in the browser

You can try the [Mesibo Live Demo(Beta)](https://mesibo.com/livedemo) which is a fully functional, Zoom Like Video Conferencing app and also download the entire source code from [Github](https://github.com/mesibo/conferencing). 

## Terminology

In this document, we will be using the following terms

- Conference - The conferencing app 
- Stream - video (camera, screen, etc) and voice data
- Participant - a user participating in the conference
- Publishing - publishing/sending self video and voice stream to the conference
- Subscribing - Receiving video and voice stream of other participants
- Publisher - The participant sending self video and voice stream
- Subscriber - The participant viewing other's voice and video stream 



### Basic requirements for conferecing

1. A conference room which people can join
2. A list of participants and a way to update the list of participants as and when people join or leave the room
3. View the videos of participants in the group
4. Send my video, to the group.
5. Mute audio/video of other participants and my own

## 1. Creating a Conference Room

The conference room is a group. We will use REST APIs to perform the operations to create a group and join a group on Mesibo backend. Only the members of a group will be able to view the streams of other members of the same group.

### User Login
In the demo app, the user registers with a name and email. 

Then the app makes a request to mesibo backend with the following parameters to send an OTP to the email entered.
```
https://example.com/api.php?op=login&appid=APP_ID&name=NAME&email=USER_EMAIL
```

The user will now need to enter the OTP received which is sent to the backend for verification with the following request

```
https://example.com/api.php?op=login&appid=APP_ID&name=NAME&email=USER_EMAIL&code=OTP_RECEIVED
```
If the entered OTP matches, the backend generates a token for that user. The token is stored locally.


### Creating a Room
For a conference room, The creator of the room will configure all the room properties such as the room name, quality settings, etc.

```javascript
const STREAM_RESOLUTION_VGA = 2 ; 
const STREAM_RESOLUTION_HD = 3 ;
const STREAM_RESOLUTION_FHD = 4;
const STREAM_RESOLUTION_UHD = 5;
```

The room is created by sending a request to the mesibo backend, in the following format:
```
https://example.com/api.php?token=USER_ACCESS_TOKEN&op=setgroup&name=ROOM_NAME&resolution=ROOM_RESOLUTION
```
For a successful request, the response looks like below:
```
{
    "op": "setgroup",
    "ts": 1592913675,
    "gid": 96734,
    "name": "newroom",
    "type": 0,
    "resolution": "0",
    "publish": 1,
    "pin": "93799667",
    "spin": "35399768",
    "result": "OK"
}
```
This result is also stored locally.

As the creator of the room, you have the permissions to publish to the group and view other streams. But, you may need to control the permissions of other particpants in the conference. You may wish to permit only a select few of the participants to both publish, participate and view other streams, while for some you only grant the permission to view other streams.

This is done by using the appropriate pin.

### Inviting others
Any participant who wishes to enter the room needs to enter a `pin`, to enter a room with a particular `room-ID`. 

When a room is created, the response contains two pins :
- `response['pin']` Participant Pin. Send this to those who you want to actively participate in the conference. They will be able to make a video or voice call to the conference.
- `response['spin']` Subscriber Pin. Send this to those who you want to silently participate in the conference. They will not be able to make a call -but they will be able to view the conference.

Also note that the option to invite ie; to get these special pins is only available to the creator of the room. So,the invite option is not displayed for anyone  other than the creator of the room.

### Entering a room
To enter a room you the user enters a `ROOM_ID` and a `ROOM_PIN`. The app requests mesibo backend to authenticate it by using the following request:
```
https://example.com/api.php?token= USER_TOKEN&op=joingroup&gid= ROOM_ID&pin=ROOM_PIN
```

## 2. Getting a list of Participants

First initialize mesibo.

### Initialize Mesibo
To initialize Mesibo, create an instance of Mesibo API class `Mesibo`. Set the app id and token that you obtained while creating the user.
Call the `getLocalParticipant` method to initialize local publisher(the stream you need to send).

You are the publisher. As a member of the conference room group, you can stream your self, which other members can view.

You can initialize and run mesibo as follows:
 
```javascript

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
        $scope.publisher = $scope.live.getLocalParticipant(0, $scope.user.name, $scope.user.address);
        if(!isValid($scope.publisher))
            return -1;        


        MesiboLog('publisher', $scope.publisher);

        $scope.file = new MesiboFile($scope);

        $scope.refresh();

        return 0;
    }


```
### List of Participants

Now you will get a list of participants though the callback function `Mesibo_onParticipants`. You can choose and subscribe to the stream of each member to view it. When a new participant joins the room, `Mesibo_onParticipants` will be called. 

```javascript
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


```

You can now iterate through the list of participants and subscribe to the stream of each participant.

### 3. View the videos of participants in the group
You can subscribe to the stream of each participant that you get in `Mesibo_onParticipants` as follows with the `call()` method. We need to update the list `$scope.streams` as and when people join and leave the room.

```javascript
    $scope.subscribe = function(p) {
        MesiboLog('subscribe', p);
        $scope.updateParticipants(p);
        $scope.updateStreams(p);    
    }
    

    $scope.updateStreams = function(p){
        MesiboLog('updateStreams', p, $scope.participants, $scope.streams);
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
            MesiboLog('call stream', p);
            p.call(null, "video-"+ p.getId(), $scope.on_stream, $scope.on_status);
        });

    }    
```

### Displaying the grid of videos

We need to dynamically render the grid of videos from the list of streams. That is if there is only a single video we need to display the video up to the full width of the screen. But, if there are four streams, we need to split the available screen into four equal parts. If there are more, our grid will be divided into more pieces. (As of now we will have a maximum of 16 streams to be displayed at a single time on the screen). As and when participants leave and join the group, our grid mode may change.

To build this feature we will use Bootstrap [Column Wrapping](https://getbootstrap.com/docs/4.0/layout/grid/#column-wrapping).

Based on the `grid_mode` we will define the number of columns our grid will have. Based on the number of streams, we will define the grid mode.

```javascript

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

        if(previous_grid_mode != $scope.grid_mode)
           isGridChange = true;

        $scope.refresh();

        return isGridChange;
    }


```
And our grid rendering is as follows
```html
<div ng-repeat="s in streams track by $index" ng-if="streams[$index] != null"  class ="pl-0 pr-0" ng-class="{'col-md-12': grid_mode==1, 'col-md-6': grid_mode==2, 'col-md-4': grid_mode==3, 'col-md-3': grid_mode==4>
```
### 4. Publish my stream to the group.
On this demo application, you either publish through a camera or share a screen. If you wish, you may similataneosuly publish both your camera and screen at the same time. But, more on that later. Let us first understand how you can publish a single stream to the group.

```javascript
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

```
You can configure two things while placing a call to the group.
- `source` It can be camera or screen
- `audio` Set it to false to disable audio
- `video` Set it to false to disable video

Before making the call, you can initialize the `audio` and `video` parameters to make it an audio or video only call to the group. Refer to the `connectStream`  function in `controller.js` which eventually calls the `call` method of the stream object to place a all to the group. 

Just like other streams, we call `attach` for the stream with an HTML element in `on_stream`

### 5. Mute participants
In case of mute there are two possibilities.
- The remote end can mute  their stream
- You can mute the participant stream a your end

The mute status is reflected in the `stream.muteStatus` method of that stream and we will display the appropriate icon. 
```javascript
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

```
The above is for local mute. When remote end mutes you can pass an additional parameter to the `muteStatus` method.
`stream.muteStatus(true, true)`  for remote video status and `stream.muteStatus(false, true)`. We display an prropriate icon when remote audio/video is muted.

### 6. Stream Status

You will be getting the state of a stream in the callback function `on_status`, for example
- `MESIBO_CALLSTATUS_CHANNELUP` : Call is established and you are getting the stream
- `MESIBO_CALLSTATUS_RECONNECTING`: Call is reconnecting, you will not be getting the stream
- `MESIBO_CALLSTATUS_COMPLETE`: Call has ended , terminate the stream.

For each state we need to display appropriate indicators. For example, if the call is reconnecting then we will show a spinner for that stream and once it is up, we hide the spinner. Also, when the call is complete we remove the stream from the streams area (Refer to `on_hangup`)

```javascript
function on_status(status){
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
}            
```
### 7. Displaying a stream
Call attach on the stream with the required DOM element
```javascript
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
				$scope.expanded_video_selected.attach('expanded-screen-video-' + 
                getStreamId($scope.expanded_video_selected), $scope.on_attached, 100, 2);
			}
			$scope.setupStrip();
		}
		else {
			p.attach('video-' + getStreamId(p), $scope.on_attached, 100, 2);											
		}

		$scope.refresh();

	};
 ```


These are some of the major features of the live demo app. This tutorial is intended as a birds-eye view of the app. You can explore the [demo app](https://mesibo.com/livedemo) and take a look at the [source code](https://github.com/mesibo/conferencing/tree/master/live-demo) to dig deeper. 

