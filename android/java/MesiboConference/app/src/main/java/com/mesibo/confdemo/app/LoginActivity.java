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
 * https://github.com/mesibo/conferencing
 */

import android.os.Bundle;
import android.support.annotation.Nullable;
import android.support.v7.app.AppCompatActivity;
import android.text.TextUtils;
import android.util.Log;
import android.view.View;
import android.widget.Button;
import android.widget.EditText;
import android.widget.TextView;

import com.mesibo.api.Mesibo;
import com.mesibo.confdemo.R;

public class LoginActivity extends AppCompatActivity {
    private static final String TAG = "LoginActivity";
    private String mName = "";
    private String mEmail = "";
    private String mCode = "";

    private EditText mNameView = null;
    private EditText mEmailView = null;
    private EditText mCodeView = null;


    private TextView mEnterCodeTextView = null;
    private TextView mErrorView = null;


    public SampleAPI.ResponseHandler mLoginHandler = new SampleAPI.ResponseHandler() {
        @Override
        public void HandleAPIResponse(SampleAPI.Response response) {
            Log.d(TAG, "Response: " + response);
            boolean save = false;
            if (!SampleAPI.checkResponse(response)) {
                // Handle Error
                if (null == response) {
                    showError(getString(R.string.login_error_connection));
                    return;
                }

                if(View.VISIBLE == mCodeView.getVisibility())
                    showError(getString(R.string.login_error_otp));
                else
                    showError(getString(R.string.login_error_email));

                return;
            }

            if (!response.result.equalsIgnoreCase("OK")) {

                if(response.op.equals("joingroup")){
                    showError(getString(R.string.join_room_existing_error));
                }
                return;
            }

            if (response.op.equals("login") && response.result.equalsIgnoreCase("OK")
                    && TextUtils.isEmpty(response.token)) {
                showOtpPrompt();
            }

            if (response.op.equals("login") && !TextUtils.isEmpty(response.token)) {
                AppConfig.getConfig().token = response.token; //TBD, save into preference
                AppConfig.getConfig().email = response.email;
                AppConfig.getConfig().name = response.name;

                save = true;

                Mesibo.reset();
                SampleAPI.startMesibo();

            }

            if (save)
                AppConfig.save();
        }
    };

    @Override
    protected void onCreate(@Nullable Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.login_layout);
        setupLogin();
    }


    private void showOtpPrompt() {

        this.runOnUiThread(new Runnable() {
            @Override
            public void run() {
                mEnterCodeTextView.setVisibility(View.VISIBLE);
                if (!mEmail.isEmpty())
                    mEnterCodeTextView.setText(String.format("%s %s", LoginActivity.this.getString(R.string.login_prompt_enter_otp), mEmail));

                mCodeView.setVisibility(View.VISIBLE);
                mCodeView.requestFocus();

                mNameView.setEnabled(false);
                mEmailView.setEnabled(false);

                LoginActivity.this.clearError();
            }
        });

    }

    private void setupLogin() {

        mNameView = findViewById(R.id.name);
        mEmailView = findViewById(R.id.email);
        mCodeView = findViewById(R.id.code);

        mEnterCodeTextView = findViewById(R.id.enter_code);
        mErrorView = findViewById(R.id.login_error);

        Button mEnterDemoButton = findViewById(R.id.button_next);

        //Hide OTP fields initially
        mCodeView.setVisibility(View.GONE);
        mEnterCodeTextView.setVisibility(View.GONE);

        //Hide error initially
        mErrorView.setVisibility(View.GONE);

        mEnterDemoButton.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                LoginActivity.this.doLogin("");
            }
        });
    }

    private int doLogin(String captchaToken) {
        mName = mNameView.getText().toString();
        mEmail = mEmailView.getText().toString();
        mCode = mCodeView.getText().toString();

        if (mName.isEmpty() || mEmail.isEmpty()) {
            showError("Enter valid Name and Email");
            return -1;
        }

        SampleAPI.emailLogin(mName, mEmail, mCode, captchaToken, mLoginHandler);

        return 0;
    }


    private void showError(String error) {
        this.runOnUiThread(new Runnable() {
            @Override
            public void run() {
                mErrorView.setVisibility(View.VISIBLE);
                if (error != null)
                    mErrorView.setText(error);
            }
        });

    }

    private void clearError(){
      showError("");
    }

}
