// config.js

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
 *
 */
const MESIBO_APP_ID = 'live';

/* If you are hosting Mesibo backend on your own server, change this accordingly.
 * Refer https://github.com/mesibo/conferencing/tree/master/live-demo/backend 
 */
const MESIBO_API_BACKEND = 'https://app.mesibo.com/conf/api.php';

/* If you are hosting Mesibo backend on your own server, 
 * use your own captcha token 
 */
const MESIBO_CAPTCHA_TOKEN = '6LceR_sUAAAAAEfV7LZK2cOaOHRzPSCNEK-_jcfU';

/* File url sources */
var MESIBO_DOWNLOAD_URL = 'https://appimages.mesibo.com/';
var MESIBO_UPLOAD_URL = 'https://s3.mesibo.com/api.php';


/* Debug Mode Configuration */
isDebug = true;// toggle this to turn on / off for global control
if (isDebug) var MesiboLog = console.log.bind(window.console);
else var MesiboLog = function() {};

var ErrorLog = console.log.bind(window.console);
/*ErrorLog(function_name, error_msg)*/

const RESULT_FAIL = -1;
const RESULT_SUCCESS = 0;

