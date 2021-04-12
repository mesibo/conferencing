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
 * https://github.com/mesibo/conferencing/tree/master/live-demo/web
 *
 *
 */

/*
 * Using Fabric JS(http://fabricjs.com/) for canvas
 *
 * Using icons from https://www.flaticon.com/
 */

var _appCtx = null;
var _boardCtx = null;


// Can possibly provide different whiteboard configurations to select from
// Greenboard, Whiteboard, Blackboard, etc

//Greenboard
const MESIBO_BOARD_DEFAULT_FG = '#ffffff';
const MESIBO_BOARD_DEFAULT_BG = '#3F704D';
const MESIBO_BOARD_DEFAULT_FILL = '#000000';

//Whiteboard
// const MESIBO_BOARD_DEFAULT_FG = '#000000';
// const DEFULT_BG = '#ffffff';
// const MESIBO_BOARD_DEFAULT_FILL = '#ffffff';

//Blackboard
// const MESIBO_BOARD_DEFAULT_FG = '#ffffff';
// const DEFULT_BG = '#000000';
// const MESIBO_BOARD_DEFAULT_FILL = '#ffffff';

/** Global preferences **/	
var gPref = {	

	"color" : {
		'foreground': MESIBO_BOARD_DEFAULT_FG,
		'background': MESIBO_BOARD_DEFAULT_BG,
		'fill' : MESIBO_BOARD_DEFAULT_FILL   
	},

	"font" : {
		'family': 'Arial',
		'size': 30,
		'format': '',

		'bold': false,
		'italic': false,
		'underline': false,   
	},


	'thickness': {
		'value':  5,
		'max': 25,
		'min': 1,
	},

	'lastSelected': {
		'pencilTools':{},
		'shapeTools':{}
	},

	'currentSelected': null,                

}


/***************************************** SYNC EVENTS ***************************************/

//Sends a group message with object JSON
function syncBoard(o){
	MesiboLog('syncBoard');
	const TYPE_CANVAS_MESSAGE = 7;


	_appCtx.sendJsonMessage(o, TYPE_CANVAS_MESSAGE);       
}

function clearCanvasHandler(_canvas, c){
	MesiboLog('clearCanvasHandler', c);
	if(!_canvas)
		return;

	if(c && c.isClear == 2){
		_appCtx.canvasObjects = [];
		_canvas.clear();
	}
	if(c && c.isClear == 1){
		var objs = _canvas.getObjects();
		for (var i = objs.length - 1; i >= 0; i--) {
			MesiboLog('clearCanvasHandler', objs[i].id.uid, c.uid);
			if(objs[i].id && objs[i].id.uid === c.uid)
				_canvas.remove(objs[i]);
		}
		_canvas.renderAll();
	}
}

function getObjectFromName(ctx, name){
	if(!(ctx && ctx.getObjects))
		return null;  //Invalid canvas ctx

	var ol = ctx.getObjects();

	if(!(ol && ol.length))
		return null; //No existing elements in ctx

	if(!name)
		return null;

	for (var i = ol.length - 1; i >= 0; i--) {
		var o = ol[i];
		if(o){
			const id = ol[i].id;
			if(!id){
				ErrorLog('Error: getObjectFromName', 'Invalid existing id');
				return null;
			}
			const existingName = id.name;
			if(!existingName){
				ErrorLog('Error: getObjectFromName', 'Invalid existing name');
				return null;
			}

			if(existingName === name){
				//Matching object exists
				return ol[i];
			}
		}  
	}

	return null;
}


function scaleToRes(c, obj){
	MesiboLog('scaleToRes', c, obj);
	if(!c)
		return;

	if(!obj)
		return;


	if(!(obj.cWidth && obj.cHeight))
		return;

	const wRatio = c.width / obj.cWidth;
	const hRatio = c.height / obj.cHeight;

	const factor = (wRatio + hRatio)/2;
	MesiboLog('scaleToRes', wRatio, hRatio);

	const scaleX = obj.scaleX;
	const scaleY = obj.scaleY;
	const left = obj.left;
	const top = obj.top;

	const tempScaleX = scaleX * wRatio;
	const tempScaleY = scaleY * hRatio;
	const tempLeft = left * wRatio;
	const tempTop = top * hRatio;

	// const tempScaleX = scaleX * factor;
	// const tempScaleY = scaleY * factor;
	// const tempLeft = left * factor;
	// const tempTop = top * factor;


	obj.scaleX = tempScaleX;
	obj.scaleY = tempScaleY;
	obj.left = tempLeft;
	obj.top = tempTop;

	MesiboLog('scaleToRes', obj);

	obj.setCoords();
}

/*
 * Input:
 * _canvas : Fabric.Canvas Object 
 * objs: Array of objects to be synced to the board
 *
 * Description:
 * Add multiple objs at once to an existing canvas
 * Can also be a single object to be modified, in which case
 * objs array may contain only one element
 */

function Board_OnSync(_canvas, objs){
	MesiboLog('Board_OnSync', objs);
	if(!(objs && objs.length)){
		return;
	}

	if(!_canvas){
		return; 
	}

	if(objs[0].isClear){
		MesiboLog('Clear Canvas');
		clearCanvasHandler(_canvas, objs[0]);
		return;
	}


	fabric.util.enlivenObjects(objs, function(objects) {

		objects.forEach(function(o) {			

			o.set('strokeUniform', true);
			o.set('selectable', false);
			o.set('evented', false);

			scaleToRes(_canvas, o);

			if(gPref.currentSelected == 'Move'){
				o.set({selectable: true, evented: true, hasControls: true});

			}

			if(o.type == 'path' && o.isEraser){
				o.stroke = gPref.color.background;
			} 

			const type = o.type;
			const id = o.id;

			if(!(o && id && type)){
				ErrorLog('Invalid canvas object', o, o.id, o.type);
				return;
			}

			var existing = getObjectFromName(_canvas, id.name);
			if(o.removed){
				if(existing){		    		
					_canvas.remove(existing);
					MesiboLog(existing.id, 'removed..');
				}
				return;
			}

			if(existing){		    	

				MesiboLog(existing.id, 'updated..');

				if(existing.type === 'line'){		    			
					//Replace existing with new line
					o.set('id', existing.id);
					o.set('removed', false);

					o.toJSON = (function(toJSON) {
						return function() {
							return fabric.util.object.extend(toJSON.call(this), {
								id: this.id,
								uid: this.uid,
								isEraser: this.isEraser
							});
						};
					})(o.toJSON);

					existing.set('evented', false);
					existing.set('isReplaced', true);
					_canvas.remove(existing);

					_canvas.add(o);
					_canvas.renderAll();
					return;
				}

				existing.set(o);                
				if(existing.setCoords){
					existing.setCoords();
				}		    	

			}			
			else		   	
				_canvas.add(o);

		});

		_canvas.calcOffset();
		_canvas.renderAll();
	});	
}

function _getId(pUser, pId) {
	var ts = Date.now();

	if(!pId){
		//Creating a new object
		pId = {};	    	    
		pId.uid = _appCtx.user.uid;
		pId.ts = ts;
		pId.name = pId.uid + '-' + ts;
	}

	if(pUser && pUser.uid){
		pId.muid = pUser.uid;    
		pId.mts = ts;
	}



	return pId;
}

function setupSyncEvents(){
	var _canvas = window.canvCtx;


	_canvas.on('object:added', function(options) {
		if (options.target) {

			var obj = options.target;
			MesiboLog('an object was added! ', obj, obj.id);	            

			if(!obj.id){

				// If object created by you, initially id will be undefined
				// Notify other members in the group that you have added an object	            	
				obj.set('uid', _appCtx.user.uid);
				obj.set('id', _getId(_appCtx.user, obj.id));
				obj.set('removed', false);
				obj.set('cWidth', _canvas.width);
				obj.set('cHeight', _canvas.height);				   

				obj.toJSON = (function(toJSON) {
					return function() {
						return fabric.util.object.extend(toJSON.call(this), {
							id: this.id,
							uid: this.uid,
							removed: this.removed,
							cWidth: this.cWidth,
							cHeight: this.cHeight, 
						});
					};
				})(obj.toJSON);

				if(obj.type == 'path'){
					// Pencil handled by path:added event
					// Image handled by uploadFile
					return;
				}

				MesiboLog('=====> new object updated', obj, obj.uid);


				//Object created by local user
				syncBoard(obj);

			}				
		} 

	});

	_canvas.on('object:moving', function(options) {
		if (options.target) {
			var obj = options.target;

			MesiboLog('object moving! ', obj.id.name);

			obj.set('id', _getId(_appCtx.user, obj.id));           

			obj.toJSON = (function(toJSON) {
				return function() {
					return fabric.util.object.extend(toJSON.call(this), {
						id: this.id,
						uid: this.uid,
						removed: this.removed 
					});
				};
			})(obj.toJSON);

			if(obj.syncMoving){
				clearTimeout(obj.syncMoving);
			}

			obj.syncMoving = setTimeout(function(){ 
				syncBoard(obj);
			}, 1000);
		}        

	});

	_canvas.on('object:modfied', function(options) {
		if (options.target) {
			MesiboLog('object modfied! ', options.target.type, options.target.uid);

			if(options.target.uid == _appCtx.user.uid){
				syncBoard(options.target);
			}
		}
	});

	_canvas.on('object:scaling', function(options) {
		if (options.target) {
			MesiboLog('object scaling! ', options.target.type, options.target.uid);


			var obj = options.target;
			obj.set('id', _getId(_appCtx.user, obj.id));
			obj.toJSON = (function(toJSON) {
				return function() {
					return fabric.util.object.extend(toJSON.call(this), {
						id: this.id,
						uid: this.uid,
						removed: this.removed 
					});
				};
			})(obj.toJSON);

			if(obj.syncScaling){
				clearTimeout(obj.syncScaling);
			}

			obj.syncScaling = setTimeout(function(){ 
				syncBoard(obj);
			}, 1000);

		}
	});

	_canvas.on('object:scaled', function(options) {
		if (options.target) {
			MesiboLog('object scaled! ', options.target.type, options.target.uid);

			if(options.target.uid == _appCtx.user.uid){
				syncBoard(options.target);
			}
		}
	});

	_canvas.on('object:removed', function(options) {
		if (options.target) {
			MesiboLog('object removed! ', options.target.type,options.target.id, options.target.uid, options.target.isReplaced);           	

			var obj = options.target;
			if(obj.isReplaced){
				return;
			}


			obj.set('removed', true);
			obj.toJSON = (function(toJSON) {
				return function() {
					return fabric.util.object.extend(toJSON.call(this), {
						id: this.id,
						uid: this.uid,
						removed: this.removed 
					});
				};
			})(obj.toJSON);


			syncBoard(obj);


		}
	});

	_canvas.on('text:editing:exited', function(options){
		MesiboLog('text exited', options.target);
		if(options.target){
			options.target.isEditing = false;
			syncBoard(options.target);
		}
	});

	_canvas.on('text:editing:entered', function(options){
		MesiboLog('text editing', options.target);
		if(options.target){
			options.target.isEditing = true;
			syncBoard(options.target);
		}
	});

	_canvas.on('text:event:changed', function(options){
		MesiboLog('text changed', options.target);

	});

	_canvas.on('text:selection:changed', function(options){
		MesiboLog('text selection changed', options.target);

	});


	_canvas.on('path:created', function(e) {
		MesiboLog('something drawn! ', e.path);

		var obj = e.path;
		//Notify other members in the group that you have added a shape
		obj.set('uid', _appCtx.user.uid);
		obj.set('id', _getId(_appCtx.user, obj.id));
		obj.set('isEraser', gPref.currentSelected == 'Eraser');


		obj.toJSON = (function(toJSON) {
			return function() {
				return fabric.util.object.extend(toJSON.call(this), {
					id: this.id,
					uid: this.uid,
					isEraser: this.isEraser
				});
			};
		})(obj.toJSON);

		if(obj.uid == _appCtx.user.uid){
			syncBoard(obj);
		}

	});

	_canvas.on('before:path:created', function(e) {
		MesiboLog('brush drawing! ', e);
	});


	_canvas.on('mouse:move', function(options) {
		gPref.mouseX = options.pointer.x;
		gPref.mouseY = options.pointer.y;
	});

}

/***************************************** SYNC EVENTS ***************************************/


function addEvent(element, eventType, callback) {
	if (eventType.split(' ').length > 1) {
		var events = eventType.split(' ');
		for (var i = 0; i < events.length; i++) {
			addEvent(element, events[i], callback);
		}
		return;
	}

	if (element.addEventListener) {
		element.addEventListener(eventType, callback, !1);
		return true;
	} else if (element.attachEvent) {
		return element.attachEvent('on' + eventType, callback);
	} else {
		element['on' + eventType] = callback;
	}
	return this;
}

function find(selector) {
	return _boardCtx.getElementById(selector);
}


/** Not being used currently in this version **/
function setCanvasBg(_canvas, imagePath, texturePath){
	if(imagePath){
		var bgImageUrl = imagePath

		_canvas.setBackgroundImage(bgImageUrl, _canvas.renderAll.bind(_canvas), {
			backgroundImageOpacity: 0.5,
			backgroundImageStretch: false,
			width: _canvas.width,
			height: _canvas.height
		});
	}

	else if(texturePath){

		var texture = new Image();
		texture.onload = start;
		texture.src = texturePath;

		function start(){
			var can = find('main-canvas');
			var img = texture;
			var ctx = can.getContext('2d');
			ctx.fillStyle = gPref.color.background;
			ctx.fillRect(0,0, can.width, can.height);
			ctx.globalAlpha= 0.6;
			ctx.drawImage(img,0,0, can.width, can.height);
		}
	}
}

function textEventHandler(event){ 
	var _canvas = window.canvCtx;       
	MesiboLog('TextHandler', event);
	if(event.target == undefined || event.target.type != 'i-text'){ //Clicked on canvas not on text
		var text  = new fabric.IText('', {
			// left: event.e.clientX,
			// top:  event.e.clientY,
			left: gPref.mouseX,
			top:  gPref.mouseY,
			fill: gPref.color.foreground,
			fontFamily: gPref.font.family,
			fontSize: gPref.font.size,
			fontStyle: gPref.font.italic ? 'italic': 'normal',
			fontWeight: gPref.font.bold ? 'bold': 'normal'
		});

		_canvas.add(text);               
		_canvas.setActiveObject(text);

		_canvas.renderAll();

		text.enterEditing()
		text.hiddenTextarea.focus();
	}

	else{ //Clicked on text
		if(event.target.type == 'i-text'){
			var text = _canvas.getActiveObject();
			if(text && text.selectAll){
				text.selectAll();
			}
		}
	}
}



function scribbleEventHandler(event){
	var scribble = event.target;
	if(!scribble)
		return;

	scribble.set({ evented : false })
} 


var Rectangle = (function () {
	function Rectangle(canvas, isFill) {
		var inst = this;
		this.canvas = canvas;
		this.className= 'Rectangle';
		this.isDrawing = false;
		this.origX;
		this.origY;
		this.isFill = isFill;
		this.bindEvents();
	}

	Rectangle.prototype.bindEvents = function() {
		var inst = this;
		inst.canvas.on('mouse:down', function(o) {
			inst.onMouseDown(o);
		});

		inst.canvas.on('mouse:move', function(o) {
			inst.onMouseMove(o);
		});
		inst.canvas.on('mouse:up', function(o) { 
			inst.onMouseUp(o);
		});
		inst.canvas.on('object:moving', function(o) {    
			inst.disable();
		})
	}

	Rectangle.prototype.onMouseUp = function (o) {
		// MesiboLog('onMouseUp');
		var inst = this;
		inst.disable();

		var _canvas = window.canvCtx;
		var finishedRect = _canvas.getActiveObject();
		if(!finishedRect)
			return;
		if(!(finishedRect.width > 1 && finishedRect.height > 1) || ! finishedRect.isMove){
			_canvas.remove(finishedRect);
			return;			
		}

		syncBoard(finishedRect);

	};

	Rectangle.prototype.onMouseMove = function (o) {
		// MesiboLog('onMouseMove');
		var inst = this;


		if(!inst.isEnable()){ return; }

		var pointer = inst.canvas.getPointer(o.e);
		var activeObj = inst.canvas.getActiveObject();
		if(!activeObj){
			ErrorLog('Invalid activeObj');
			return;
		}
		activeObj.stroke =  gPref.color.foreground;
		activeObj.fill = inst.isFill ? gPref.color.fill : 'transparent';
		activeObj.padding = 0;

		activeObj.set('strokeWidth', parseInt(gPref.thickness.value));
		activeObj.set('strokeUniform', true);

		if(inst.origX > pointer.x){
			activeObj.set({ left: Math.abs(pointer.x) }); 
		}
		if(inst.origY > pointer.y){
			activeObj.set({ top: Math.abs(pointer.y) });
		}


		var w = Math.abs(inst.origX - pointer.x);
		var h = Math.abs(inst.origY - pointer.y);

		if (!w || !h) {
			return false;
		}

		activeObj.set({ width: w });
		activeObj.set({ height: h});
		activeObj.set({ isMove: true});

		activeObj.setCoords();
		inst.canvas.renderAll();

	};

	Rectangle.prototype.onMouseDown = function (o) {
		// MesiboLog('onMouseDown');
		var inst = this;
		inst.enable();

		var pointer = inst.canvas.getPointer(o.e);
		inst.origX = pointer.x;
		inst.origY = pointer.y;


		var w = Math.abs(pointer.x - inst.origX);
		var h = Math.abs(pointer.y- inst.origY);

		var rect = new fabric.Rect({
			top: inst.origY,
			left: inst.origX,
			width: 0,
			height: 0,
			originX: 'left',
			originY: 'top',
			padding: 0,
			selectable: false,
			hasControls: false,
			evented: false,
			isMove: false,
		});			



		inst.canvas.add(rect).setActiveObject(rect);
	};

	Rectangle.prototype.isEnable = function(){
		return this.isDrawing;
	}

	Rectangle.prototype.enable = function(){
		this.isDrawing = true;
	}

	Rectangle.prototype.disable = function(){
		this.isDrawing = false;
	}

	return Rectangle;
}());

var Line = (function () {
	function Line(canvas) {
		var inst = this;
		this.canvas = canvas;
		this.className= 'Line';
		this.isDrawing = false;
		this.origX;
		this.origY;
		this.bindEvents();
	}

	Line.prototype.bindEvents = function() {
		var inst = this;
		inst.canvas.on('mouse:down', function(o) { 
			inst.onMouseDown(o);
		});

		inst.canvas.on('mouse:move', function(o) {
			inst.onMouseMove(o);
		});
		inst.canvas.on('mouse:up', function(o) { 
			inst.onMouseUp(o);
		});
		inst.canvas.on('object:moving', function(o) {    
			inst.disable();
		})
	}

	Line.prototype.onMouseUp = function (o) {
		// MesiboLog('onMouseUp');
		var inst = this;
		inst.disable();

		var _canvas = window.canvCtx;
		var finishedLine = _canvas.getActiveObject()
		if(!finishedLine.isMove){
			_canvas.remove(finishedLine);
			return;
		}

		MesiboLog('---finishedLine---', finishedLine);
		syncBoard(finishedLine);

	};

	Line.prototype.onMouseMove = function (o) {
		// MesiboLog('onMouseMove');
		var inst = this;


		if(!inst.isEnable()){ return; }

		var pointer = inst.canvas.getPointer(o.e);
		var activeObj = inst.canvas.getActiveObject();

		activeObj.stroke =  gPref.color.foreground;

		activeObj.set('strokeWidth', parseInt(gPref.thickness.value));
		activeObj.set('strokeUniform', true);

		activeObj.set({ x2: pointer.x});
		activeObj.set({ y2: pointer.y});
		activeObj.set({ isMove: true});


		activeObj.setCoords();
		inst.canvas.renderAll();

	};

	Line.prototype.onMouseDown = function (o) {
		// MesiboLog('onMouseDown');
		var inst = this;
		inst.enable();

		var pointer = inst.canvas.getPointer(o.e);
		inst.origX = pointer.x;
		inst.origY = pointer.y;


		var line = new fabric.Line([inst.origX, inst.origY, inst.origX, inst.origY], {
			top: inst.origY,
			left: inst.origX,
			stroke: gPref.color.foreground,
			hasBorders: false,
			selectable: false,
			hasControls: false,
			evented: false,
			isMove: false,     
		});

		inst.canvas.add(line)
		inst.canvas.setActiveObject(line);
	};

	Line.prototype.isEnable = function(){
		return this.isDrawing;
	}

	Line.prototype.enable = function(){
		this.isDrawing = true;
	}

	Line.prototype.disable = function(){
		this.isDrawing = false;
	}

	return Line;
}());

var Circle = (function() {
	function Circle(canvas, isFill) {
		this.canvas = canvas;
		this.className = 'Circle';
		this.isDrawing = false;
		this.isFill = isFill;
		this.origX;
		this.origY;
		this.bindEvents();
	}

	Circle.prototype.bindEvents = function() {
		var inst = this;
		inst.canvas.on('mouse:down', function(o) {
			inst.onMouseDown(o);
		});
		inst.canvas.on('mouse:move', function(o) {
			inst.onMouseMove(o);
		});
		inst.canvas.on('mouse:up', function(o) {
			inst.onMouseUp(o);
		});
		inst.canvas.on('object:moving', function(o) {
			inst.disable();
		})
	}

	Circle.prototype.onMouseUp = function(o) {
		var inst = this;
		inst.disable();

		var _canvas = window.canvCtx;
		var finishedCircle = _canvas.getActiveObject();
		if(!finishedCircle.isMove){
			_canvas.remove(finishedCircle);
			return;
		}

		syncBoard(finishedCircle);

	};

	Circle.prototype.onMouseMove = function(o) {
		var inst = this;
		if (!inst.isEnable()) {
			return;
		}

		var pointer = inst.canvas.getPointer(o.e);
		var activeObj = inst.canvas.getActiveObject();

		activeObj.stroke = gPref.color.foreground,
			activeObj.fill = inst.isFill ? gPref.color.fill : 'transparent';

		activeObj.set('strokeWidth', parseInt(gPref.thickness.value));
		activeObj.set('strokeUniform', true);

		if (inst.origX > pointer.x) {
			activeObj.set({
				left: Math.abs(pointer.x)
			});
		}

		if (inst.origY > pointer.y) {
			activeObj.set({
				top: Math.abs(pointer.y)
			});
		}

		activeObj.set({
			rx: Math.abs(inst.origX - pointer.x + activeObj.strokeWidth) / 2
		});
		activeObj.set({
			ry: Math.abs(inst.origY - pointer.y + activeObj.strokeWidth) / 2
		});

		activeObj.set({isMove: true});

		activeObj.setCoords();
		inst.canvas.renderAll();
	};

	Circle.prototype.onMouseDown = function(o) {
		var inst = this;
		inst.enable();

		var pointer = inst.canvas.getPointer(o.e);
		inst.origX = pointer.x;
		inst.origY = pointer.y;

		var ellipse = new fabric.Ellipse({
			top: inst.origY,
			left: inst.origX,
			rx: 0,
			ry: 0,
			transparentCorners: false,
			hasBorders: false,
			fill: inst.fill ? gPref.color.fill : 'transparent' ,
			selectable: false,
			hasControls: false,
			evented: false,
			isMove: false,

		});

		inst.canvas.add(ellipse).setActiveObject(ellipse);
	};

	Circle.prototype.isEnable = function() {
		return this.isDrawing;
	}

	Circle.prototype.enable = function() {
		this.isDrawing = true;
	}

	Circle.prototype.disable = function() {
		this.isDrawing = false;
	}

	return Circle;
}());



var FileSelector = function() {
	var selector = this;

	selector.selectSingleFile = selectFile;
	selector.selectMultipleFiles = function(callback) {
		selectFile(callback, true);
	};

	function selectFile(callback, multiple, accept) {
		var file = _boardCtx.createElement('input');
		file.type = 'file';

		if (multiple) {
			file.multiple = true;
		}

		file.accept = accept || 'image/*';

		file.onchange = function() {
			if (multiple) {
				if (!file.files.length) {
					console.error('No file selected.');
					return;
				}
				callback(file.files);
				return;
			}

			if (!file.files[0]) {
				console.error('No file selected.');
				return;
			}

			callback(file.files[0]);

			file.parentNode.removeChild(file);
		};
		file.style.display = 'none';
		(_boardCtx.body || _boardCtx.documentElement).appendChild(file);
		fireClickEvent(file);
	}

	function fireClickEvent(element) {
		var evt = new window.MouseEvent('click', {
			view: window,
			bubbles: true,
			cancelable: true,
			button: 0,
			buttons: 0,
			mozInputSource: 1
		});

		var fired = element.dispatchEvent(evt);
	}
};


function resetMouseEvents(){
	var _canvas = window.canvCtx;
	_canvas.__eventListeners = {};		 
	// Not effecient. 
	// Unset listeners only for a shape.
	// The current shape classes do not unset events after their job is done
}


function setSelection(element, prop) {        	

	var selected = _boardCtx.getElementsByClassName('selected-shape')[0];
	if (selected) selected.className = selected.className.replace(/selected-shape/g, '');


	MesiboLog('====>setSelection', prop, selected);


	gPref.currentSelected = prop;

	switch(prop){

		case 'Pencil':
			find('pencil-icon').className = 'btn selected-shape';
			find('pencil-tool').className = 'btn selected-shape';
			find('rectangle').className = 'btn';
			break;

		case 'Pencil':
		case 'Marker':
		case 'Line':
		case 'Arrow':
		case 'QuadraticCurve':
			find('rectangle').className = 'btn';
			break;

		case 'Rectangle':
			find('rectangle-tool').className = 'btn selected-shape';
			find('rectangle').className = 'btn selected-shape';
			find('pencil-icon').className = 'btn';
			break

		case 'FilledRectangle':
			find('filled-rectangle-tool').className = 'btn selected-shape';
			find('rectangle').className = 'btn selected-shape';
			find('pencil-icon').className = 'btn';
			break

		case 'Arc':
			find('rectangle').className = 'btn selected-shape';                
			break;

		case 'FilledArc':
			find('rectangle').className = 'btn selected-shape';                
			break;

		default:
			find('rectangle').className = 'btn';
			find('pencil-icon').className = 'btn';
			find('eraser-icon').className = 'btn';
			find('text-icon').className = 'btn';

	}


	if (!element.className) {
		element.className = '';
	}

	element.className += ' selected-shape';
}



function setDefaultSelectedIcon(_canvas,toolBox) {
	var canvasElements = toolBox.getElementsByTagName('canvas');

	MesiboLog('---- Pencil ---');
	window.selectedIcon = 'Pencil';
	var firstMatch = find('pencil-icon');
	find('pencil-icon').className += ' selected-shape';
	find('pencil-tool').className += ' selected-shape';

	_canvas.freeDrawingBrush.color = gPref.color.foreground;
	_canvas.freeDrawingBrush.width = parseInt(gPref.thickness.value);


	_canvas.isDrawingMode = true;
	_canvas.freeDrawingCursor = 'url(./drawingboard/images/pen.png) 6 12, crosshair';
	setupSyncEvents(_canvas);             

	setSelection(firstMatch, window.selectedIcon);
}


function enableInteractivity(){
	var _canvas = window.canvCtx;
	var objList = _canvas.getObjects();
	for (var i = 0; i < objList.length; i++) {
		if(objList[i] && objList[i].type !='path'){
			objList[i].set({selectable: true, evented: true, hasControls: true});
			// if(objList[i].setCoords){
			//               objList[i].setCoords();
			//         }
		}

		if(objList[i].type == 'path' && objList[i].isEraser){
			objList[i].stroke = gPref.color.background;
		}
	}

	_canvas.requestRenderAll();     
}

function enableTextInteractivity(){
	MesiboLog('enableTextInteractivity');
	var _canvas = window.canvCtx;
	var objList = _canvas.getObjects();
	for (var i = 0; i < objList.length; i++) {
		if(objList[i] && (objList[i].type =='i-text')){
			objList[i].set({selectable: true, evented: true, hasControls: true});			
		}
	}
}

function disableInteractivity(){
	var _canvas = window.canvCtx;
	var objList = _canvas.getObjects();
	for (var i = 0; i < objList.length; i++) {
		objList[i].set({selectable: false, evented: false});
	}

	_canvas.hoverCursor = "default";
}

async function uploadFile(selected_file, pImg){

	var f = selected_file;
	if(!f)
		return;
	MesiboLog(f.name);

	//Validate file type before proceeding.
	const formData = new FormData();

	formData.append('file', f);

	const options = {
		method: 'POST' ,
		body: formData,

	};

	const MESIBO_UPLOAD_URL = 'https://s3.mesibo.com/api.php';

	const response = await fetch(MESIBO_UPLOAD_URL + '?op=upload&token=' + _appCtx.user.token ,
		options);

	const file_upload_response = await response.json();
	MesiboLog(file_upload_response);
	const file_url = file_upload_response['file'];
	if (!file_url) {
		MesiboLog('Invalid file_url');
		return -1;
	}

	MesiboLog(file_url, f.name);

	fabric.Image.fromURL(file_url, function(pImg) {
		var _canvas = window.canvCtx;
		if(pImg.width > _canvas.width/2)
			pImg.scaleToWidth(_canvas.width/2);

		if(pImg.height > _canvas.height/2)
			pImg.scaleToHeight(_canvas.height/2);

		_canvas.add(pImg); 
	});

}

function on_tool_click(shape, source) {
	resetMouseEvents();
	setupSyncEvents();

	var _canvas = window.canvCtx;

	_canvas.defaultCursor = 'default';
	_canvas.isDrawingMode = false;
	disableInteractivity();

	event = event || window.event;               

	if (shape === 'Text') {
		hideAllOptions();
		showTextOptions();
		_canvas.isDrawingMode = false;
		_canvas.defaultCursor = 'text';

		enableTextInteractivity();

	} 


	MesiboLog('on_tool_click', source, shape);
	setSelection(source, shape);


	if (source.id === 'image-icon') {
		hideAllOptions();
		//Hide everythin else!

		showFileOptions();

		MesiboLog('Add image');
	}

	if(source.id === 'move-icon'){
		hideAllOptions();                    
		enableInteractivity();
		_canvas.hoverCursor = "move";                        
	}

	if(source.id === 'text-icon'){                
		_canvas.on('mouse:down', function(options){

			if(gPref.currentSelected === 'Text'){
				MesiboLog('Adding text..');
				textEventHandler(options);
			}

		});
	}


	if(source.id === 'rectangle' || source.id === 'rectangle-tool' ) {
		hideAllOptions();

		showShapeOptions();

		MesiboLog('shape options');

		_canvas.isDrawingMode = false;

		var flexRect = new Rectangle(_canvas, false);		

		_canvas.defaultCursor = 'crosshair';
		_canvas.hoverCursor = 'crosshair';                     
	}

	if(source.id ===  'filled-rectangle-tool'){   
		var flexRect = new Rectangle(_canvas, true);

		_canvas.defaultCursor = 'crosshair';
		_canvas.hoverCursor = 'crosshair';     
	}

	if(source.id === 'line-tool'){
		var flexLine = new Line(_canvas);
	}

	if(source.id === 'arc-tool'){
		var circle = new Circle(_canvas, false);

		_canvas.defaultCursor = 'crosshair';
		_canvas.hoverCursor = 'crosshair';
	}

	if(source.id === 'filled-arc-tool'){
		var circle = new Circle(_canvas, true);

		_canvas.defaultCursor = 'crosshair';
		_canvas.hoverCursor = 'crosshair';    
	}   

	if (source.id === 'image-icon') {

		var selector = new FileSelector();
		selector.accept = 'image/*';
		selector.selectSingleFile(function(file) {
			if (!file) return;
			uploadFile(file); 					
		});
	}


	if(source.id === 'pencil-icon' || source.id === 'pencil-tool'){
		MesiboLog('You have selected pencil tools!');

		hideAllOptions();
		showPencilOptions();
		_canvas.isDrawingMode = true;
		_canvas.freeDrawingBrush.width =  parseInt(gPref.thickness.value);
		_canvas.freeDrawingBrush.color = gPref.color.foreground;                              
		_canvas.freeDrawingCursor = 'url(./drawingboard/images/pen.png) 8 8, crosshair';				

	}			

	if (source.id === 'eraser-icon') {
		MesiboLog('You have selected eraser!');

		hideAllOptions();
		toggle('line-width', 'inline-block');

		_canvas.isDrawingMode = true;

		var wEraser = parseInt(gPref.thickness.value);
		if(wEraser < 5)
			wEraser = 5;

		_canvas.freeDrawingBrush.width = wEraser;
		_canvas.freeDrawingBrush.color = gPref.color.background; 
		_canvas.freeDrawingCursor = 'url(./drawingboard/images/eraser.png) 8 8, crosshair';              

	}
}

window.on_tool_click = on_tool_click;


function bindToolEvent(context, shape) {        

	// MesiboLog(context, shape);
	addEvent(context, 'click', function() {
		on_tool_click(shape, this);
		MesiboLog(this);
	});
}

function setupMove() {
	var context = find('move-icon');
	bindToolEvent(context, 'Move');            
}		

function setupLine() {
	var context = find('line-tool');

	bindToolEvent(context, 'Line');
}

function setupUndo() {

}

function setupFile(){
	var context = find('image-icon');

	bindToolEvent(context, 'File');
}		


function setupPencil(ele_id) {
	if(!ele_id)
		return;
	var context = find(ele_id);            
	bindToolEvent(context, 'Pencil');
}		


function setupEraser() {
	// MesiboLog('setupEraser');
	var context = find('eraser-icon');
	bindToolEvent(context, 'Eraser');
}


function setupText() {
	var context = find('text-icon');

	bindToolEvent(context, 'Text');
}		

function toggle(eleId, displayState){
	var element =  find(eleId);
	if(!element)
		return;
	element.style.display = displayState;
}

function hideAllOptions(){
	hidePencilOptions();
	hideFileOptions();
	hideShapeOptions();
	hideTextOptions();
}

function hideTextOptions(){
	toggle('font-style-options', 'none');
	toggle('font-size-options', 'none');
	toggle('text-format-options', 'none');
}

function showTextOptions(){
	toggle('font-style-options', 'inline-block');
	toggle('font-size-options', 'inline-block');
	toggle('text-format-options', 'inline-block');
}

function hidePencilOptions(){
	toggle('pencil-tool', 'none');
	// toggle('marker-tool', 'none');
	toggle('line-tool', 'none');
	// toggle('arrow-tool', 'none');
	// toggle('quadratic-curve-tool', 'none');
	toggle('line-width', 'none');
}

function showPencilOptions(){
	toggle('pencil-tool', 'inline-block');
	// toggle('marker-tool', 'inline-block');
	toggle('line-tool', 'inline-block');
	// toggle('arrow-tool', 'inline-block');
	// toggle('quadratic-curve-tool', 'inline-block');
	toggle('line-width', 'inline-block');

	setupPencil('pencil-tool');
	// setupMarker('marker-tool');
	setupLine('line-tool');
	// setupArrow('arrow-tool');
	// setupQuadratic('quadratic-curve-tool');
	setupLineWidth();  
}

function showFileOptions(){

}

function hideFileOptions(){

}

function hideShapeOptions(){
	toggle('rectangle-tool', 'none');
	toggle('arc-tool', 'none');
	toggle('filled-rectangle-tool', 'none');
	toggle('filled-arc-tool', 'none');
	// toggle('line-width', 'none');            
}

function showShapeOptions(){
	toggle('rectangle-tool', 'inline-block');
	toggle('arc-tool', 'inline-block');
	toggle('filled-rectangle-tool', 'inline-block');
	toggle('filled-arc-tool', 'inline-block');


	toggle('line-width', 'inline-block');

	setupRect('rectangle-tool');
	setupArc('arc-tool');
	setupRect('filled-rectangle-tool');
	setupArc('filled-arc-tool');

	setupLineWidth('line-width');
}

function setupImage(ele_id) {
	if(!ele_id)
		return;

	var context = find(ele_id);

	bindToolEvent(context, 'Image');
}    


function setupRect(ele_id) {
	if(!ele_id)
		return;
	var context = find(ele_id);


	if(ele_id == 'rectangle' || ele_id == 'rectangle-tool')
		bindToolEvent(context, 'Rectangle');
	else if(ele_id == 'filled-rectangle-tool')
		bindToolEvent(context, 'FilledRectangle');

}		


function setupArc(ele_id) {
	if(!ele_id)
		return;
	var context = find(ele_id);

	if(ele_id == 'arc-tool')
		bindToolEvent(context, 'Arc');
	else if(ele_id == 'filled-arc-tool')
		bindToolEvent(context, 'FilledArc');

}

function setupLineWidth() {
	var context = find('line-tool');

	var lineWidthContainer = find('line-width-container');
	var lineWidthText = find('line-width-text');

	lineWidthText.value = gPref.thickness.value;
	lineWidthText.max = gPref.thickness.max;
	lineWidthText.min = gPref.thickness.min;

	addEvent(lineWidthText, 'input', function() {
		gPref.thickness.value =  parseInt(lineWidthText.value);
		var _canvas = window.canvCtx;
		_canvas.freeDrawingBrush.width = parseInt(gPref.thickness.value);
		_appCtx.saveBoardPref();  
	});
}


function setGlobalColors(){
	MesiboLog('setGlobalColors', gPref);
	var _canvas = window.canvCtx;

	var colorFg = find('foreground-color-input');
	colorFg.value = gPref.color.foreground;

	addEvent(colorFg, 'input', function() {
		gPref.color.foreground = colorFg.value;

		if(gPref.currentSelected != 'Eraser'){
			_canvas.freeDrawingBrush.color = gPref.color.foreground;
		}

		_appCtx.saveBoardPref();
	});


	var colorFill = find('fill-color-input');
	colorFill.value = gPref.color.fill;
	MesiboLog('Set default fill color',colorFill, colorFill.value, gPref.color.fill);

	addEvent(colorFill, 'input', function() {
		gPref.color.fill = colorFill.value; 
		_appCtx.saveBoardPref();           
	});

	var colorBg = find('background-color-input');
	colorBg.value = gPref.color.background;
	_canvas.backgroundColor = gPref.color.background;

	addEvent(colorBg, 'input', function() {
		if(colorBg.value == gPref.color.background)
			return; //No change

		gPref.color.background = colorBg.value;
		_appCtx.saveBoardPref();

		if(gPref.currentSelected == 'Eraser'){		    		
			_canvas.freeDrawingBrush.color = colorBg.value;			
		}

		_canvas.backgroundColor = gPref.color.background;

		//Set all eraser paths to updated bg color
		var objList = _canvas.getObjects();
		for (var i = objList.length - 1; i >= 0; i--) {
			// MesiboLog(objList[i]);
			if(objList[i].type == 'path' && objList[i].isEraser){
				MesiboLog('Eraser path');
				objList[i].stroke = gPref.color.background;
				objList[i].set('dirty', true);
			}
		}

		_canvas.requestRenderAll();

	});
}


function setCanvasControls(){
	var clearCanvas = find('clear-canvas');

	addEvent(clearCanvas, 'click', function() {
		$('#clearCanvasPrompt').modal('show');
	});
}


function setTextFormat(){

	var textSize = find('font-size-options');
	textSize.value = gPref.font.size;            
	addEvent(textSize, 'change', function() {            
		gPref.font.size =  textSize.value;               
	});

	var textFontStyle = find('font-style-options'); 
	textFontStyle.value = gPref.font.family;           
	addEvent(textFontStyle, 'change', function() {
		gPref.font.family = textFontStyle.value;
		MesiboLog(gPref.font.family);                
	});

	var toggleBold = find('text-bold-option');

	addEvent(toggleBold, 'click', function() {  
		gPref.font.bold = !gPref.font.bold;

		if(gPref.font.bold){
			gPref.font.format = "bold "+ gPref.font.format;
			toggleBold.className = 'btn selected-shape';

		}
		else {
			gPref.font.format = gPref.font.format.replace('bold ', '');
			toggleBold.className = 'btn';
		}
		MesiboLog(gPref.font.format);

	});

	var toggleItalic = find('text-italic-option');
	addEvent(toggleItalic, 'click', function() {
		gPref.font.italic = !gPref.font.italic;

		MesiboLog(gPref.font.italic);

		if(gPref.font.italic){
			gPref.font.format = "italic "+ gPref.font.format;
			toggleItalic.className = 'btn selected-shape';
		}
		else {
			gPref.font.format= gPref.font.format.replace('italic ', '');
			toggleItalic.className = 'btn';
		}
		MesiboLog(gPref.font.format);
	});

}


function setupTools(){
	setTextFormat();
	setCanvasControls();
	setGlobalColors();

	hideAllOptions();		
	setupPencil('pencil-icon');
	showPencilOptions();

	setupRect('rectangle');
	setupText();
	setupEraser();
	setupFile();
	setupMove();
}

function setupCustomSlider(){
	// Get the current width of the slider
	var sliderWidth = $('[type=range]').width();

	// Remove previously created style elements
	$('.custom-style-element-related-to-range').remove();

	// Add our updated styling
	$('<style class="custom-style-element-related-to-range">input[type="range"]::-webkit-slider-thumb { box-shadow: -' + sliderWidth + 'px 0 0 ' + sliderWidth + 'px;}<style/>').appendTo('head');

}



function onkeydown(e) {
	var keycode = e.which;
	var _canvas = window.canvCtx;

	if(_canvas.getActiveObject() && _canvas.getActiveObject().type == 'i-text'){
		var obj = _canvas.getActiveObject();			

		if(!obj.isEditing){
			if(keycode == 46 || keycode == 8){	
				_canvas.remove(obj);
				_canvas.renderAll();
				return;
			}
		}

		MesiboLog('text being entered! ', obj.id.name, obj.text);

		obj.set('id', _getId(_appCtx.user, obj.id));
		obj.toJSON = (function(toJSON) {
			return function() {
				return fabric.util.object.extend(toJSON.call(this), {
					id: this.id,
					uid: this.uid,
					removed: this.removed 
				});
			};
		})(obj.toJSON);

		if(obj.syncText)
			clearTimeout(obj.syncText);

		obj.syncText = setTimeout(function(){ 
			syncBoard(obj);
		}, 500);


		return; 
	}

	if(keycode == 46 || keycode == 8){	

		var active = _canvas.getActiveObject();
		_canvas.remove(active);

	}

	//If you hit the “D” key it sets Black to the foreground color and White to the fill color.
	if(keycode == 68){
		//Pressed D

		if(gPref.currentSelected === 'Text')
			return; //TextHandler 

		var colorFg = find('foreground-color-input');
		colorFg.value = MESIBO_BOARD_DEFAULT_FG;

		gPref.color.foreground = colorFg.value;

		if(gPref.currentSelected != 'Eraser'){
			_canvas.freeDrawingBrush.color = gPref.color.foreground; 
		}		

		var colorFill = find('fill-color-input');
		colorFill.value = MESIBO_BOARD_DEFAULT_FILL;

		gPref.color.fill = colorFill.value;

		_appCtx.saveBoardPref();
	}


	//Hitting the “X” key will swap the foreground and fill color.

	if(keycode == 88){
		//Pressed X


		if(gPref.currentSelected === 'Text')
			return; //TextHandler 

		var colorFg = find('foreground-color-input');
		colorFg.value = gPref.color.fill;

		var prevFg = gPref.color.foreground;
		gPref.color.foreground = colorFg.value;
		_canvas.freeDrawingBrush.color = gPref.color.foreground; 
		//What if it's in eraser mode? 

		var colorFill = find('fill-color-input');
		colorFill.value = prevFg;

		gPref.color.fill = colorFill.value;
	}

}

function initPreferences(sPref, sId){
	MesiboLog('initPreferences', sPref, sId);
	if(!(sPref && sId)){
		return;
	}

	var storedPref = localStorage.getItem(sId);
	MesiboLog(storedPref);
	if(storedPref){
		try {
			storedPref = JSON.parse(storedPref);
			if(storedPref){
				gPref = storedPref;
			}
		}
		catch(e){
			ErrorLog('Error: initPreferences', 'Error parsing stored preferences', sPref, sId);
		}
	} //No preferences stored
}

//To be called only once
function initCanvas(appContext, boardContext, bWidth, bHeight){
	MesiboLog('===>initCanvas',appContext, boardContext, bWidth, bHeight);
	if(!(appContext && boardContext))
		return;

	if(appContext._canvas)
		return;

	initPreferences(gPref, 'mesibo_local_board_pref');

	MesiboLog('Initalizing board with --', appContext);
	_appCtx = appContext;
	_boardCtx = boardContext;

	var _canvas = new fabric.Canvas(find('main-canvas'), {
		isDrawingMode: false,
		width: bWidth,
		height: bHeight,
		selection :false, /** Disable Group selection fo now **/
	});

	find('main-canvas').style.backgroundColor = gPref.color.background;

	window.canvCtx = _canvas;

	console.log('Setup Canvas',_canvas);		


	var toolBox = find('tool-box');
	MesiboLog('toolBox', toolBox);
	toolBox.style.height = (bHeight - 40) + 'px'; 

	setDefaultSelectedIcon(_canvas, toolBox);		
	setupTools();
	setupCustomSlider();
	addEvent(_boardCtx, 'keydown', onkeydown);

	var initObjs = _appCtx.canvasObjects;

	if(initObjs){
		for(var i=0; i < initObjs.length; i++){			

			try {
				initObjs[i]= JSON.parse(initObjs[i]);				
			}
			catch(err) {
				MesiboLog('Error initializing canvas', err, initObjs[i]);
			}			
		}

		Board_OnSync(_canvas, initObjs);
	} 



	return _canvas;	
}

function saveDrawing(){
	var gh = window.canvCtx.toDataURL({
		format: 'png',
		quality: 0.8
	});

	var a  = document.createElement('a');
	a.href = gh;	    

	var d = new Date();
	var ts = d.getTime();
	a.download = 'drawing-'+ ts +'.png';

	a.click();
}




