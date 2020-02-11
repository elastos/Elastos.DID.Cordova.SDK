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

class DIDPluginAdapter : DIDAdapter {
    private let TAG = "DIDPluginAdapter"
    private let callbackId: Int
    private let command: CDVInvokedUrlCommand
    private let commandDelegate: CDVCommandDelegate
    
    // Privnet
    // private let resolver = "https://coreservices-didsidechain-privnet.elastos.org"
    // TestNet
    // private let resolver = "http://api.elastos.io:21606"
    // MainNet
    private let resolver = "http://api.elastos.io:20606"

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

    /*
    public func setResolver(resolver: String) {
        self.resolver = resolver
    }*/

    func createIdTransaction(_ payload: String, _ memo: String?) throws -> String {
        let ret = NSMutableDictionary()
        ret.setValue(payload, forKey: "payload")
        ret.setValue(memo, forKey: "memo")
        self.sendEvent(info: ret)
        return "";
    }
    
    func resolve(_ requestId: String, _ did: String, _ all: Bool) throws -> String {
        /*
         DIDResolveException {
         try {
             Log.d(TAG, "Resolving remote did: " + did);
             URL url = new URL(this.resolver);
             HttpURLConnection connection = (HttpURLConnection)url.openConnection();
             connection.setRequestMethod("POST");
             connection.setRequestProperty("User-Agent",
                     "Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.11 (KHTML, like Gecko) Chrome/23.0.1271.95 Safari/537.11");
             connection.setRequestProperty("Content-Type", "application/json");
             connection.setRequestProperty("Accept", "application/json");
             connection.setDoOutput(true);
             connection.connect();

             OutputStream os = connection.getOutputStream();
             JsonFactory factory = new JsonFactory();
             JsonGenerator generator = factory.createGenerator(os, JsonEncoding.UTF8);
             generator.writeStartObject();
             generator.writeStringField("id", requestId);
             generator.writeStringField("method", "resolvedid");
             generator.writeFieldName("params");
             generator.writeStartObject();
             generator.writeStringField("did", did);
             generator.writeBooleanField("all", all);
             generator.writeEndObject();
             generator.writeEndObject();
             generator.close();
             os.close();

             int code = connection.getResponseCode();
             if (code != HttpURLConnection.HTTP_OK)
                 throw new DIDResolveException("Unable to resolve DID: "+code+" "+connection.getResponseMessage());

             return connection.getInputStream();
         }
         catch (IOException e) {
             throw new DIDResolveException("Network error.", e);
         }
         */
        
        return "" // TODO
    }
}
