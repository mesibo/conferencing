package com.mesibo.confdemo.groupcall;

import android.content.Context;
import android.graphics.Color;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.FrameLayout;
import android.widget.ImageButton;
import android.widget.ImageView;
import android.widget.RelativeLayout;
import android.widget.TextView;

import com.mesibo.api.Mesibo;
import com.mesibo.api.MesiboProfile;
import com.mesibo.calls.api.MesiboCall;
import com.mesibo.calls.api.MesiboVideoView;
import com.mesibo.confdemo.R;
import com.mesibo.messaging.MesiboUI;

public class ParticipantViewHolder implements View.OnClickListener {
    private final TextView nameView;
    private ImageView mIndicatorView;
    private final MesiboVideoView mVideoView;

    private final RelativeLayout mControls;
    MesiboCall.MesiboParticipant mStream = null;
    boolean mFullScreen = false;
    private Listener mListener = null;

    private boolean mVideo = false;
    private boolean mAudio = false;

    private float mX, mY, mWidth, mHeight;

    public interface Listener {
        void ParticipantViewHolder_onFullScreen(MesiboCall.MesiboParticipant p, boolean fullScreen);
        void ParticipantViewHolder_onHangup(MesiboCall.MesiboParticipant p);
        int ParticipantViewHolder_onStreamCount();
    }


    // Buttons
    ImageButton toggleAudioMuteButton;
    ImageButton toggleVideoMuteButton;
    ImageButton toggleFullScreenButton;
    ImageButton messageButton;
    ImageButton hangupButton;

    private MesiboCall.MesiboGroupCall mGroupcall = null;
    private boolean mAdminMode = false;

    private final View mView;
    public ParticipantViewHolder(Context context, Listener listener, MesiboCall.MesiboGroupCall groupCall) {
        LayoutInflater inflater1 = (LayoutInflater) context.getSystemService(Context.LAYOUT_INFLATER_SERVICE);
        mGroupcall = groupCall;
        mListener = listener;
        mView = inflater1.inflate(R.layout.participant_layout, null);

        nameView = mView.findViewById(R.id.participant_name);
        mVideoView = mView.findViewById(R.id.participant_stream_view);
        mControls = mView.findViewById(R.id.stream_controls);
        mIndicatorView = mView.findViewById(R.id.participant_indicator);

        toggleAudioMuteButton = mView.findViewById(R.id.button_stream_toggle_audio);
        toggleVideoMuteButton = mView.findViewById(R.id.button_stream_toggle_video);
        toggleFullScreenButton = mView.findViewById(R.id.button_stream_toggle_fullscreen);
        messageButton = mView.findViewById(R.id.button_stream_message);
        hangupButton = mView.findViewById(R.id.button_stream_hangup);

        toggleAudioMuteButton.setOnClickListener(this);
        toggleVideoMuteButton.setOnClickListener(this);
        toggleFullScreenButton.setOnClickListener(this);
        messageButton.setOnClickListener(this);
        hangupButton.setOnClickListener(this);

        mVideoView.scaleToFill(true);
    }

    private void reset() {

    }

    public MesiboCall.MesiboParticipant getParticipant() {
        return mStream;
    }

    public void setParticipant(MesiboCall.MesiboParticipant p) {
        reset();
        mStream = p;
        if(null == mStream) return;

        ParticipantViewHolder ovh = (ParticipantViewHolder) p.getUserData();
        if(null != ovh && ovh != this) {
            if(ovh.getParticipant() == mStream)
                ovh.setParticipant(null);
        }

        p.setUserData(this);
        // initialize view with participant properties
        String name = p.getName();
        if(p.isMe())
            name = "You";

        if(!name.isEmpty())
            nameView.setText(name);

        setStreamIndicators();
        setStreamView();
        setParticipantProfile(getParticipant());
    }

    public static void setParticipantProfile(MesiboCall.MesiboParticipant participant) {
        MesiboProfile user = Mesibo.getProfile(participant.getAddress());

    }

    public static boolean deleteParticipantProfile(MesiboCall.MesiboParticipant p){
        MesiboProfile profile = Mesibo.getProfile(p.getAddress());
        if(profile == null)
            return false; //Profile doesn't exist

        //profile.remove();
        return true;
    }

    public void setAudio(boolean enable) {
        mAudio = enable;
    }

    public void setVideo(boolean enable) {
        mVideo = enable;
        setStreamView();
    }

    public void refresh() {
        setStreamIndicators();
    }

    public void setFullScreen(boolean fullScreen) {
        mFullScreen = false;
    }

    @Override
    public void onClick(View v) {
        if(null == mStream) return;

        final int id = v.getId();
        switch (id) {
            case R.id.button_stream_toggle_audio:
                onToggleStreamAudioMute(v);
                break;

            case R.id.button_stream_toggle_video:
                onToggleStreamVideoMute(v);
                break;

            case R.id.button_stream_toggle_fullscreen:
                onToggleStreamFullScreen(v);
                break;

            case R.id.button_stream_message:
                onLaunchMessagingUi(v);
                break;

            case R.id.button_stream_hangup:
                onStreamHangup(v);
                break;
        }
    }


    public void setCoordinates(int position, float x, float y, float width, float height) {
        mX = x;
        mY = y;
        mWidth = width;
        mHeight = height;
    }

    public void layout(FrameLayout frameLayout) {
        //mView.setX(mX);
        //mView.setY(mY);
        FrameLayout.LayoutParams params = new FrameLayout.LayoutParams(
                FrameLayout.LayoutParams.WRAP_CONTENT,
                FrameLayout.LayoutParams.WRAP_CONTENT
        );
        params.setMargins((int)mX, (int)mY, 0, 0);
        params.height = (int)mHeight;
        params.width = (int) mWidth;
        frameLayout.addView(mView, params);
    }

    private void onToggleStreamAudioMute(View view){
        boolean status;
        if(mAdminMode) {
            MesiboCall.MesiboParticipantAdmin admin = mStream.getAdmin();
            if(null == admin) return;
            status = admin.toggleAudioMute();
        } else {
            mStream.toggleAudioMute();
            status = mStream.getMuteStatus(false);
        }

        int id = status?R.drawable.ic_mesibo_mic_off:R.drawable.ic_mesibo_mic;
        view.setBackgroundResource(id);
    }

    private void onToggleStreamVideoMute(View view){
        boolean status;
        if(mAdminMode) {
            MesiboCall.MesiboParticipantAdmin admin = mStream.getAdmin();
            if(null == admin) return;
            status = admin.toggleVideoMute();
        } else {
            mStream.toggleVideoMute();
            status = mStream.getMuteStatus(false);
        }

        int id = status?R.drawable.ic_mesibo_videocam_off:R.drawable.ic_mesibo_videocam;
        view.setBackgroundResource(id);

    }

    private void onToggleStreamFullScreen(View view){
        mFullScreen = !mFullScreen;
        mListener.ParticipantViewHolder_onFullScreen(getParticipant(), mFullScreen);
    }

    public void onLaunchMessagingUi(View view) {
        MesiboCall.MesiboParticipant p = getParticipant();
        MesiboUI.Config opt = MesiboUI.getConfig();
        opt.mToolbarColor = 0xff00868b;
        MesiboUI.launchMessageView(view.getContext(), p.getAddress(), 0);
    }

    private void onStreamHangup(View view){
        if(mAdminMode) {
            MesiboCall.MesiboParticipantAdmin admin = mStream.getAdmin();
            if (null == admin) return;
            admin.hangup();
            return;
        }
        mListener.ParticipantViewHolder_onHangup(getParticipant());
    }

    protected void stopVideoView() {
        mVideoView.stop();
    }

    public void setHeight(float height){
        if(height <0)
            return;

        ViewGroup.LayoutParams params = mView.getLayoutParams();
        params.height = (int) height;
        mView.setLayoutParams(params);
    }


    private void setStreamView(){
        //TBD. hide video view and show placeholder
        //setHeight

        if(mVideo && mStream.isVideoCall() && mStream.hasVideo()) {

            mStream.setVideoView(mVideoView);
            if(mStream.isMe() && mStream.getVideoSource() != MesiboCall.MESIBOCALL_VIDEOSOURCE_SCREEN)
                mVideoView.enableMirror(true);
        }

        setStreamControls();
    }

    private void setStreamIndicators(){

        boolean isAudioMuted = mStream.getMuteStatus(false);
        boolean isVideoMuted = mStream.getMuteStatus(true);
        boolean isTalking = mStream.isTalking();

        int indicatorId = -1;
        int color = Color.argb(200, 200, 0, 0);

        if(isAudioMuted){
            indicatorId = R.drawable.ic_mesibo_mic_off;
        }

        if(isVideoMuted){
            indicatorId = R.drawable.ic_mesibo_videocam_off;
        }

        if(isAudioMuted && isVideoMuted){
            indicatorId = R.drawable.ic_mesibo_tv_off;
        }

        if(isTalking){
            indicatorId = R.drawable.ic_mesibo_volume_up;
            color = Color.argb(200, 0, 200, 0);
        }

        if(indicatorId > -1) {
            mIndicatorView.setColorFilter(color);
            mIndicatorView.setImageResource(indicatorId);
            mIndicatorView.setVisibility(View.VISIBLE);
        } else {
            mIndicatorView.setVisibility(View.GONE);
        }
    }

    private void setButtonColors(boolean admin) {
        if(admin) {
            int color = Color.argb(200, 200, 0, 0);
            toggleAudioMuteButton.setColorFilter(color);
            toggleVideoMuteButton.setColorFilter(color);
            hangupButton.setColorFilter(color);
            toggleFullScreenButton.setColorFilter(color);
        } else {
            toggleAudioMuteButton.clearColorFilter();
            toggleVideoMuteButton.clearColorFilter();
            hangupButton.clearColorFilter();
            toggleFullScreenButton.clearColorFilter();
        }

    }
    public void setStreamControls(){
        if(!mFullScreen) {
            if (mStream.isMe()) {
                hangupButton.setVisibility(View.GONE);
                messageButton.setVisibility(View.GONE);
            }

            if (mListener.ParticipantViewHolder_onStreamCount() < 2)
                toggleFullScreenButton.setVisibility(View.GONE);
            else
                toggleFullScreenButton.setVisibility(View.VISIBLE);
        }

        int fullScreenIcon = -1;
        if(mFullScreen) {
            fullScreenIcon = R.drawable.ic_baseline_fullscreen_exit_24;
        } else {
            fullScreenIcon = R.drawable.ic_baseline_fullscreen_24;
        }

        if(fullScreenIcon > -1)
            toggleFullScreenButton.setImageResource(fullScreenIcon);

        mVideoView.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                mAdminMode = false;
                int visible = mControls.getVisibility();
                if(visible == View.GONE) {
                    setButtonColors(false);
                    mControls.setVisibility(View.VISIBLE);
                }
                else
                    mControls.setVisibility(View.GONE);
            }
        });

        mVideoView.setOnLongClickListener(new View.OnLongClickListener() {
            @Override
            public boolean onLongClick(View v) {

                if(!mGroupcall.hasAdminPermissions(false)) return true;

                if (mStream.isMe()) return true;

                mAdminMode = true;
                setButtonColors(true);
                mControls.setVisibility(View.VISIBLE);
                return true;
            }
        });
    }

}
