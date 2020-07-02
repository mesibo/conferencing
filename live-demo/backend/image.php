<?
function image_convert($srcfile, $ext, $dstfile, $dwidth, $dheight, $quality=70) {
	if('' == $ext) {
		$ext_arr = explode(".",basename($srcfile));
		$ext = strtolower($ext_arr[count($ext_arr)-1]); //Get the last extension
	}

	$imgtype = exif_imagetype($srcfile);
	if(IMAGETYPE_JPEG == $imgtype) {
		$ext = 'jpg';
	} else if(IMAGETYPE_PNG == $imgtype) {
		$ext = 'png';
	} else if(IMAGETYPE_GIF == $imgtype) {
		$ext = 'gif';
	}

	if ('jpg' == $ext || 'jpeg' == $ext)
		$image=imagecreatefromjpeg($srcfile);
	else if ('png' == $ext)
		$image=@imagecreatefrompng($srcfile);
	else if ('gif' == $ext)
		$image=imagecreatefromgif($srcfile);
	else if ('bmp' == $ext)
		$image=imagecreatefrombmp($srcfile);
	else {
		//print 'wrong src file';
		return false;
	}

	if(!$image)
		return false;

	$width = imagesx($image);
	$height = imagesy($image);

	$dst_img = imagecreatetruecolor($dwidth, $dheight);
	$src_img = $image;

	$width_new = $height * $dwidth / $dheight;
	$height_new = $width * $dheight / $dwidth;
	//if the new width is greater than the actual width of the image, then the height is too large and the rest cut off, or vice versa
	if($width_new > $width){
		//cut point by height
		$h_point = (($height - $height_new) / 2);
		//copy image
		imagecopyresampled($dst_img, $src_img, 0, 0, 0, $h_point, $dwidth, $dheight, $width, $height_new);
	}else{
		//cut point by width
		$w_point = (($width - $width_new) / 2);
		imagecopyresampled($dst_img, $src_img, 0, 0, $w_point, 0, $dwidth, $dheight, $width_new, $height);
	}

	imagejpeg($dst_img, $dstfile, $quality);

	if($dst_img)imagedestroy($dst_img);
	if($src_img)imagedestroy($src_img);

	return true;


}

