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

#import "GroupCallUIView.h"

#import "Mesibo/Mesibo.h"
#import "MesiboCall/MesiboCall.h"

#import "GroupCallController.h"
#import "MesiboUI/MesiboUI.h"
#import "AppAlert.h"

@interface GroupCallUIView () <MesiboGroupCallListener, MesiboGroupCallInProgressListener, MesiboParticipantSortListener, MesiboDelegate>
@end

@implementation GroupCallUIView {
    uint32_t mGid;
    MesiboGroupCall *mGc;
    NSMutableArray *mPublishers;
    NSMutableArray *mStreams;
    MesiboParticipant *mFullScreenParticipant;
    GroupCallController *mController;
    MesiboParticipant *mSelfParticipant;
    float mWidth, mHeight;
    UIColor *mBorderColor, *mStopColor;
    NSString *mInvite;
    MesiboProfile *mProfile;
    
    MesiboGroupSettings *mSettings;
    MesiboMemberPermissions *mPermissions;
    NSArray<MesiboGroupPin *> *mPins;
}

-(void) initVideoView:(MesiboVideoView *)v {
    
}

- (instancetype) initWithGid:(uint32_t)gid controller:(GroupCallController *)controller frame:(CGRect)frame {
    mGid = gid;
    mController = controller;
    mPublishers = [NSMutableArray new];
    mStreams = [NSMutableArray new];
    mBorderColor = [UIColor lightGrayColor];
    mStopColor = [UIColor redColor];
    mProfile = [MesiboInstance getGroupProfile:mGid];
    mSettings = nil;
    mPermissions = nil;
    mPins = nil;
    
    self = [super initWithFrame:frame];
    
    return self;
}


- (void)layoutSubviews {
    CGRect bounds = self.bounds;
    
    //float x = CGRectGetMinX(bounds);
    //float y = CGRectGetMinY(bounds);
    mWidth = CGRectGetMaxX(bounds);
    mHeight = CGRectGetMaxY(bounds);
    
}

-(void) initCall {
    [[mProfile getGroupProfile] getSettings:self];
}

-(void) Mesibo_onGroupSettings:(MesiboProfile *)groupProfile settings:(MesiboGroupSettings *)settings permissions:(MesiboMemberPermissions *)permissions pins:(NSArray<MesiboGroupPin *> *)pins {
    mSettings = settings;
    mPermissions = permissions;
    if(pins && pins.count)
        mPins = pins;
    
    [MesiboInstance runInThread:YES handler:^{
        [self startCall];
    }];
    
}

-(void) Mesibo_onGroupError:(MesiboProfile *)groupProfile error:(uint32_t)error {
    //[AppAl]
    [AppAlert showDialogue:@"Group Call Error" withTitle:@"Not a member"];
}

- (void)startCall {
    /* create a group call instance and join the room */
    mGc = [MesiboCallInstance groupCall:self groupid:mGid];
    [mGc join:self];
    
    if(!(mPermissions.flags&MESIBO_MEMBERFLAG_PUBL))
        return;
    
    /* publish streams */
    mSelfParticipant = [mGc createPublisher:0];
    [mSelfParticipant setVideoSource:MESIBOCALL_VIDEOSOURCE_CAMERAFRONT index:0];
    [mPublishers addObject:mSelfParticipant];
    [mSelfParticipant call:YES video:YES listener:self];
    
}

-(ParticipantViewHolder *) getViewHolder:(MesiboParticipant *) participant {
    return (ParticipantViewHolder *) [participant getUserData];
}

-(ParticipantViewHolder *)createViewHolder:(MesiboParticipant *) p {
    ParticipantViewHolder *vh = [self getViewHolder:p];
    if(vh) return vh;
    vh = [ParticipantViewHolder new];
    
    [mStreams addObject:vh];
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

-(void) onToggleAudioMute:(id)sender {
    BOOL mute = [mSelfParticipant toggleAudioMute];
    UIButton *button = (UIButton *)sender;
    button.layer.borderColor = mute?[mStopColor CGColor]:[mBorderColor CGColor];

}

-(void) onToggleVideoMute:(id)sender {
    BOOL mute = [mSelfParticipant toggleVideoMute];
    UIButton *button = (UIButton *)sender;
    button.layer.borderColor = mute?[mStopColor CGColor]:[mBorderColor CGColor];
}

-(void) onSwitchCamera:(id)sender {
    [mSelfParticipant switchCamera];
}

-(void) onInvite:(id)sender {
    if(!mPins || !mPins.count) return;
    MesiboGroupPin *pin = nil;
    for(int i=0; i < mPins.count; i++) {
        pin = [mPins objectAtIndex:i];
        if(pin.permissions.flags&MESIBO_MEMBERFLAG_PUBL)
            break;
    }
    
    NSString *invite = [NSString stringWithFormat:@"Hey, join my open-source mesibo conference room (%@) from the Web or your Android or iPhone mobile phone. Use the following credentials: Room ID: %u, Pin: %u", [mProfile getName], [mProfile getGroupId], pin.pin];

    
    [self shareText:invite parent:mController];
}

-(void) onMessageButton:(id)sender {
    MesiboUiOptions *opt = [MesiboUI getUiOptions];
    opt.enableBackButton = YES;
    opt.createGroupTitle = nil;
    opt.emptyUserListMessage = @"No active conversations! Click on the message icon to send a message";
    
    UIViewController *vc = [MesiboUI getMesiboUIViewController];
    
    UINavigationController *navigationController =
        [[UINavigationController alloc] initWithRootViewController:vc];

    navigationController.modalPresentationStyle = UIModalPresentationFullScreen;
    
    
    [mController presentViewController:navigationController animated:NO completion:nil];
}


-(UIButton *) addButtonWithSize:(SEL)sel image:(UIImage *)image color:(UIColor *)color size:(CGFloat)size border:(BOOL)border{
    
    UIButton *button = [UIButton buttonWithType:UIButtonTypeCustom];
    button.backgroundColor = border?[UIColor clearColor]:color;
    button.layer.cornerRadius = size / 2;
    button.layer.masksToBounds = YES;
    [button setImage:image forState:UIControlStateNormal];
    if(border) {
        button.layer.borderColor = [color CGColor];
        button.layer.borderWidth = 2;
    }
    
    if(sel)
        [button addTarget:self action:sel forControlEvents:UIControlEventTouchUpInside];
    
    [self addSubview:button];
    return button;
}

-(UIImage *) getImage:(NSString *)name {
    NSBundle *bundle = [NSBundle mainBundle];
    return  [UIImage imageNamed:name inBundle:bundle compatibleWithTraitCollection:nil];
}

-(void) addControlButtons {
    
    int count = mPins?6:5;
    
    CGFloat size = mWidth / (count + 2); // +2 for margin
    if(size > 60) size = 60;
    CGFloat bottom = mHeight - (size + 20);
    
    CGFloat margin = (mWidth - size*count)/(count+1);
    CGFloat x = margin/2;
    CGFloat offset = margin + size;
    
    UIButton *button = [self addButtonWithSize:@selector(onHangup:) image:[self getImage:@"ic_call_white"] color:mStopColor size:size border:NO];
    button.frame = CGRectMake(x, bottom, size, size);
    
    x += offset;
    button = [self addButtonWithSize:@selector(onToggleAudioMute:) image:[self getImage:@"ic_mic_off_white"] color:mBorderColor size:size border:YES];
    button.frame = CGRectMake(x, bottom, size, size);
    
    x += offset;
    button = [self addButtonWithSize:@selector(onToggleVideoMute:) image:[self getImage:@"ic_videocam_off_white"] color:mBorderColor size:size border:YES];
    button.frame = CGRectMake(x, bottom, size, size);
    
    x += offset;
    button = [self addButtonWithSize:@selector(onSwitchCamera:) image:[self getImage:@"ic_switch_video_white"] color:mBorderColor size:size border:YES];
    button.frame = CGRectMake(x, bottom, size, size);
    
    x += offset;
    button = [self addButtonWithSize:@selector(onMessageButton:) image:[self getImage:@"ic_message_white"] color:mBorderColor size:size border:YES];
    button.frame = CGRectMake(x, bottom, size, size);
    
    if(mPins) {
        x += offset;
        button = [self addButtonWithSize:@selector(onInvite:) image:[self getImage:@"ic_group_add_white"] color:mBorderColor size:size border:YES];
        button.frame = CGRectMake(x, bottom, size, size);
    }
    
    
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
    
    [self addControlButtons];
}


- (void)MesiboGroupCall_OnAudioDeviceChanged:(int)active inactive:(int)inactive {
    
}

- (void)MesiboGroupcall_OnPublisher:(MesiboParticipant * _Nonnull)p joined:(BOOL)joined {
    
    /* we got a new publisher, subscribe to them*/
    if (joined) {
        //[self createMesiboProfile:p];
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
        
        //Note, here you may remove profile if you only want to show
        //online users
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

- (void)MesiboGroupcall_OnVideoSourceChanged:(MesiboParticipant *)p source:(int)source index:(int)index {
    
}

- (MesiboParticipant * _Nonnull)ParticipantSort_onGetParticipant:(id _Nonnull)o {
    ParticipantViewHolder *pv = (ParticipantViewHolder *)o;
    return [pv getParticipant];
}

- (void)ParticipantSort_onSetCoordinates:(id _Nonnull)o position:(int)position x:(float)x y:(float)y width:(float)width height:(float)height {
    ParticipantViewHolder *pv = (ParticipantViewHolder *)o;
    [pv setCoordinates:position x:x y:y width:width height:height];
    
    
}

BOOL shareInProgress = NO;
-(void)shareText:(NSString *)textToShare parent:(UIViewController *)parent {
    
    if(shareInProgress)
        return;
    
    shareInProgress = YES;
    NSArray *objectsToShare = [NSArray arrayWithObjects:textToShare, nil];
    
    UIActivityViewController *activityVC = [[UIActivityViewController alloc] initWithActivityItems:objectsToShare applicationActivities:nil];
    
    activityVC.excludedActivityTypes = @[UIActivityTypePrint,  UIActivityTypeAssignToContact, UIActivityTypeSaveToCameraRoll]; //Exclude
    
    //dispatch_async(dispatch_get_main_queue(), ^ {
    [parent presentViewController:activityVC animated:YES completion:^ {
        shareInProgress = NO;
    }];
   
}


@end



