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

#import "WelcomeViewController.h"
#import "MessengerDemoAPI.h"
#import "AppDelegate.h"

@interface WelcomeViewController ()

@end

@implementation WelcomeViewController

- (void)viewDidLoad {
    [super viewDidLoad];
    
    NSString *desc = @"This is an open-source video and voice conferencing app created using mesibo conferencing and streaming APIs.\n\nYou can download the entire source code from the mesibo GitHub repository https://github.com/mesibo/conferencing/, customize and brand it to your needs without any restrictions. \n\nThe documentation is available at https://mesibo.com/documentation/api/conferencing/ ";
    NSString *title = @"Open-Source Conferencing App";
    
    [self updateDescription:title desc:desc];
    
}

-(void) updateDescription:(NSString *)title desc:(NSString *)desc {
    if(title && title.length > 0)
        _mTitle.text = title;
    
    if(!desc || !desc.length) return;
    
    UIFont *font = [UIFont systemFontOfSize:17];
    NSMutableAttributedString *attributedString =
    [[NSMutableAttributedString alloc] initWithString:desc attributes:@{ NSFontAttributeName : font }];
    NSMutableParagraphStyle *paragraphStyle = [[NSMutableParagraphStyle alloc] init];
    [paragraphStyle setAlignment:NSTextAlignmentLeft];
    [paragraphStyle setLineSpacing:2];
    [attributedString addAttribute:NSParagraphStyleAttributeName value:paragraphStyle range:NSMakeRange(0, [attributedString length])];
    
    [_mDesc setAttributedText:attributedString];
    
    
}

- (IBAction)OnContinue:(id)sender {
    AppDelegate *appDelegate = (AppDelegate *)[[UIApplication sharedApplication] delegate];
    [appDelegate selectViewController];
}


@end
