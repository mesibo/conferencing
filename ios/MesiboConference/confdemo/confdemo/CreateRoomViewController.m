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
#import "SampleAPI.h"
#import "AppAlert.h"

@interface CreateRoomViewController () {
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
    [self addResolution:@"Default" resolution:0];
    [self addResolution:@"Standard" resolution:2];
    [self addResolution:@"HD" resolution:3];
    [self addResolution:@"Full HD" resolution:4];
    [self addResolution:@"4K" resolution:5];
    
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
    
    [SampleAPIInstance createRoom:_mRoom.text resolutoon:r.resolution handler:^(int result, NSDictionary *response) {
        
        if(SAMPLEAPP_RESULT_OK != result) {
            [self showError:@"Create Failed"];
            return;
        }
        
        NSInteger gid = [[response objectForKey:@"gid"] longValue];
        
        
        [self dismissViewControllerAnimated:NO completion:^{
            [mParent groupCallUi:gid video:YES publish:YES];
        }];
        
        
        
    }];
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
