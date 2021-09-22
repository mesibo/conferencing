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

import android.app.Activity;
import android.content.Context;
import android.content.DialogInterface;
import android.content.Intent;
import android.os.Bundle;

import com.mesibo.confdemo.R;
import com.mesibo.confdemo.groupcall.JoinRoomActivity;
import com.mesibo.messaging.MesiboUI;
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


        config.mScreens = res;
        config.mWelcomeBackgroundColor = 0xff00868b;

        config.mBackgroundColor = 0xffffffff;
        config.mPrimaryTextColor = 0xff172727;
        config.mButttonColor = 0xff00868b;
        config.mButttonTextColor = 0xffffffff;
        config.mSecondaryTextColor = 0xff666666;

        config.mScreenAnimation = true;
        config.mSmartLockUrl = "https://confdemo.mesibo.com";
        config.mPhoneVerificationBottomText = "IMPORTANT: We will NOT send OTP.  Instead, you can generate OTP for any number from the mesibo console. Sign up at https://mesibo.com/console";



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

    public static void launchParticipantList(Context context, long forwardid, int selectionMode, int flag, Bundle bundle) {
        MesiboUI.launchContacts(context, forwardid, selectionMode, flag, bundle);
    }

    public static void showAlert(Context context, String title, String message, DialogInterface.OnClickListener pl, DialogInterface.OnClickListener nl) {
        //android.support.v7.app.AlertDialog.Builder dialog = new android.support.v7.app.AlertDialog.Builder(context, R.style.AppCompatAlertDialogStyle);
        if(null == context) {
            return; //
        }
        android.support.v7.app.AlertDialog.Builder dialog = new android.support.v7.app.AlertDialog.Builder(context);
        dialog.setTitle(title);
        dialog.setMessage(message);
        // dialog.setIcon(android.R.drawable.ic_dialog_alert);
        dialog.setCancelable(true);

        dialog.setPositiveButton(android.R.string.ok, pl);
        //dialog.setNegativeButton(android.R.string.cancel, nl);

        try {
            dialog.show();
        } catch (Exception e) {
            //Log.d(TAG, "Exception showing alert: " + e);
        }
    }

    public static void showAlert(Context context, String title, String message) {
        showAlert(context, title, message, null, null);
    }
}
