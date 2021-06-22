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

package org.elastos.plugins.did;

import android.util.Log;

import org.apache.cordova.CallbackContext;
import org.apache.cordova.PluginResult;
import org.elastos.did.DIDAdapter;
import org.elastos.did.DefaultDIDAdapter;
import org.elastos.did.exception.DIDResolveException;
import org.json.JSONException;
import org.json.JSONObject;

import java.io.InputStream;

public class DIDPluginAdapter extends DefaultDIDAdapter {
    private final String TAG = "DIDPluginAdapter";
    private final int callbackId;
    private String didStoreId = "";
    private CallbackContext callbackContext;

    DIDPluginAdapter(String endpoint, int id, String didStoreId) {
        super(endpoint);
        this.callbackId = id;
        this.didStoreId = didStoreId;
    }

    private void sendEvent(JSONObject info) throws JSONException {
        info.put("id", callbackId);
        info.put("didStoreId", didStoreId);

        PluginResult res = new PluginResult(PluginResult.Status.OK, info);
        res.setKeepCallback(true);
        callbackContext.sendPluginResult(res);
    }

    public void setCallbackContext(CallbackContext callbackContext) {
        this.callbackContext = callbackContext;
    }

    @Override
    public void createIdTransaction(String payload, String memo) {
        JSONObject ret = new JSONObject();
        try {
            Log.d(TAG, "createIdTransaction() callback is called, now asking the app to create the DID transaction asynchronously");

            ret.put("payload", payload);
            ret.put("memo", memo);
            sendEvent(ret);
        } catch (JSONException e) {
            e.printStackTrace();
        }
    }
}
