package com.mesibo.confdemo.app;
/**
 * Copyright (c) 2021 Mesibo
 * https://mesibo.com
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without modification,
 * are permitted provided that the terms and condition mentioned on https://mesibo.com
 * as well as following conditions are met:
 *
 * Redistributions of source code must retain the above copyright notice, this list
 * of conditions, the following disclaimer and links to documentation and source code
 * repository.
 *
 * Redistributions in binary form must reproduce the above copyright notice, this
 * list of conditions and the following disclaimer in the documentation and/or other
 * materials provided with the distribution.
 *
 * Neither the name of Mesibo nor the names of its contributors may be used to endorse
 * or promote products derived from this software without specific prior written
 * permission.
 *
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
 * ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED.
 * IN NO EVENT SHALL THE COPYRIGHT OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT,
 * INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING,
 * BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA,
 * OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY,
 * WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
 * ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
 * POSSIBILITY OF SUCH DAMAGE.
 *
 * Getting Started with Mesibo
 * https://mesibo.com/documentation/tutorials/get-started/
 *
 * Documentation
 * https://mesibo.com/documentation/api/conferencing
 *
 * Source Code Repository
 * https://github.com/mesibo/conferencing/tree/master/live-demo
 */

import android.content.Context;
import android.os.Bundle;
import android.os.Handler;
import android.text.TextUtils;


import com.mesibo.api.Mesibo;
import com.mesibo.confdemo.MainApplication;
import com.google.gson.Gson;
import com.mesibo.confdemo.messaging.FileTransferHelper;

/**
 * This demo uses Mesibo Private Backend APIs for conferencing
 * to create conference rooms, participants, and handling login
 * These APIs are meant for use only in this demo app.
 *
 * See https://github.com/mesibo/conferencing/tree/master/live-demo/backend
 * to know about hosting private backend APIs for the conferencing demo app
 *
 * While creating your own app, you must use Mesibo Backend APIs
 * See https://mesibo.com/documentation/api/backend-api/
 */

public class SampleAPI {
    private static final String TAG = "SampleAPI";

    private static Context mContext = null;

    /**
     * This sample app uses use Mesibo HTTP Library to handle HTTP requests
     * See https://mesibo.com/documentation/api/http-library/
     */
    public static abstract class ResponseHandler implements Mesibo.HttpListener {
        private Mesibo.Http http = null;
        private Bundle mRequest = null;
        private boolean mOnUiThread = false;
        public static boolean result = true;
        public Context mContext = null;

        @Override
        public boolean Mesibo_onHttpProgress(Mesibo.Http http, int state, int percent) {
            if (percent < 0) {
                HandleAPIResponse(null);
                return true;
            }

            if (100 == percent && Mesibo.Http.STATE_DOWNLOAD == state) {
                String strResponse = http.getDataString();
                Response response = null;

                if (null != strResponse) {
                    try {
                        response = mGson.fromJson(strResponse, Response.class);
                    } catch (Exception e) {
                        result = false;
                    }
                }

                if (null == response)
                    result = false;

                final Context context = (null == this.mContext) ? SampleAPI.mContext : this.mContext;

                if (!mOnUiThread) {
                    HandleAPIResponse(response);
                } else {
                    final Response r = response;

                    if (null == context)
                        return true;

                    Handler uiHandler = new Handler(context.getMainLooper());

                    Runnable myRunnable = new Runnable() {
                        @Override
                        public void run() {
                            ResponseHandler.this.HandleAPIResponse(r);
                        }
                    };
                    uiHandler.post(myRunnable);
                }
            }
            return true;
        }


        public void setOnUiThread(boolean onUiThread) {
            mOnUiThread = onUiThread;
        }

        public boolean sendRequest(Bundle postBunlde, String filePath, String formFieldName) {

            postBunlde.putString("dt", String.valueOf(Mesibo.getDeviceType()));

            mRequest = postBunlde;
            http = new Mesibo.Http();
            http.url = mApiUrl;
            http.postBundle = postBunlde;
            http.uploadFile = filePath;
            http.uploadFileField = formFieldName;
            http.notifyOnCompleteOnly = true;
            http.concatData = true;
            http.listener = this;

            Mesibo api = Mesibo.getInstance();

            return http.execute();
        }

        public abstract void HandleAPIResponse(Response response);
    }


    public static class Room {
        public long gid = 0;
        public String name = "";
        public String pin = "";
        public String spin = "";
        public long resolution = 0;
        public long publish = 1;
        public boolean audio = true;
        public boolean video = true;
        public long duration = 0;
    }

    public static class Response {
        public String result;
        public String op;
        public String error;
        public String token;
        public String name;


        public long gid;
        public String email;
        public Room[] rooms;
        public long duration;

        long resolution;
        long publish;
        String pin;
        String spin;
        long type;

        Response() {
            result = null;
            op = null;
            error = null;
            token = null;
            gid = 0;
            resolution = 0;
            publish = 0;
            pin = "";
            spin = "";
            type = 0;
        }
    }

    private static final Gson mGson = new Gson();
    private static String mApiUrl = "";


    public static boolean checkResponse(Response response) {
        if (null == response) {
            return false;
        }

        if(response.result.equalsIgnoreCase("OK"))
            return true;

        if(response.error == null)
            return true;

        if (response.error.equalsIgnoreCase("AUTHFAIL")) {
            forceLogout();
            return false;
        }

        return true;

    }


    public static void init(Context context) {
        mContext = context;
        mApiUrl = AppConfig.getConfig().demo_backend_api_url;

        Mesibo api = Mesibo.getInstance();
        api.init(context);

        Mesibo.setSecureConnection(true);

        if (!TextUtils.isEmpty(AppConfig.getConfig().token)) {
            startMesibo();
        }
    }

    // Initialize and run mesibo
    // See https://mesibo.com/documentation/tutorials/get-started/
    // to learn about creating users and initializing mesibo
    public static boolean startMesibo() {

        // add listener to handle changes in connection status, etc
        // See https://mesibo.com/documentation/api/real-time-api/listeners
        Mesibo.addListener(MesiboListeners.getInstance());

        // add file transfer handler
        FileTransferHelper fileTransferHelper = new FileTransferHelper();
        Mesibo.addListener(fileTransferHelper);

        // set access token generated for the user logged in
        if (0 != Mesibo.setAccessToken(AppConfig.getConfig().token)) {
            return false;
        }

        // set database after setting access token so that it's associated with user
        Mesibo.setDatabase("mesibo.db", 0);

        // Now start mesibo
        if (0 != Mesibo.start()) {
            return false;
        }

        // Mesibo is running. Now the user can enter or create a room, and initiate a group call
        UIManager.launchJoinRoomActivity(MainApplication.getAppContext());

        return true;
    }


    public static void forceLogout() {
        Mesibo.stop(true);
        AppConfig.reset();
        Mesibo.reset();

        UIManager.launchStartupActivity(mContext, true);
    }

    public static boolean emailLogin(String name, String email, String verificationCode, String captchaToken, ResponseHandler handler) {

        Bundle b = new Bundle();
        b.putString("op", "login");
        b.putString("appid", mContext.getPackageName());
        b.putString("email", email);
        b.putString("name", name);
        b.putString("captcha", captchaToken);

        if (!TextUtils.isEmpty(verificationCode)) {
            handler.setOnUiThread(true);
            b.putString("code", verificationCode);
        }

        handler.sendRequest(b, null, null);
        return true;
    }

    public static boolean enterRoom(String gid, String pin, String mesiboToken, String captchaToken, ResponseHandler handler) {

        Bundle b = new Bundle();
        b.putString("op", "joingroup");
        b.putString("token", mesiboToken);
        b.putString("gid", gid);
        b.putString("pin", pin);
        b.putString("captcha", captchaToken);


        handler.sendRequest(b, null, null);
        return true;
    }

    public static boolean createRoom(String name, int mSelectedResolution, String mesiboToken, String captchaToken, ResponseHandler handler) {

        Bundle b = new Bundle();
        b.putString("op", "setgroup");
        b.putString("token", mesiboToken);
        b.putString("name", name);
        b.putString("captcha", captchaToken);
        b.putInt("resolution", mSelectedResolution);

        handler.sendRequest(b, null, null);
        return true;
    }

    public static boolean getRooms(String mesiboToken, ResponseHandler handler) {

        Bundle b = new Bundle();
        b.putString("op", "rooms");
        b.putString("token", mesiboToken);

        handler.sendRequest(b, null, null);

        return true;
    }

    public static String getUploadUrl() { return AppConfig.getConfig().uploadurl; }
    public static String getDownloadUrl() { return AppConfig.getConfig().downloadurl; }
    public static String getToken() { return AppConfig.getConfig().token; }
    public static Room getActiveRoom() { return AppConfig.getConfig().activeRoom; }
}
