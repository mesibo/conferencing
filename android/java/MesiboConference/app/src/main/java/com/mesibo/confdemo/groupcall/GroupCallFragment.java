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

import android.annotation.SuppressLint;
import android.content.Context;
import android.content.DialogInterface;
import android.content.Intent;
import android.os.Bundle;
import android.os.Handler;
import android.support.v4.app.Fragment;
import android.support.v7.app.AlertDialog;
import android.util.Log;
import android.view.Gravity;
import android.view.LayoutInflater;
import android.view.Menu;
import android.view.View;
import android.view.ViewGroup;
import android.widget.FrameLayout;
import android.widget.ImageButton;
import android.widget.TextView;
import android.widget.Toast;

import com.mesibo.api.Mesibo;
import com.mesibo.calls.api.MesiboCall;
import com.mesibo.calls.api.MesiboCallActivity;
import com.mesibo.confdemo.R;
import com.mesibo.confdemo.app.AppConfig;
import com.mesibo.confdemo.app.SampleAPI;
import com.mesibo.confdemo.app.UIManager;
import com.mesibo.messaging.MesiboUI;
import com.mesibo.messaging.MesiboUserListFragment;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.Iterator;
import java.util.Map;
import java.util.concurrent.ConcurrentLinkedQueue;


// Refer to https://mesibo.com/documentation/api/conferencing/listeners

public class GroupCallFragment extends Fragment implements MesiboCall.GroupCallListener, MesiboCall.GroupCallInProgressListener, Mesibo.MessageListener, View.OnClickListener, ParticipantViewHolder.Listener, Mesibo.UIHelperListner{
    public static final String TAG = "MesiboCallFragment";
    private long mGid = 0;
    private Mesibo.UserProfile mGroupProfile = null;
    private SampleAPI.Room mRoom = null;

    private MesiboCall.MesiboGroupCall mGroupcall = null; // TBD, move to call manager
    private MesiboCall.MesiboParticipant mLocalPublisher = null;

    // All participants in the conference, who are publishing their streams
    public ArrayList<MesiboCall.MesiboParticipant> mPublishers = new ArrayList<>();

    //LinkedBlockingQueue<ParticipantViewHolder> mViewHolders = new LinkedBlockingQueue<ParticipantViewHolder>();
    private ConcurrentLinkedQueue<ParticipantViewHolder> mViewHolders = new ConcurrentLinkedQueue<ParticipantViewHolder>();
    private ArrayList<ParticipantViewHolder> mStreams = new ArrayList<>();

    private GroupCallView mGridView = null;

    protected void setGroup(long gid) {
        mGid = gid;
    }

    protected void setRoom(SampleAPI.Room room){
        if(room == null)
            return;

        mRoom = room;

        mGroupProfile = new Mesibo.UserProfile();
        mGroupProfile.address = null;
        mGroupProfile.groupid = mRoom.gid;
        mGroupProfile.name = mRoom.name;

        Mesibo.setUserProfile(mGroupProfile, false);
    }

    private boolean isGroupCallStarted = false;
    private long mTalkTs = 0;
    private MesiboCall.MesiboParticipant mFullScreenParticipant = null;

    @Override
    public View onCreateView(LayoutInflater inflater, ViewGroup container, Bundle savedInstanceState) {
        int layout_id = R.layout.grid_layout;
        View view = inflater.inflate(layout_id, container, false);
        FrameLayout mFrame = (FrameLayout) view.findViewById(R.id.streams_grid);


        mGroupcall = MesiboCall.getInstance().groupCall((MesiboCallActivity) getActivity(), mGid);
        if(mGroupcall == null) {
            Log.d(TAG, "Unable to place call to group");
            return null;
        }

        // Message Listener has been implemented here
        Mesibo.addListener(this);



        mGridView = new GroupCallView(getActivity(), mFrame, mGroupcall);

        setRoom(SampleAPI.getActiveRoom());
        if(mRoom == null)
            return view;

        if(mRoom.pin.isEmpty() || mRoom.spin.isEmpty()){
            // Only creators of the room can invite participants
            // Hide button otherwise
            view.findViewById(R.id.layout_invite_participant).setVisibility(View.GONE);
        }

        setupButtons(view);

        if(mRoom.video) {
            //We are currently not doing video only call, audio or audio+video
            mRoom.audio = true;
        }

        resetUserProfiles();

        return view;
    }

    private void resetUserProfiles(){
        HashMap<String, Mesibo.UserProfile > profiles = Mesibo.getUserProfiles();
        Iterator pIterator = profiles.entrySet().iterator();

        while (pIterator.hasNext()){
            Map.Entry ele = (Map.Entry)pIterator.next();
            Mesibo.UserProfile p = (Mesibo.UserProfile) ele.getValue();
            Mesibo.deleteUserProfile(p, true, true);
        }

        profiles = Mesibo.getUserProfiles();
    }

    @SuppressLint("NonConstantResourceId")
    @Override
    public void onClick(View v) {
        final int id = v.getId();
        switch (id) {
            case R.id.button_hangup:
                onLocalHangup(v);
                break;

            case R.id.button_toggle_audio:
                onLocalToggleAudioMute(v);
                break;

            case R.id.button_toggle_video:
                onLocalToggleVideoMute(v);
                break;

            case R.id.button_switch_camera:
                onLocalSwitchCamera(v);
                break;

            case R.id.button_switch_source:
                onLocalSwitchSource(v);
                break;

            case R.id.button_group_message:
                onLaunchGroupMessagingUi(v);
                break;

            case R.id.button_invite_participant:
                onInvite(v);
                break;

            case R.id.button_list_participants:
                onListParticipants(v);
                break;

        }
    }



    private void setupButtons(View view) {
        if (view == null)
            return;

        ImageButton hangupButton = view.findViewById(R.id.button_hangup);
        ImageButton toggleAudioButton = view.findViewById(R.id.button_toggle_audio);
        ImageButton toggleVideoButton = view.findViewById(R.id.button_toggle_video);
        ImageButton switchCameraButton = view.findViewById(R.id.button_switch_camera);
        ImageButton switchSourceButton = view.findViewById(R.id.button_switch_source);
        ImageButton inviteParticipantButton = view.findViewById(R.id.button_invite_participant);
        ImageButton groupMessagingButton = view.findViewById(R.id.button_group_message);
        ImageButton listParticipantsButton = view.findViewById(R.id.button_list_participants);

        hangupButton.setOnClickListener(this);
        toggleAudioButton.setOnClickListener(this);
        toggleVideoButton.setOnClickListener(this);
        switchCameraButton.setOnClickListener(this);
        switchSourceButton.setOnClickListener(this);
        inviteParticipantButton.setOnClickListener(this);
        groupMessagingButton.setOnClickListener(this);
        listParticipantsButton.setOnClickListener(this);

    }


    private void onLocalHangup(View view){
        if (mLocalPublisher == null)
            return;

        // Here, we are removing all participants and hanging up the group call if self decides to hangup
        // But, the conference is still running(Until the owner of the conference room hangs up)
        // So, you may hangup only the local participant and remove the local stream.
        // For example,
        // mLocalParticipant.hangup();
        // mPublishers.remove(mLocalParticipant);

        //Confirm before exiting
        new AlertDialog.Builder(getContext())
                .setMessage("Do you want to exit the room?")
                .setCancelable(false)
                .setPositiveButton("Yes", new DialogInterface.OnClickListener() {
                    public void onClick(DialogInterface dialog, int id) {
                        getActivity().onBackPressed();
                    }
                })
                .setNegativeButton("No", null)
                .show();
    }

    private void onLocalToggleAudioMute(View view){
        if (mLocalPublisher == null)
            return;

        mLocalPublisher.toggleAudioMute();

        // focus audio muted button
        view.setAlpha(mLocalPublisher.getMuteStatus(false) ? 1.0f : 0.3f);

        MesiboGroupcall_OnMute(mLocalPublisher,
                mLocalPublisher.getMuteStatus(false), mLocalPublisher.getMuteStatus(true), false);
    }

    private void onLocalToggleVideoMute(View view){
        if (mLocalPublisher == null)
            return;

        mLocalPublisher.toggleVideoMute();

        // focus video muted button
        view.setAlpha(mLocalPublisher.getMuteStatus(true) ? 1.0f : 0.3f);

        MesiboGroupcall_OnMute(mLocalPublisher,
                mLocalPublisher.getMuteStatus(false), mLocalPublisher.getMuteStatus(true), false);
    }

    private void onLocalSwitchCamera(View view){
        if(mLocalPublisher == null)
            return;

        mLocalPublisher.switchCamera();
    }

    private void onLocalSwitchSource(View view){
        if(mLocalPublisher == null)
            return;

        mLocalPublisher.switchSource();

        int source = mLocalPublisher.getVideoSource();
        int icon = -1;
        if(MesiboCall.MESIBOCALL_VIDEOSOURCE_SCREEN == source){
            icon = R.drawable.ic_baseline_camera_alt_24;
        }
        else {
            icon = R.drawable.ic_mesibo_screen_sharing;
        }

        ImageButton switchSourcebutton = (ImageButton)view;
        switchSourcebutton.setImageResource(icon);
    }

    public void onLaunchGroupMessagingUi(View view) {
        MesiboUI.Config opt = MesiboUI.getConfig();
        opt.mToolbarColor = 0xff00868b;
        MesiboUI.launchMessageView(getActivity(), null, mGroupProfile.groupid);
    }

    public void onInvite(View view){
        Intent sharingIntent = new Intent(android.content.Intent.ACTION_SEND);
        sharingIntent.setType("text/plain");
        sharingIntent.putExtra(android.content.Intent.EXTRA_SUBJECT, "Invite Participant");
        sharingIntent.putExtra(android.content.Intent.EXTRA_TEXT, getInviteText());
        getContext().startActivity(Intent.createChooser(sharingIntent, "Invite"));
    }

    private void onListParticipants(View v) {
        Bundle bundle = new Bundle();
        bundle.putLong("groupid", mRoom.gid);

        MesiboUI.Config opt = MesiboUI.getConfig();
        opt.mToolbarColor = 0xff00868b;
        opt.selectContactTitle = "Participants";
        opt.createGroupTitle = null;

        UIManager.launchParticipantList(getActivity(), 0, MesiboUserListFragment.MODE_SELECTCONTACT, 0, bundle);
 }


    private String getInviteText(){
        if(mRoom == null)
            return "";
        String invite = String.format( "Join my room with Room-ID:%s  and pin: %s", mRoom.gid, mRoom.pin);

        return invite;
    }

    private void showToastNotification(String message, String title){
        if(null == message || message.isEmpty())
            return;


        LayoutInflater inflater = getLayoutInflater();
        View layout = inflater.inflate(R.layout.message_toast, getView().findViewById(R.id.message_toast_container));

        if(null!= title && !title.isEmpty()){
            TextView titleText = (TextView) layout.findViewById(R.id.title);
            titleText.setText(title);
        }
        TextView text = (TextView) layout.findViewById(R.id.text);
        text.setText(message);


        Toast toast = new Toast(getContext());
        toast.setView(layout);
        toast.setDuration(Toast.LENGTH_LONG);
        toast.setGravity(Gravity.BOTTOM | Gravity.CENTER, 0, 200);

        toast.show();
    }

    private void startGroupCall(){
        if(mGroupcall == null) {
            Log.d(TAG, "call instance is null!");
            return;
        }

        mGroupcall.join(this);
        isGroupCallStarted = true;


        setRoom(SampleAPI.getActiveRoom());
        if(mRoom == null)
            return;

        if(mRoom.publish != 1) {
            //User does not have the permission to publish
            return;
        }
        //Publish self stream
        mLocalPublisher = mGroupcall.createPublisher(0);
        mLocalPublisher.setVideoSource(MesiboCall.MESIBOCALL_VIDEOSOURCE_CAMERAFRONT, 0);

        mLocalPublisher.call(mRoom.audio, mRoom.video, this);
        mLocalPublisher.setName(AppConfig.getConfig().name);
        mPublishers.add(mLocalPublisher);
        Log.d(TAG, "Publishing Self");
    }

    @Override
    public void onResume() {
        super.onResume();
        if(!isGroupCallStarted)
            startGroupCall();
    }

    @Override
    public void onPause() {
        super.onPause();
        // mGroupcall.leave();
    }

    public void onBackPressed() {
        mGroupcall.leave();
    }

    public static int getParticipantPosition(ArrayList<MesiboCall.MesiboParticipant> pl, MesiboCall.MesiboParticipant p) {
        if (pl == null || pl.isEmpty() || p == null)
            return -1;

        for (int i = 0; i < pl.size(); i++) {
            MesiboCall.MesiboParticipant sp = pl.get(i);
            if (sp.getId() == p.getId()) {
                return i;
            }
        }

        return -1;
    }



    public MesiboCall.MesiboParticipant removeParticipant(MesiboCall.MesiboParticipant p){
        ParticipantViewHolder vh = getViewHolder(p);
        int i = getParticipantPosition(mPublishers, p);
        if(i >= 0) {
            mPublishers.remove(i);
            ParticipantViewHolder.deleteParticipantProfile(p);
        }

        if(p == mFullScreenParticipant) {
            mFullScreenParticipant = null;
        }

        if(null != vh) {
            mStreams.remove(vh);
            //mViewHolders.add(vh);
        }

        return p;
    }

    private ParticipantViewHolder getViewHolder(MesiboCall.MesiboParticipant participant) {
        return (ParticipantViewHolder) participant.getUserData();
    }

    public ParticipantViewHolder createViewHolder(MesiboCall.MesiboParticipant p) {
        ParticipantViewHolder vh = getViewHolder(p);
        if(null != vh)
            return vh;

        //vh = mViewHolders.poll();
        vh = null;
        if(null == vh ) {
            vh = new ParticipantViewHolder(getActivity(), this);
        }

        mStreams.add(vh);
        //p.setUserData(vh); // let vh do it
        vh.setParticipant(p);

        return vh;
    }

    private void showParticipantNotification(MesiboCall.MesiboParticipant participant, boolean joined){
        String message = "";

        if(joined) {
            if (participant.getSid() > 0)
                message = participant.getName() + " is sharing the screen " + participant.getSid();
            else
                message = participant.getName() + " has joined the room";
        } else {
            if (participant.getSid() > 0)
                message = participant.getName() + " has stopped sharing the screen " + participant.getSid();
            else
                message = participant.getName() + " has left the room";
        }

        showToastNotification(message, "Notification");
    }

    // Called when a participant starts/stops publishing a stream.
    // Here, depending on your conferencing app logic, you can decide whether to view them or not.
    // If you decide to view a publisher, you can subscribe to them
    @Override
    public void MesiboGroupcall_OnPublisher(MesiboCall.MesiboParticipant participant, boolean joined) {
        Log.d(TAG, "MesiboGroupcall_OnPublisher Name: " + participant.getName() + " id: " + participant.getId() + " action " + joined);

        showParticipantNotification(participant, joined);

        if (joined) {

            mGroupcall.playInCallSound(getContext(), R.raw.join, false);
            int pos = getParticipantPosition(mPublishers, participant);
            if(pos >= 0)
                mPublishers.set(pos, participant);
            else
                mPublishers.add(participant);

            participant.call(mRoom.audio, mRoom.video , this);

        } else {
            removeParticipant(participant);
        }


    }

    // Called when a participant starts/stops viewing your stream,
    @Override
    public void MesiboGroupcall_OnSubscriber(MesiboCall.MesiboParticipant p, boolean joined) {
        Log.d(this.TAG, "MesiboGroupcall_OnSubscriber" + p.toString() + " action: " + joined);
        if(joined)
            ParticipantViewHolder.setParticipantProfile(p);
        else
            ParticipantViewHolder.deleteParticipantProfile(p);
    }

    // Called when the active audio device is changed by a user action,
    // for example, headset inserted, Bluetooth was turned ON, active audio device changes from an earpiece to a speaker, etc
    @Override
    public void MesiboGroupcall_OnAudioDeviceChanged(MesiboCall.AudioDevice audioDevice, MesiboCall.AudioDevice audioDevice1) {

    }

    // Called when a participant mutes their audio or video.
    // You can use MesiboParticipant.getMuteStatus() to know about the current mute status of a participant.
    @Override
    public void MesiboGroupcall_OnMute(MesiboCall.MesiboParticipant participant, boolean audioMuted, boolean videoMuted, boolean remote) {
        Log.d(TAG, "MesiboGroupcall_OnMute" + participant.toString() + " audio: " + audioMuted + " video: " + videoMuted + "remote: " + remote + " isUiThread: "+ Mesibo.isUiThread());
        ParticipantViewHolder vh = getViewHolder(participant);
        if(null != vh) vh.refresh();
    }

    // Called when the remote participant hangs up.
    @Override
    public void MesiboGroupcall_OnHangup(MesiboCall.MesiboParticipant participant, int reason) {
        if(MesiboCall.MESIBOCALL_HANGUP_REASON_REMOTE == reason)
            showParticipantNotification(participant, false);

        removeParticipant(participant);
        if(null == mFullScreenParticipant)
            mGridView.setStreams(mStreams);
    }

    @Override
    public void ParticipantViewHolder_onFullScreen(MesiboCall.MesiboParticipant p, boolean fullScreen) {

        if(!fullScreen) {
            mFullScreenParticipant = null;
            mGridView.setStreams(mStreams);
            return;
        }

        mFullScreenParticipant = p;
        ArrayList<ParticipantViewHolder> fsp = new ArrayList<>();
        fsp.add(getViewHolder(p));
        mGridView.setStreams(fsp);

    }

    @Override
    public void ParticipantViewHolder_onHangup(MesiboCall.MesiboParticipant p) {
        p.hangup();
        MesiboGroupcall_OnHangup(p, MesiboCall.MESIBOCALL_HANGUP_REASON_USER);
    }

    @Override
    public int ParticipantViewHolder_onStreamCount() {
        return mStreams.size();
    }


    // After subscribing to a participant,
    // MesiboGroupcall_OnConnected will be called when connection is established
    // When, there is connection issue and the participant's stream is disconnected(not hangup), connected will be false
    @Override
    public void MesiboGroupcall_OnConnected(MesiboCall.MesiboParticipant participant, boolean connected) {
        Log.d(TAG, "MesiboGroupcall_OnConnected Name: " + participant.getName() + " Address: " + participant.getAddress());

        //mAdapter.setStreamChanged(participant);
    }

    // Talk Detection
    // Called when the participant starts/stops talking
    @Override
    public void MesiboGroupcall_OnTalking(MesiboCall.MesiboParticipant participant, boolean talking) {
        ParticipantViewHolder vh = getViewHolder(participant);

        if(mStreams.size() > 6 && (Mesibo.getTimestamp() - mTalkTs) > 5000) {
            mTalkTs = Mesibo.getTimestamp();
            mGridView.setStreams(mStreams);
            return;
        }

        if(null != vh) vh.refresh();

    }

    // Called when the publisher changes their video source.
    // For example, from camera feed to sharing their screen.
    // Or from their front-facing camera to rear-facing camera (on Mobile)
    @Override
    public void MesiboGroupcall_OnVideoSourceChanged(int source, int index) {
        Log.d(TAG, "MesiboGroupcall_OnVideoSourceChanged");
    }

    // Called when you receive video from a participant who you have subscribed to.
    // It is also called when any aspect of the video changes.
    // For example, changes in aspect ratio, if video changes to landscape, etc.
    // You can update the UI used to display the video accordingly for such changes.
    @Override
    public void MesiboGroupcall_OnVideo(MesiboCall.MesiboParticipant participant, float aspect_ratio, boolean available) {
        Log.d(TAG, "MesiboGroupcall_OnVideo Name: " + participant.getName() + " isMe:" + participant.isMe() + " id: "+ participant.getId() + " Address: " + participant.getAddress() + " aspect ratio: " + aspect_ratio + " hasVideo: " + participant.hasVideo() + " landscape: "+ participant.isVideoLandscape()+ " isVideoCall: " + participant.isVideoCall());
        ParticipantViewHolder vh = createViewHolder(participant);
        vh.setVideo(true);
        mGridView.setStreams(mStreams);
    }

    // Called when you receive audio from a participant who you have subscribed to.
    @Override
    public void MesiboGroupcall_OnAudio(MesiboCall.MesiboParticipant participant) {

        Log.d(TAG, "MesiboGroupcall_OnAudio Name: " + participant.getName() + " isMe:" + participant.isMe() + " id: "+ participant.getId() + " Address: " + participant.getAddress() + " hasVideo: " + participant.hasVideo() + " landscape: "+ participant.isVideoLandscape()+ " videoMuted: " + participant.getMuteStatus(true) + " audioMuted: "+ participant.getMuteStatus(false) );
        ParticipantViewHolder vh = getViewHolder(participant);

        if(null == vh) {
            vh = createViewHolder(participant);
            vh.setAudio(true);
            mGridView.setStreams(mStreams); // in audio case, we need relayout only if it does not exists
        } else {
            vh.setAudio(true);
        }
    }


    @Override
    public boolean Mesibo_onMessage(Mesibo.MessageParams params, byte[] data) {
        try {
            String message = new String(data, "UTF-8");
            if(message == null || message.isEmpty())
                return false;

            Mesibo.UserProfile profile = null;
            profile = Mesibo.getUserProfile(params.peer);

            Log.d(TAG, "Mesibo_onMessage: "+ message);
            String title = "";
            if (params.groupid > 0) {
                title = "New Group Message from "+ profile.name;
            } else {
                title = "New Message from "+ profile.name;
            }

            if(params.groupid != mRoom.gid)
                return false;

            showToastNotification(message, title);

        } catch (Exception e) {
        }

        return true;
    }

    @Override
    public void Mesibo_onMessageStatus(Mesibo.MessageParams params) {
        if(params.peer.isEmpty() || params.mid == 0)
            return;

      Log.d(TAG, "Mesibo_onMessageStatus: "+ params.getStatus() + " id: "+ params.mid + " peer: "+ params.peer);
    }

    @Override
    public void Mesibo_onActivity(Mesibo.MessageParams messageParams, int i) {

    }

    @Override
    public void Mesibo_onLocation(Mesibo.MessageParams messageParams, Mesibo.Location location) {

    }

    @Override
    public void Mesibo_onFile(Mesibo.MessageParams messageParams, Mesibo.FileInfo fileInfo) {

    }


//    UI Helper Listener
    @Override
    public void Mesibo_onForeground(Context context, int i, boolean b) {

    }

    @Override
    public void Mesibo_onShowProfile(Context context, Mesibo.UserProfile userProfile) {

    }

    @Override
    public void Mesibo_onDeleteProfile(Context context, Mesibo.UserProfile userProfile, Handler handler) {

    }

    @Override
    public int Mesibo_onGetMenuResourceId(Context context, int i, Mesibo.MessageParams messageParams, Menu menu) {
        return 0;
    }

    @Override
    public boolean Mesibo_onMenuItemSelected(Context context, int i, Mesibo.MessageParams messageParams, int i1) {
        return false;
    }

    @Override
    public void Mesibo_onSetGroup(Context context, long l, String s, int i, String s1, String s2, String[] strings, Handler handler) {

    }

    @Override
    public void Mesibo_onGetGroup(Context context, long l, Handler handler) {

    }

    @Override
    public ArrayList<Mesibo.UserProfile> Mesibo_onGetGroupMembers(Context context, long l) {
        return null;
    }
}
