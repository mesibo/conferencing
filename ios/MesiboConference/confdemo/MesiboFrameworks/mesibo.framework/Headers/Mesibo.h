// Mesibo.h
// Copyright © 2021 Mesibo. All rights reserved.
// https://mesibo.com

#pragma once

#import <Foundation/Foundation.h>
#import <UIKit/UIKit.h>


#define AUDIO_INBUILT                   0
#define AUDIO_SPEAKER                   1
#define AUDIO_BLUETOOTH                 2
#define AUDIO_HEADPHONE                 3


#define MESIBO_FLAG_DELIVERYRECEIPT     0x1
#define MESIBO_FLAG_READRECEIPT         0x2
#define MESIBO_FLAG_TRANSIENT           0x4
#define MESIBO_FLAG_PRESENCE           0x8
#define MESIBO_FLAG_BROADCAST           0x20

//#define MESIBO_FLAG_QUEUE            0x40000
#define MESIBO_FLAG_NONBLOCKING         0x80000
#define MESIBO_FLAG_DONTSEND            0x200000
#define MESIBO_FLAG_LASTMESSAGE                 0x800000ULL
#define MESIBO_FLAG_EORS                 0x4000000ULL

#define MESIBO_FLAG_SAVECUSTOM                 (1ULL << 56)
#define MESIBO_FLAG_FILETRANSFERRED     (1ULL << 58)
#define MESIBO_FLAG_FILEFAILED          (1ULL << 59)


#define MESIBO_FLAG_DEFAULT             (MESIBO_FLAG_DELIVERYRECEIPT | MESIBO_FLAG_READRECEIPT)




#define MESIBO_FORMAT_DEFAULT           0
#define MESIBO_FORMAT_HEX               1
#define MESIBO_FORMAT_DECIMAL           2

#define MESIBO_STATUS_UNKNOWN            0
#define MESIBO_STATUS_ONLINE            1
#define MESIBO_STATUS_OFFLINE           2
#define MESIBO_STATUS_SIGNOUT           3
#define MESIBO_STATUS_AUTHFAIL          4
#define MESIBO_STATUS_STOPPED           5
#define MESIBO_STATUS_CONNECTING        6
#define MESIBO_STATUS_CONNECTFAILURE    7
#define MESIBO_STATUS_NONETWORK         8
#define MESIBO_STATUS_ONPREMISEERROR         9
#define MESIBO_STATUS_SUSPEND         10
#define MESIBO_STATUS_UPDATE         20
#define MESIBO_STATUS_MANDUPDATE        21
#define MESIBO_STATUS_SHUTDOWN          22
#define MESIBO_STATUS_ACTIVITY          -1

#define MESIBO_MSGSTATUS_OUTBOX         0
#define MESIBO_MSGSTATUS_SENT           1
#define MESIBO_MSGSTATUS_DELIVERED      2
#define MESIBO_MSGSTATUS_READ           3
#define MESIBO_MSGSTATUS_RECEIVEDNEW    0x12
#define MESIBO_MSGSTATUS_RECEIVEDREAD   0x13
#define MESIBO_MSGSTATUS_CALLMISSED     0x15
#define MESIBO_MSGSTATUS_CALLINCOMING   0x16
#define MESIBO_MSGSTATUS_CALLOUTGOING   0x17
#define MESIBO_MSGSTATUS_CUSTOM         0x20

// ONLY FOR UI USAGE
#define MESIBO_MSGSTATUS_TIMESTAMP      0x30

#define MESIBO_MSGSTATUS_FAIL           0x80
#define MESIBO_MSGSTATUS_USEROFFLINE    0x81
#define MESIBO_MSGSTATUS_INBOXFULL      0x82
#define MESIBO_MSGSTATUS_INVALIDDEST    0x83
#define MESIBO_MSGSTATUS_EXPIRED        0x84
#define MESIBO_MSGSTATUS_BLOCKED        0x88


#define MESIBO_RESULT_OK                0
#define MESIBO_RESULT_FAIL              0x80
#define MESIBO_RESULT_GENERROR          0x81
#define MESIBO_RESULT_NOSUCHERROR       0x83
#define MESIBO_RESULT_INBOXFULL         0x84
#define MESIBO_RESULT_BADREQ            0x85
#define MESIBO_RESULT_OVERCAPACITY      0x86
#define MESIBO_RESULT_RETRYLATER        0x87

#define MESIBO_RESULT_TIMEOUT           0xB0
#define MESIBO_RESULT_CONNECTFAIL       0xB1
#define MESIBO_RESULT_DISCONNECTED      0xB2
#define MESIBO_RESULT_REQINPROGRESS     0xB3
#define MESIBO_RESULT_BUFFERFULL        0xB4

#define MESIBO_RESULT_AUTHFAIL          0xC0
#define MESIBO_RESULT_DENIED            0xC1

#define MESIBO_ADDRESSSTRING_MAXLENGTH  63

#define MESIBO_READFLAG_READRECEIPT     1
#define MESIBO_READFLAG_SENDLAST        2
#define MESIBO_READFLAG_FIFO            4
#define MESIBO_READFLAG_SUMMARY         0x10
#define MESIBO_READFLAG_SENDEOR         0x20
#define MESIBO_READFLAG_WITHFILES       0x80


#define MESIBO_ORIGIN_REALTIME          0
#define MESIBO_ORIGIN_DBMESSAGE         1
#define MESIBO_ORIGIN_DBSUMMARY         2
#define MESIBO_ORIGIN_DBPENDING         3
#define MESIBO_ORIGIN_FILTER            4
#define MESIBO_ORIGIN_MESSAGESTATUS     5

#define MESIBO_ACTIVITY_NONE            0
#define MESIBO_ACTIVITY_ONLINE          1
#define MESIBO_ACTIVITY_ONLINERESP      2
#define MESIBO_ACTIVITY_TYPING          3
#define MESIBO_ACTIVITY_TYPINGCLEARED   4
#define MESIBO_ACTIVITY_JOINED          10
#define MESIBO_ACTIVITY_LEFT            11



// All status < 0x40 will keep call in progress - max status 0x7F (we can't go beyond that, as 0x80 will be treated as voice)
#define MESIBO_CALLSTATUS_NONE                  0x00
#define MESIBO_CALLSTATUS_INCOMING         0x01
#define MESIBO_CALLSTATUS_INPROGRESS            0x02
#define MESIBO_CALLSTATUS_RINGING               0x03
#define MESIBO_CALLSTATUS_ANSWER                0x05
#define MESIBO_CALLSTATUS_UPDATE                0x06
#define MESIBO_CALLSTATUS_DTMF                  0x07
#define MESIBO_CALLSTATUS_SDP                   0x08
#define MESIBO_CALLSTATUS_MUTE                  0x09
#define MESIBO_CALLSTATUS_UNMUTE                0x0A
#define MESIBO_CALLSTATUS_HOLD                  0x0B
#define MESIBO_CALLSTATUS_UNHOLD                0x0C

#define MESIBO_CALLSTATUS_PING                  0x21
#define MESIBO_CALLSTATUS_INFO                  0x23
#define MESIBO_CALLSTATUS_ECHO                  0x24
#define MESIBO_CALLSTATUS_REDIRECT              0x25

//Local Status used by client
#define MESIBO_CALLSTATUS_CHANNELUP             0x30
#define MESIBO_CALLSTATUS_CONNECTED             0x30
#define MESIBO_CALLSTATUS_QUALITY               0x31
#define MESIBO_CALLSTATUS_RECONNECTING          0x32

// Phone Specific ERRORs
#define MESIBO_CALLSTATUS_COMPLETE              0x40
#define MESIBO_CALLSTATUS_CANCEL                0x41
#define MESIBO_CALLSTATUS_NOANSWER              0x42
#define MESIBO_CALLSTATUS_BUSY                  0x43
#define MESIBO_CALLSTATUS_UNREACHABLE           0x44
#define MESIBO_CALLSTATUS_OFFLINE               0x45
#define MESIBO_CALLSTATUS_INVALIDDEST           0x46
#define MESIBO_CALLSTATUS_INVALIDSTATE          0x47
#define MESIBO_CALLSTATUS_NOCALLS               0x48
#define MESIBO_CALLSTATUS_NOVIDEOCALLS          0x49
#define MESIBO_CALLSTATUS_NOTALLOWED            0x4A

//TringMe specific errir
#define MESIBO_CALLSTATUS_AUTHFAIL              0x50
#define MESIBO_CALLSTATUS_NOCREDITS             0x51
#define MESIBO_CALLSTATUS_NONTRINGMEDEST        0x52
#define MESIBO_CALLSTATUS_INCOMPATIBLE          0x53
#define MESIBO_CALLSTATUS_BADCALLID             0x54

// Generic Errors
#define MESIBO_CALLSTATUS_ERROR                 0x60
#define MESIBO_CALLSTATUS_HWERROR               0x61
#define MESIBO_CALLSTATUS_NETWORKERROR          0x62
#define MESIBO_CALLSTATUS_NETWORKBLOCKED        0x63

#define MESIBO_CALLFLAG_AUDIO                   0x1
#define MESIBO_CALLFLAG_VIDEO                   0x2
#define MESIBO_CALLFLAG_STARTCALL               0x4
#define MESIBO_CALLFLAG_CALLWAITING               0x8
#define MESIBO_CALLFLAG_WIFI                    0x10
#define MESIBO_CALLFLAG_SLOWNETWORK             0x20
#define MESIBO_CALLFLAG_MISSED                  0x1000

#define MESIBO_DELETE_DEFAULT   -1
#define MESIBO_DELETE_LOCAL     0
#define MESIBO_DELETE_RECALL    1
#define MESIBO_DELETE_REMOVE    2

//Following CALL_STATUS_ are for internal use and for notifications
#define MESIBO_CALLSTATUS_DUREXCEED             19
#define MESIBO_CALLSTATUS_SRCRINGING            20
#define MESIBO_CALLSTATUS_SRCANSWERED           21
#define MESIBO_CALLSTATUS_USERINPUT             22

#define MESIBO_SERVERTYPE_STUN                  0
#define MESIBO_SERVERTYPE_TURN                  1

#define MESIBO_MUTESTATUS_AUDIO   1
#define MESIBO_MUTESTATUS_VIDEO   2
#define MESIBO_MUTESTATUS_HOLD    4

#define MESIBO_CONTACT_UPDATE           0
#define MESIBO_CONTACT_DELETE           1

//MUST be same as internal CONNECTION_DISCONNECTED, etc
#define MESIBO_CONNECTIVITY_DISCONNECTED 0xFF
#define MESIBO_CONNECTIVITY_UNKNOWN      -1
#define MESIBO_CONNECTIVITY_WIFI         0
#define MESIBO_CONNECTIVITY_2G           1
#define MESIBO_CONNECTIVITY_3G           2
#define MESIBO_CONNECTIVITY_4G           3

#define MESIBO_DBTABLE_MESSAGES          1
#define MESIBO_DBTABLE_PROFILES          2
#define MESIBO_DBTABLE_KEYS              4

#define MESIBO_DBTABLE_ALL (MESIBO_DBTABLE_MESSAGES|MESIBO_DBTABLE_PROFILES|MESIBO_DBTABLE_KEYS)

#define MESIBO_CONFIGTYPE_CALLFLAGS             0x100
#define MESIBO_CONFIGTYPE_CALLANSWERMODE        0x101
#define MESIBO_CONFIGTYPE_CALLREQTO             0x110
#define MESIBO_CONFIGTYPE_CALLANSTO             0x111
#define MESIBO_CONFIGTYPE_CALLCONNECTTO         0x112

#define MESIBO_VISIBILITY_NONE         0
#define MESIBO_VISIBILITY_PUBLIC       1
#define MESIBO_VISIBILITY_CONTACT      2
#define MESIBO_VISIBILITY_CUSTOM       4
#define MESIBO_VISIBILITY_LOCAL        8

#define MESIBO_SYNCTYPE_REALTIME               0
#define MESIBO_SYNCTYPE_LAZY                   1
#define MESIBO_SYNCTYPE_ONLINEONLY             2
#define MESIBO_SYNCTYPE_RECENTONLY             3

#define MESIBO_MEMBERFLAG_SEND    1
#define MESIBO_MEMBERFLAG_RECV    2
#define MESIBO_MEMBERFLAG_PUBL    4
#define MESIBO_MEMBERFLAG_SUBS    8
#define MESIBO_MEMBERFLAG_LIST    0x10
#define MESIBO_MEMBERFLAG_RECORD  0x20
#define MEMBERFLAG_EXPIRYTS       0x100
#define MEMBERFLAG_DELETEWITHPIN  0x200
#define MEMBERFLAG_NOSELFDELETE   0x800

#define MESIBO_MEMBERFLAG_ADMIN   0x1000
    // prevents user from deleting itself
#define MESIBO_MEMBERFLAG_NOSELFDELETE    0x2000
#define MESIBO_MEMBERFLAG_SHAREDPIN      0x8000

#define MESIBO_MEMBERFLAG_DELETE  0x80000000
#define MESIBO_MEMBERFLAG_ALL            0xFFFF

#define MESIBO_ADMINFLAG_MODIFY       1
#define MESIBO_ADMINFLAG_ADDUSER      0x10
#define MESIBO_ADMINFLAG_REMUSER      0x20
#define MESIBO_ADMINFLAG_ADDADMIN     0x40
#define MESIBO_ADMINFLAG_REMADMIN     0x80
#define MESIBO_ADMINFLAG_REMOWNER     0x100
#define MESIBO_ADMINFLAG_REMGROUP     0x200
#define MESIBO_ADMINFLAG_OWNER        0x1000
#define MESIBO_ADMINFLAG_ADDPIN       0x2000
#define MESIBO_ADMINFLAG_REMOVEPIN    0x4000
#define MESIBO_ADMINFLAG_LISTPIN      0x8000


#define MESIBO_OWNERFLAG_ALL          0xFFFF
#define MESIBO_ADMINFLAG_ALL          (MESIBO_OWNERFLAG_ALL & ~MESIBO_ADMINFLAG_OWNER)

#define MESIBO_GROUPFLAG_SENDBYSELECTED      1
#define MESIBO_GROUPFLAG_SENDBYANYONE        2
#define MESIBO_GROUPFLAG_AUTOADDMEMBER       8
#define MESIBO_GROUPFLAG_RECVBYSELECTED      0x10
#define MESIBO_GROUPFLAG_RECVROUNDROBIN      0x20
#define MESIBO_GROUPFLAG_NOSTORAGE           0x40
#define MESIBO_GROUPFLAG_RECVLOOPBACK        0x80
#define MESIBO_GROUPFLAG_PUBBYSELECTED       0x100
#define MESIBO_GROUPFLAG_PUBBYANYONE         0x200
#define MESIBO_GROUPFLAG_SUBBYSELECTED       0x1000
#define MESIBO_GROUPFLAG_SUBBYANYONE         0x2000
#define MESIBO_GROUPFLAG_LISTBYSELECTED      0x10000
#define MESIBO_GROUPFLAG_LISTBYANYONE        0x20000
    //members can't delete themselves
#define MESIBO_GROUPFLAG_NOSELFDELETE        0x40000
    // these flags are not to be saved in database but sent by group_set request in profile_t
#define MESIBO_GROUPFLAG_DELETE              0x80000000

#define MESIBO_GROUPERROR_NOTMEMBER       1
#define MESIBO_GROUPERROR_PERMISSION      2
#define MESIBO_GROUPERROR_BADPIN          3
#define MESIBO_GROUPERROR_ACCESSDENIED    4
#define MESIBO_GROUPERROR_NOTSHAREDPIN    5
#define MESIBO_GROUPERROR_GENERAL         10

#define MESIBO_RESOLUTION_DEFAULT          0
#define MESIBO_RESOLUTION_QVGA             1
#define MESIBO_RESOLUTION_VGA              2
#define MESIBO_RESOLUTION_HD               3
#define MESIBO_RESOLUTION_FHD              4
#define MESIBO_RESOLUTION_4K               5
#define MESIBO_RESOLUTION_QQVGA            8
#define MESIBO_RESOLUTION_180P             9
#define MESIBO_RESOLUTION_NHD              10
#define MESIBO_RESOLUTION_MAX              10

@interface MesiboGroupSettings : NSObject
@property (nonatomic) NSString *name;
@property (nonatomic) uint32_t flags;
@property (nonatomic) uint32_t callFlags;
@property (nonatomic) uint32_t callDuration;
@property (nonatomic) uint32_t videoResolution;
@property (nonatomic) uint32_t expiry;
@end

@interface MesiboMemberPermissions : NSObject
@property (nonatomic) uint32_t flags;
@property (nonatomic) uint32_t adminFlags;
@property (nonatomic) uint32_t callFlags;
@property (nonatomic) uint32_t callDuration;
@property (nonatomic) uint32_t videoResolution;
@property (nonatomic) uint32_t expiry;
@end

@interface MesiboGroupPin : NSObject
@property (nonatomic) uint32_t pin;
@property (nonatomic) MesiboMemberPermissions *permissions;
@end


@class MesiboGroupProfile; // foward declaration
@protocol MesiboProfileDelegate;
@class MesiboParams;
@class MesiboReadSession;
@class MesiboFileInfo;
@class MesiboLocation;

@interface MesiboProfile : NSObject


-(void) toggleMute;
-(BOOL) isMuted;
-(void) toggleArchive;
-(BOOL) isArchieved;
-(void) toggleMark;
-(BOOL) isMarked;
-(void) setMark:(BOOL) enable;
-(BOOL) isSelfProfile;
-(BOOL) isLookedup;
-(void) setLookedup:(BOOL)enable;

-(BOOL) isBlocked;
-(void) blockMessages:(BOOL) enable;
-(void) blockCalls:(BOOL) enable;

-(uint32_t) getGroupId;
-(NSString *) getAddress;

-(int) getUnreadCount;
-(uint64_t) getLastActiveTime;

-(NSString *) getAdmin ;

-(void) setName:(NSString *)val ;
-(void) setOverrideName:(NSString *)val ;

-(NSString *) getName ;
-(NSString *) getNameOrAddress:(NSString *)prefix;
-(void) setStatus:(NSString *)val ;
-(NSString *) getStatus ;
-(void) setInfo:(NSString *)val ;
-(NSString *) getInfo ;
-(void) setCustomProfile:(NSString *)val ;
-(NSString *) getCustomProfile ;
-(void) setDraft:(NSString *)val ;
-(NSString *) getDraft ;
-(void) setUserData:(id)val ;
-(id) getUserData ;


-(BOOL) isProfileSynced ;
-(BOOL) isSyncedProfileRecent ;


-(void) setImageUrl:(NSString *) url ;
-(NSString *) getImageUrl ;
-(UIImage *) getImage ;
-(UIImage *) getThumbnail ;
-(NSString *) getImageOrThumbnailPath;
-(UIImage *) getImageOrThumbnail;

-(void) setAddress:(NSString *)addr gid:(uint32_t)gid ;
-(MesiboProfile *) cloneProfile;

-(BOOL) addListener:(id<MesiboProfileDelegate>) delegate ;
-(void) removeListener:(id<MesiboProfileDelegate>) delegate ;

-(void) setThumbnailProperties:(int)width height:(int)height quality:(int)quality ;
-(void) setImageProperties:(int)width height:(int)height quality:(int)quality ;

-(void) setImage:(UIImage *)image;
-(BOOL) setImageFromFile:(NSString *)path;
-(NSString *) getImagePath;
-(BOOL) isContact;
-(BOOL) isSubscribed;
-(void) setContact:(BOOL) enable visiblity:(int) visibility ;
-(void) subscribe:(BOOL) enable;

-(uint32_t) getLocalFields;
-(void) removeLocalProfile;
-(void) removeSyncedProfile;
-(void) remove;

-(BOOL) save;

-(MesiboGroupProfile *) getGroupProfile;

/* Messaging Functions */
-(void) setMessageParams:(MesiboParams *)params;
-(MesiboParams *) getMessageParams;
-(int) sendMessage:(uint32_t)msgid data:(NSData *)data;
-(int) sendMessage:(uint32_t)msgid string:(NSString *)string;
-(int) sendFile:(uint32_t)msgid file:(MesiboFileInfo *)file;
-(int) sendLocation:(uint32_t)msgid location:(MesiboLocation *) location;
-(int) sendPresence:(uint32_t)msgid presence:(int)presence interval:(int)interval;
-(int) sendActivity:(uint32_t)msgid activity:(int)activity interval:(int)interval;
-(int) forwardMessage:(uint32_t)msgid forwardid:(uint64_t)forwardid;
-(BOOL)deleteMessages:(uint64_t)ts;
-(MesiboReadSession *) createReadSession:(id) delegate;
-(int) subscribeTransient:(uint32_t)type activity:(uint32_t)activity duration:(uint32_t) duration;
-(BOOL) isReading;
-(BOOL) isOnline;
-(BOOL) isTyping;
-(BOOL) isTypingInGroup:(uint32_t)gid;
-(BOOL) isChatting;
-(BOOL) isChattingInGroup:(uint32_t)gid;
-(BOOL) isGroup;
@end

@interface MesiboGroupMember : NSObject
-(BOOL) isOwner;
-(BOOL) isAdmin;
-(MesiboProfile *) getProfile;
-(NSString *) getAddress;
@end

@interface MesiboGroupProfile : MesiboProfile
-(BOOL) canModify;
-(BOOL) canAddMembers;
-(BOOL) canRemoveMembers;
-(BOOL) canAddAdmins;
-(BOOL) canRemoveAdmins;
-(BOOL) canRemoveOwner;
-(BOOL) canRemoveGroup;
-(uint64_t) getRequestId;
-(MesiboProfile *) getLastAdmin;

-(int) getSettings:(id) listener;
-(void) setProperties:(MesiboGroupSettings *) settings;


-(int) getMembers:(int)count restart:(BOOL)restart listener:(id)listener;
-(BOOL) deleteGroup;
-(int) addMembers:(NSArray *)addresses permissions:(MesiboMemberPermissions *)permissions pin:(uint32_t)pin;
-(int) addMembers:(NSArray *)addresses permissions:(MesiboMemberPermissions *)permissions;
-(int) addMember:(NSString *)address permissions:(MesiboMemberPermissions *)permissions pin:(uint32_t)pin;
-(int) addMember:(NSString *)address permissions:(MesiboMemberPermissions *)permissions;
-(int) addMembers:(NSArray *)members permissions:(uint32_t)permissions adminPermissions:(uint32_t)adminPermissions;

-(int) removeMembers:(NSArray *)members;
-(int) removeMember:(NSString *)address;


-(void) addPin:(MesiboMemberPermissions *)permissions listener:(id)listener expiry:(uint32_t)expiry count:(uint32_t)count;
-(void) addPin:(MesiboMemberPermissions *)permissions listener:(id)listener;
-(BOOL) editPin:(uint32_t) pin permissions:(MesiboMemberPermissions *)permissions expiry:(uint32_t)expiry count:(uint32_t) count;
-(BOOL) removePin:(uint32_t) pin;

-(void) join:(uint32_t) pin listener:(id)listener;
-(void) leave;

@end

@interface MesiboSelfProfile : MesiboProfile
-(void) setVisibility:(int) visibility;
-(void) setSyncType:(int)type;
@end

@protocol MesiboProfileDelegate <NSObject>
@required
-(void) MesiboProfile_onUpdate:(MesiboProfile *)profile;
@end


@interface MesiboParams : NSObject
@property (nonatomic) NSString *peer;
@property (nonatomic) uint64_t mid;
@property (nonatomic) uint64_t ts;
@property (nonatomic) int expiry;
@property (nonatomic) uint32_t groupid;
@property (nonatomic) uint64_t flag;
@property (nonatomic) int type;
@property (nonatomic) int status;
@property (nonatomic) uint64_t statusFlags;
@property (nonatomic) int origin;

@property (nonatomic) NSString *enckey;
@property (nonatomic) MesiboProfile *profile;
@property (nonatomic) MesiboProfile *groupProfile;

-(BOOL) compare:(NSString *)peer groupid:(uint32_t)groupid;
-(BOOL) compare:(MesiboParams *) p;

-(int) getStatus;
-(void) setStatus:(int)status;
-(int) getExpiry;
-(void) setExpiry:(int)expiry;
-(int) getType;
-(void) setType:(int)type;
-(void) setFlag:(uint64_t) flag;

-(void) setPeer:(NSString *)peer;
-(void) setGroup:(uint32_t) group;

-(BOOL) isIncoming;
-(BOOL) isOutgoing;
-(BOOL) isSavedMessage;
-(BOOL) isDeleted;
-(BOOL) isForwarded;
-(BOOL) isPresence;
-(BOOL) isMissedCall;
-(BOOL) isCall;
-(BOOL) isVoiceCall;
-(BOOL) isVideoCall;
-(BOOL) isPstnCall;
-(BOOL) isLastMessage;

-(BOOL) isDbMessage;
-(BOOL) isDbSummaryMessage;
-(BOOL) isDbPendingMessage;
-(BOOL) isRealtimeMessage;



-(BOOL) isMessageStatusFailed;
-(BOOL) isMessageStatusInProgress;


// WARNING - not to be used directly - (private function)
-(void) setParams:(NSString *)peer groupid:(uint32_t)groupid flag:(uint64_t)flag origin:(int)origin;

@end

typedef MesiboProfile MesiboAddress;

#define MESIBO_FILEACTION_START   0
#define MESIBO_FILEACTION_STOP   1

#define MESIBO_FILEMODE_DOWNLOAD  0
#define MESIBO_FILEMODE_UPLOAD    1

#define MESIBO_FILESTATUS_IDLE            0
#define MESIBO_FILESTATUS_INPROGRESS      1
#define MESIBO_FILESTATUS_RETRYLATER      2
#define MESIBO_FILESTATUS_FAILED          3

#define MESIBO_FILETYPE_AUTO              0
#define MESIBO_FILETYPE_IMAGE             1
#define MESIBO_FILETYPE_VIDEO             2
#define MESIBO_FILETYPE_AUDIO             3
#define MESIBO_FILETYPE_LOCATION          4
#define MESIBO_FILETYPE_PROFILEIMAGE      5
#define MESIBO_FILETYPE_PROFILETHUMBNAIL  6
#define MESIBO_FILETYPE_OTHER             10

#define MESIBO_FILESOURCE_MESSAGE         0
#define MESIBO_FILESOURCE_PROFILE         1
#define MESIBO_FILESOURCE_PROFILETN       2
#define MESIBO_FILESOURCE_USERPROFILELIST   3



#define MESIBO_FILETYPE_MASK                0xFF

@interface MesiboFileInfo : NSObject
@property (nonatomic) int mode;

@property (nonatomic) int type;
@property (nonatomic) int source;
@property (nonatomic) int size;
@property (nonatomic) int maxDimension;
@property (nonatomic) int maxSize;
@property (nonatomic) NSString *mimeType;
@property (nonatomic) NSString *launchUrl;
@property (nonatomic) BOOL userInteraction;
@property (nonatomic) BOOL secure;
@property (nonatomic) NSString *title;
@property (nonatomic) NSString *message;
@property (nonatomic) uint64_t mid;
@property (nonatomic) UIImage *image;
@property (nonatomic) double lat;
@property (nonatomic) double lon;
@property (nonatomic) id asset;
@property (nonatomic) NSString *localIdentifier;
@property (nonatomic, weak) id fileTransferContext;

-(void) setCache:(BOOL)isEnabled;

-(void) setData:(NSObject *)data;
-(NSObject *) getData;

-(void) setListener:(id) listener;
-(id) getListener;

-(NSString *) getUrl;
-(void) setUrl:(NSString *)url;

-(int) getStatus;
-(uint64_t) getId;
-(MesiboParams *) getParams;


-(void) setPath:(NSString *)path;
-(NSString *) getPath;

-(void) setFileTransferContext:(id)context;
-(id) getFileTransferContext;

-(int) getProgress;

-(BOOL) isTransferred;
-(BOOL) mayExist;
@end




@interface MesiboLocation : NSObject
@property (nonatomic) double lat;
@property (nonatomic) double lon;
@property (nonatomic) int zoom;
@property (nonatomic) NSString *url;
@property (nonatomic) BOOL update;
@property (nonatomic) NSString *title;
@property (nonatomic) NSString *message;
@property (nonatomic) uint64_t mid;
@property (nonatomic) UIImage *image;

-(void) setData:(NSObject *)data;
-(NSObject *) getData;
@end

@interface MesiboMedia : NSObject

#if 0
@property (nonatomic) NSString *url;
@property (nonatomic) NSString *title;
@property (nonatomic) UIImage *image;

@property (nonatomic) NSString *mimeType;
@property (nonatomic) NSString *launchUrl;

@property (nonatomic) double lat;
@property (nonatomic) double lon;
@property (nonatomic) int zoom;

#else
//Temporary - will be removed in v2.0
@property (nonatomic) MesiboFileInfo *file;
@property (nonatomic) MesiboLocation *location;
#endif

-(void) setData:(NSObject *)data;
-(NSObject *) getData;
@end

// For internal use only - will be for public use from v2.0
@interface MesiboMessage : NSObject
@property (nonatomic) uint64_t mid;
@property (nonatomic) uint64_t ts;
@property (nonatomic) uint64_t mts;
@property (nonatomic) int32_t expiry;
@property (nonatomic) uint64_t flag;
@property (nonatomic) int type;
@property (nonatomic) int status;
@property (nonatomic) int origin;

@property (nonatomic) MesiboAddress *sender;
@property (nonatomic) MesiboAddress *sendingGroup;

@property (nonatomic) NSData *message;

#if 0
@property (nonatomic) double lat;
@property (nonatomic) double lon;
#endif

@property (nonatomic) MesiboMedia *media;

@property (nonatomic) id other; //user data
@property (nonatomic) id ui; //UI use only


-(int) getStatus;
-(void) setStatus:(int)status;
-(int) getExpiry;
-(void) setExpiry:(int)expiry;
-(int) getType;
-(void) setType:(int)type;
-(void) setOrigin:(int)origin;

-(BOOL) isIncoming;
-(BOOL) isOutgoing;
-(BOOL) isInOutbox;
-(BOOL) isFailed;
-(BOOL) isCustom;
-(BOOL) isDeleted;
-(BOOL) isForwarded;
-(BOOL) isPresence;
-(BOOL) isMissedCall;
-(BOOL) isCall;
-(BOOL) isVoiceCall;
-(BOOL) isVideoCall;
-(BOOL) isPstnCall;
-(BOOL) isLastMessage;
-(BOOL) isEmpty;
-(BOOL) hasMedia;
-(void) setDeleted;

-(void) setLocation:(MesiboLocation *) location;
-(void) setFile:(MesiboFileInfo *) file;

-(NSString *) getMessageAsString;

-(BOOL) isDbMessage;
-(BOOL) isDbSummaryMessage;
-(BOOL) isDbPendingMessage;
-(BOOL) isRealtimeMessage;

-(BOOL)compare:(NSString *)peer groupid:(uint32_t)groupid;

-(NSString *) getSenderAddress;
-(NSString *) getSenderName;
-(uint32_t) getGroupId;
@end




@interface MesiboReadSession : NSObject
+(void) addSession:(uint64_t)sessionid session:(id)session;
+(MesiboReadSession *)getSession:(uint64_t)sessionid ;
+(void)removeSession:(uint64_t)sessionid ;
+(BOOL)isSessionReading:(MesiboParams *)params ;
+(void)endAllSessions;
-(void) initSession:(NSString*)peer groupid:(uint32_t)groupid query:(NSString *)query delegate:(id)listener;
-(void)endSession ;

//private function - only for internal use
-(void)_onsync:(int) count flags:(uint32_t)flags;


-(BOOL) isReading:(MesiboParams *)params ;

-(id) getDelegate:(uint64_t)flags;
-(void) stop ;
-(void) restart ;

-(int) read:(int)count;
-(void)sync:(int)count listener:(id)listener ;

-(void) enableReadReceipt:(BOOL) enable ;

-(void) enableSummary:(BOOL) enable ;

-(void) enableFifo:(BOOL) enable ;

-(void) enableFiles:(BOOL) enable ;

-(void) enableMessages:(BOOL) enable ;

-(void) enableMissedCalls:(BOOL) enable ;

-(void) enableIncomingCalls:(BOOL) enable ;

-(void) enableOutgoingCalls:(BOOL) enable ;

-(void) enableCalls:(BOOL) enable ;

@end

#define MESIBO_HTTPSTATE_UPLOAD     0
#define MESIBO_HTTPSTATE_DOWNLOAD   1
#define MESIBO_HTTPSTATE_DONE       2

@class MesiboHttp; //forward declaration so that we can declare in block definition below
typedef BOOL (^Mesibo_onHTTPProgress)(MesiboHttp *http, int state, int progress);

@interface MesiboHttp : NSObject

@property (nonatomic) NSString * url;
@property (nonatomic) NSString * proxy;

@property (nonatomic) NSData * post;
@property (nonatomic) NSDictionary *postBundle;
@property (nonatomic) NSString * contentType;

@property (nonatomic) NSString * cookie;

@property (nonatomic) NSString * caCertificateFile;

@property (nonatomic) NSString * downloadFile;

@property (nonatomic) id        uploadPhAsset;
@property (nonatomic) NSString *uploadLocalIdentifier;

@property (nonatomic) NSString * uploadFile;
@property (nonatomic) NSString * uploadFileField;
@property (nonatomic) NSString * uploadFileOffsetField;
@property (nonatomic) NSString * uploadFileName;
@property (nonatomic) NSString * uploadFileType;
@property (nonatomic) NSString * uploadFileCheckUrl;

@property (nonatomic) NSString * extraHeaders;
@property (nonatomic) NSString * userAgent;
@property (nonatomic) NSString * referrer;
@property (nonatomic) NSString * origin;
@property (nonatomic) NSString * encoding;
@property (nonatomic) NSString * cacheControl;
@property (nonatomic) NSString * accept;

@property (nonatomic) int bufferSize;
@property (nonatomic) uint64_t connectionTimeout;
@property (nonatomic) uint64_t headerTimeout;
@property (nonatomic) uint64_t bodyTimeout;

@property (nonatomic) uint64_t downloadOffset;
@property (nonatomic) uint64_t downloadEnd;
@property (nonatomic) uint64_t uploadOffset;
@property (nonatomic) uint64_t uploadEnd;
@property (nonatomic) uint64_t ims;
@property (nonatomic) int maxRedirects;
@property (nonatomic) int maxRetries;

@property (nonatomic) BOOL headerOnly;
@property (nonatomic) BOOL resume;
@property (nonatomic) BOOL noCache;
@property (nonatomic) BOOL concatData;
@property (nonatomic) BOOL notifyOnCompleteOnly;
@property (nonatomic) BOOL onMainThread;

@property (nonatomic) uint64_t ts;

@property (nonatomic) Mesibo_onHTTPProgress listener;

@property (nonatomic) int result;
@property (nonatomic) int respCode;
@property (nonatomic) int errorCode;
@property (nonatomic) NSString * error;
@property (nonatomic) int state;

@property (nonatomic) int progress;
@property (nonatomic) uint64_t contentLength;
@property (nonatomic) uint64_t offset;

@property (nonatomic) NSString * respEncoding;
@property (nonatomic) NSString * respDisposition;
@property (nonatomic) NSString * respETag;
@property (nonatomic) BOOL respCached;

@property (nonatomic) long contentAge ;
@property (nonatomic) long respFlag;




@property (nonatomic) NSMutableData *data;

@property (nonatomic) id other; // user data object

@property (nonatomic) dispatch_queue_t dispatchQueue;


-(BOOL) execute;
-(BOOL) executeAndWait;
-(void) cancel;
-(NSData *) getData;
-(NSString *) getDataString;
-(NSString *) urlEncode:(NSDictionary *) post;

@end

@interface MesiboServer : NSObject
@property (nonatomic) int type;
@property (nonatomic) NSString *host;
@property (nonatomic) NSString *username;
@property (nonatomic) NSString *password;
@end




/*
 typedef void (^MesiboConnectionStatusBlock)(int status);
 typedef BOOL (^MesiboMessageFilterBlock)(MesiboParams *params, NSData *data, int type, NSString *url, NSString *tnurl);
 typedef BOOL (^MesiboFileTransferHandlerBlock)(int action, uint64_t mid, MesiboFileInfo *file);
 typedef BOOL (^MesiboFileTransferListenerBlock)(MesiboFileInfo *file);
 //typedef BOOL (^MesiboUserProfileLookupBlock)(NSString *peer, MesiboUserProfile *user);
 */


typedef BOOL (^Mesibo_onHTTPUtilsProgress)(id cbdata, int progress, NSString *result);
typedef void (^Mesibo_onSetGroupHandler)(uint32_t groupid);
typedef void (^Mesibo_onRunHandler)(void);

@protocol MesiboDelegate <NSObject>

@required

@optional
-(void) Mesibo_OnMessage:(MesiboParams *)params data:(NSData *)data;

//Only for internal use now 
-(void) Mesibo_OnMessage:(MesiboMessage *)message;

-(void) Mesibo_OnMessageStatus:(MesiboParams *)params;
-(void) Mesibo_OnConnectionStatus:(int) status;

-(void) Mesibo_onActivity:(MesiboParams *)params activity:(int) activity;
-(void) Mesibo_onLocation:(MesiboParams *)params location:(MesiboLocation *)location;
-(void) Mesibo_onFile:(MesiboParams *)params file:(MesiboFileInfo *) file;

-(void) Mesibo_OnPresence:(MesiboParams *)params data:(NSData *)data;

-(void) Mesibo_OnSync:(int)count;

-(BOOL) Mesibo_onCall:(uint32_t)peerid callid:(uint32_t)callid profile:(MesiboProfile *)profile flags:(uint64_t)flags;
-(BOOL) Mesibo_onCallStatus:(uint32_t)peerid callid:(uint32_t)callid status:(int)status flags:(uint64_t)flags info:(uint64_t)info resolution:(uint64_t)resolution desc:(NSString *)desc;
-(void) Mesibo_onServer:(int)type url:(NSString *)url username:(NSString *)username credential:(NSString *)credential;

-(void) Mesibo_onConfParitcipant:(uint32_t)uid sid:(uint32_t)sid address:(NSString *)address name:(NSString *)name role:(uint32_t) role flags:(uint32_t) flags;
-(void) Mesibo_onConfCall:(uint32_t)uid sid:(uint32_t)sid op:(int)op resolution:(uint32_t)resolution fps:(int)fps bw:(uint32_t)bw flags:(uint32_t)flags sdp:(NSString *)sdp mid:(NSString *)mid mline:(int) mline;

-(BOOL) Mesibo_onStartFileTransfer:(MesiboFileInfo *)file;
-(BOOL) Mesibo_onStopFileTransfer:(MesiboFileInfo *) file;
-(BOOL) Mesibo_onFileTransferProgress:(MesiboFileInfo *) file;

-(BOOL) Mesibo_OnMessageFilter:(MesiboParams *)params direction:(int)direction data:(NSData *)data;

-(void) Mesibo_onProfileUpdated:(MesiboProfile *)profile;
-(BOOL) Mesibo_onGetProfile:(MesiboProfile *)profile;

-(void) Mesibo_onGroupCreated:(MesiboProfile *) groupProfile;
-(void) Mesibo_onGroupJoined:(MesiboProfile *) groupProfile;
-(void) Mesibo_onGroupLeft:(MesiboProfile *) groupProfile;
-(void) Mesibo_onGroupMembers:(MesiboProfile *) groupProfile members:(NSArray *)members;
-(void) Mesibo_onGroupMembersJoined:(MesiboProfile *) groupProfile members:(NSArray *)members;
-(void) Mesibo_onGroupMembersRemoved:(MesiboProfile *) groupProfile members:(NSArray *)members;
-(void) Mesibo_onGroupSettings:(MesiboProfile *) groupProfile settings:(MesiboGroupSettings *)settings permissions:(MesiboMemberPermissions *)permissions pins:(NSArray<MesiboGroupPin *> *) pins;
-(void) Mesibo_onGroupError:(MesiboProfile *) groupProfile error:(uint32_t)error;


//UI helper
//-(void) Mesibo_onShowProfilesList;
-(void) Mesibo_onForeground:(id)parent screenId:(int)screenId foreground:(BOOL)foreground;
-(void) Mesibo_onShowProfile:(id)parent profile:(MesiboProfile *) profile;
-(void) Mesibo_onDeleteProfile:(id)parent profile:(MesiboProfile *) profile handler:(Mesibo_onSetGroupHandler)handler;

-(NSArray *) Mesibo_onGetMenu:(id)parent type:(int) type profile:(MesiboProfile *)profile;
-(BOOL) Mesibo_onMenuItemSelected:(id)parent type:(int)type profile:(MesiboProfile *)profile item:(int)item;

@end

#define MesiboInstance [Mesibo getInstance]


@interface Mesibo : NSObject

+(Mesibo *) getInstance;

//********************** Init ************************************************
//-(void) someInit; //TBD
-(void) reset;
-(BOOL) setPath:(NSString *)path;
-(int) setAccessToken:(NSString *)accessToken;
-(int) setPushToken:(NSString *)pushToken voip:(BOOL)voip;
-(void) setPushRegistryCompletion:(void (^)(void))completion;
-(uint32_t) getAccessTokenValidity;
-(int) setBufferLen:(int)length empty:(BOOL)empty;
-(void) setSecureConnection:(BOOL) enable;
-(void) setConfiuration:(uint32_t) type value:(uint32_t)value;
-(void) setConfiuration:(uint32_t) type svalue:(NSString *)svalue;
//********************** Listner *********************************************
//both are same functions, setDelegate is more common in iOS world
-(BOOL) setDelegate:(id)delegate;
-(id) getDelegates;
-(BOOL) addListener:(id)delegate;
-(BOOL) removeListner:(id)delegate;

//********************** Live Connection **************************************
-(int) start;
-(int) stop;
-(BOOL) reconnect:(int) inFocus;
-(BOOL) isAccountSuspended;
-(int) getConnectionStatus;
-(void)setNetwork:(int)connectivity;
-(int) getDeviceType;
-(uint32_t) getUid;
-(NSString *) getAddress;

//********************** Database **********************************************
-(BOOL) setDatabase:(NSString *)name resetTables:(uint32_t)resetTables;
-(void) resetDatabase:(uint32_t) tables;
-(BOOL) setKey:(NSString *)key value:(NSString *)value;
-(NSString *) readKey:(NSString *)key;
-(BOOL) deleteKey:(NSString *)key;


//********************** Status and Information *********************************
-(NSString *) getBasePath;
-(NSString *) getFilePath:(int)type;
-(void) setForegroundContext:(id)context screenId:(int)screenId foreground:(BOOL)foreground;
-(BOOL) setAppInForeground:(id)context screenId:(int)screenId foreground:(BOOL)foreground;
-(id) getForegroundContext;
-(BOOL) isAppInForeground;
-(NSString *) version; // TBD

// Time
-(uint64_t) getTimestamp;
-(uint64_t) getStartTimestamp;
-(int) daysElapsed:(uint64_t) ts;

//********************** Messaging ************************************************

-(int) sendMessage:(MesiboParams *)p msgid:(uint32_t)msgid data:(NSData *)data;
-(int) sendMessage:(MesiboParams *)p msgid:(uint32_t)msgid string:(NSString *)string;
-(int) addCustomMessage:(MesiboParams *)p msgid:(uint32_t)msgid data:(NSData *)data;
-(int) addCustomMessage:(MesiboParams *)p msgid:(uint32_t)msgid string:(NSString *)string;
-(int) sendFile:(MesiboParams *)p msgid:(uint32_t)msgid file:(MesiboFileInfo *)file;
-(int) sendLocation:(MesiboParams *)p msgid:(uint32_t)msgid location:(MesiboLocation *) location;
//TBD, add title also (already have message)
-(int) sendPresence:(MesiboParams *)p msgid:(uint32_t)msgid presence:(int)presence interval:(int)interval;
-(int) sendActivity:(MesiboParams *)p msgid:(uint32_t)msgid activity:(int)activity interval:(int)interval;
-(int) forwardMessage:(MesiboParams *)p msgid:(uint32_t)msgid forwardid:(uint64_t)forwardid;
-(BOOL) resend:(uint32_t)msgid;
-(int) cancel:(int)type msgid:(uint32_t)msgid;
//-(void) enableAutoSendOnlineStatus:(BOOL)enable;
-(void) setOnlineStatusMode:(int) mode;
-(void) setOnlinestatusTarget:(uint32_t) gid;
-(void) setOnlineStatusPrivacy:(int) privacy;


//TBD, need to change to match with android

-(int) deletePolicy:(int)maxRemoteDeleteInterval deleteType:(int)deleteType;
-(BOOL) deleteMessages:(uint64_t *)msgids count:(int)count deleteType:(int)deleteType;
-(BOOL) deleteMessage:(uint64_t)msgid deleteType:(int)deleteType;
-(BOOL) deleteMessage:(uint64_t)msgid ;
-(BOOL) deleteMessages:(NSString *)sender groupid:(uint32_t)groupid ts:(uint64_t)ts;
-(BOOL) deleteZombieMessages:(BOOL) groupOnly;
//-(void)setEnableReadReceipt:(BOOL)enable sendLastReceipt:(BOOL)sendLastReceipt;
-(int) sendReadReceipt:(MesiboParams *)p msgid:(uint64_t)msgid;
//-(id) getMessageFilter; //TBD, not implemented in IOS
-(BOOL) isReading:(MesiboParams *)p;
-(void) updateLocationImage:(MesiboParams *)params location:(MesiboLocation *)location;


//********************** File Transfer ********************************************
-(MesiboFileInfo *) getFileInstance:(MesiboParams *)p msgid:(uint64_t)msgid mode:(int)mode type:(int)type source:(int)source filePath:(NSString *)filePath url:(NSString *)url listener:(id)listener;
-(BOOL) startFileTransfer:(MesiboFileInfo *)file;
-(BOOL) stopFileTransfer:(MesiboFileInfo *) file;
-(BOOL) updateFileTransferProgress:(MesiboFileInfo *)file progress:(int)progress status:(int)status;
-(BOOL) isFileTransferEnabled;
-(void) disableFileTransfer;
-(NSString *) getUploadUrl;
-(NSString *) getUploadAuthToken;
-(void) setUploadUrl:(NSString *)url  authToken:(NSString *) authToken;
-(int) getFileType:(NSString *)path;

//********************** User Profile *********************************************

-(MesiboProfile *) getProfile:(NSString *)peer groupid:(uint32_t)groupid;
-(MesiboProfile *) getProfileIfExists:(NSString *)peer groupid:(uint32_t)groupid;
-(MesiboProfile *) getUserProfile:(NSString *)peer;
-(MesiboProfile *) getGroupProfile:(uint32_t)groupid;
-(MesiboProfile *) getProfileFromParams:(MesiboParams *)params;

-(MesiboProfile *) getUserProfileIfExists:(NSString *)peer;
-(MesiboProfile *) getGroupProfileIfExists:(uint32_t)groupid;

-(MesiboProfile *) getSelfProfile;

-(void) syncContacts:(NSArray<NSString *> *)addresses addContact:(BOOL)addContact subscribe:(BOOL)subscribe visibility:(int)visibility syncNow:(BOOL) syncNow;
-(void) syncContact:(NSString *)address addContact:(BOOL)addContact subscribe:(BOOL)subscribe visibility:(int)visibility syncNow:(BOOL) syncNow;
-(void) syncContacts;
-(BOOL) createGroup:(NSString *)name flags:(uint32_t) flags listener:(id)listener;
-(BOOL) createGroup:(MesiboGroupSettings *)settings listener:(id)listener;

-(int) subscribeTransient:(NSArray<NSString *> *) addresses type:(uint32_t)type activity:(uint32_t)activity duration:(uint32_t)duration;

-(NSArray *) getSortedProfiles;
-(NSArray *) getRecentProfiles;

-(void) updateLookups;

//********************** Utility Functions *********************************************

-(uint32_t) random;

-(BOOL) createFile:(NSString *)path fileName:(NSString *)fileName data:(NSData *)data overwrite:(BOOL)overwrite;
-(BOOL) createPath:(NSString *)path;
-(BOOL) fileExists:(NSString *)fileName;
-(BOOL) deleteFile:(NSString *)path;
-(BOOL) renameFile:(NSString *)srcFile destFile:(NSString *)destFile forced:(BOOL) forced ;

// phone functions, used in demo app
-(int) getCountryCodeFromPhone:(NSString *) phone;
-(NSString *) getFQN:(NSString *)phone code:(int)code mcc:(int)mcc;

-(BOOL) isUiThread;
-(void) runInThread:(BOOL)uiThread handler:(Mesibo_onRunHandler) handler;
-(UIImage *) loadImage:(UIImage *)image filePath:(NSString *)path maxside:(int)maxside;

//********************** Network.HTTP(S) Functions *********************************************
-(int) getNetworkConnectivity;

#if 0
-(NSString *) fetch_deprecated:(NSString *)url post:(NSDictionary *)post filePath:(NSString *) filePath;
-(int) upload_deprecated:(NSString *)url filePath:(NSString *)filePath fileField:(NSString*)fileField post:(NSDictionary *)post  progress:(Mesibo_onHTTPUtilsProgress)progress cbdata:(id) cbdata;
-(int) upload_deprecated:(NSString *)url phAsset:(id)phAsset fileField:(NSString *)fileField post:(NSDictionary *)post progress:(Mesibo_onHTTPUtilsProgress)progress cbdata:(id)cbdata;
-(int) download_deprecated:(NSString *)url filePath:(NSString *)filePath post:(NSDictionary *)post  progress:(Mesibo_onHTTPUtilsProgress)progress cbdata:(id) cbdata;
//-(NSString *)fetch:(NSString *)url post:(NSDictionary *)post filePath:(NSString *)filePath fileField:(NSString*)fileField;
#endif

//********************** UI Functions *********************************************
-(BOOL) setMessageWidthInPercent:(int) percent;
-(int) getMessageWidthInPoints;




+ (void) Log:(const char*)sourceFile lineNumber:(int)lineNumber format:(NSString*)format, ...;
+ (void) Log:(NSString*)format, ...;

-(void) setCallInterface:(int)type ci:(void *) ci;
-(int) call:(NSString *)phone video:(BOOL)video;
-(int) answer:(BOOL)video;
-(int) call_ack:(BOOL)cis;
-(int) call_info:(uint64_t)info width:(uint16_t)width height:(uint16_t) height;
-(int) mute:(BOOL)audio video:(BOOL)video enable:(BOOL)enable;
-(int) hold:(BOOL)enable;
-(int) dtmf:(int)digit;
-(int) hangup:(uint32_t)callid;
-(int) getMuteStatus;
-(void) setCallProcessing:(int)rejectStatus currentStatus:(int)currentStatus;
-(void) setCallStatus:(int)type sdp:(NSString *)sdp;
-(void) setCallQueue:(id)q;
-(void) requestBackgroundTime;
-(void) remlog_start:(NSString *)host port:(int) port;
-(void) remlog:(NSString *)log;
//-(MesiboServer *) getServer:(int)type;

// INTERNAL USE ONLY - NOT TO BE USED
-(id) getProfilesManager;

// INTERNAL USE ONLY - DO NOT invoke these functions directly
-(int) groupcall_start:(uint32_t) groupid;
-(int) groupcall_stop:(uint32_t) groupid;
-(int) groupcall_create_participant:(uint32_t) sid flags:(uint32_t) flags;
-(int) groupcall_call:(uint32_t)peer sid:(uint32_t)sid flags:(uint32_t)flags resolution:(uint32_t)resolution screen:(BOOL)screen;
-(int) groupcall_hangup:(uint32_t)peer sid:(uint32_t) sid;
-(int) groupcall_set_media:(uint32_t)peer sid:(uint32_t)sid resolution:(uint32_t)resolution screen:(BOOL)screen;
-(int) groupcall_mute:(uint32_t)peer sid:(uint32_t)sid video:(BOOL)video audio:(BOOL)audio mute:(BOOL)mute;
-(int) groupcall_sdp:(uint32_t)peer sid:(uint32_t)sid resolutioon:(uint32_t)resolution type:(int)type sdp:(NSString *)sdp mid:(NSString *)mid mline:(int) mline;

/*
 
 //+(NSString *)callstatusToString:(int) status;
 
 //-(void) setOnAlert:(MesiboAlertBlock) alertBlock;
 //-(void) setOnLogout:(MesiboLogoutBlock) onLogoutBlock;
 -(int) call:(NSString *)phone
 withHandler:(MesiboCallBlock) completionHandler;
 -(void) dtmf:(int)digit;
 -(void) hangup;
 -(void) mute:(BOOL)OnOrOff;
 -(void) routeAudio:(int)route OnOrOff:(BOOL)state;
 -(int) getCharges:(float *)charge;
 */

-(void *) getApi;
@end

#ifdef MESIBO_NOLOGS
#define NSLog(args, ...) do {} while(0)
#endif
