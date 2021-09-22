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

#import "ParticipantViewHolder.h"

@implementation ParticipantViewHolder {
    MesiboVideoView *mVideoView;
    MesiboParticipant *mStream;
    BOOL mVideo;
    BOOL mAudio;
    float mX, mY, mWidth, mHeight;
    UIView *mParent;
}
- (id)initWithParent:(UIView *)parent {
    
    self = [super init];
    if (self)
    {
        mParent = parent;
        [self reset];
    }
    return self;
}

-(void) reset {
    mStream = nil;
    mVideoView = [[MesiboVideoView alloc] initWithFrame:CGRectZero];
    [mVideoView scaleToFill:NO];
    mVideo = NO;
    mAudio = NO;
}

-(void) remove {
   // [mVideoView removeFromSuperview];
}

-(MesiboParticipant *) getParticipant {
    return mStream;
}

-(void) setParticipant:(MesiboParticipant *) p {
    [self reset];
    mStream = p;
    if(!mStream) return;
    
    ParticipantViewHolder *ovh = (ParticipantViewHolder *) [p getUserData];
    if(ovh && ovh != self) {
        if([ovh getParticipant] == mStream)
           [ovh setParticipant:nil];
    }
    
    [p setUserData:self];
    
}

-(void) setAudio:(BOOL) enable {
        mAudio = enable;
}

-(void) setVideo:(BOOL) enable {
        mVideo = enable;
        [self setStreamView];
}

-(void)setCoordinates:(int) position x:(float)x y:(float)y width:(float)width height:(float) height {
        mX = x;
        mY = y;
        mWidth = width;
        mHeight = height;
}

-(void) layout:(UIView *) parent {
        
    [parent addSubview:mVideoView];
    CGRect frame = CGRectMake(mX, mY, mWidth, mHeight);
    mVideoView.frame = frame;
}

-(void) setStreamView {
  

    if(mVideo && [mStream isVideoCall] && [mStream hasVideo]) {

        [mStream setVideoView:mVideoView];
        if([mStream isMe] && [mStream getVideoSource] != MESIBOCALL_VIDEOSOURCE_SCREEN)
           [mVideoView enableMirror:YES];
        }

        //setStreamControls();
    }

@end
