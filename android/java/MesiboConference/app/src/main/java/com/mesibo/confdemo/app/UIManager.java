package com.mesibo.confdemo.app;

/** Copyright (c) 2021 Mesibo
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
 * https://github.com/mesibo/conferencing
 *
 * Web Demo
 * https://mesibo.com/livedemo
 *
 */

import android.Manifest;
import android.app.Activity;
import android.content.Context;
import android.content.DialogInterface;
import android.content.Intent;

import com.mesibo.confdemo.R;
import com.mesibo.uihelper.IProductTourListener;
import com.mesibo.uihelper.MesiboUiHelper;
import com.mesibo.uihelper.MesiboUiHelperConfig;
import com.mesibo.uihelper.WelcomeScreen;

import java.util.ArrayList;
import java.util.List;


public class UIManager {

    public static void launchStartupActivity(Context context, boolean skipTour) {
        Intent intent = new Intent(context, StartUpActivity.class);
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        intent.putExtra(StartUpActivity.SKIPTOUR, skipTour);
        context.startActivity(intent);
    }

    public static void launchLoginActivity(Context context) {
        Intent intent = new Intent(context, LoginActivity.class);
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        context.startActivity(intent);
    }

    public static void launchJoinRoomActivity(Context context){
        Intent intent = new Intent(context, JoinRoomActivity.class);
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        context.startActivity(intent);
    }

    public static boolean mMesiboLaunched = false;

    public static boolean mProductTourShown = false;
    public static void launchWelcomeactivity(Activity context, boolean newtask, IProductTourListener tourListener){


        MesiboUiHelperConfig config = new MesiboUiHelperConfig();

        List<WelcomeScreen> res = new ArrayList<WelcomeScreen>();

        // Image from https://www.freepik.com/vectors/technology
        res.add(new WelcomeScreen("Powerful Conferencing APIs", "Unified APIs for mobile and web, to build apps with unlimited participants, multiple camera and  screen sharing, Talk Detection, Group Chat and more..", 0, R.drawable.groupcall, 0xff00868b));
        res.add(new WelcomeScreen("On-Premise Platform", "Run it from our cloud or download the entire platform and run it on your own-premise for ultimate control and privacy compliance with GDPR, HIPAA, etc.", 0, R.drawable.on_premise, 0xff00868b));
        res.add(new WelcomeScreen("Completely Open Source", "Download the entire source code from GitHub and modify / rebrand / reuse without any restrictions.", 0, R.drawable.opensource_android, 0xff00868b));

        // dummy - required
        res.add(new WelcomeScreen("", ":", 0, R.drawable.welcome, 0xff00868b));


        MesiboUiHelperConfig.mScreens = res;
        MesiboUiHelperConfig.mWelcomeBackgroundColor = 0xff00868b;

        MesiboUiHelperConfig.mBackgroundColor = 0xffffffff;
        MesiboUiHelperConfig.mPrimaryTextColor = 0xff172727;
        MesiboUiHelperConfig.mButttonColor = 0xff00868b;
        MesiboUiHelperConfig.mButttonTextColor = 0xffffffff;
        MesiboUiHelperConfig.mSecondaryTextColor = 0xff666666;

        MesiboUiHelperConfig.mScreenAnimation = true;
        MesiboUiHelperConfig.mSmartLockUrl = "https://app.mesibo.com";


        MesiboUiHelper.setConfig(config);

        if(mMesiboLaunched) {
            launchLogin(context);
            return;
        }

        mProductTourShown = true;
        MesiboUiHelper.launchTour(context, newtask, tourListener);
    }

    public static void launchLogin(Activity context){
        launchLoginActivity(context);
    }

}
