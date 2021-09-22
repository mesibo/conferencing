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

#import "CreateRoomViewController.h"
#import "MessengerDemoAPI.h"
#import "AppAlert.h"
#import "Mesibo/Mesibo.h"


@interface CreateRoomViewController () <MesiboDelegate> {
    NSMutableArray *mResolutions;
    NSInteger mSelectedResolution;
    JoinRoomViewController *mParent;
}

@end

@implementation CreateRoomViewController 

-(void) addResolution:(NSString *)name resolution:(uint32_t)resolution {
    Resolution *r = [Resolution new];
    r.name = name;
    r.resolution = resolution;
    [mResolutions addObject:r];
}

-(void) showError:(NSString *) error {
    [AppAlert showDialogue:error withTitle:@"Error"];
}

- (void)viewDidLoad {
    [super viewDidLoad];
    mResolutions = [NSMutableArray new];
    [self addResolution:@"Default" resolution:MESIBO_RESOLUTION_DEFAULT];
    [self addResolution:@"Standard" resolution:MESIBO_RESOLUTION_VGA];
    [self addResolution:@"HD" resolution:MESIBO_RESOLUTION_HD];
    [self addResolution:@"Full HD" resolution:MESIBO_RESOLUTION_FHD];
    [self addResolution:@"4K" resolution:MESIBO_RESOLUTION_4K];
    
    mSelectedResolution = 0;
    _mResolutionPicker.dataSource = self;
    _mResolutionPicker.delegate = self;
    
}

-(void) setParent:(JoinRoomViewController *)jvc {
    mParent = jvc;
}

- (IBAction)onCreateRoom:(id)sender {
    if(_mRoom.text.length < 3) {
        [self showError:@"missing or too short room Name"];
        return;;
    }
    
    Resolution *r = [mResolutions objectAtIndex:mSelectedResolution];
    
    MesiboGroupSettings *settings = [MesiboGroupSettings new];
    settings.name = _mRoom.text;
    settings.videoResolution = r.resolution;
    [MesiboInstance createGroup:settings listener:self];
}

-(void) Mesibo_onGroupCreated:(MesiboProfile *)groupProfile {
    /* Room has been created, now create a PIN so that we can invite users. You can create multiple
       PINS with different permissions if requires
     */
    MesiboMemberPermissions *mp = [MesiboMemberPermissions new];
    mp.flags = MESIBO_MEMBERFLAG_ALL;
    [[groupProfile getGroupProfile] addPin:mp listener:self];
}

-(void) Mesibo_onGroupJoined:(MesiboProfile *)groupProfile {
    
}

-(void) Mesibo_onGroupSettings:(MesiboProfile *)groupProfile settings:(MesiboGroupSettings *)settings permissions:(MesiboMemberPermissions *)permissions pins:(NSArray<MesiboGroupPin *> *)pins {
    
    /* We now have a PIN, let's start the conference */
    [self dismissViewControllerAnimated:NO completion:^{
        [mParent groupCallUi:[groupProfile getGroupId] video:YES];
    }];
}

-(void) Mesibo_onGroupError:(MesiboProfile *)groupProfile error:(uint32_t)error {
    
}

    
- (NSInteger)numberOfComponentsInPickerView:(UIPickerView *)pickerView {
        return 1;
}

- (NSInteger)pickerView:(UIPickerView *)pickerView  numberOfRowsInComponent:(NSInteger)component {
    return mResolutions.count;
}
    
- (NSString *)pickerView:(UIPickerView *)pickerView titleForRow:(NSInteger)row forComponent:(NSInteger)component {
    Resolution *r = [mResolutions objectAtIndex:row];
    return r.name;
}

- (void)pickerView:(UIPickerView *)pickerView didSelectRow:(NSInteger)row inComponent:(NSInteger)component API_UNAVAILABLE(tvos) {
    mSelectedResolution = row;
}

@end

@implementation Resolution
@end
