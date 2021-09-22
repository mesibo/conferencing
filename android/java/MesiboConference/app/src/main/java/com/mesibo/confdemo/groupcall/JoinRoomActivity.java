package com.mesibo.confdemo.groupcall;

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
import android.widget.RadioButton;
import android.widget.Spinner;
import android.widget.TextView;

import com.mesibo.api.Mesibo;
import com.mesibo.api.MesiboGroupProfile;
import com.mesibo.api.MesiboProfile;
import com.mesibo.calls.api.MesiboCall;
import com.mesibo.confdemo.MainApplication;
import com.mesibo.confdemo.R;
import com.mesibo.confdemo.app.MessengerDemoAPI;

import java.util.ArrayList;

import static com.mesibo.api.MesiboGroupProfile.MESIBO_GROUPCALLFLAG_AUDIO;
import static com.mesibo.api.MesiboGroupProfile.MESIBO_GROUPCALLFLAG_SCREEN;
import static com.mesibo.api.MesiboGroupProfile.MESIBO_GROUPCALLFLAG_TALKING;
import static com.mesibo.api.MesiboGroupProfile.MESIBO_GROUPCALLFLAG_VIDEO;

public class JoinRoomActivity extends AppCompatActivity implements Mesibo.GroupListener {
    private static final String TAG = "JoinRoomActivity";

    private EditText mEnterRoomId = null;
    private EditText mEnterRoomPin = null;
    private EditText mEnterRoomName = null;

    private View mEnterRoomView = null;
    private View mMyRoomsView = null;
    private TextView mErrorEnterRoomView = null;

    private View mCreateRoomView = null;
    private Spinner mCreateRoomsResolutions = null;
    private int mSelectedResolution = Mesibo.RESOLUTION_DEFAULT;

    private ArrayList<MesiboProfile> mRoomsArray = new ArrayList<MesiboProfile>();
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
                        mSelectedResolution = Mesibo.RESOLUTION_DEFAULT;
                        break;
                    case RESOLUTION_STANDARD_STRING:
                        mSelectedResolution = Mesibo.RESOLUTION_VGA;
                        break;
                    case RESOLUTION_HD_STRING:
                        mSelectedResolution = Mesibo.RESOLUTION_HD;
                        break;
                    case RESOLUTION_FULL_HD_STRING:
                        mSelectedResolution = Mesibo.RESOLUTION_FHD;
                        break;
                    case RESOLUTION_4K_STRING:
                        mSelectedResolution = Mesibo.RESOLUTION_4K;
                        break;
                    case RESOLUTION_QVGA_STRING:
                        mSelectedResolution = Mesibo.RESOLUTION_QVGA;
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
        String gid_s = mEnterRoomId.getText().toString();
        String pin_s = mEnterRoomPin.getText().toString();

        if (gid_s.isEmpty() || pin_s.isEmpty())
            return;

        long gid = Integer.parseInt(gid_s);
        long pin = Integer.parseInt(pin_s);

        MesiboProfile profile = Mesibo.getProfile(gid);
        profile.getGroupProfile().join(pin, this);
    }

    public void onCreateRoom(View view) {
        String name = mEnterRoomName.getText().toString();

        if (name.isEmpty())
            return;

        MesiboGroupProfile.GroupSettings settings = new MesiboGroupProfile.GroupSettings();
        settings.name = name;
        settings.videoResolution = mSelectedResolution;

        /* video room without audio does not make sense */
        if(mVideo) {
           settings.flags = MESIBO_GROUPCALLFLAG_VIDEO | MESIBO_GROUPCALLFLAG_AUDIO;
        }
        else if(mAudio) {
           settings.flags = MESIBO_GROUPCALLFLAG_AUDIO;
        }

        settings.flags |= MESIBO_GROUPCALLFLAG_SCREEN | MESIBO_GROUPCALLFLAG_TALKING;

        Mesibo.createGroup(settings, this);
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

        setAvailableRooms();
    }

    private void setAvailableRooms() {
        ArrayList<MesiboProfile> profiles = Mesibo.getSortedUserProfiles();

        mRoomsArray.clear();
        mRoomsList.clear();
        for(int i=0; i< profiles.size(); i++){
            MesiboProfile profile = profiles.get(i);
            if(!profile.isGroup()) continue;


            String room_description = "Room #"+ profile.getGroupId() + ": "+ profile.getName();
            mRoomsList.add(room_description);
            mRoomsArray.add(profile);
        }

        mAdapter.notifyDataSetChanged();

        mRoomsListView.setOnItemClickListener((parent, view, position, id) -> {

            MesiboProfile profile = mRoomsArray.get(position);
            joinConferenceRoom(profile);
        });

    }

    private void showError(String error) {
        mErrorEnterRoomView.setVisibility(View.VISIBLE);
        mErrorEnterRoomView.setText(error);
    }

    private void hideError() {
        mErrorEnterRoomView.setVisibility(View.GONE);
    }

    private void joinConferenceRoom(MesiboProfile profile) {
        MesiboCall.getInstance().init(MainApplication.getAppContext());

        Intent intent = new Intent(MainApplication.getAppContext(), GroupCallActivity.class);
        intent.putExtra("gid", profile.getGroupId());
        intent.putExtra("videp", mVideo);
        intent.putExtra("audio", mAudio);
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
        MessengerDemoAPI.getInstance().forceLogout();
    }

    @Override
    public void Mesibo_onGroupCreated(MesiboProfile mesiboProfile) {
        MesiboGroupProfile.MemberPermissions permissions = new MesiboGroupProfile.MemberPermissions();
        permissions.flags = MesiboGroupProfile.MEMBERFLAG_ALL;
        mesiboProfile.getGroupProfile().addPin(permissions, this);
    }

    @Override
    public void Mesibo_onGroupJoined(MesiboProfile mesiboProfile) {
        joinConferenceRoom(mesiboProfile);
    }

    @Override
    public void Mesibo_onGroupLeft(MesiboProfile mesiboProfile) {

    }

    @Override
    public void Mesibo_onGroupMembers(MesiboProfile mesiboProfile, MesiboGroupProfile.Member[] members) {

    }

    @Override
    public void Mesibo_onGroupMembersJoined(MesiboProfile mesiboProfile, MesiboGroupProfile.Member[] members) {

    }

    @Override
    public void Mesibo_onGroupMembersRemoved(MesiboProfile mesiboProfile, MesiboGroupProfile.Member[] members) {

    }

    @Override
    public void Mesibo_onGroupSettings(MesiboProfile mesiboProfile, MesiboGroupProfile.GroupSettings groupSettings, MesiboGroupProfile.MemberPermissions memberPermissions, MesiboGroupProfile.GroupPin[] groupPins) {
        // we can create multiple pings here
        joinConferenceRoom(mesiboProfile);
    }

    @Override
    public void Mesibo_onGroupError(MesiboProfile mesiboProfile, long error) {
        if(MesiboGroupProfile.GROUPERROR_BADPIN == error) {
            showError("Incorrect RoomId or the PIN");
        }
    }
}
