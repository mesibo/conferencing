//
//  MesiboUI.h
//  MesiboUI
//
//  Copyright © 2018 Mesibo. All rights reserved.
//
#ifndef __MESIBOUI_H
#define __MESIBOUI_H
#import <Foundation/Foundation.h>
#import <UIKit/UIKit.h>
#import "Mesibo/Mesibo.h"
//#import "UITableViewWithReloadCallback.h"

@interface MesiboCell : UITableViewCell {
    
}
@end

@protocol MesiboMessageViewDelegate <NSObject>
@required
- (UITableView *) getMesiboTableView;
- (CGFloat)MesiboTableView:(UITableView *)tableView heightForMessage:(MesiboMessage *)message;
- (MesiboCell *)MesiboTableView:(UITableView *)tableView cellForMessage:(MesiboMessage *)message;
- (MesiboCell *)MesiboTableView:(UITableView *)tableView show:(MesiboMessage *)message;
@optional
@end

@interface MesiboUiOptions : NSObject
@property (nonatomic) UIImage *contactPlaceHolder;
@property (nonatomic) UIImage *messagingBackground;

@property (nonatomic) BOOL useLetterTitleImage;

@property (nonatomic) BOOL enableVoiceCall;
@property (nonatomic) BOOL enableVideoCall;
@property (nonatomic) BOOL enableForward;
@property (nonatomic) BOOL enableSearch;
@property (nonatomic) BOOL enableBackButton;
@property (nonatomic) BOOL enableMessageButton;

@property (copy, nonatomic) NSString *messageListTitle;
@property (copy, nonatomic) NSString *userListTitle;
@property (copy, nonatomic) NSString *createGroupTitle;
@property (copy, nonatomic) NSString *selectContactTitle;
@property (copy, nonatomic) NSString *selectGroupContactsTitle;
@property (copy, nonatomic) NSString *forwardTitle;

@property (copy, nonatomic) NSString *userOnlineIndicationTitle;
@property (copy, nonatomic) NSString *onlineIndicationTitle;
@property (copy, nonatomic) NSString *offlineIndicationTitle;
@property (copy, nonatomic) NSString *connectingIndicationTitle;
@property (copy, nonatomic) NSString *noNetworkIndicationTitle;
@property (copy, nonatomic) NSString *suspendedIndicationTitle;


@property (copy, nonatomic) NSString *emptyUserListMessage;

@property (nonatomic) BOOL showRecentInForward;
@property (nonatomic) BOOL mConvertSmilyToEmoji;

@property (assign, nonatomic) int *mLetterTitleColors;
@property (assign, nonatomic) int mToolbarColor;
@property (assign, nonatomic) int mStatusBarColor;
@property (assign, nonatomic) int mToolbarTextColor;
@property (assign, nonatomic) int mUserListTypingIndicationColor;
@property (assign, nonatomic) int mUserListStatusColor;
@property (assign, nonatomic) int messageBackgroundColorForMe;
@property (assign, nonatomic) int messageBackgroundColorForPeer;
@property (assign, nonatomic) int messagingBackgroundColor;


@property (assign, nonatomic) uint64_t mMaxImageFileSize;
@property (assign, nonatomic) uint64_t mMaxVideoFileSize;

@property (assign, nonatomic) BOOL mEnableNotificationBadge;


@end


@interface MesiboUI : NSObject

+(void) launchEditGroupDetails:(id) parent groupid:(uint32_t) groupid;

+(UIViewController *) getMesiboUIViewController ;
+ (UIViewController *) getMesiboUIViewController:(id)uidelegate;

+(UIImage *) getDefaultImage:(BOOL) group;

+(void) launchMessageViewController:(UIViewController *) parent profile:(MesiboProfile*)profile ;

+(MesiboUiOptions *) getUiOptions;
+(void) setUiOptions:(MesiboUiOptions *)options;

+(void) launchMessageViewController:(UIViewController *) parent profile:(MesiboProfile*)profile uidelegate:(id)uidelegate;

//+(void) getUITableViewInstance:(UITableViewWithReloadCallback *) table;

@end


#endif
