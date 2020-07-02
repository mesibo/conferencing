<?php

function recapcha3($token, $remoteip) {
	global $captcha_secret;
	$post = http_build_query(
		array (
			'response' => $token,
			'secret' => $captcha_secret,
			'remoteip' => $remoteip
		)
	);
	$opts = array('http' =>
		array (
			'method' => 'POST',
			'header' => 'application/x-www-form-urlencoded',
			'content' => $post
		)
	);
	$ch = curl_init();
	curl_setopt($ch, CURLOPT_URL, "https://www.google.com/recaptcha/api/siteverify");
	curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, FALSE);  
	curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, 2);
	curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 10);
	curl_setopt($ch, CURLOPT_TIMEOUT, 20);
	curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);

	curl_setopt($ch, CURLOPT_POST, 1);
	curl_setopt($ch, CURLOPT_POSTFIELDS, $post);
	curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
	$response = curl_exec($ch);
	$errno    = curl_errno($ch);
	curl_close ($ch);

	$result = json_decode($response, true);
	if(!$result['success']) {
		return 0;
	}
	return $result['score']*10;
}

