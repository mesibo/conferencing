<?php
	ini_set('default_charset', 'UTF-8');
	include_once ('config.php');
	include_once ("errorhandler.php");

	if(function_exists('date_default_timezone_set')) {
		date_default_timezone_set('America/Chicago');
	}
	
function sqlTrimIt($value) {
	return mysql_real_escape_string(trim($value));
}

function GetRequestField($field, $defaultval="") {
	$val = $defaultval;

	if(isset($_REQUEST[$field])) {
		$val = mysql_real_escape_string(trim($_REQUEST[$field]));
	}

	return $val;
}

function GetRequestFieldEx($field1, $field2, $defaultval="") {
	$val = $defaultval;

	if(isset($_REQUEST[$field1])) {
		return mysql_real_escape_string(trim($_REQUEST[$field1]));
	}

	if(isset($_REQUEST[$field2])) {
		return mysql_real_escape_string(trim($_REQUEST[$field2]));
	}

	return $val;
}

function GetIPAddress() {

	if(isset($_SERVER['X-Forwarded-For'])) {
		$ip = $_SERVER['X-Forwarded-For'];
	}
	else if(isset($_SERVER['HTTP_X_FORWARDED_FOR'])) {
		$ip = $_SERVER['HTTP_X_FORWARDED_FOR'];
	}
	else 
		$ip = $_SERVER['REMOTE_ADDR'];

	$ip = htmlspecialchars($ip); 
	if (strpos($ip, '::') === 0) { 
		$ip = substr($ip, strrpos($ip, ':')+1); 
	} 
	//$ipaddr = ip2long($ip); 
	// since ip2long can be negative (see php manual), we use sprintf to get unsigned value
	$ipaddr = sprintf('%u', ip2long($ip));
	return $ipaddr;
}

function GetIPStr() {
	if(isset($_SERVER['X-Forwarded-For'])) {
		$ip = $_SERVER['X-Forwarded-For'];
	}
	else if(isset($_SERVER['HTTP_X_FORWARDED_FOR'])) {
		$ip = $_SERVER['HTTP_X_FORWARDED_FOR'];
	}
	else 
		$ip = $_SERVER['REMOTE_ADDR'];

	$ip = htmlspecialchars($ip); 

	if (strpos($ip, '::') === 0) { 
		$ip = substr($ip, strrpos($ip, ':')+1); 
	}
	return $ip; 
}

function GetEmailDomain($email, &$domain) {
	$domain = '';
	if(preg_match('/^\w[-.\w]*@(\w[-._\w]*\.[a-zA-Z]{2,}.*)$/', $email, $matches))
	{
		$domain = $matches[1];
		return true;
	}
	return false;
}

function curl_get($url) {
	$ch = curl_init();
	curl_setopt($ch, CURLOPT_URL, $url);
	curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, FALSE);  
	curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, 2);
	curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 10);
	curl_setopt($ch, CURLOPT_TIMEOUT, 20);
	//curl_setopt($ch, CURLOPT_POST, 1);
	//curl_setopt($ch, CURLOPT_POSTFIELDS, $data);
	curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
	$response = curl_exec($ch);
	$errno    = curl_errno($ch);
	curl_close ($ch);

	if($errno != 0)
		return false;

	return $response;
}

function GlobalLogFileName() {
	return "/webdata/mesibo/conf/logs-".date("m-Y").".txt";  
}

function LogError($errstr) {
	$file = fopen(GlobalLogFileName(), "a+");  
	fwrite($file, "$errstr\n");
	fclose($file); 
}

function LogRequest($filename, $sizelimit=0) {
	//$currtime = strftime('%b %d,%Y %r');
	$currtime = strftime('%d%m%Y%H%M%S');
	$ipaddr =  $_SERVER["REMOTE_ADDR"];
	$clientip = $ipaddr;
	if(isset($_SERVER['HTTP_X_FORWARDED_FOR'])) {
		$clientip = $_SERVER['HTTP_X_FORWARDED_FOR'];
	}
	$filemode = "a+";
	if($sizelimit > 0 ) {
		$fsize = filesize($filename);
		if($fsize > $sizelimit) {
			$filemode = "w+";  
		}
	}
	@$file = fopen($filename, "a+");  
	if(false == $file)
		return;
	fwrite($file, "#$currtime: IP - $ipaddr , Client IP - $clientip, ");
	foreach ( $_REQUEST as $key => $value) {
		$value = trim($value);
		fwrite($file, "$key - $value , ");
	}
	fwrite($file, "\n");
	fclose($file); 
}

