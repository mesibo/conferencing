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


#import "LoginViewController.h"
#import "JoinRoomViewController.h"
#import "MessengerDemoAPI.h"
#import "AppAlert.h"
#import "Mesibo/Mesibo.h"
#import "AppDelegate.h"

@interface LoginViewController () {
    CGFloat m_x, m_y;
    CGFloat m_width, m_height;
    UILabel *mTitle;
    UILabel *mInfo;
}

@end

@implementation LoginViewController


- (void)viewDidLoad {
    [super viewDidLoad];
    
    _mOtp.hidden = YES;
   
}

-(void) addView:(CGFloat)top hmargin:(CGFloat)hmargin height:(CGFloat)height view:(UIView *)view {
    
    CGFloat width = m_width - 2*hmargin;
    
    CGRect frame = CGRectMake(m_x + hmargin, m_y + top, width, height);
    m_y += top + height;
    view.frame = frame;
}

- (void)layoutSubviews {
    return;
    //if(mLayoutDone) return;
    //mLayoutDone = YES;
    CGRect bounds = self.view.bounds;
    CGFloat xmin = CGRectGetMinX(bounds);
    CGFloat xmax = CGRectGetMaxX(bounds);
    CGFloat ymin = CGRectGetMinY(bounds);
    CGFloat ymax = CGRectGetMaxY(bounds);
    m_width = xmax - xmin;
    m_height = ymax - ymin;
    
    m_x = xmin;
    m_y = ymin;
    
    //[self addView:100 hmargin:20 height:200 view:m_title];
        
}

-(void) launchJoinRoom {
    AppDelegate *appDelegate = (AppDelegate *)[[UIApplication sharedApplication] delegate];
    [appDelegate selectViewController];
}

-(void) showError:(NSString *) error {
    [AppAlert showDialogue:error withTitle:@"Error"];
}

- (IBAction)onLogin:(id)sender {
    
    if(_mName.text.length < 3) {
        [self showError:@"missing or too short name"];
        return;;
    }
    
    if(_mPhone.text.length < 8 || (NSNotFound == [_mPhone.text rangeOfString:@"+"].location)) {
        [self showError:@"Enter Phone number with Country code. For example, +18885551234"];
        return;
    }
    
    [MessengerDemoAPIInstance login:_mName.text phone:_mPhone.text code:_mOtp.text handler:^(BOOL result, LoginResponse *response) {
        
        if(!result) {
            [self showError:@"Login Failed. Bad Phone or the PIN"];
            return;
        }
        
        _mOtp.hidden = NO;
        
        if(response.title && response.message && response.message.length > 0) {
            [AppAlert showDialogue:response.message withTitle:response.title];
        }
        
        if(response.token) {
            [self launchJoinRoom];
            return;
        }
        
    }];
    
}


@end
