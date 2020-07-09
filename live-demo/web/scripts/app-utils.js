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

const MESIBO_FILETYPE_IMAGE = 1;
const MESIBO_FILETYPE_VIDEO = 2;
const MESIBO_FILETYPE_AUDIO = 3;
const MESIBO_FILETYPE_LOCATION = 4;


//For debugging purposes only
function getScope(){
	return angular.element(document.getElementById('mesiboliveapp')).scope();
};

function _generateStreamId(uid, type){
	if(!uid || type <0){
		ErrorLog('_generateStreamId', 'Invalid uid');
		return -1;
	}

	return (type << 32) | uid;		
}

function getStreamId(s){
	if(!(s && s.getId && s.getType)){
		ErrorLog('getStreamId', 'Invalid stream', s);
		return -1;
	}

	const uid = s.getId();
	if(typeof uid != 'number' || isNaN(uid) || uid < 0){
		ErrorLog('getStreamId', 'Invalid uid');
		return -1;
	}

	const type = s.getType();
	if(typeof type != 'number' || isNaN(type) || type < 0){
		ErrorLog('getStreamId', 'Invalid type');
		return -1;
	}
	
	return _generateStreamId(uid, type);
}	

function getStreamName(s){	
	if(!(s && s.getId && s.getName)){
		ErrorLog('getStreamName', 'Invalid stream');
		return RESULT_FAIL;
	}

	const name = s.getName();
	if(!name || typeof name != 'string'){
		ErrorLog('getStreamName', 'Invalid name');
		return RESULT_FAIL;
	}

	const type = s.getType();
	if(typeof type != 'number' || isNaN(type) || type <0){
		ErrorLog('getStreamName', 'Invalid type');
		return RESULT_FAIL;
	}

	let stream_name = name;
	if(type > 0)
		stream_name += ' screen-'+ type;

	return stream_name;
}

// Get the matching status tick icon
let getStatusClass = (status) => {
        // MesiboLog("getStatusClass", status);
        var statusTick = '';
        switch (status) {

                case MESIBO_MSGSTATUS_SENT:
                        statusTick = 'far fa-check-circle';
                        break;

                case MESIBO_MSGSTATUS_DELIVERED:
                        statusTick = 'fas fa-check-circle';
                        break;


                case MESIBO_MSGSTATUS_READ:
                        statusTick = 'fas fa-check-circle';
                        break;

                default:
                        statusTick = 'far fa-clock';
        }

        //MESIBO_MSGSTATUS_FAIL is 0x80
        if (status > 127)
            statusTick = 'fas fa-exclamation-circle';

        return statusTick;
};

// If the status value is read type, color it blue. Default color of status icon is gray
let getStatusColor = (status) => {
        var statusColor = "";
        switch (status) {
                case MESIBO_MSGSTATUS_READ:
                        statusColor = "#34b7f1";
                        break;

                default:
                        statusColor = "grey";
        }
        //MESIBO_MSGSTATUS_FAIL is 0x80
        if(status > 127) 
            statusColor = "red";

        return statusColor;
};

let getFileIcon = (f) =>{


    var type = f.filetype;
    if(undefined == type)
        return "";


    var fileIcon = "fas fa-paperclip";
    switch (type) {

            //Image
            case MESIBO_FILETYPE_IMAGE:
                    fileIcon = "fas fa-image";
                    break;

            //Video
            case MESIBO_FILETYPE_VIDEO:
                    fileIcon = "fas fa-video";
                    break;

            //Audio
            case MESIBO_FILETYPE_AUDIO:
                    fileIcon = "fas fa-music";
                    break;

            //Location
            case MESIBO_FILETYPE_LOCATION:
                    fileIcon = "fas fa-map-marker-alt";
    }

    return fileIcon;

}

let getFileType = (f) =>{

    var type = f.filetype;
    if(undefined == type)
        return "";

    var fileType = "Attachment";
    switch (type) {

            //Image
            case MESIBO_FILETYPE_IMAGE:
                    fileType = "Image";
                    break;

            //Video
            case MESIBO_FILETYPE_VIDEO:
                    fileType = "Video";
                    break;

            //Audio
            case MESIBO_FILETYPE_AUDIO:
                    fileType = "Audio";
                    break;

            //Location
            case MESIBO_FILETYPE_LOCATION:
                    fileType = "Location";
    }

    return fileType;

}

let isSentMessage = (status) =>{
        if((status === MESIBO_MSGSTATUS_RECEIVEDREAD) || (status === MESIBO_MSGSTATUS_RECEIVEDNEW))
            return false;
        else
            return true;
};


let imgError = (image) => {
    MesiboLog("imgError");
    image.onerror = "";
    image.src = MESIBO_DEFAULT_PROFILE_IMAGE;
    return true;
};



/**
 * Plays a sound using the HTML5 audio tag. Provide mp3 and ogg files for best browser support.
 * @param {string} filename The name of the file. Omit the ending
 */
function playSound(filename){
	var mp3Source = '<source src="' + filename + '.mp3" type="audio/mpeg">';
	var oggSource = '<source src="' + filename + '.ogg" type="audio/ogg">';
	var embedSource = '<embed hidden="true" autostart="true" loop="false" src="' + filename +'.mp3">';
	document.getElementById("sound").innerHTML='<audio autoplay="autoplay">' + mp3Source + oggSource + embedSource + '</audio>';
}



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

function exitRoomPrompt(){
	MesiboLog('Sure to exit?');
	alert('Sure to exit?');
	MesiboLog(getScope().exitRoom());
	getScope().exitRoom()
}


