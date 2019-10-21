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

package org.elastos.trinity.plugins.did;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;
import java.util.List;

import org.elastos.did.*;

class JSONObjectHolder {

    public static JSONObject getDIDInfoJson(DIDStore.Entry<DID, String> entry) throws JSONException {
        JSONObject r = new JSONObject();
        r.put("did", entry.getKey().toString());
        r.put("hint", entry.getValue());
        return r;
    }

    public static JSONObject getDIDsInfoJson(List<DIDStore.Entry<DID, String>> dids) throws JSONException {
        JSONArray array = new JSONArray();
        for (DIDStore.Entry<DID, String> entry : dids) {
            array.put(getDIDInfoJson(entry));
        }

        JSONObject r = new JSONObject();
        r.put("items", array);
        return r;
    }

    public static JSONObject getCredentialInfoJson(DIDStore.Entry<DIDURL, String> entry) throws JSONException {
        JSONObject r = new JSONObject();
        r.put("didurl", entry.getKey().toString());
        return r;
    }

    public static JSONObject getCredentialsInfoJson(List<DIDStore.Entry<DIDURL, String>> dids) throws JSONException {
        JSONArray array = new JSONArray();
        for (DIDStore.Entry<DIDURL, String> entry : dids) {
            array.put(getCredentialInfoJson(entry));
        }

        JSONObject r = new JSONObject();
        r.put("items", array);
        return r;
    }

    public static JSONObject getPublicKeyInfoJson(PublicKey entry) throws JSONException {
        JSONObject r = new JSONObject();
        r.put("id", entry.getId());
        r.put("controller", entry.getController());
        r.put("keyBase58", entry.getPublicKeyBase58());
        return r;
    }

    public static JSONObject getPublicKeysInfoJson(List<PublicKey> keys) throws JSONException {
        JSONArray array = new JSONArray();
        for (PublicKey entry : keys) {
            array.put(getPublicKeyInfoJson(entry));
        }

        JSONObject r = new JSONObject();
        r.put("items", array);
        return r;
    }
}