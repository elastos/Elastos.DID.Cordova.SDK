/*
 * Copyright (c) 2019 Elastos Foundation
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

import Foundation
import ElastosDIDSDK
import Alamofire

class DIDPluginAdapter : DIDAdapter {
    private let TAG = "DIDPluginAdapter"
    private let callbackId: Int
    private var command: CDVInvokedUrlCommand
    private var commandDelegate: CDVCommandDelegate
    
    // Privnet
    // private let resolver = "https://coreservices-didsidechain-privnet.elastos.org"
    // TestNet
    // private let resolver = "http://api.elastos.io:21606"
    // MainNet
    // private var resolver = "http://api.elastos.io:20606"

    init(id: Int, command: CDVInvokedUrlCommand, commandDelegate: CDVCommandDelegate) {
        self.callbackId = id
        self.command = command
        self.commandDelegate = commandDelegate
    }

    private func sendEvent(info: NSMutableDictionary) {
        info.setValue(callbackId, forKey: "id")

        let result = CDVPluginResult(status: CDVCommandStatus_OK, messageAs: (info as! [AnyHashable : Any]))
        result?.setKeepCallbackAs(true)
        self.commandDelegate.send(result, callbackId: command.callbackId)
    }

    public func setCallbackContext(command: CDVInvokedUrlCommand, commandDelegate: CDVCommandDelegate) {
        self.command = command
        self.commandDelegate = commandDelegate
    }

    func createIdTransaction(_ payload: String, _ memo: String?, _ confirms: Int, _ callback: @escaping (String, Int, String?) -> Void) {
        let ret = NSMutableDictionary()
        ret.setValue(payload, forKey: "payload")
        ret.setValue(memo, forKey: "memo")
        self.sendEvent(info: ret)
        
        callback("", 0, nil);
    }
    
//    func resolve(_ requestId: String, _ did: String, _ all: Bool) throws -> String {
//        NSLog("DIDPlugin adapter resolve() called for \(did)")
//
//        var resolveError: DIDError? = nil
//        var responseData: Data? = nil
//
//        // Currently, DID SDK requires a synchronous response, so we convert our async http to a sync call using semaphores
//        let semaphore = DispatchSemaphore(value: 0)
//
//        let parameters: [String: Any] = [
//            "id" : requestId,
//            "method" : "resolvedid",
//            "params": [
//                "did": did,
//                "all": all
//            ]
//        ]
//
//        let headers: HTTPHeaders = [
//          "User-Agent": "Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.11 (KHTML, like Gecko) Chrome/23.0.1271.95 Safari/537.11",
//          "Content-Type": "application/json",
//          "Accept": "application/json"
//        ]
//
//        // Run our request and ask to receive the response in a background thread as we are going to lock
//        // the main thread with a semaphore.
//        let queue = DispatchQueue(label: "did_resolver", qos: .background, attributes: .concurrent)
//        Alamofire.request(self.resolver, method: .post, parameters: parameters, encoding: JSONEncoding.default, headers: headers)
//            .responseJSON(queue: queue) { response in
//
//                if (response.response == nil || response.response?.statusCode != 200) {
//                    resolveError = DIDError.didResolveError(_desc: "Unable to resolve DID: \(response.response?.statusCode ?? -1) \(response.description)")
//                }
//                else {
//                    responseData = response.data
//                }
//                semaphore.signal()
//            }
//
//        _ = semaphore.wait(timeout: DispatchTime.distantFuture)
//
//        if (resolveError != nil) {
//            throw resolveError!
//        }
//
//        if (responseData == nil) {
//            throw DIDError.didResolveError(_desc: "Empty data received")
//        }
//
//        if let ret = String(data: responseData!, encoding: .utf8) {
//            return ret
//        }
//        else {
//            throw DIDError.didResolveError(_desc: "Received data is not valid a UTF8 string")
//        }
//    }
}
