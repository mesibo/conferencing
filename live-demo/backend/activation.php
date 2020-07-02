<?
function activation_data($email) {
	return GetRowFromDB("select code, timestampdiff(minute, ts, current_timestamp) elapsed, attempts from activation where  email='$email' limit 1;");
}

function activation_start($email, $testcode='') {

	//TBD, if email is blocked, return false
	$code = '';

	if($testcode == '') {
		$data = activation_data($email);

		if($data) {
			$code = $data['code'];
			if($data['elapsed'] > 1) {
				$code = '';
			}
		} 
	}

	if($code == '') {
		$codelen = 6;
		$code = rand(100, 999).rand(111, 999);
		if($testcode != '') 
			$code = $testcode; //just for testing without sms

		QueryDB("insert into activation (code, email, attempts, ts) values ('$code', '$email', 0, current_timestamp) on duplicate key update code='$code', email='$email', ts=current_timestamp;");
		//send code
		if($testcode == '') {
			mail($email, "Mesibo Live Demo OTP", "Your OTP is $code");
		}
	}

	return true;
}

function activation_verify($email, $code) {

	$data = activation_data($email);
	if(!$data) 
		return false;

	if($data['code'] == $code) {
		QueryDB("delete from activation where email='$email'");
		return true;
	}

	if($data['attempts'] >= 5) {
		QueryDB("delete from activation where email='$email'");
		return false;
	}

	QueryDB("update activation set attempts=attempts+1 where email='$email'");
	return false;
}

