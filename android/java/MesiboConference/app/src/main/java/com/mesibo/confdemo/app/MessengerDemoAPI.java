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
 * https://github.com/mesibo/messenger-app-backend
 */

import android.content.Context;
import android.content.SharedPreferences;
import android.os.Handler;
import android.text.TextUtils;
import android.util.Log;


import com.mesibo.api.Mesibo;
import com.mesibo.confdemo.MainApplication;
import com.google.gson.Gson;

import org.json.JSONObject;

/**
 * MessengerDemoAPI uses Messenger Private Backend APIs for generating token
 * for your users.
 * These APIs are meant for use only in this demo app.
 *
 * While creating your own app, you must download and host it on your own server
 * Code: https://github.com/mesibo/messenger-app-backend
 * Tutorial: https://mesibo.com/documentation/tutorials/open-source-whatsapp-clone/backend/
 */

public class MessengerDemoAPI implements Mesibo.HttpListener {
    private static final String TAG = "MessengerDemoAPI";

    private Context mContext = null;
    public final String sharedPrefKey = MainApplication.getAppContext().getPackageName();
    private final String systemPreferenceKey = "confsettings";
    //System Specific Preferences - does not change across logins
    public Configuration mConfig = new Configuration();

    private boolean firstTime = false;
    private SharedPreferences mSharedPref = null;

    public interface Listener {
        void MessengerDemo_onLogin(boolean result, Response response);
        void MessengerDemo_onLogout(boolean result);
        void MessengerDemo_onError();
    }

    private static Listener mListener = null;
    private static Mesibo.Http http = null;

    private static MessengerDemoAPI _instance = null;
    public static MessengerDemoAPI getInstance() {
        if(null==_instance)
            synchronized(MessengerDemoAPI.class) {
                if(null == _instance) {
                    _instance = new MessengerDemoAPI();
                }
            }

        return _instance;
    }

    public static class Configuration {
        public String token = "";
        public String phone = "";

        public String uploadurl = "https://s3.mesibo.com/api.php";
        public String downloadurl = "https://files.mesibo.com/";

        public void reset() {
            token = "";
            phone = "";
        }
    }
    private final String mApiUrl = "https://messenger.mesibo.com";

    /**
     * This sample app uses use Mesibo HTTP Library to handle HTTP requests
     * See https://mesibo.com/documentation/api/http-library/
     */

    public static class Response {
        public String result;
        public String op;
        public String error;

        public String token;
        public String phone;
        public String cc;

        public String title;
        public String message;
        public long delay;

        Response() {
            result = null;
            op = null;
            error = null;
            token = null;
            title = null;
            message = null;
            delay = 0;
        }
    }

    private static final Gson mGson = new Gson();

    public void init(Context context) {
        mContext = context;
        initSavedConfig();

        Mesibo api = Mesibo.getInstance();
        api.init(context);

        Mesibo.setSecureConnection(true);

        if (!TextUtils.isEmpty(mConfig.token)) {
            startMesibo();
        }
    }

    // Initialize and run mesibo
    // See https://mesibo.com/documentation/tutorials/get-started/
    // to learn about creating users and initializing mesibo
    public boolean startMesibo() {

        // add listener to handle changes in connection status, etc
        // See https://mesibo.com/documentation/api/real-time-api/listeners
        Mesibo.addListener(MesiboListeners.getInstance());

        // set access token generated for the user logged in
        if (0 != Mesibo.setAccessToken(mConfig.token)) {
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


    public void forceLogout() {
        Mesibo.stop(true);
        reset();
        Mesibo.reset();

        UIManager.launchStartupActivity(mContext, true);
    }

    @Override
    public boolean Mesibo_onHttpProgress(Mesibo.Http http, int state, int percent) {
        if (percent < 0) {
            if(null != mListener)
                mListener.MessengerDemo_onError();
            return true;
        }

        if(percent < 100 || Mesibo.Http.STATE_DOWNLOAD != state)
            return true;

        String strResponse = http.getDataString();
        Response response = null;
        boolean result = false;

        if (null != strResponse) {
            try {
                response = mGson.fromJson(strResponse, Response.class);
            } catch (Exception e) {
                result = false;
            }
        }

        if(null != response && response.result.equalsIgnoreCase("OK")) {
                result = true;
        }

        if(null == mListener) return true;

        Handler uiHandler = new Handler(mContext.getMainLooper());

        final boolean isLogin = response.op.equals("login");
        if(isLogin && !TextUtils.isEmpty(response.token)) {
            mConfig.token = response.token;
            mConfig.phone = response.phone;
            save();
        }


        final boolean result_r = result;
        final Response response_r = response;
        Runnable myRunnable = new Runnable() {
            @Override
            public void run() {
                if(isLogin)
                    mListener.MessengerDemo_onLogin(result_r, response_r);
                else
                    mListener.MessengerDemo_onLogout(result_r);
            }
        };
        uiHandler.post(myRunnable);
        return true;
    }

    private boolean sendRequest(JSONObject j) {

        try {
            j.put("dt", String.valueOf(Mesibo.getDeviceType()));
        } catch (Exception e) {

        }
        int nwtype = Mesibo.getNetworkConnectivity();
        if(nwtype == 0xFF) {

        }

        http = new Mesibo.Http();
        http.url = mApiUrl;
        try {
            http.post = j.toString().getBytes();
        } catch (Exception e) {}

        http.contentType = "application/json";
        http.notifyOnCompleteOnly = true;
        http.concatData = true;
        http.listener = this;
        //if(mBlocking)
        //  return http.executeAndWait();
        return http.execute();
    }

    public void login(String name, String phoneNumber, String verificationCode, Listener listener) {
        //Mesibo.resetDB();

        mListener = listener;

        JSONObject b = new JSONObject();
        try {
            b.put("op", "login");
            b.put("appid", mContext.getPackageName());
            b.put("name", name);
            b.put("phone", phoneNumber);
            if (!TextUtils.isEmpty(verificationCode))
                b.put("otp", verificationCode);
        } catch (Exception e) {

        }

        sendRequest(b);
    }


    private void initSavedConfig() {
        mSharedPref = mContext.getSharedPreferences(sharedPrefKey, Context.MODE_PRIVATE);
        firstTime = false;
        if (!mSharedPref.contains(systemPreferenceKey)) {
            firstTime = true;
        }

        getAppSetting();

        if (isFirstTime())
            save();
    }


    public Boolean isFirstTime() {
        return firstTime;
    }

    private void getAppSetting() {
        Gson gson = new Gson();
        String json = mSharedPref.getString(systemPreferenceKey, "");
        mConfig = gson.fromJson(json, Configuration.class);

        if(null == mConfig)
            mConfig = new Configuration();
    }

    private void putAppSetting(SharedPreferences.Editor spe) {
        Gson gson = new Gson();

        String json = gson.toJson(mConfig);
        spe.putString(systemPreferenceKey, json);
        spe.commit();
    }

    public void reset() {
        mConfig.reset();
        save();
    }

    public boolean save() {
        try {
            synchronized (mSharedPref) {
                SharedPreferences.Editor spe = mSharedPref.edit();
                putAppSetting(spe);
                return true;
            }
        } catch (Exception e) {
            Log.d(TAG, "Unable to updateRMS(): " + e.getMessage());
            return false;
        }

    }

    public String getUploadUrl() { return mConfig.uploadurl; }
    public String getDownloadUrl() { return mConfig.downloadurl; }
    public String getToken() { return mConfig.token; }
}
