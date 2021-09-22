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


#import <Foundation/Foundation.h>
#import "NSDictionary+NilObject.h"


#define SAMPLEAPP_RESULT_OK         0
#define SAMPLEAPP_RESULT_FAIL       1
#define SAMPLEAPP_RESULT_AUTHFAIL   2


#define VISIBILITY_HIDE         0
#define VISIBILITY_VISIBLE      1
#define VISIBILITY_UNCHANGED    2

@interface LoginResponse : NSObject
@property (nonatomic) NSString *result;
@property (nonatomic) NSString *op;
@property (nonatomic) NSString *token;
@property (nonatomic) NSString *title;
@property (nonatomic) NSString *message;
@property (nonatomic) uint32_t delay;
@end

typedef void (^MessengerDemoAPI_onLogout)(id parent);
typedef void (^MessengerDemoAPI_onLogin)(BOOL result, LoginResponse *token);

#define MessengerDemoAPIInstance [MessengerDemoAPI getInstance]

@interface MessengerDemoAPI : NSObject

+(MessengerDemoAPI *) getInstance;

-(void) initialize;
-(void) setOnLogout:(MessengerDemoAPI_onLogout)logOutBlock;
-(NSString *) getToken;
-(BOOL) isLoginAttempted;

-(void) startMesibo;

-(void) resetDB;
-(void) logout:(BOOL) forced parent:(id)parent;
-(void) login:(NSString *)name phone:(NSString *)phone code:(NSString *)code handler:(MessengerDemoAPI_onLogin) handler;

+(BOOL) isEmpty:(NSString *)string; //utility
+(BOOL) equals:(NSString *)s old:(NSString *)old;

@end
