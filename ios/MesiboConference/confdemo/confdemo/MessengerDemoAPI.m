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
#import "MessengerDemoAPI.h"
#import "Mesibo/Mesibo.h"
#import "NSDictionary+NilObject.h"
#import "AppAlert.h"
#import "AppDelegate.h"

#define TOKEN_KEY  @"mesibo_token2"
#define UPLOADURL_KEY  @"upload"
#define DOWNLOADURL_KEY  @"download"
#define INVITE_KEY  @"inivte"

@interface MessengerDemoAPI ( /* class extension */ ) <MesiboDelegate>
{
    NSUserDefaults *mUserDefaults;
    MessengerDemoAPI_onLogout mLogoutBlock;
    NSString *mDeviceType;
    NSString *mApiUrl;
    NSString *mUploadUrl;
    NSString *mDownloadUrl;
    NSString *mInvite;
    NSString *mToken;
    BOOL mLoginAttempted;
}

@end

@implementation MessengerDemoAPI

+(MessengerDemoAPI *)getInstance {
    static MessengerDemoAPI *myInstance = nil;
    if(nil == myInstance) {
        @synchronized(self) {
            if (nil == myInstance) {
                myInstance = [[self alloc] init];
                [myInstance initialize];
            }
        }
    }
    return myInstance;
}

-(BOOL) isValidUrl:(NSString *)url {
    return ([url hasPrefix:@"http://"] || [url hasPrefix:@"https://"]);
}

-(void)initialize {
    mApiUrl = @"https://messenger.mesibo.com";
    

    mUserDefaults = [NSUserDefaults standardUserDefaults];
    mToken = [mUserDefaults objectForKey:TOKEN_KEY];    
    mDeviceType = [NSString stringWithFormat:@"%d", [MesiboInstance getDeviceType]];
    mLoginAttempted = NO;
}

-(void) setOnLogout:(MessengerDemoAPI_onLogout)logOutBlock {
    mLogoutBlock = logOutBlock;
}

-(NSString *)getSavedValue:(NSString *)value key:(NSString *)key {
    if(value) {
        [MesiboInstance setKey:value value:key];
        return value;
    }
    
    return [MesiboInstance readKey:key];
}

-(void) startMesibo {
    
    
    NSString *appdir = [NSSearchPathForDirectoriesInDomains(NSDocumentDirectory, NSUserDomainMask, YES) lastObject];
    [MesiboInstance setPath:appdir];
    
    [MesiboInstance setAccessToken:[MessengerDemoAPIInstance getToken]];
    [MesiboInstance setDatabase:@"conf.db" resetTables:0];
    [MesiboInstance setDelegate:self];
    
    [MesiboInstance setSecureConnection:YES];
    [MesiboInstance start];
    
}

-(NSString *) getToken {
    if([MessengerDemoAPI isEmpty:mToken])
        return nil;
    
    return mToken;
}

-(BOOL) isLoginAttempted {
    return mLoginAttempted;
}

-(NSString *) getApiUrl {
    return mApiUrl;
}

-(NSString *) getUploadUrl {

    return mUploadUrl;
}

-(NSString *) getDownloadUrl {

    return mDownloadUrl;
}

-(void)save {
    [mUserDefaults setObject:mToken forKey:TOKEN_KEY];
  
    [mUserDefaults synchronize];
}

-(BOOL) parseResponse:(NSString *)response request:(NSDictionary*)request handler:(MessengerDemoAPI_onLogin) handler {
    NSMutableDictionary *returnedDict = nil;
    NSError *jsonerror = nil;
    
    //MUST not happen
    if(nil == response)
        return YES;
    
    //LOGD(@"Data %@", [NSString stringWithUTF8String:(const char *)[data bytes]]);
    NSData *data = [response dataUsingEncoding:NSUTF8StringEncoding];
    id jsonObject = [NSJSONSerialization JSONObjectWithData:data options:NSJSONReadingAllowFragments error:&jsonerror];
    
    if (jsonerror != nil) {
        if(handler) handler(NO, nil);
        return YES;
    }
    
    if ([jsonObject isKindOfClass:[NSArray class]]) {
        //LOGD(@"its an array!");
        //NSArray *jsonArray = (NSArray *)jsonObject;
        
    }
    else {
        //LOGD(@"its probably a dictionary");
        returnedDict = (NSMutableDictionary *)jsonObject;
    }
    
    if(nil == returnedDict) {
        if(handler) {
            [MesiboInstance runInThread:YES handler:^{
                handler(NO, nil);
            }];
        }
        
        return YES;
    }
    
    BOOL result = NO;
    LoginResponse *resp = [LoginResponse new];
    resp.op = (NSString *)[returnedDict objectForKeyOrNil:@"op"];
    resp.result = (NSString *)[returnedDict objectForKeyOrNil:@"result"];
    
    if(![resp.result isEqualToString:@"OK"]) {
        if(handler) {
            [MesiboInstance runInThread:YES handler:^{
                handler(NO, resp);
            }];
        }
        return YES;
    }
    
    resp.title = (NSString *)[returnedDict objectForKeyOrNil:@"title"];
    resp.message = (NSString *)[returnedDict objectForKeyOrNil:@"message"];
    NSNumber *delay = [returnedDict objectForKeyOrNil:@"delay"];
    if(delay) resp.delay = (uint32_t) [delay intValue];
    
    result = YES;
    BOOL login = NO;
    if([resp.op isEqualToString:@"login"]) {
        login = YES;
        mToken = (NSString *)[returnedDict objectForKeyOrNil:@"token"];
        resp.token = mToken;
        mLoginAttempted = YES;

        if(![MessengerDemoAPI isEmpty:mToken]) {
            [self save];
            
            [MesiboInstance reset];
        }
        
    }
    
    if(handler) {
        [MesiboInstance runInThread:YES handler:^{
            if(login)
                handler(YES, resp);
            else
                mLogoutBlock(nil);
        }];
    }
    
    return YES;
    
}


-(void) invokeApi:(NSDictionary *)post filePath:(NSString *)filePath handler:(MessengerDemoAPI_onLogin) handler {
    
    if(post) {
        [post setValue:mDeviceType forKey:@"dt"];
    }
    
    NSError *error;
    //options:NSJSONWritingPrettyPrinted
    NSData *jsonData = [NSJSONSerialization dataWithJSONObject:post options:0 error:&error];
    if(!jsonData) {
        //[[NSString alloc] initWithData:jsonData encoding:NSUTF8StringEncoding];
        
    }
    
    Mesibo_onHTTPProgress progressHandler = ^BOOL(MesiboHttp *http, int state, int progress) {
        
        if(100 == progress && state == MESIBO_HTTPSTATE_DOWNLOAD) {
            [self parseResponse:[http getDataString] request:post handler:handler];
        }
        
        if(progress < 0) {
            NSLog(@"invokeAPI failed");
            if(handler) handler(NO, nil);
        }
        
        return YES;
        
    };
    
    MesiboHttp *http = [MesiboHttp new];
    http.url = [self getApiUrl];
    http.contentType = @"application/json";
    http.post = jsonData;
    http.uploadFile = filePath;
    http.uploadFileField = @"photo";
    
    http.listener = progressHandler;
    
    if(![http execute]) {
        
    }
    
}

+(BOOL) equals:(NSString *)s old:(NSString *)old {
    int sempty = (int) [s length];
    int dempty = (int) [old length];
    if(sempty != dempty) return NO;
    if(!sempty) return YES;
    
    return ([s caseInsensitiveCompare:old] == NSOrderedSame);
}

+(BOOL) isEmpty:(NSString *)string {
    if(/*[NSNull null] == string ||*/ nil == string || 0 == [string length])
        return YES;
    return NO;
}



-(void) startLogout {
    if(nil == [MessengerDemoAPIInstance getToken])
        return;
    
    NSMutableDictionary *post = [[NSMutableDictionary alloc] init];
    [post setValue:@"logout" forKey:@"op"];
    
    //even if token value is wrong, logout will happen due to AUTHFAIL
    [post setValue:mToken forKey:@"token"];
    
    [self invokeApi:post filePath:nil handler:nil];
    return;
}

-(void) logout:(BOOL)forced parent:(id)parent {
    [self startLogout];
    
    [MesiboInstance stop];
    mToken = @"";
    [self save];
    [MesiboInstance reset];
    
    if(nil != mLogoutBlock)
        mLogoutBlock(parent);
    
}

        

-(void) login:(NSString *)name phone:(NSString *)phone code:(NSString *)code handler:(MessengerDemoAPI_onLogin)handler {
    NSMutableDictionary *post = [[NSMutableDictionary alloc] init];
    [post setValue:@"login" forKey:@"op"];
    [post setValue:name forKey:@"name"];
    [post setValue:phone forKey:@"phone"];
    if(nil != code) {
        [post setValue:code forKey:@"otp"];
    }
    
    NSString *packageName = [[NSBundle mainBundle] bundleIdentifier];
    [post setValue:packageName forKey:@"appid"];
    
    [self invokeApi:post filePath:nil handler:handler];
}


-(NSString *) fetch:(NSDictionary *)post filePath:(NSString *) filePath {
    MesiboHttp *http = [MesiboHttp new];
    http.url = [self getApiUrl];
    http.postBundle = post;
    http.uploadFile = filePath;
    http.uploadFileField = @"photo";
    
    if([http executeAndWait]) {
        return [http getDataString];
    }
    
    return nil;
}


-(void) resetDB {
    [MesiboInstance resetDatabase:MESIBO_DBTABLE_ALL];
}

-(void) Mesibo_OnConnectionStatus:(int)status {
    // You will receive the connection status here
    
    NSLog(@"Connection status: %d", status);
    if(MESIBO_STATUS_AUTHFAIL == status) {
        mToken = nil;
        [self save];
        
        [MesiboInstance runInThread:YES handler:^{
                AppDelegate *appDelegate = (AppDelegate *)[[UIApplication sharedApplication] delegate];
                [appDelegate selectViewController];
        }];
    }
        
}

-(void) Mesibo_OnMessage:(MesiboParams *)params data:(NSData *)data {
    

}

-(void) Mesibo_OnMessage:(MesiboMessage *)message {
    
}

-(void) Mesibo_OnMessageStatus:(MesiboParams *)params {

}
@end

@implementation LoginResponse
- (id)init
{
    self = [super init];
    if (!self) return self;

    _result = nil;
    _op = nil;
    _token = nil;
    _title = nil;
    _message = nil;
    _delay = 0;
    
    return self;
}
@end
