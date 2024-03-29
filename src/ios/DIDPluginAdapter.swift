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
    private var command: CDVInvokedUrlCommand?
    private var commandDelegate: CDVCommandDelegate?
    private var publicationStoreId: String? = "";

    private var idtxEndpoint: String = ""

    init(endpoint: String, id: Int) {
        self.callbackId = id
        super.init(endpoint)
    }

    private func sendEvent(info: NSMutableDictionary) {
        info.setValue(callbackId, forKey: "id")
        info.setValue(publicationStoreId, forKey: "didStoreId")

        let result = CDVPluginResult(status: CDVCommandStatus_OK, messageAs: (info as! [AnyHashable : Any]))
        result?.setKeepCallbackAs(true)
        self.commandDelegate?.send(result, callbackId: command?.callbackId)
    }

    public func setCallbackContext(command: CDVInvokedUrlCommand, commandDelegate: CDVCommandDelegate) {
        self.command = command
        self.commandDelegate = commandDelegate
    }

    public func setPublicationStoreId(_ storeId: String?) {
        self.publicationStoreId = storeId
    }

    override func createIdTransaction(_ payload: String, _ memo: String?) throws {

        let ret = NSMutableDictionary()
        ret.setValue(payload, forKey: "payload")
        ret.setValue(memo, forKey: "memo")
        self.sendEvent(info: ret)
        // Reset the store id to avoid mistakes
        self.setPublicationStoreId(nil)
    }
}
