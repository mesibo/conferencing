<?php 

function randomstring ($length=8, $useupper=1, $usenumbers=1, $usespecial=0) {
	$charset = "abcdefghijklmnopqrstuvwxyz";
	if ($useupper) $charset .= "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
	if ($usenumbers) $charset .= "0123456789";
	if ($usespecial) $charset .= "~@#$%^*()_+-={}|]["; // Note: using all special characters this reads: "~!@#$%^&*()_+`-={}|\\]?[\":;'><,./";
	$key = '';
	$clen = strlen($charset);
	for ($i=0; $i<$length; $i++) 
		$key .= $charset[(mt_rand(0,$clen-1))];
	return $key;
}

function GeneratePassword($passlen = 8, $usenumbers=1, $useupper=0) {

	$charset = "abcdefghijklmnopqrstuvwxyz";
	if ($usenumbers) $charset .= "0123456789";
	if ($useupper) $charset .= "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

	$password = "";
	$possible  = $charset.sha1(date("r").rand()."lajdsjkldjald".time());
	$plen = strlen($possible)-1;

	// password length is 8
	$i = 0;
	while ($i < $passlen) { 
		// pick a random character from the possible ones
		// 39 because sha1 returns 40 byte string
		$char = substr($possible, mt_rand(0, $plen),1);
		$password .= $char;
		$i++;
	}


	return $password;
}

	
function check_empty_fields($req_fields) { 

//	print "$req_fields[0], $req_fields[1], $req_fields[2]";
// do not use empty() here
	//print_r($_POST);
    $data_array = $_POST; 

    foreach ($req_fields as $key) { 
		if(!isset($data_array[$key]) || ($trimmedtext = trim($data_array[$key])=="")) {
			print "<br>Empty $key";
			return true;
		}
		$data_array[$key] = $trimmedtext;
    } 
	
	return false;
} 

//
function StripAllSlashes(&$inarray) {

	return;
	foreach($inarray as $key => $value) {
		$inarray[$key] = preg_replace('/\r\n|\r/', "\n", $value);
		$value = stripslashes($value);
		//
	}

}

// Quote variable to make safe
function quote_smart($value)
{
   $value = preg_replace('/\r\n|\r/', "\n", $value);
   // Stripslashes
   if (get_magic_quotes_gpc()) {
       $value = stripslashes($value);
   }
   // Quote if not integer
   if (!is_numeric($value)) {
       $value = "'" . mysql_real_escape_string($value) . "'";
   }
   return $value;
}

// Pending, mysql_real_escape_string is not working as expected,


function GenerateSetQuery($fields, $data_array, $insert_or_update, $tablename, &$setquery, $prefix='') { 
	if($insert_or_update == 0 ) {
		$setquery = "INSERT INTO ".$tablename." SET ";
	} else if($insert_or_update == 2) {
		$setquery = "ON DUPLICATE KEY UPDATE ";
	} else {
		$setquery = "UPDATE ".$tablename." SET ";
	}
	
	$len = count($fields);
	$i = 0;
    foreach ($fields as $key) { 
		$i++;
		
		//trim(stripslashes(strip_tags($data_array[$key])));
		// quote_smart
		//$setquery = $setquery.$prefix.$key."=\"".quote_smart(trim($data_array[$key]))."\"";
		//print "<br>$key=".$data_array[$key];
		//$setquery = $setquery.$prefix.$key."=".quote_smart(trim($data_array[$key]));
		$setquery = $setquery.$prefix.$key."='".trim($data_array[$key]). "'";
		if($i < $len) {
			$setquery = $setquery.", ";
		}
    } 

	return true;
} 

function GetTableDefaultValues($table, &$TableValue) {
	
		global $db_userstable;
		
		$result = mysql_query("SHOW COLUMNS FROM $table") or die('Invalid query: ' . mysql_error());
		
		if (mysql_num_rows($result) > 0) {
   			while ($row = mysql_fetch_assoc($result)) {
       			$TableValue[$row['Field']] = $row['Default'];
   			}
		}
}

function GenerateDeleteQuery($fields, $data_array, $tablename, &$setquery) { 

	$setquery = "DELETE FROM ".$tablename." WHERE ";
	
	$len = count($fields);
	$i = 0;
    foreach ($fields as $key) { 
		$i++;
		$setquery = $setquery.$key."='".mysql_real_escape_string(trim($data_array[$key]))."'";
		if($i < $len) {
			$setquery = $setquery." AND ";
		}
    } 

	return true;
} 

function IncrementField($tablename, $condition, $field) {

	$setquery = "UPDATE $tablename 
				SET $field=($field+1)
				WHERE $condition LIMIT 1";
	
	mysql_query($setquery) or die('Invalid query: '. mysql_error());
	
	if(mysql_affected_rows() == 0)
		return false; 
	
	return true;
}

function DecrementField($tablename, $condition, $field) {

	$setquery = "UPDATE $tablename 
				SET $field=($field-1)
				WHERE $condition LIMIT 1";
		
	mysql_query($setquery) or die('Invalid query: '. mysql_error());
	
	if(mysql_affected_rows() == 0)
		return false; 
	
	return true;
}

function SetField($tablename, $condition, $field, $value) {

	$setquery = "UPDATE $tablename 
				SET $field=$value
				WHERE $condition LIMIT 1";
		
	mysql_query($setquery) or die('Invalid query: '. mysql_error());
	
	return true;
}

function GetField($tablename, $condition, $field, &$value) {

	$setquery = "SELECT $field from $tablename WHERE $condition LIMIT 1";
		
	$result = mysql_query($setquery);
	
	list($value) = mysql_fetch_row($result);
	
	return true;
}

function CopyEscapedString($fields, $sourcearray, &$destarray) {

	foreach ($fields as $key) {
		$destarray[$key] =  mysql_real_escape_string(trim(stripslashes(strip_tags($sourcearray[$key]))));
	}
}

// change this function to add offset in time for local time (where user is connection from
function GetLocalDate($time) {

	return date("d-F-Y", $time);
}

function GenerateForm($divname, $formfields) {
	print "<div id=\"$divname\">\n";
}

