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


#import "GroupCallView.h"

#import "Mesibo/Mesibo.h"
#import "MesiboCall/MesiboCall.h"

#import "MesiboGroupCallController.h"

@interface GroupCallView () <MesiboGroupCallListener, MesiboGroupCallInProgressListener, MesiboParticipantSortListener>
@end

@implementation GroupCallView {
    uint32_t mGid;
    MesiboGroupCall *mGc;
    NSMutableArray *mPublishers;
    NSMutableArray *mStreams;
    MesiboParticipant *mFullScreenParticipant;
    MesiboGroupCallController *mController;
    float mWidth, mHeight;
}

-(void) initVideoView:(MesiboVideoView *)v {
    
}

/* In this simple example, we are creating four views. In a real-app,
 you create views on deman
 
 */
- (instancetype) initWithGid:(uint32_t)gid controller:(MesiboGroupCallController *)controller frame:(CGRect)frame {
    mGid = gid;
    mController = controller;
    mPublishers = [NSMutableArray new];
    mStreams = [NSMutableArray new];
    
    self = [super initWithFrame:frame];
    
    
    //[MesiboCallInstance gro]
    
    return self;
}


- (void)layoutSubviews {
    CGRect bounds = self.bounds;
    
    //float x = CGRectGetMinX(bounds);
    //float y = CGRectGetMinY(bounds);
    mWidth = CGRectGetMaxX(bounds);
    mHeight = CGRectGetMaxY(bounds);
    
}

- (void)startCall {
    /* create a group call instance and join the room */
    mGc = [MesiboCallInstance groupCall:self groupid:mGid];
    [mGc join:self];
    
    /* publish streams */
    MesiboParticipant *p = [mGc createPublisher:0];
    [p setVideoSource:MESIBOCALL_VIDEOSOURCE_CAMERAFRONT index:0];
    [mPublishers addObject:p];
    [p call:YES video:YES listener:self];
    
}

-(ParticipantViewHolder *) getViewHolder:(MesiboParticipant *) participant {
    return (ParticipantViewHolder *) [participant getUserData];
}

-(ParticipantViewHolder *)createViewHolder:(MesiboParticipant *) p {
    ParticipantViewHolder *vh = [self getViewHolder:p];
    if(vh) return vh;
    vh = [ParticipantViewHolder new];
    
    [mStreams addObject:vh];
    
    //p.setUserData(vh); // let vh do it
    [vh setParticipant:p];
    
    return vh;
}

-(int)getParticipantPosition:(NSArray *)pl p:(MesiboParticipant *)p {
    if (!pl||  !pl.count || !p)
        return -1;
    
    for (int i = 0; i < pl.count; i++) {
        MesiboParticipant *sp = [pl objectAtIndex:i];
        if ([sp getId] == [p getId]) {
            return i;
        }
    }
    
    return -1;
}

-(MesiboParticipant *)removeParticipant:(MesiboParticipant *) p {
    ParticipantViewHolder *vh = [self getViewHolder:p];
    int i = [self getParticipantPosition:mPublishers p:p];
    if(i >= 0)
        [mPublishers removeObject:p];
    
    if(p == mFullScreenParticipant) {
        mFullScreenParticipant = nil;
    }
    
    if(vh) {
        [mStreams removeObject:vh];
    }
    
    [vh remove];
    
    return p;
}

-(void) removeAllViews {
    for(int i=0; i < self.subviews.count; i++) {
        UIView *v = [self.subviews objectAtIndex:i];
        if(v) [v removeFromSuperview];
    }
}

-(void) onHangup:(id)sender {
    [mGc leave];
    [mController dismiss];
}

-(void) addHangupButton {
    CGFloat size = 60.0f;
    UIButton *button = [UIButton buttonWithType:UIButtonTypeCustom];
    button.backgroundColor = [UIColor clearColor];
    button.layer.borderColor = [[UIColor redColor] CGColor];
    button.layer.borderWidth = 2;
    button.layer.cornerRadius = size / 2;
    button.layer.masksToBounds = YES;
    
    [button addTarget:self action:@selector(onHangup:) forControlEvents:UIControlEventTouchUpInside];
        
    
    button.frame = CGRectMake((mWidth-size)/2, mHeight-100, size, size);
    [self addSubview:button];
    
}

-(void) setStreams {
        //mFrameLayout.removeAllViewsInLayout();
    if(0 == mStreams.count) {
        [self removeAllViews];
        return;
    }
    
    NSArray *sorted = [mGc sortStreams:self views:mStreams width:mWidth height:mHeight start:0 size:mStreams.count params:nil];
    
    [self removeAllViews];
    // we can put some layout on top to avoid flicker
    
    for(int i=0; i < sorted.count; i++) {
        ParticipantViewHolder *vh = (ParticipantViewHolder *) [sorted objectAtIndex:i];
        //vh.setStreamControls();
        [vh layout:self];
    }
    
    [self addHangupButton];
}

- (void)MesiboGroupCall_OnAudioDeviceChanged:(int)active inactive:(int)inactive {
    
}

- (void)MesiboGroupcall_OnPublisher:(MesiboParticipant * _Nonnull)p joined:(BOOL)joined {
    
    /* we got a new publisher, subscribe to them*/
    if (joined) {
        // mGroupcall.playInCallSound(getContext(), R.raw.join, false);
        int pos = [self getParticipantPosition:mPublishers p:p];
        if(pos >= 0) {
            [mPublishers removeObjectAtIndex:pos];
        }
        [mPublishers addObject:p];
        [p call:YES video:(YES) listener:self];;
        
    } else {
        [self removeParticipant:p];
        [self setStreams];
    }
    
}

- (void)MesiboGroupcall_OnSubscriber:(MesiboParticipant * _Nonnull)p joined:(BOOL)joined {
    
}


- (void)MesiboGroupcall_OnConnected:(MesiboParticipant * _Nonnull)p connected:(BOOL)connected {
    
}

- (void)MesiboGroupcall_OnHangup:(MesiboParticipant * _Nonnull)p reason:(int)reason {
    
}

- (void)MesiboGroupcall_OnMute:(MesiboParticipant * _Nonnull)p audio:(BOOL)audio video:(BOOL)video remote:(BOOL)remote {
    
}

- (void)MesiboGroupcall_OnTalking:(MesiboParticipant * _Nonnull)p talking:(BOOL)talking {
    
}

- (void)MesiboGroupcall_OnVideo:(MesiboParticipant * _Nonnull)p aspectRatio:(float)aspectRatio landscape:(BOOL)landscape {
    
    ParticipantViewHolder *vh = [self createViewHolder:p];
    [vh setVideo:YES];
    
    [self setStreams];
    
}

-(void) MesiboGroupcall_OnAudio:(MesiboParticipant *)p {
    ParticipantViewHolder *vh = [self getViewHolder:p];
    
    if(!vh) {
        vh = [self createViewHolder:p];
        [vh setAudio:YES];
        [self setStreams]; // in audio case, we need relayout only if it does not exists
    } else {
        [vh setAudio:YES];
    }
}

- (void)MesiboGroupcall_OnVideoSourceChanged:(int)source index:(int)index {
    
}

- (MesiboParticipant * _Nonnull)ParticipantSort_onGetParticipant:(id _Nonnull)o {
    ParticipantViewHolder *pv = (ParticipantViewHolder *)o;
    return [pv getParticipant];
}

- (void)ParticipantSort_onSetCoordinates:(id _Nonnull)o position:(int)position x:(float)x y:(float)y width:(float)width height:(float)height {
    ParticipantViewHolder *pv = (ParticipantViewHolder *)o;
    [pv setCoordinates:position x:x y:y width:width height:height];
    
    
}


@end



