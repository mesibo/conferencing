## Backend for Sample Conferencing App 

This repository contains the backend source code for the mesibo Sample Conferencing App which you can readily host and use it or modify it as per your needs.

The demo app uses  Private Backend APIs . Your app uses these private APIs for login and other administrative tasks such as creating users, groups,etc. In turn, the private API connects to the mesibo backend API to perform the necessary operations your database. Private APIs internally call the [User and Group Management APIs](https://mesibo.com/documentation/api/backend-api).

You can host mesibo's backend API or use the existing backend hosted at `https://app.mesibo.com/conf/api.php`. You can also customize mesibo backend APIs as per your requirements. 

If you are hosting mesibo backend APIs modify [config.js](https://github.com/mesibo/conferencing/blob/master/live-demo/web/mesibo/config.js) to point to your own URL and you are good to go. 

### Hosting Backend APIs
To set up the mesibo backend API for the conferencing app, follow the steps below.

## Prerequisites
Before we dive into setting up the backend for the conferencing app, please ensure the following
- Familiarity with mesibo API. Refer [Getting Started Guide](https://mesibo.com/documentation/get-started/) and [First App Tutorial](https://mesibo.com/documentation/tutorials/first-app/#preparation) if you are not familiar.
- Familiarity with mesibo [User and Group Management Backedn APIs](https://mesibo.com/documentation/api/backend-api/#group-management-apis)
- Familiar with the mesibo conferencing and streaming APIs.

Please ensure that the following servers are running.
- A web server with HTTPS and PHP support. Depending on the web server (apache / h2o/ Lighttpd/ Nginx) you are using, the setup varies. In the subsequent examples, we will assume that your hostname is `example.com` and the backend code which you will download soon is accessible via URL `https://example.com/api.php`
- MySQL server

- Get Mesibo API Key and the App token. Refer to [First Mesibo App tutorial](https://mesibo.com/documentation/tutorials/first-app/#preparation) to learn about how to get API key and App token.

### Setting up the Database

You will need to set up a database so that backend can store various information:

- Users email/phone number and login token
- Groups, group members, and group admins

The private APIs uses MySQL as the database. We will not go into details of setting up MySQL server; there are plenty of tutorials on the web if you are not familiar. Once you’ve set up the MySQL server, create a database and the credentials. These credential will be needed by the backend code to access the database.

The next step is to create the database schema using the supplied SQL file `mysql-schema.sql`. Run following to create the database schema for the backend.

```
$ mysql -h <host> -u <username> -p <password> <dbname> < mysql-schema.sql
```

### Configure the backend APIs

We now have all the information to configure and go live with private API on your own servers.

Open `config.php` in the downloaded code and enter all the information we have obtained above, namely:
- MySQL host, database name, username, and password
- The API key and APP token.Refer to [First Mesibo App tutorial](https://mesibo.com/documentation/tutorials/first-app/#preparation) to learn about how to get API key and App token.

**Optional** If you are using Google ReCaptcha set the recaptcha secret token.

Modify the file [config.php](https://github.com/mesibo/conferencing/blob/master/live-demo/backend/config.php)
```php
<?php

$db_host = "localhost";
$db_name  = "confdemo";         // the name of the database to connect to
$db_user  = "confuser";           // the username to connect with
$db_pass  = "confpass";      // the user's password

// OBTAINED BY SIGNING AT mesibo.com
$apikey = "<get yours from https://mesibo.com/console >";
$apptoken = "<get yours from https://mesibo.com/console >";

// google recaptcha secret [optional]
$captcha_secret = '';
```
### Testing your Private API
It’s time now to test the backend. Open `https://example.com/api.php` in your browser. It should output
`{ "code": "NOOP", "result": "FAIL" }`

Above output indicates that the backend appears to be set up correctly. 

### Configure the conferencing demo app to use your backend API

Once you are done with the backend setup, Edit the [config.js](https://github.com/mesibo/conferencing/blob/master/live-demo/web/mesibo/config.js) of the app to use your own private API URL (replacing https://app.mesibo.com/api.php with the new one).

- Edit `conferencing/live-demo/web/mesibo/config.js` and enter the private API url in `MESIBO_API_BACKEND` field
- Edit `conferencing/live-demo/web/mesibo/config.js` and enter the grecaptcha public key in `MESIBO_CAPTCHA_TOKEN` field

For example,
```javascript
const MESIBO_API_BACKEND = 'https://example.com/api.php';
const MESIBO_CAPTCHA_TOKEN = '6LceR_sUxxxxxxxxxxxxPSCU-_jcfU';
```

That's it! You are now good to go about running the conferecing demo app connected to your own backend.

### Using Private backend APIs for conferencing

Before you continue, Remember that, private APIs are not the replacement for mesibo backend APIs. Private APIs invoke mesibo backend APIs. You will still need to invoke mesibo API at https://api.mesibo.com/api.php for adding users, groups, members, etc.

These are private backend APIs that are only meant for use in the sample conferencing app. The private APIs used in the conferencing app are :
- `login` - For generating a token for a user
- `setgroup` - For letting a user create a room
- `joingroup` - For letting a user enter a room 


### User Login and Authentication

Anyone who wants to join the group, also need to be a mesibo user with a token. To create a room using the private API (described in the next step) you need a token. 

So, for the first step, we authenticate a user and generate a token for them.

1. We will ask for the name and email of the user and send an OTP to their email. To do this send a request with the following parameters to send an OTP to the email of the user. `MESIBO_API_BACKEND` is the API url configured in [config.js](https://github.com/mesibo/conferencing/blob/master/live-demo/web/mesibo/config.js)

```
MESIBO_API_BACKEND?op=login&appid=APP_ID&name=NAME&email=USER_EMAIL
```
2. Now we will use a private API to verify this email and generate a token(For more details on mesibo private APIs for authentication refer [here](https://mesibo.com/documentation/tutorials/open-source-whatsapp-clone/backend/#user-login-and-authentication) The user will now need to enter the OTP received which we then send to the backend for verification with the following request

```
MESIBO_API_BACKEND?op=login&appid=APP_ID&name=NAME&email=USER_EMAIL&code=OTP_RECEIVED
```
If the entered OTP matches, we generate a token for that user. We then save the token and other required parameters locally

### Creating a conference room
For a conference room, we need to create a group that other people can join. The creator of the room will configure all the room properties such as the room name, etc

We can also set the video quality settings required.
```javascript
const STREAM_RESOLUTION_DEFAULT = 0 ;
const STREAM_RESOLUTION_QVGA  = 1 ;
const STREAM_RESOLUTION_VGA = 2 ; 
const STREAM_RESOLUTION_HD = 3 ;
const STREAM_RESOLUTION_FHD = 4;
const STREAM_RESOLUTION_UHD = 5;
```

You can create a group, by making an API request in the following format:
```
MESIBO_API_BACKEND?token=USER_ACCESS_TOKEN&op=setgroup&name=ROOM_NAME&resolution=ROOM_RESOLUTION
```
For a successful request, you response will look like below:
```
{
    "op": "setgroup",
    "ts": 1592913675,
    "gid": 96734,
    "name": "newroom",
    "type": 0,
    "resolution": "0",
    "publish": 1,
    "pin": "93799667",
    "spin": "35399768",
    "result": "OK"
}
```
You can store all these room parameters.

As the creator of the room, you have the permissions to publish to the group and view other streams. But, you may need to control the permissions of other particpants in the conference. You may wish to permit only a select few of the participants to both publish, participate and view other streams, while for some you only grant the permission to view other streams.

To do this mesibo generates two random pins for every group that is created. `pin` and `spin`. Any participant who wishes to enter the room need to enter a `pin` or `spin` to enter a room with a particular `room-ID`.
 
When a room is created, the response will contain two pins :
- `response['pin']` Participant Pin. Send this to those who you want to actively participate in the conference. They will be able to make a video or voice call to the conference.
- `response['spin']` Subscriber Pin. Send this to those who you want to silently participate in the conference. They will not be able to make a call -but they will be able to view the conference.


### Entering a room
To enter a room you need to enter a `room-ID` which is the group id and a `pin`. Participants will need to enter the groupid and pin. We read these valuues and send it along with the access token(that was generated in the login step) and request mesibo backend to authenticate it. 

```
MESIBO_API_BACKEND?token= USER_TOKEN &op=joingroup&gid= ROOM_ID &pin= ROOM_PIN
```
If the entered pin matches with the pin that was generated while creating the room, the participant will be allowed to enter the room.

