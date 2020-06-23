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

class JSONObjectHolder {
    public static func getDIDInfoJson(entry: DID) throws -> NSDictionary {
        let r = NSMutableDictionary()
        r.setValue(entry.description, forKey: "did") // TODO: initially "toString()" in java, does "description" work for ios ?
        r.setValue(entry.getMetadata().aliasName, forKey: "alias")
        return r
    }
    
    public static func getDIDsInfoJson(dids: [DID]?) throws -> NSDictionary {
        let array = NSMutableArray()
        
        if let dids = dids {
            for entry in dids {
                array.add(try getDIDInfoJson(entry: entry))
            }
        }
        
        let r = NSMutableDictionary()
        r.setValue(array, forKey: "items")
        
        return r
    }

    /* TODO
    

    public static JSONObject getCredentialInfoJson(DIDURL entry) throws JSONException, DIDException {
        JSONObject r = new JSONObject();
        r.put("didurl", entry.toString());
        r.put("alias", entry.getAlias());
        return r;
    }

    public static JSONObject getCredentialsInfoJson(List<DIDURL> dids) throws JSONException, DIDException {
        JSONArray array = new JSONArray();
        for (DIDURL entry : dids) {
            array.put(getCredentialInfoJson(entry));
        }

        JSONObject r = new JSONObject();
        r.put("items", array);
        return r;
    }

    public static JSONObject getPublicKeyInfoJson(DIDDocument.PublicKey entry) throws JSONException {
        JSONObject r = new JSONObject();
        r.put("id", entry.getId());
        r.put("controller", entry.getController());
        r.put("keyBase58", entry.getPublicKeyBase58());
        return r;
    }

    public static JSONObject getPublicKeysInfoJson(List<DIDDocument.PublicKey> keys) throws JSONException {
        JSONArray array = new JSONArray();
        for (DIDDocument.PublicKey entry : keys) {
            array.put(getPublicKeyInfoJson(entry));
        }

        JSONObject r = new JSONObject();
        r.put("items", array);
        return r;
    }
 */
}
