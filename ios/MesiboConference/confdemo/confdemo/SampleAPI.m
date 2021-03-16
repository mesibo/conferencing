//
//  SampleAPI.m
//  MesiboDevel
//
//  Updated by Grace on 23/12/19.
//  Copyright © 2018 Mesibo. All rights reserved.
//
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


#import "SampleAPI.h"
#import "Mesibo/Mesibo.h"
#import "NSDictionary+NilObject.h"
#import "AppAlert.h"
#import "AppDelegate.h"

#define TOKEN_KEY  @"token"
#define UPLOADURL_KEY  @"upload"
#define DOWNLOADURL_KEY  @"download"
#define INVITE_KEY  @"inivte"

@interface SampleAPI ( /* class extension */ ) <MesiboDelegate>
{
    NSUserDefaults *mUserDefaults;
    SampleAPI_LogoutBlock mLogoutBlock;
    NSString *mDeviceType;
    NSString *mApiUrl;
    NSString *mUploadUrl;
    NSString *mDownloadUrl;
    NSString *mInvite;
    NSString *mToken;
}

@end

@implementation SampleAPI

+(SampleAPI *)getInstance {
    static SampleAPI *myInstance = nil;
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
    mApiUrl = @"https://app.mesibo.com/conf/api.php";
    

    mUserDefaults = [NSUserDefaults standardUserDefaults];
    mToken = [mUserDefaults objectForKey:TOKEN_KEY];    
    mDeviceType = [NSString stringWithFormat:@"%d", [MesiboInstance getDeviceType]];
}

-(void) setOnLogout:(SampleAPI_LogoutBlock)logOutBlock {
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
    
    [MesiboInstance setAccessToken:[SampleAPIInstance getToken]];
    [MesiboInstance setDatabase:@"conf.db" resetTables:0];
    [MesiboInstance setDelegate:self];
    
    [MesiboInstance setSecureConnection:YES];
    [MesiboInstance start];
    
}



-(NSString *) getToken {
    if([SampleAPI isEmpty:mToken])
        return nil;
    
    return mToken;
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

-(BOOL) parseResponse:(NSString *)response request:(NSDictionary*)request handler:(SampleAPI_onResponse) handler {
    NSMutableDictionary *returnedDict = nil;
    NSString *op = nil;
    int result = SAMPLEAPP_RESULT_FAIL;
    
    NSError *jsonerror = nil;
    
    //NSLog(@"Request: %@", request);
    //NSLog(@"Response: %@", response);
    
    //MUST not happen
    if(nil == response)
        return YES;
    
    //LOGD(@"Data %@", [NSString stringWithUTF8String:(const char *)[data bytes]]);
    NSData *data = [response dataUsingEncoding:NSUTF8StringEncoding];
    id jsonObject = [NSJSONSerialization JSONObjectWithData:data options:NSJSONReadingAllowFragments error:&jsonerror];
    
    if (jsonerror != nil) {
        if(nil != handler)
            handler(result, nil);
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
        if(nil != handler) {
            [MesiboInstance runInThread:YES handler:^{
                handler(result, nil);
            }];
        }
        
        return YES;
        
    }
    
    //NSString *result = (NSString *)[returnedDict objectForKeyOrNil:@"result"];
    //NSString *subresult = (NSString *)[returnedDict objectForKeyOrNil:@"subresult"];
    op = (NSString *)[returnedDict objectForKeyOrNil:@"op"];
    NSString *res = (NSString *)[returnedDict objectForKeyOrNil:@"result"];
    if([res isEqualToString:@"OK"]) {
        result = SAMPLEAPP_RESULT_OK;
    } else {
        NSString *error = (NSString *)[returnedDict objectForKeyOrNil:@"error"];
        NSString *errmsg = (NSString *)[returnedDict objectForKeyOrNil:@"errmsg"];
        NSString *errtitle = (NSString *)[returnedDict objectForKeyOrNil:@"errtitle"];
        if([error isEqualToString:@"AUTHFAIL"]) {
            result = SAMPLEAPP_RESULT_AUTHFAIL;
            [self logout:YES parent:nil];
            return NO;
        }
        
        if(errmsg) {
            if(!errtitle) errtitle = @"Failed";
            [AppAlert showDialogue:errmsg withTitle:errtitle];
        }
    }
    
    int64_t serverts = (uint64_t) [[returnedDict objectForKeyOrNil:@"ts"] longLongValue];
    
    if(SAMPLEAPP_RESULT_OK != result) {
        if(nil != handler)
            handler(result, returnedDict);
        return NO;
    }
    
    NSString *temp = (NSString *)[returnedDict objectForKeyOrNil:@"invite"];
    if(temp && [temp length] >0) {
        mInvite = [self getSavedValue:temp key:INVITE_KEY];
    }
    
    NSDictionary *urls = (NSDictionary *)[returnedDict objectForKeyOrNil:@"urls"];
    if(urls) {
        mUploadUrl = [self getSavedValue:(NSString *)[urls objectForKeyOrNil:@"upload"] key:UPLOADURL_KEY];
        mDownloadUrl = [self getSavedValue:(NSString *)[urls objectForKeyOrNil:@"download"] key:DOWNLOADURL_KEY];
    }
    
    if([op isEqualToString:@"login"]) {
        mToken = (NSString *)[returnedDict objectForKeyOrNil:@"token"];
        

        if(![SampleAPI isEmpty:mToken]) {
            [self save];
            
            [MesiboInstance reset];
            
            //NO DB OP SHOULD BE HERE UNLESS DB is initialized
            
            
        }
        
        
    } else if([op isEqualToString:@"delgroup"]) {
        uint32_t groupid = [[returnedDict objectForKeyOrNil:@"gid"] unsignedIntValue];
    } else if([op isEqualToString:@"upload"]) {
   
        
    }
    
    if(handler) {
        [MesiboInstance runInThread:YES handler:^{
            handler(result, returnedDict);
        }];
        
    }
    
    return YES;
    
}


-(void) invokeApi:(NSDictionary *)post filePath:(NSString *)filePath handler:(SampleAPI_onResponse) handler {
    
    if(post) {
        [post setValue:mDeviceType forKey:@"dt"];
    }
    
    Mesibo_onHTTPProgress progressHandler = ^BOOL(MesiboHttp *http, int state, int progress) {
        
        /*
         if(nil != response) {
         NSArray *aArray = [response componentsSeparatedByString:@"op"];
         NSString *str1 = @"{\"op";
         NSString *str2 = [aArray objectAtIndex:1];
         response = [str1 stringByAppendingString:str2];
         }*/
        
        if(100 == progress && state == MESIBO_HTTPSTATE_DOWNLOAD) {
            [self parseResponse:[http getDataString] request:post handler:handler];
        }
        
        if(progress < 0) {
            NSLog(@"invokeAPI failed");
            // 100 % progress will be handled by parseResponse
            if(nil != handler) {
                handler(SAMPLEAPP_RESULT_FAIL, nil);
            }
        }
        
        
        return YES;
        
    };
    
    MesiboHttp *http = [MesiboHttp new];
    http.url = [self getApiUrl];
    http.postBundle = post;
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



-(void) startLogout:(SampleAPI_onResponse) handler {
    if(nil == mToken)
        return;
    
    NSMutableDictionary *post = [[NSMutableDictionary alloc] init];
    [post setValue:@"logout" forKey:@"op"];
    
    //even if token value is wrong, logout will happen due to AUTHFAIL
    [post setValue:mToken forKey:@"token"];
    
    [self invokeApi:post filePath:nil handler:handler];
    return;
}

-(void) logout:(BOOL)forced parent:(id)parent {
    if(!forced) {
        [self startLogout:^(int result, NSDictionary *response) {
            if(MESIBO_RESULT_OK == result)
                [self logout:YES parent:parent];
        }];
        return;
    }
    
    [MesiboInstance stop];
    mToken = @"";
    [self save];
    [MesiboInstance reset];
    
    if(nil != mLogoutBlock)
        mLogoutBlock(parent);
    
}

        

-(void) login:(NSString *)name email:(NSString *)email code:(NSString *)code handler:(SampleAPI_onResponse) handler {
    NSMutableDictionary *post = [[NSMutableDictionary alloc] init];
    [post setValue:@"login" forKey:@"op"];
    [post setValue:name forKey:@"name"];
    [post setValue:email forKey:@"email"];
    if(nil != code) {
        [post setValue:code forKey:@"code"];
    }
    
    NSString *packageName = [[NSBundle mainBundle] bundleIdentifier];
    [post setValue:packageName forKey:@"appid"];
    
    [self invokeApi:post filePath:nil handler:handler];
}

-(void) joinRoom:(NSString *)gid pin:(NSString *)pin handler:(SampleAPI_onResponse) handler {
    NSMutableDictionary *post = [[NSMutableDictionary alloc] init];
    [post setValue:@"joingroup" forKey:@"op"];
    [post setValue:[self getToken] forKey:@"token"];
    [post setValue:gid forKey:@"gid"];
    [post setValue:pin forKey:@"pin"];
    
    [self invokeApi:post filePath:nil handler:handler];
}

-(void) createRoom:(NSString *)name resolutoon:(int)resolution handler:(SampleAPI_onResponse) handler {
    NSMutableDictionary *post = [[NSMutableDictionary alloc] init];
    [post setValue:@"setgroup" forKey:@"op"];
    [post setValue:[self getToken] forKey:@"token"];
    [post setValue:name forKey:@"name"];
    
    NSString *r = [NSString stringWithFormat:@"%d", resolution];
    [post setValue:r forKey:@"resolution"];
    
    [self invokeApi:post filePath:nil handler:handler];
}

-(void) getRooms:(SampleAPI_onResponse) handler {
    NSMutableDictionary *post = [[NSMutableDictionary alloc] init];
    [post setValue:@"rooms" forKey:@"op"];
    [post setValue:[self getToken] forKey:@"token"];
    [self invokeApi:post filePath:nil handler:handler];
}

-(void) welcome:(SampleAPI_onResponse) handler {
    NSMutableDictionary *post = [[NSMutableDictionary alloc] init];
    [post setValue:@"welcome" forKey:@"op"];    
    [self invokeApi:post filePath:nil handler:handler];
}

-(BOOL) setProfile:(NSString*)name status:(NSString*)status groupid:(uint32_t)groupid handler:(SampleAPI_onResponse) handler {
    if(nil == mToken || mToken.length == 0)
        return NO ;
    
    NSMutableDictionary *post = [[NSMutableDictionary alloc] init];
    [post setValue:@"profile" forKey:@"op"];
    [post setValue:mToken forKey:@"token"];
    [post setValue:name forKey:@"name"];
    [post setValue:status forKey:@"status"];
    [post setValue:[@(groupid) stringValue]  forKey:@"gid"];
    
    [self invokeApi:post filePath:nil handler:handler];
    return YES;
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


-(BOOL) getGroup:(uint32_t) groupid handler:(SampleAPI_onResponse) handler {
    if(nil == mToken || 0 == groupid)
        return NO;
    
    NSMutableDictionary *post = [[NSMutableDictionary alloc] init];
    [post setValue:@"getgroup" forKey:@"op"];
    [post setValue:mToken forKey:@"token"];
    [post setValue:[@(groupid) stringValue] forKey:@"gid"];
    
    [self invokeApi:post filePath:nil handler:handler];
    return YES;
}

-(void) startOnlineAction {

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
    
    // You will receive messages here
    NSString* message = [[NSString alloc] initWithData:data encoding:NSUTF8StringEncoding];
    
    if(MESIBO_ORIGIN_REALTIME == params.origin && 0 == params.type) {
    }

}

-(void) Mesibo_OnMessage:(MesiboMessage *)message {
    
}

-(void) Mesibo_OnMessageStatus:(MesiboParams *)params {

}
@end
