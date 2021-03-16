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


#import "MesiboGroupCallController.h"
#import "MesiboCall/MesiboCall.h"
#import "GroupCallView.h"

@interface MesiboGroupCallController ()

@end

@implementation MesiboGroupCallController {
    GroupCallView *mView;
    uint32_t mGid;
    BOOL mViewLoaded;
    
}

- (void)viewDidLoad {
    [super viewDidLoad];
    // Do any additional setup after loading the view.
}

- (id)init {

    self = [super init];
    if (self) {
        self.modalPresentationStyle = UIModalPresentationFullScreen;
    }
    return self;
}

- (id)initWithGid:(uint32_t) gid {
    self = [super init];
    if (self) {
        self.modalPresentationStyle = UIModalPresentationFullScreen;
        mGid = gid;
    }
    return self;
}

- (void)loadView {
    
    //[super loadView];
    mViewLoaded = NO;
    mView = [[GroupCallView alloc] initWithGid:mGid controller:self frame:CGRectZero];
    //[mView setListener:self];
    self.view = mView;
   

    //Do this first before loading any views
    [MesiboCall checkPermissions:YES handler:^(BOOL granted) {
        if(granted) {
            [self start];
            return;
        }
        
        [Mesibo Log:@"Permission not granted"];
        
        [self dismissViewControllerAnimated:NO completion:nil];
    }];
        
}

- (void)start {
    if(mViewLoaded) return;
    mViewLoaded = YES;
    [mView startCall];
}
    
     

-(void) viewWillDisappear:(BOOL)animated {
    
    [super viewWillDisappear:animated];
    
   
    //[MesiboCallInstance hangup];
}

-(void) viewDidAppear:(BOOL)animated {
    
    [super viewDidAppear:animated];
    
    // we are doing it here since it requires start() to be called before answer
    
    
}

- (UIInterfaceOrientationMask)supportedInterfaceOrientations {
    return UIInterfaceOrientationMaskAll;
}


- (void)dismiss {
    [self dismissViewControllerAnimated:NO completion:^{
        
    }];
    
}


@end
