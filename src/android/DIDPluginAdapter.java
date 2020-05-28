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

import android.util.Log;

import org.apache.cordova.CallbackContext;
import org.apache.cordova.PluginResult;
import org.elastos.did.DIDAdapter;
import org.json.JSONException;
import org.json.JSONObject;

public class DIDPluginAdapter implements DIDAdapter {
    private final String TAG = "DIDPluginAdapter";
    private final int callbackId;
    private CallbackContext callbackContext;
    private TransactionCallback createIdTransactionCallback = null;

    // private String resolver = "https://coreservices-didsidechain-privnet.elastos.org";
    // TestNet
    // private String resolver = "http://api.elastos.io:21606";
    // MainNet
    // private String resolver = "http://api.elastos.io:20606";

    DIDPluginAdapter(int id) {
        this.callbackId = id;
    }

    private void sendEvent(JSONObject info) throws JSONException {
        info.put("id", callbackId);

        PluginResult res = new PluginResult(PluginResult.Status.OK, info);
        res.setKeepCallback(true);
        callbackContext.sendPluginResult(res);
    }

    public void setCallbackContext(CallbackContext callbackContext) {
        this.callbackContext = callbackContext;
    }

    @Override
    public void createIdTransaction(String payload, String memo, int confirms, TransactionCallback callback) {
        JSONObject ret = new JSONObject();
        try {
            this.createIdTransactionCallback = callback;

            Log.d(TAG, "createIdTransaction() callback is called, now asking the app to create the DID transaction asynchronously");

            ret.put("payload", payload);
            ret.put("memo", memo);
            sendEvent(ret);
        } catch (JSONException e) {
            e.printStackTrace();
        }
    }

    void setTransactionID(String txID) {
        Log.d(TAG, "Sending DID transaction ID to the DID SDK");
        if (txID != null)
            createIdTransactionCallback.accept(txID, 0, null);
        else
            createIdTransactionCallback.accept(null, -1, null);
    }
}
