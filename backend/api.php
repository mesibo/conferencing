<?php
	include_once("httpheaders.php");
	include_once ("consts.php");
	include_once ("mysqldb.php");
	//include_once ('users.php');


	include_once ('api_functions.php');

	ConnectToDB();
	if(1) {
		LogRequest("/webdata/mesibo/conf/logs-".date("m-Y").".txt");  
	}

	$op=GetRequestField('op', '');
	$json=GetRequestField('json', 1);
	$token = GetRequestField('token', '');
	OnEmptyExit($op, 'NOOP');
	$result = array();
	$result['op'] = $op;

	$user = null;
	if($op != 'login') {
		if(strlen($token) > 16)
			$user = get_user_from_token($token);

		if(!$user) {
			if($op == 'logout') {
				DoExit(true, $result);
			}
			$result['error'] = 'AUTHFAIL';
			DoExit(false, $result);
		}
		$user['token'] = $token;
	}

	$op = strtolower($op);
	$apifuncname = $op."_callbackapi";
	if(!function_exists($apifuncname)) {
		$apifuncname = "$op"."_callbackapi";
		if(!function_exists($apifuncname)) {
			$result['error'] = 'BADOP';
			DoExit(false, $result);
		}
	}

	$result['op'] = $op;
	$result['ts'] = time(); //always send time so that client know the time diff
	$res = $apifuncname($user, $result);

	//for login, we will add it from inside
	if($res === true && $token != '') {
	}
	DoExit($res, $result);

