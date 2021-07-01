/*
 * Copyright (c) 2021 Elastos Foundation
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

class DIDPluginAdapter: DefaultDIDAdapter {

    private let TAG = NSStringFromClass(DIDPluginAdapter.self)
    private let callbackId: Int
    private var didStoreId: String
    private var command: CDVInvokedUrlCommand
    private var commandDelegate: CDVCommandDelegate?
    private var endpoint: String = "http://localhost:9123"
//    private var endpoint: String = "https://api.elastos.io/did/v2"
//    private var endpoint: String = "http://52.80.107.251:1111"
//    private var endpoint: String = "https://api-tesetnet.elastos.io/newid"

    private var idtxEndpoint: String = ""

    init(id: Int, didStoreId: String, command: CDVInvokedUrlCommand, commandDelegate: CDVCommandDelegate) {
        self.callbackId = id
        self.didStoreId = didStoreId
        self.command = command
        self.commandDelegate = commandDelegate
        super.init(endpoint + "/resolve")
//        super.init(endpoint)
    }

    private func sendEvent(info: NSMutableDictionary) {
        info.setValue(callbackId, forKey: "id")
        info.setValue(didStoreId, forKey: "didStoreId")

        let result = CDVPluginResult(status: CDVCommandStatus_OK, messageAs: (info as! [AnyHashable : Any]))
        result?.setKeepCallbackAs(true)
        self.commandDelegate?.send(result, callbackId: command.callbackId)
    }

    public func setCallbackContext(command: CDVInvokedUrlCommand, commandDelegate: CDVCommandDelegate) {
        self.command = command
        self.commandDelegate = commandDelegate
    }

    override func createIdTransaction(_ payload: String, _ memo: String?) throws {

        let ret = NSMutableDictionary()
        ret.setValue(payload, forKey: "payload")
        ret.setValue(memo, forKey: "memo")
        self.sendEvent(info: ret)
    }
}
