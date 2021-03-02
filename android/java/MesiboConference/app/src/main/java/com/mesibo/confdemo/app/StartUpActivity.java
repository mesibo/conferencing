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
 *
 * Web Demo
 * https://mesibo.com/livedemo
 *
 */

import android.content.Context;
import android.content.Intent;
import android.os.Bundle;
import android.support.v7.app.AppCompatActivity;
import android.text.TextUtils;
import android.util.Log;

import com.mesibo.api.Mesibo;
import com.mesibo.calls.api.MesiboCall;
import com.mesibo.confdemo.R;
import com.mesibo.confdemo.groupcall.GroupCallActivity;

public class StartUpActivity extends AppCompatActivity {

    private static final String TAG = "MesiboStartupActivity";
    public final static String INTENTEXIT = "exit";
    public final static String SKIPTOUR = "skipTour";

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        setContentView(R.layout.activity_main);
        startNextActivity();
    }

    void startNextActivity() {

        if (TextUtils.isEmpty(AppConfig.getConfig().token)) {
            if (getIntent().getBooleanExtra(SKIPTOUR, false)) {
                UIManager.launchLogin(this);
            } else {
                UIManager.launchWelcomeactivity(this, true, MesiboListeners.getInstance());
            }

            overridePendingTransition(android.R.anim.fade_in, android.R.anim.fade_out);

        }

        finish();
    }

    // since this activity is singleTask, intent will be delivered here if it's running
    @Override
    protected void onNewIntent(Intent intent) {
        Log.d(TAG, "onNewIntent");
        if (intent.getBooleanExtra(INTENTEXIT, false)) {
            finish();
        }

        super.onNewIntent(intent);
    }
}
