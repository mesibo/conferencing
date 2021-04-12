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

import android.app.Activity;
import android.os.Build;
import android.util.DisplayMetrics;
import android.util.Log;
import android.view.Display;
import android.view.ViewGroup;
import android.widget.FrameLayout;

import com.mesibo.calls.api.MesiboCall;

import java.util.ArrayList;

public class GroupCallView implements MesiboCall.MesiboParticipantSortListener {
    public static final String TAG = "GroupCallAdapter";

    private FrameLayout mFrameLayout;
    private float mWidth = 0;
    private float mHeight = 0;

    // Full Screen Mode
    private boolean mFullScreenMode = false;
    private MesiboCall.MesiboGroupCall mGroupCall = null;


    public GroupCallView(Activity activity, FrameLayout frameLayout, MesiboCall.MesiboGroupCall groupCall) {

        ViewGroup.LayoutParams params = frameLayout.getLayoutParams();

        mWidth = params.width;
        mHeight = params.height;

        if(mWidth < 0 || mHeight < 0) {
            DisplayMetrics metrics = getDisplayMetrics(activity);
            if(metrics != null) {
                if(mWidth < 0)
                    mWidth = metrics.widthPixels;
                if(mHeight < 0)
                    mHeight = metrics.heightPixels;
            }
        }
        mFrameLayout = frameLayout;
        mGroupCall = groupCall;
    }


    public void setStreams(ArrayList<ParticipantViewHolder> views) {
        for (int i=0; i < views.size(); i++){
            Log.d(TAG, "setStreams " + views.get(i).toString());
        }

        mFrameLayout.removeAllViewsInLayout();

        ArrayList<Object> sorted = (ArrayList<Object>) mGroupCall.sort(this, views, mWidth, mHeight, 0, 8, null);

        // we can put some layout on top to avoid flicker

        for(int i=0; i < sorted.size(); i++) {
            ParticipantViewHolder vh = (ParticipantViewHolder) sorted.get(i);
            vh.setStreamControls();
            vh.layout(mFrameLayout);
        }
    }

    @Override
    public MesiboCall.MesiboParticipant ParticipantSort_onGetParticipant(Object o) {
        ParticipantViewHolder vh = (ParticipantViewHolder)o;
        return vh.getParticipant();
    }

    @Override
    public void ParticipantSort_onSetCoordinates(Object o, int position, float x, float y, float width, float height) {
        ParticipantViewHolder vh = (ParticipantViewHolder)o;
        vh.setCoordinates(position, x, y, width, height);
    }

    private DisplayMetrics getDisplayMetrics(Activity activity){
        if(activity == null)
            return  null;

        Display display = activity.getWindowManager().getDefaultDisplay();

        DisplayMetrics metrics = new DisplayMetrics();
        if (Build.VERSION.SDK_INT >= 17) {
            display.getRealMetrics(metrics);
        } else {
            display.getMetrics(metrics);
        }

        return metrics;

    }

}
