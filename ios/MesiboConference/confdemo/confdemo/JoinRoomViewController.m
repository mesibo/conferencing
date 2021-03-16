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
#import "SampleAPI.h"
#import "Mesibo/Mesibo.h"
#import "MesiboGroupCallController.h"
#import "CreateRoomViewController.h"



@interface JoinRoomViewController () {
    NSMutableArray *mRooms;
}

@end

@implementation JoinRoomViewController

- (void)viewDidLoad {
    [super viewDidLoad];
    mRooms = [NSMutableArray new];
    _mRoomsTable.hidden = YES;
    _mOtherRoomLabel.hidden = YES;
    _mOtherRoomDescLabel.hidden = YES;
    // Do any additional setup after loading the view.
    
    [SampleAPIInstance getRooms:^(int result, NSDictionary *response) {
        
        if(SAMPLEAPP_RESULT_OK != result) {
            return;
        }
        [self showOtherRooms:response];
        
    }];
}

-(void)showOtherRooms:(NSDictionary *) response {
    NSArray *rooms = [response objectForKey:@"rooms"];
    if(!rooms || !rooms.count)
        return;
    
    for(int i=0; i < rooms.count; i++) {
        NSDictionary *d = [rooms objectAtIndex:i];
        Room *r = [Room new];
        r.name = [d objectForKey:@"name"];
        r.pin = [d objectForKey:@"pin"];
        r.spin = [d objectForKey:@"spin"];
        r.gid = [d objectForKey:@"gid"];
        r.uid = (uint32_t) strtoul([[d objectForKey:@"uid"] UTF8String], NULL, 10);
        
        [mRooms addObject:r];
    }
    
    _mOtherRoomLabel.hidden = NO;
    _mRoomsTable.hidden = NO;
    _mOtherRoomDescLabel.hidden = NO;
    [_mRoomsTable reloadData];
}

-(void) showError:(NSString *) error {
    [AppAlert showDialogue:error withTitle:@"Error"];
}

-(BOOL) groupCallUi:(uint32_t)gid video:(BOOL)video publish:(BOOL)publish {
    MesiboGroupCallController *vc = [[MesiboGroupCallController alloc] initWithGid:gid];
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

-(void) joinRoom:(NSString *)gid pin:(NSString *)pin {
    
    [SampleAPIInstance joinRoom:gid pin:pin handler:^(int result, NSDictionary *response) {
        
        if(SAMPLEAPP_RESULT_OK != result) {
            [self showError:@"Joining Room Failed"];
            return;
        }
        
        [self groupCallUi:gid video:YES publish:YES];
        
    }];
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
        [self showError:@"missing or bad Pin"];
        return;
    }
    
    [self joinRoom:_mRoom.text pin:_mPin.text];
}

- (NSInteger)tableView:(UITableView *)tableView numberOfRowsInSection:(NSInteger)section {
    return [mRooms count];
}


- (UITableViewCell *)tableView:(UITableView *)tableView cellForRowAtIndexPath:(NSIndexPath *)indexPath
{
    static NSString *simpleTableIdentifier = @"SimpleTableItem";
 
    UITableViewCell *cell = [tableView dequeueReusableCellWithIdentifier:simpleTableIdentifier];
 
    if (cell == nil) {
        cell = [[UITableViewCell alloc] initWithStyle:UITableViewCellStyleDefault reuseIdentifier:simpleTableIdentifier];
    }
    
    Room *room = (Room *)[mRooms objectAtIndex:indexPath.row];
    NSString *title = [NSString stringWithFormat:@"Room #%u: %@", room.gid, room.name];
 
    cell.textLabel.text = title;
    cell.textLabel.textColor = [UIColor systemBlueColor];
    return cell;
}

- (void)tableView:(UITableView *)tableView didSelectRowAtIndexPath:(NSIndexPath *)indexPath {
    Room *room = (Room *)[mRooms objectAtIndex:indexPath.row];
    [_mRoomsTable deselectRowAtIndexPath:indexPath animated:NO];
    
    NSString *pin = room.pin;
    if(!pin || !pin.length)
        pin = room.spin;
    
    [self groupCallUi:100531 video:YES publish:YES];
    //[self joinRoom:room.gid pin:pin];
}

@end

@implementation Room
@end
