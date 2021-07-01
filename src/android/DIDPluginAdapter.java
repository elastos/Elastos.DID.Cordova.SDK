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
    private CallbackContext callbackContext;
    private String publicationStoreId = null;

    DIDPluginAdapter(String endpoint, int id) {
        super(endpoint);
        this.callbackId = id;
    }

    private void sendEvent(JSONObject info) throws Exception {
        if (publicationStoreId == null) {
            throw new Exception("publicationStoreId must be set first (by publish())");
        }

        info.put("id", callbackId);
        info.put("didStoreId", publicationStoreId);

        PluginResult res = new PluginResult(PluginResult.Status.OK, info);
        res.setKeepCallback(true);
        callbackContext.sendPluginResult(res);
    }

    public void setCallbackContext(CallbackContext callbackContext) {
        this.callbackContext = callbackContext;
    }

    public void setPublicationStoreId(String storeId) {
        this.publicationStoreId = storeId;
    }

    @Override
    public void createIdTransaction(String payload, String memo) {
        JSONObject ret = new JSONObject();
        try {
            Log.d(TAG, "createIdTransaction() callback is called, now asking the app to create the DID transaction asynchronously");

            ret.put("payload", payload);
            // TMP REMOVED BECAUSE OF DID SDK 2.0.4-pre BUG - PASSES PAYLOAD AS MEMO - ret.put("memo", memo);
            sendEvent(ret);
            // Reset the store id to avoid mistakes
            this.setPublicationStoreId(null);
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
