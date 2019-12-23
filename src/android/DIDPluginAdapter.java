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

import com.fasterxml.jackson.core.JsonEncoding;
import com.fasterxml.jackson.core.JsonFactory;
import com.fasterxml.jackson.core.JsonGenerator;

import org.apache.cordova.CallbackContext;
import org.apache.cordova.PluginResult;
import org.elastos.did.DIDAdapter;
import org.elastos.did.exception.DIDResolveException;
import org.json.JSONException;
import org.json.JSONObject;

import java.io.BufferedReader;
import java.io.DataOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;

import javax.net.ssl.HttpsURLConnection;


public class DIDPluginAdapter implements DIDAdapter {
    private final String TAG = "DIDPluginAdapter";
    private final int callbackId;
    private final CallbackContext callbackContext;
    private String resolver = "https://coreservices-didsidechain-privnet.elastos.org";

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

    public void setResolver(String resolver) {
        this.resolver = resolver;
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
    public InputStream resolve(String requestId, String did, boolean all)throws DIDResolveException {
        try {
            URL url = new URL(this.resolver);
            HttpsURLConnection connection = (HttpsURLConnection)url.openConnection();
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
            if (code != HttpURLConnection.HTTP_OK) return null;

            return connection.getInputStream();
        }
        catch (IOException e) {
            throw new DIDResolveException("Network error.", e);
        }
    }
}
