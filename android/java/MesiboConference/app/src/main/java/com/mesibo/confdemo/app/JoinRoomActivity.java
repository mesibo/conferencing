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

import android.content.Intent;
import android.os.Bundle;
import android.support.annotation.Nullable;
import android.support.v7.app.AppCompatActivity;
import android.view.View;
import android.widget.AdapterView;
import android.widget.ArrayAdapter;
import android.widget.CheckBox;
import android.widget.EditText;
import android.widget.LinearLayout;
import android.widget.ListView;
import android.widget.ProgressBar;
import android.widget.RadioButton;
import android.widget.Spinner;
import android.widget.TextView;

import com.mesibo.calls.api.MesiboCall;
import com.mesibo.confdemo.MainApplication;
import com.mesibo.confdemo.R;
import com.mesibo.confdemo.groupcall.GroupCallActivity;

import java.util.ArrayList;

public class JoinRoomActivity extends AppCompatActivity {
    private static final String TAG = "JoinRoomActivity";
    private Integer mRoomId = 0;
    private Integer mRoomPin = 0;

    private String mRoomName = "";

    private EditText mEnterRoomId = null;
    private EditText mEnterRoomPin = null;
    private EditText mEnterRoomName = null;

    private View mEnterRoomView = null;
    private View mMyRoomsView = null;
    private TextView mErrorEnterRoomView = null;

    private View mCreateRoomView = null;
    private Spinner mCreateRoomsResolutions = null;
    private int mSelectedResolution = STREAM_RESOLUTION_DEFAULT;

    private SampleAPI.Room[] mRoomsArray = {};
    private ArrayList<String> mRoomsList = new ArrayList<String>();
    private ArrayAdapter<String> mAdapter = null;
    private ListView mRoomsListView;

    private LinearLayout mProgressBar = null;

    private boolean mAudio = true;
    private boolean mVideo = true;

    private static final String RESOLUTION_DEFAULT_STRING = "Default";
    private static final String RESOLUTION_STANDARD_STRING = "Standard - 640x480";
    private static final String RESOLUTION_HD_STRING = "HD - 1280x720";
    private static final String RESOLUTION_FULL_HD_STRING = "Full HD - 1920x1080";
    private static final String RESOLUTION_4K_STRING = "4K - 3840x2160";
    private static final String RESOLUTION_QVGA_STRING = "QVGA - 320x240";

    private static final int STREAM_RESOLUTION_DEFAULT = 0;
    private static final int STREAM_RESOLUTION_STANDARD = 0;
    private static final int STREAM_RESOLUTION_QVGA = 1;
    private static final int STREAM_RESOLUTION_VGA = 2;
    private static final int STREAM_RESOLUTION_HD = 3;
    private static final int STREAM_RESOLUTION_FHD = 4;
    private static final int STREAM_RESOLUTION_4K = 5;


    public SampleAPI.ResponseHandler mJoinRoomHandler = new SampleAPI.ResponseHandler() {
        @Override
        public void HandleAPIResponse(SampleAPI.Response response) {

            mProgressBar.setVisibility(View.GONE);

            if (! SampleAPI.checkResponse(response)) { //Error occurred
                showError(getString(R.string.login_error_connection));
                return;
            }


            if (!response.result.equalsIgnoreCase("OK")) {

                if(response.op.equals("joingroup")){
                    showError(getString(R.string.join_room_existing_error));
                }
                return;
            }

            //Show available rooms to enter
            if(response.op.equals("rooms") && response.result.equalsIgnoreCase("OK")){
                SampleAPI.Room[] rl = response.rooms;
                AppConfig.getConfig().rooms = rl;
                setAvailableRooms(rl);
            }

            // Entering an existing room
            if(response.op.equals("joingroup") && response.result.equalsIgnoreCase("OK")){
                SampleAPI.Room room = getRoom(response);

                AppConfig.getConfig().activeRoom = room;
                joinConferenceRoom((int) response.gid, room);
            }

            // Creating and entering a new room
            if(response.op.equals("setgroup") && response.result.equalsIgnoreCase("OK")){
                SampleAPI.Room room = getRoom(response);

                AppConfig.getConfig().activeRoom = room;
                joinConferenceRoom((int) response.gid, room);
            }


        }
    };


    private SampleAPI.Room getRoom(SampleAPI.Response response){
        if(null == response)
            return  null;

        SampleAPI.Room room = new SampleAPI.Room();

        long gid = response.gid;
        if(gid <=0)
            return null;


        room.gid = gid;
        room.name = response.name;
        room.resolution = response.resolution;
        room.pin = response.pin;
        room.spin =response.spin;
        room.publish = response.publish;
        room.audio = mAudio;
        room.video = mVideo;
        room.duration = response.duration;

        return room;
    }

    @Override
    protected void onCreate(@Nullable Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.join_room_layout);

        mEnterRoomId = findViewById(R.id.room_id);
        mEnterRoomPin = findViewById(R.id.room_pin);
        mEnterRoomName = findViewById(R.id.room_name);

        mEnterRoomView = findViewById(R.id.existing_room);
        mCreateRoomView = findViewById(R.id.create_room);
        mMyRoomsView = findViewById(R.id.my_rooms);

        mErrorEnterRoomView = findViewById(R.id.error_enter_room);
        hideError();

        mRoomsListView = findViewById(R.id.list_my_rooms);
        mAdapter = new ArrayAdapter<String>(this, android.R.layout.simple_list_item_1, mRoomsList);
        mRoomsListView.setAdapter(mAdapter);

        mCreateRoomsResolutions = findViewById(R.id.choose_resolution_options);


        String[] options = new String[]{RESOLUTION_DEFAULT_STRING, RESOLUTION_STANDARD_STRING, RESOLUTION_HD_STRING, RESOLUTION_FULL_HD_STRING, RESOLUTION_4K_STRING, RESOLUTION_QVGA_STRING};
        ArrayAdapter<String> adapter = new ArrayAdapter<String>(this, android.R.layout.simple_spinner_dropdown_item, options);
        mCreateRoomsResolutions.setAdapter(adapter);

        mCreateRoomsResolutions.setOnItemSelectedListener(new AdapterView.OnItemSelectedListener() {

            @Override
            public void onItemSelected(AdapterView<?> arg0, View arg1, int position, long arg3) {
                String selected = options[position];
                switch (selected){
                    case RESOLUTION_DEFAULT_STRING:
                        mSelectedResolution = STREAM_RESOLUTION_DEFAULT;
                        break;
                    case RESOLUTION_STANDARD_STRING:
                        mSelectedResolution = STREAM_RESOLUTION_STANDARD;
                        break;
                    case RESOLUTION_HD_STRING:
                        mSelectedResolution = STREAM_RESOLUTION_HD;
                        break;
                    case RESOLUTION_FULL_HD_STRING:
                        mSelectedResolution = STREAM_RESOLUTION_FHD;
                        break;
                    case RESOLUTION_4K_STRING:
                        mSelectedResolution = STREAM_RESOLUTION_4K;
                        break;
                    case RESOLUTION_QVGA_STRING:
                        mSelectedResolution = STREAM_RESOLUTION_QVGA;
                        break;
                }
            }

            @Override
            public void onNothingSelected(AdapterView<?> arg0) {

            }
        });

        mProgressBar = findViewById(R.id.join_room_progressbar);

    }


    public void onEnterRoom(View view) {
        String rid = mEnterRoomId.getText().toString();
        String rpin = mEnterRoomPin.getText().toString();

        if (rid.isEmpty() || rpin.isEmpty())
            return;

        mRoomId = Integer.parseInt(rid);
        mRoomPin = Integer.parseInt(rpin);

        SampleAPI.enterRoom(mRoomId.toString(), mRoomPin.toString(), AppConfig.getConfig().token, "", mJoinRoomHandler);
        mProgressBar.setVisibility(View.VISIBLE);
    }

    public void onCreateRoom(View view) {
        String rname = mEnterRoomName.getText().toString();

        if (rname.isEmpty())
            return;

        mRoomName = rname;

        SampleAPI.createRoom(mRoomName, mSelectedResolution, AppConfig.getConfig().token, "", mJoinRoomHandler);
        mProgressBar.setVisibility(View.VISIBLE);
    }

    public void onRoomRadioButtonClicked(View view) {
        boolean checked = ((RadioButton) view).isChecked();

        // Check which radio button was clicked

        switch (view.getId()) {
            case R.id.radio_enter_room:
                if (checked) {

                    mEnterRoomView.setVisibility(View.VISIBLE);
                    mMyRoomsView.setVisibility(View.GONE);
                    mEnterRoomId.requestFocus();

                    mCreateRoomView.setVisibility(View.GONE);
                }

                break;
            case R.id.radio_create_room:
                if (checked) {
                    mEnterRoomView.setVisibility(View.GONE);
                    mMyRoomsView.setVisibility(View.GONE);

                    mCreateRoomView.setVisibility(View.VISIBLE);
                    mEnterRoomName.requestFocus();

                    break;
                }
        }

    }

    public void onShowRooms(View v) {
        mEnterRoomView.setVisibility(View.GONE);
        mMyRoomsView.setVisibility(View.VISIBLE);

        SampleAPI.getRooms(AppConfig.getConfig().token, mJoinRoomHandler);
        mProgressBar.setVisibility(View.VISIBLE);
    }

    private void setAvailableRooms(SampleAPI.Room[] rl) {
        mRoomsArray = rl;
        mRoomsList.clear();
        for(int i=0; i< rl.length; i++){
            SampleAPI.Room r = rl[i];
            String room_description = "";
            if(r.spin.isEmpty())
                room_description = "Room #"+ r.gid + ": "+ r.name;
            else
                room_description = "[Host] Room #"+ r.gid + ": "+ r.name;

            mRoomsList.add(room_description);
        }
        mAdapter.notifyDataSetChanged();

        mRoomsListView.setOnItemClickListener((parent, view, position, id) -> {

            SampleAPI.Room r = mRoomsArray[position];
            SampleAPI.enterRoom(String.valueOf(r.gid), r.pin, AppConfig.getConfig().token, "", mJoinRoomHandler);

        });

    }

    private void showError(String error) {
        mErrorEnterRoomView.setVisibility(View.VISIBLE);
        mErrorEnterRoomView.setText(error);
    }

    private void hideError() {
        mErrorEnterRoomView.setVisibility(View.GONE);
    }

    private void joinConferenceRoom(Integer gid, SampleAPI.Room room) {
        MesiboCall.getInstance().init(MainApplication.getAppContext());

        Intent intent = new Intent(MainApplication.getAppContext(), GroupCallActivity.class);
        intent.putExtra("gid", room.gid);
        intent.putExtra("duration", room.duration);

        if(room == null)
            return;

        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);


        MainApplication.getAppContext().startActivity(intent);
    }

    public void onStreamCheckboxClicked(View view) {

        boolean checked = ((CheckBox) view).isChecked();

        switch(view.getId()) {
            case R.id.checkbox_audio:
                    mAudio = checked;
                    break;
            case R.id.checkbox_video:
                    mVideo = checked;
                    break;
        }
    }

    public void onLogout(View view) {
        SampleAPI.forceLogout();
    }
}
