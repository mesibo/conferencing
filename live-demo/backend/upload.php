<?php
//http://www.openjs.com/articles/ajax/ajax_file_upload/response_data.php
/**
 * A function for easily uploading files. This function will automatically generate a new 
 *        file name so that files are not overwritten.
 * Taken From: http://www.bin-co.com/php/scripts/upload_function/
 * Arguments:    $file_id- The name of the input field contianing the file.
 *                $folder    - The folder to which the file should be uploaded to - it must be writable. OPTIONAL
 *                $types    - A list of comma(,) seperated extensions that can be uploaded. If it is empty, anything goes OPTIONAL
 * Returns  : This is somewhat complicated - this function returns an array with two values...
 *                The first element is randomly generated filename to which the file was uploaded to.
 *                The second element is the status - if the upload failed, it will be 'Error : Cannot upload the file 'name.txt'.' or something like that
 */

function upload_fileinfo($file_id, $types, &$ext, &$filesize, &$error) {
	if(!$_FILES[$file_id]['name']) {
		return false;
	}

	if(!$_FILES[$file_id]['size']) { //Check if the file is made
		$error = "Bad file size";
		return false;
	}

	$filesize = $_FILES[$file_id]['size'];	
	
	$ext_arr = explode(".",basename($_FILES[$file_id]['name']));
	$ext = strtolower($ext_arr[count($ext_arr)-1]); //Get the last extension
	
	if("" != $types) {
		$all_types = explode(",",strtolower($types));
		if(!in_array($ext,$all_types)) {
			$error = "Bad file type";
			return false;
		}
	}

	return $_FILES[$file_id]['name'];
}

function upload($file_id, $folder, $file_name="", $types="", &$ext="") {
	if(!isset($_FILES[$file_id])) {
		return false;
	}

	if(!isset($_FILES[$file_id]['name'])) {
		return false;
	}

	if(!$_FILES[$file_id]['size']) { //Check if the file is made
	//	return false;
	}

	//Get file extension
	if("" == $ext) {
		$ext_arr = explode(".", basename($_FILES[$file_id]['name']));
		$ext = strtolower($ext_arr[count($ext_arr)-1]); //Get the last extension
	}

	//Not really uniqe - but for all practical reasons, it is
	if("" == $file_name) {
		$file_name = time().'-'.substr(md5(uniqid(rand(),1)),0,16);
	}

	if("" != $types) {
		$all_types = explode(",",strtolower($types));
		if(!in_array($ext,$all_types)) {
			return false;
		}
	}

	//Where the file must be uploaded to
	if($folder) $folder .= '/';//Add a '/' at the end of the folder
	if(false === strpos($file_name, ".$ext"))
		$file_name .= ".$ext";

	$uploadfile = $folder . $file_name;

	$result = '';
	//check upload_max_filesize in php.ini if move_uploaded_file fails
	//Move the file from the stored location to the new location
	if (!move_uploaded_file($_FILES[$file_id]['tmp_name'], $uploadfile)) {
		return false;
	} 

	chmod($uploadfile,0777);//Make it universally writable.
	return $file_name;
}


