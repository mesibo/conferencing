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
#import "JoinRoomViewController.h"
#import "AppAlert.h"
#import "MessengerDemoAPI.h"
#import "Mesibo/Mesibo.h"
#import "GroupCallController.h"
#import "CreateRoomViewController.h"
#import "Mesibo/Mesibo.h"



@interface JoinRoomViewController () <MesiboDelegate> {
    NSMutableArray *mProfiles;
    int mProfileRetries;
}

@end

@implementation JoinRoomViewController

- (void)viewDidLoad {
    [super viewDidLoad];
    mProfiles = [NSMutableArray new];
    _mRoomsTable.hidden = YES;
    _mOtherRoomLabel.hidden = YES;
    _mOtherRoomDescLabel.hidden = YES;
    mProfileRetries = 2;
    // Do any additional setup after loading the view.

}

-(void) viewWillAppear:(BOOL)animated {
    [self showOtherRooms];
}

-(void)showOtherRooms {
    NSArray *profiles = [MesiboInstance getSortedProfiles];
    
    if(!profiles || !profiles.count) {
        // if login was just done, sync maybe in progress, try again after say 5 seconds
        if(mProfileRetries > 0 && [MessengerDemoAPIInstance isLoginAttempted]) {
            mProfileRetries--;
            dispatch_time_t delay = dispatch_time(DISPATCH_TIME_NOW, 5 * NSEC_PER_SEC);
            dispatch_after(delay, dispatch_get_main_queue(), ^(void){
                [self showOtherRooms];
            });
        }
        return;
    }
    
    [mProfiles removeAllObjects];
    
    for(int i=0; i < profiles.count; i++) {
        MesiboProfile *profile = [profiles objectAtIndex:i];
        if(![profile isGroup]) continue;
        [mProfiles addObject:profile];
    }
    
    _mOtherRoomLabel.hidden = NO;
    _mRoomsTable.hidden = NO;
    _mOtherRoomDescLabel.hidden = NO;
    [_mRoomsTable reloadData];
}

-(void) showError:(NSString *) error {
    [AppAlert showDialogue:error withTitle:@"Error"];
}

-(BOOL) groupCallUi:(uint32_t)gid video:(BOOL)video {
    GroupCallController *vc = [[GroupCallController alloc] initWithGid:gid];
    vc.modalPresentationStyle = UIModalPresentationFullScreen;
    
    UIViewController *me = self;
    [MesiboInstance runInThread:YES handler:^{
        [me presentViewController:vc animated:YES completion:nil];
    }];
    
    return YES;
}

- (IBAction)OnCreate:(id)sender {
    UIStoryboard *storyboard = [UIStoryboard storyboardWithName:@"Main" bundle:nil];
    CreateRoomViewController *vc = [storyboard instantiateViewControllerWithIdentifier:@"createRoom"];
    [vc setParent:self];
    
    [self presentViewController:vc animated:NO completion:nil];
}

-(void)joinRoom:(NSString *)gid pin:(NSString *)pin {
    uint32_t gid_i  = (uint32_t) strtoul([gid UTF8String], NULL, 10);
    uint32_t pin_i  = (uint32_t) strtoul([pin UTF8String], NULL, 10);
    
    MesiboProfile *profile = [MesiboInstance getGroupProfile:gid_i];
    [[profile getGroupProfile] join:pin_i listener:self];
}

-(void) Mesibo_onGroupJoined:(MesiboProfile *)groupProfile {
    [self groupCallUi:[groupProfile getGroupId] video:YES];
}

-(void) Mesibo_onGroupError:(MesiboProfile *)groupProfile error:(uint32_t)error {
    
}


- (IBAction)OnJoin:(id)sender {
    uint32_t gid = 0;
    
    if(_mRoom.text.length > 3)
        gid = (uint32_t) strtoul([_mRoom.text UTF8String], NULL, 10);
    
    if(!gid) {
        [self showError:@"missing or too short room ID"];
        return;;
    }
    
    if(_mPin.text.length < 6) {
        [self showError:@"missing or bad PIN"];
        return;
    }
    
    [self joinRoom:_mRoom.text pin:_mPin.text];
}

- (NSInteger)tableView:(UITableView *)tableView numberOfRowsInSection:(NSInteger)section {
    return [mProfiles count];
}


- (UITableViewCell *)tableView:(UITableView *)tableView cellForRowAtIndexPath:(NSIndexPath *)indexPath
{
    static NSString *simpleTableIdentifier = @"SimpleTableItem";
 
    UITableViewCell *cell = [tableView dequeueReusableCellWithIdentifier:simpleTableIdentifier];
 
    if (cell == nil) {
        cell = [[UITableViewCell alloc] initWithStyle:UITableViewCellStyleDefault reuseIdentifier:simpleTableIdentifier];
    }
    
    MesiboProfile *profile = [mProfiles objectAtIndex:indexPath.row];
    NSString *title = [NSString stringWithFormat:@"Room #%u: %@", [profile getGroupId], [profile getName]];
 
    cell.textLabel.text = title;
    cell.textLabel.textColor = [UIColor systemBlueColor];
    return cell;
}

- (void)tableView:(UITableView *)tableView didSelectRowAtIndexPath:(NSIndexPath *)indexPath {
    MesiboProfile *profile = [mProfiles objectAtIndex:indexPath.row];
    [_mRoomsTable deselectRowAtIndexPath:indexPath animated:NO];

    [self groupCallUi:[profile getGroupId] video:YES];
}

@end
