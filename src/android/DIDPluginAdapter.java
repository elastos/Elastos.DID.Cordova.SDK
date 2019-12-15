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

import org.apache.cordova.CallbackContext;
import org.apache.cordova.PluginResult;
import org.elastos.did.DIDAdapter;
import org.json.JSONException;
import org.json.JSONObject;

public class DIDPluginAdapter implements DIDAdapter {
    private final int callbackId;
    private final CallbackContext callbackContext;

    DIDPluginAdapter(int id, CallbackContext callbackContext) {
        this.callbackId = id;
        this.callbackContext = callbackContext;
    }

    private void sendEvent(JSONObject info) throws JSONException {
        info.put("id", callbackId);

        PluginResult res = new PluginResult(PluginResult.Status.OK, info);
        res.setKeepCallback(true);
        callbackContext.sendPluginResult(res);
    }

    @Override
    public boolean createIdTransaction(String payload, String memo) {
        JSONObject ret = new JSONObject();
        try {
            ret.put("payload", payload);
            ret.put("memo", memo);
            sendEvent(ret);
        } catch (JSONException e) {
            e.printStackTrace();
        }
        return true;
    }

    @Override
    public String resolve(String did) {
        System.out.println("Operation: resolve");
        System.out.println("        " + did);
        return null;
    }
}
