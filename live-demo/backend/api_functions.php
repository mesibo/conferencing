<?php
include_once("httpheaders.php");
include_once ("consts.php");
include_once ("mysqldb.php");
include_once ("utility.php");
include_once ('mesibohelper.php');
include_once ("json.php");
include_once ("image.php");
include_once ("captcha.php");

define("FILES_FOLDER", "../samplefiles");
define("FILES_TN_FOLDER", "../samplefiles/tn");

$apiurl = "http://127.0.0.1/mesibo/api.php";
$downloadurl = 'https://appimages.mesibo.com/';

function get_uid_from_token($token) {
	return GetValueFromDB("select uid from tokens where token='$token' limit 1", 'uid');
}

function get_addr_from_token($token) {
	return GetValueFromDB("select email from users, tokens where token='$token' and tokens.uid=users.uid limit 1", 'email');
}

function get_user_from_token($token) {
	return GetRowFromDB("select * from users, tokens where token='$token' and tokens.uid=users.uid limit 1");
}

function login_callbackapi($user, &$result) {
	global $captcha_secret;
	$email = strtolower(GetRequestField('email', ''));
	$name = GetRequestField('name', '');
	$code = GetRequestField('code', '');
	$captcha = GetRequestField('captcha', '');
	$appid = strtolower(GetRequestField('appid', 'javascript'));
	$dt = GetRequestField('dt', 0);
	$fixedcode = 0;

	if($captcha_secret != '' && $code == '' && $captcha == '') {
		$result['error'] = 'MISSINGCAPTCHA';
		return false;
	}

	if($email == '') {
		$result['error'] = 'MISSINGEMAIL';
		return false;
	}
	if($appid == '') {
		$result['error'] = 'MISSINGAPPID';
		return false;
	}
	if($name == '') {
		$result['error'] = 'MISSINGNAME';
		return false;
	}
	
	if($captcha_secret != '' && $captcha != '' && recapcha3($captcha, 0) < 7) {
		$result['error'] = 'BADCAPTCHA';
		return false;
	}

	include_once ("activation.php");
	if($code == '') {
		return activation_start($email, $code);
	}

	if(!activation_verify($email, $code)) {
		$result['error'] = 'BADCODE';
		return false;
	}

	/* We are generating a random address from email so that user email is not visible 
	 * to anyone in the group. You can remove this and set it as 
	 * address = email
	 * if your setup is private
	 */
	$address = sha1($email);

	$response = MesiboAddUser($name, $address, $appid, 0, 365*24*60, 0, 0);
	if(!$response || !$response['result']) {
		//print_r($response);
		$result['error'] = 'BADUSER';
		return false;
	}


	$newuser = 0;
	$ts = time(); 
	$token = $response['user']['token'];
	$uid = $response['user']['uid'];
	$result['token'] = $token;

	$newuser = SetQueryDB("insert into users set uid=$uid, address='$address', email='$email', name='$name', ts=$ts on duplicate key update uid=$uid, ts=$ts");
	
	$user = GetRowFromDB("select uid, name, address, ts from users where uid='$uid' limit 1");
	SetQueryDB("insert into tokens set uid='$uid', token='$token' on duplicate key update token='$token'");

	$result['name'] = $user['name'];
	$result['address'] = $user['address'];
	$result['uid'] = $uid;
	return true; 
}

function logout_callbackapi($user, &$result) {
	$uid = $user['uid'];
	QueryDB("delete from tokens where uid=$uid");
	return true;
}

function upload_callbackapi($user, &$result) {
	global $downloadurl;
	$profile = GetRequestField('profile', 0);
	$gid = GetRequestField('gid', 0);
	$delete = GetRequestField('delete', 0);

	$uid = $user['uid'];
	$email = $user['email'];

	$filename = '';

	if(0 == $delete) {
		$filename = get_uploaded_file();
		if(!$filename) {
			$result['error'] = 'MISSINGFILE';
			return false;
		}

		if($profile) {
			$srcfile = FILES_FOLDER."/$filename";
			$destfile = FILES_TN_FOLDER."/$filename";
			if(!image_convert($srcfile, '', $destfile, 100, 100, 50)) {
				$result['error'] = 'BADIMAGE';
				return false;
			}
		}
	}

	$ts = time();
	$result['email'] = "";
	$result['gid'] = 0;
	$result['profile'] = $profile;

	$fileurl = $downloadurl.$filename;

	$result['file'] = $fileurl; // file field is need for file upload
	return true;
}

function load_thumbnail(&$c) {
	if($c['photo'] != '') {
		$tnfile = FILES_TN_FOLDER."/".basename($c['photo']);
		if(file_exists($tnfile)) {
			$tn = file_get_contents($tnfile);
			if($tn)
				$c['tn'] = base64_encode($tn);
		}
	}
}

function get_group($gid) {
	return GetRowFromDB("select name, uid, pin, spin, type from groupstable where gid='$gid' limit 1;");
}

function setgroup_callbackapi($user, &$result) {
	//$name = GetRequestField('name', '');
	$gid = GetRequestField('gid', 0);
	$type = GetRequestField('type', 0);
	$name = GetRequestField('name', '');
	$pin = GetRequestField('pin', '');
	$spin = GetRequestField('spin', '');
	$resolution = GetRequestField('resolution', 0);
	$delete = GetRequestField('delete', 0);
	$captcha = GetRequestField('captcha', '');

	$uid = $user['uid'];
	$ts = time();

	$members = $user['address'];
	if($gid > 0) {
		$group = get_group($gid);
		if(null == $group || $uid == $group['uid']) {
			$result['error'] = 'BADGROUP';
			return false;
		}

		if($name == '')
			$name = $group['name'];
		
		$members = ''; //setgroup will overwrite
	}

	$flag = 0;
	$sflags = -1;
	$pin = 0;
	$spin = 0;
	if(0 == $gid) {
		$roomcount = GetValueFromDB("select count(uid) c from groupstable where uid=$uid", 'c');
		if(0 && $roomcount >= 5) {
			$result['error'] = $error;
			return false;
		}

		$sflags = $resolution << 24 | 263 | 32768;
		$pin = rand(100, 999).rand(111, 999).rand(10, 99);
		do {
			$spin = rand(100, 999).rand(111, 999).rand(10, 99);
		} while($pin == $spin);
	}

	$response = MesiboSetGroup($gid, $name, $flag, $sflags, $members, 0);
	if(!$response || !$response['result']) {
		$result['error'] = $response['error'];
		return false;
	}


	$gid = $response['group']['gid'];

	$rv = SetQueryDB("insert into groupstable set gid=$gid, uid=$uid, pin='$pin', spin='$spin', type='$type', name='$name', ts=$ts on duplicate key update type=$type, name='$name', ts=$ts");
	SetQueryDB("insert into members set gid=$gid, uid=$uid, pin='$pin', ts=unix_timestamp() on duplicate key update pin=values(pin), ts=unix_timestamp()");

	$result['gid'] = $gid;
	$result['name'] = $name;
	$result['type'] = $type;
	$result['resolution'] = $resolution;
	$result['publish'] = 1;
	$result['pin'] = $pin;
	$result['spin'] = $spin;
	return true;
}

function delgroup_callbackapi($user, &$result) {
	$gid = GetRequestField('gid', 0);
	if(0 == $gid) {
		$result['error'] = 'MISSINGPARA';
		return false;
	}

	$uid = $user['uid'];
	$ts = time();
	$result['gid'] = $gid;

	$group = get_group($gid, $email);
	if(null == $group || $group['uid'] != $uid) {
		$result['error'] = 'BADGROUP';
		return false;
	}

	SetQueryDB("delete from groupstable where gid=$gid");

	$response = MesiboDeleteGroup($gid);
	if(!$response || !$response['result']) {
		$result['error'] = $response['error'];
		return false;
	}
	return true;
}

function joingroup_callbackapi($user, &$result) {
	$gid = GetRequestField('gid', 0);
	$pin = GetRequestField('pin', '');

	if(0 == $gid) {
		$result['error'] = 'MISSINGPARA';
		return false;
	}

	$uid = $user['uid'];
	$email = $user['email'];

	$group = get_group($gid);
	if(null == $group) {
		$result['error'] = 'BADGROUP';
		return false;
	}
	
	if($pin != $group['pin'] && $pin != $group['spin'] && $uid != $group['uid']) {
		$result['error'] = 'BADGROUP';
		return false;
	}
	
	$publish = 1;
	
	/* we are checking 'spin' instead of 'pin' since the owner can enter with any pin. 
	 * Owner can enter 'spin' to enter in subscribe only mode
	 */
	if($pin == $group['spin'])
		$publish = 0;

	MesiboEditMembers($gid, $user['address'], 0, $publish);
	
	SetQueryDB("insert into members set gid=$gid, uid=$uid, pin='$pin', ts=unix_timestamp() on duplicate key update pin=values(pin), ts=unix_timestamp()");

	$result['gid'] = $gid;
	$result['name'] = $group['name'];
	$result['type'] = $group['type'];
	$result['publish'] = $publish;
	if($uid == $group['uid']) {
		$result['pin'] = $group['pin'];
		$result['spin'] = $group['spin'];
	}

	return true;
}

function rooms_callbackapi($user, &$result) {
	$uid = $user['uid'];

	GetRowsFromDB("select g.uid, g.gid, name, if(m.uid=g.uid, g.pin, m.pin) pin, if(m.uid=g.uid, g.spin, '') spin from groupstable g, members m where m.uid=$uid and m.pin != '' and m.gid=g.gid order by m.ts desc",  $result, null, $key='rooms', $keycount='count');
	return true;
}

function RestoreText($text) {
	$text = str_replace('\r', "\r", $text);
	$text = str_replace('\n', "\n", $text);
	return $text;
}

function DoExit($result, $data) {
	$data['result'] = "FAIL";

	if($result) {
		$data['result'] = "OK";
	}

	$jsondata = safe_json_encode($data);
	// This header will cause issue when error message is printed and error text length > content lenght
	//header("Content-length: " . strlen($jsondata));
	print $jsondata;
	flush();
	exit;
}

function OnEmptyExit($var, $code) {
	if($var == '') {
		$result = array();
		$result['code'] = $code;
		DoExit(false, $result);
	}
}

function webapi_getrecords($query, &$user, $callbackfn, $key='records', $keycount='reccount') {
	$result = NULL;
	if($query != '')
		$result = QueryDB($query);

	if(NULL == $result) {
		if($keycount != '')
			$user[$keycount] = 0; // zero records

		$user[$key] = array(); //empty array so that we don't need to check class of data when json decoded
		return false;
	}

	$num_rows = mysql_num_rows($result);
	if($keycount != '')
		$user[$keycount] = $num_rows;

	$i = 0;
	while ($row = mysql_fetch_assoc($result)) {
		if($callbackfn != '' && $callbackfn != null)
			$callbackfn($i, $row);

		$user[$key][$i] = $row;
		$i++;
	}

	mysql_free_result($result);
	return true;
}

