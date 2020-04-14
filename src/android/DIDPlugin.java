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
import org.elastos.did.Mnemonic;
import org.elastos.did.exception.DIDException;
import org.elastos.did.exception.DIDStoreException;
import org.elastos.did.exception.MalformedDocumentException;
import org.elastos.did.exception.WrongPasswordException;
import org.elastos.trinity.runtime.ConfigManager;
import org.elastos.trinity.runtime.PreferenceManager;
import org.elastos.trinity.runtime.TrinityPlugin;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;
import java.io.File;
import java.net.URI;
import java.util.ArrayList;
import java.util.Calendar;
import java.util.Date;
import java.util.Dictionary;
import java.util.Iterator;
import java.util.List;
import java.util.Map;
import java.util.HashMap;

import org.elastos.did.*;


/**
 * This class echoes a string called from JavaScript.
 */
public class DIDPlugin extends TrinityPlugin {
    private static String TAG = "DIDPlugin";

    private static final int IDTRANSACTION  = 1;

    private CallbackContext idTransactionCC  = null;

    private DIDPluginAdapter globalDidAdapter = null;

    private HashMap<String, DIDDocument> mDocumentMap;
    private HashMap<String, DID> mDIDMap;
    private HashMap<Integer, DIDDocument.PublicKey> mPublicKeyMap;
    private HashMap<String, VerifiableCredential> mCredentialMap;
    private HashMap<String, DIDPluginAdapter> mDidAdapterMap;
    private HashMap<String, DIDStore> mDIDStoreMap;
    private HashMap<String, Issuer> mIssuerMap;

    private String keyCode      = "code";
    private String keyMessage   = "message";
    private String keyException = "exception";

    private int errCodeParseJsonInAction          = 10000;
    private int errCodeInvalidArg                 = 10001;
    private int errCodeNullPointer                = 10002;
    private int errCodeDidStoreUninitialized      = 10003;
    private int errCodeInvalidDidDocment          = 10004;
    private int errCodeInvalidDid                 = 10005;
    private int errCodeInvalidPublicKey           = 10006;
    private int errCodeInvalidCredential          = 10007;
    private int errCodeLoadDid                    = 10008;
    private int errCodePublishDid                 = 10009;
    private int errCodeUpdateDid                  = 10010;
    private int errCodeLoadCredential             = 10011;
    private int errCodeDeleteCredential           = 10012;
    private int errCodeVerify                     = 10013;
    private int errCodeActionNotFound             = 10014;
    private int errCodeUnspecified                = 10015;
    private int errCodeWrongPassword              = 10016;

    private int errCodeDidException               = 20000;

    public DIDPlugin() {
        mDocumentMap = new HashMap<>();
        mDIDMap = new HashMap<>();
        mPublicKeyMap = new HashMap<>();
        mCredentialMap = new HashMap<>();
        mDidAdapterMap = new HashMap<>();
        mDIDStoreMap = new HashMap<>();
        mIssuerMap = new HashMap<>();
    }

    private void exceptionProcess(Exception e, CallbackContext cc, String msg) {
        e.printStackTrace();
        cc.error(e.toString());
    }

    private void exceptionProcess(DIDException e, CallbackContext cc, String msg) {
        e.printStackTrace();

        try {
            JSONObject errJson = new JSONObject();

            // Try to specialized the error code
            if (e instanceof WrongPasswordException)
                errJson.put(keyCode, errCodeWrongPassword);
            else
                errJson.put(keyCode, errCodeDidException);

            errJson.put(keyMessage, msg + ": " + e.toString());
            Log.e(TAG, errJson.toString());
            cc.error(errJson);
        } catch (JSONException je) {
            Log.e(TAG, je.toString());
            Log.e(TAG, e.toString());
            cc.error(e.toString());
        }
    }

    private void errorProcess(CallbackContext cc, int code, Object msg) {
        try {
            JSONObject errJson = new JSONObject();
            errJson.put(keyCode, code);
            errJson.put(keyMessage, msg);
            Log.e(TAG, errJson.toString());
            cc.error(errJson);
        } catch (JSONException e) {
            String m = "Make json error message exception: " + e.toString();
            Log.e(TAG, m);
            cc.error(m);
        }
    }

    @Override
    public boolean execute(String action, JSONArray args, CallbackContext callbackContext) throws JSONException {
        try {
            switch(action) {
                case "getVersion":
                    this.getVersion(args, callbackContext);
                    break;
                case "setListener":
                    this.setListener(args, callbackContext);
                    break;
                case "initDidStore":
                    this.initDidStore(args, callbackContext);
                    break;
                case "deleteDidStore":
                    this.deleteDidStore(args, callbackContext);
                    break;
                case "CreateDIDDocumentFromJson":
                    this.CreateDIDDocumentFromJson(args, callbackContext);
                    break;
                case "generateMnemonic":
                    this.generateMnemonic(args, callbackContext);
                    break;
                case "isMnemonicValid":
                    this.isMnemonicValid(args, callbackContext);
                    break;
                case "DIDManager_resolveDIDDocument":
                    this.DIDManager_resolveDIDDocument(args, callbackContext);
                    break;
                //DidStore
                case "DIDStore_changePassword":
                    this.DIDStore_changePassword(args, callbackContext);
                    break;
                case "containsPrivateIdentity":
                    this.containsPrivateIdentity(args, callbackContext);
                    break;
                case "initPrivateIdentity":
                    this.initPrivateIdentity(args, callbackContext);
                    break;
                case "exportMnemonic":
                    this.exportMnemonic(args, callbackContext);
                    break;
                case "setResolverUrl":
                    this.setResolverUrl(args, callbackContext);
                    break;
                case "synchronize":
                    this.synchronize(args, callbackContext);
                    break;
                case "deleteDid":
                    this.deleteDid(args, callbackContext);
                    break;
                case "newDid":
                    this.newDid(args, callbackContext);
                    break;
                case "listDids":
                    this.listDids(args, callbackContext);
                    break;
                case "loadDid":
                    this.loadDid(args, callbackContext);
                    break;
                case "publishDid":
                    this.publishDid(args, callbackContext);
                    break;
                case "setTransactionResult":
                    this.setTransactionResult(args, callbackContext);
                    break;
                case "resolveDid":
                    this.resolveDid(args, callbackContext);
                    break;
                case "storeDid":
                    this.storeDid(args, callbackContext);
                    break;
                case "CreateCredential":
                    this.CreateCredential(args, callbackContext);
                    break;
                case "deleteCredential":
                    this.deleteCredential(args, callbackContext);
                    break;
                case "DID_loadCredentials":
                    this.DID_loadCredentials(args, callbackContext);
                    break;
                case "loadCredential":
                    this.loadCredential(args, callbackContext);
                    break;
                case "storeCredential":
                    this.storeCredential(args, callbackContext);
                    break;
                //DIDDocument
                case "getDefaultPublicKey":
                    this.getDefaultPublicKey(args, callbackContext);
                    break;
                case "DIDDocument_addService":
                    this.DIDDocument_addService(args, callbackContext);
                    break;
                case "DIDDocument_removeService":
                    this.DIDDocument_removeService(args, callbackContext);
                    break;
                case "addCredential":
                    this.addCredential(args, callbackContext);
                    break;
                case "DIDDocument_deleteCredential":
                    this.DIDDocument_deleteCredential(args, callbackContext);
                    break;
                case "getCredentials":
                    this.DIDDocument_getCredentials(args, callbackContext);
                    break;
                case "sign":
                    this.sign(args, callbackContext);
                    break;
                case "verify":
                    this.verify(args, callbackContext);
                    break;
                //DID
                case "getMethod":
                    this.getMethod(args, callbackContext);
                    break;
                case "getMethodSpecificId":
                    this.getMethodSpecificId(args, callbackContext);
                    break;
                case "prepareIssuer":
                    this.prepareIssuer(args, callbackContext);
                    break;
                //PublicKey
                case "getController":
                    this.getController(args, callbackContext);
                    break;
                case "getPublicKeyBase58":
                    this.getPublicKeyBase58(args, callbackContext);
                    break;
                //credential
                case "createVerifiablePresentationFromCredentials":
                    this.createVerifiablePresentationFromCredentials(args, callbackContext);
                    break;
                case "verifiablePresentationIsValid":
                    this.verifiablePresentationIsValid(args, callbackContext);
                    break;
                case "verifiablePresentationIsGenuine":
                    this.verifiablePresentationIsGenuine(args, callbackContext);
                    break;
                default:
                    errorProcess(callbackContext, errCodeActionNotFound, "Action '" + action + "' not found, please check!");
                    return false;
            }
        } catch (Exception e) {
            e.printStackTrace();
            errorProcess(callbackContext, errCodeParseJsonInAction, "Execute action '" + action + "' exception: " + e.toString());
        }
        return true;
    }

    private Map<String, String> JSONObject2Map(JSONObject jsonobj)  throws JSONException {
        Map<String, String> map = new HashMap<String, String>();
        Iterator<String> keys = jsonobj.keys();
        while(keys.hasNext()) {
            String key = keys.next();
            Object value = jsonobj.get(key);
            map.put(key, value.toString());
        }
        return map;
    }

    private String[] JSONArray2Array(JSONArray jsonArray) throws JSONException {
        String[] strArray = new String[jsonArray.length()];
        for (int i=0; i<jsonArray.length(); i++) {
            strArray[i] = jsonArray.getString(i);
        }
        return strArray;
    }

    private void deleteFile(File file) {
        if (file.isDirectory()) {
            File[] children = file.listFiles();
            for (File child : children)
                deleteFile(child);
        }

        file.delete();
    }

    private String getStringFromJSONArray(JSONArray jsonArray, int index) throws JSONException {
        return jsonArray.isNull(index) ? "" : jsonArray.getString(index);
    }

    private String getDefaultResolverUrl() {
        return PreferenceManager.getShareInstance().getDIDResolver();
    }

    private String getDefaultCacheDir() {
        return cordova.getActivity().getFilesDir() + "/data/did/.cache.did.elastos";
    }

    private void getVersion(JSONArray args, CallbackContext callbackContext) {
        String version = "ElastosDIDSDK-v0.1";
        callbackContext.success(version);
    }

    private void setListener(JSONArray args, CallbackContext callbackContext) throws JSONException {
        Integer type = args.getInt(0);

        if (type == IDTRANSACTION) {
            idTransactionCC = callbackContext;

            PluginResult result = new PluginResult(PluginResult.Status.NO_RESULT);
            result.setKeepCallback(true);
            callbackContext.sendPluginResult(result);
        }
    }

    private void CreateDIDDocumentFromJson(JSONArray args, CallbackContext callbackContext) throws JSONException {
        int idx = 0;
        String json = args.getString(idx++);

        if (args.length() != idx) {
            errorProcess(callbackContext, errCodeInvalidArg, idx + " parameters are expected");
            return;
        }

        try {
            DIDDocument didDocument = DIDDocument.fromJson(json);
            mDocumentMap.put(didDocument.getSubject().toString(), didDocument);
            JSONObject ret= new JSONObject();
            ret.put("diddoc", didDocument.toString(true));
            ret.put("updated", didDocument.getUpdated());
            callbackContext.success(ret);
        }
        catch(MalformedDocumentException e) {
            exceptionProcess(e, callbackContext, "CreateDIDDocumentFromJson ");
        }
    }

    private void initDidStore(JSONArray args, CallbackContext callbackContext) throws JSONException {
        int idx = 0;
        String didStoreId = args.getString(idx++);
        String dataDir = cordova.getActivity().getFilesDir() + "/data/did/" + didStoreId;
        int callbackId = args.getInt(idx++);

        if (args.length() != idx) {
            errorProcess(callbackContext, errCodeInvalidArg, idx + " parameters are expected");
            return;
        }
        try {
            String cacheDir = getDefaultCacheDir();
            String resolver = getDefaultResolverUrl();
            DIDBackend.initialize(resolver, cacheDir);

            globalDidAdapter = new DIDPluginAdapter(callbackId);

            mDidAdapterMap.put(didStoreId, globalDidAdapter);
            globalDidAdapter.setCallbackContext(idTransactionCC);

            DIDStore didStore = DIDStore.open("filesystem", dataDir, globalDidAdapter);
            mDIDStoreMap.put(didStoreId, didStore);

            callbackContext.success();
        }
        catch(DIDException e) {
            exceptionProcess(e, callbackContext, "initDidStore ");
        }
    }

    private void deleteDidStore(JSONArray args, CallbackContext callbackContext) throws JSONException {
        int idx = 0;
        String dataDir = cordova.getActivity().getFilesDir() + "/data/did/" + args.getString(idx++);

        if (args.length() != idx) {
            errorProcess(callbackContext, errCodeInvalidArg, idx + " parameters are expected");
            return;
        }

        java.io.File dirFile = new java.io.File(dataDir);
        deleteFile(dirFile);
        callbackContext.success();
    }

    private void generateMnemonic(JSONArray args, CallbackContext callbackContext) throws JSONException {
        int idx = 0;
        String language = args.getString(idx++);

        if (args.length() != idx) {
            errorProcess(callbackContext, errCodeInvalidArg, idx + " parameters are expected");
            return;
        }

        try {
            String mnemonic = Mnemonic.getInstance(language).generate();
            callbackContext.success(mnemonic);
        }
        catch (DIDException e) {
            exceptionProcess(e, callbackContext, "generateMnemonic ");
        }
    }

    private void isMnemonicValid(JSONArray args, CallbackContext callbackContext) throws JSONException {
        int idx = 0;
        String language = args.getString(idx++);
        String mnemonic = args.getString(idx++);

        if (args.length() != idx) {
            errorProcess(callbackContext, errCodeInvalidArg, idx + " parameters are expected");
            return;
        }

        try {
            Boolean ret = Mnemonic.getInstance(language).isValid(mnemonic);
            callbackContext.success(ret.toString());
        } catch (DIDException e) {
            exceptionProcess(e, callbackContext, "isMnemonicValid ");
        }
    }

    private void DIDManager_resolveDIDDocument(JSONArray args, CallbackContext callbackContext) throws JSONException {
        int idx = 0;
        String didString = args.getString(idx++);
        boolean forceRemote = args.getBoolean(idx++);

        if (args.length() != idx) {
            errorProcess(callbackContext, errCodeInvalidArg, idx + " parameters are expected");
            return;
        }

        try {
            // DIRTY: BECAUSE DIDBACKEND SINGLETON NEEDS AN ADAPTER...
            // This is "ok" as long as the DID App is the only one to call publish().
            //
            // If no initDidStore() has been called yet, we need to initialize the DID backend
            // to resolve DIDs. If later on the DID app needs to initDidStore(), it will call
            // DIDBackend.initialize() with a real adapter that will overwrite our init.
            if (globalDidAdapter == null) {
                String cacheDir = getDefaultCacheDir();
                String resolver = getDefaultResolverUrl();
                DIDBackend.initialize(resolver, cacheDir);
            }

            DIDDocument didDocument = new DID(didString).resolve(forceRemote);
            JSONObject ret = new JSONObject();

            if (didDocument != null) {
                ret.put("diddoc", didDocument.toString(true));
                ret.put("updated", didDocument.getUpdated());
            }
            else {
                ret.put("diddoc", null);
            }
            callbackContext.success(ret);
        }
        catch(DIDException e) {
            exceptionProcess(e, callbackContext, "DIDManager_resolveDIDDocument ");
        }
    }

    private void DIDStore_changePassword(JSONArray args, CallbackContext callbackContext) throws JSONException {
        int idx = 0;
        String didStoreId = args.getString(idx++);
        String oldPassword = args.getString(idx++);
        String newPassword = args.getString(idx++);

        if (args.length() != idx) {
            errorProcess(callbackContext, errCodeInvalidArg, idx + " parameters are expected");
            return;
        }

        try {
            DIDStore didStore = mDIDStoreMap.get(didStoreId);
            didStore.changePassword(oldPassword, newPassword);
            callbackContext.success();
        }
        catch (DIDStoreException e) {
            exceptionProcess(e, callbackContext, "DIDStore_changePassword ");
        }
    }

    private void containsPrivateIdentity(JSONArray args, CallbackContext callbackContext) throws JSONException {
        int idx = 0;
        String didStoreId = args.getString(idx++);
        try {
            DIDStore didStore = mDIDStoreMap.get(didStoreId);
            Boolean ret = didStore.containsPrivateIdentity();
            callbackContext.success(ret.toString());
        }
        catch (DIDException e) {
            exceptionProcess(e, callbackContext, "containsPrivateIdentity ");
        }
    }

    private void initPrivateIdentity(JSONArray args, CallbackContext callbackContext) throws JSONException {
        int idx = 0;
        String didStoreId = args.getString(idx++);
        String language = args.getString(idx++);
        String mnemonic = args.getString(idx++);
        String passphrase = getStringFromJSONArray(args, idx++);
        String storepass = args.getString(idx++);
        boolean force = args.getBoolean(idx++);

        if (args.length() != idx) {
            errorProcess(callbackContext, errCodeInvalidArg, idx + " parameters are expected");
            return;
        }

        try {
            DIDStore didStore = mDIDStoreMap.get(didStoreId);
            didStore.initPrivateIdentity(language, mnemonic, passphrase, storepass, force);
            callbackContext.success();
        }
        catch(DIDException e) {
            exceptionProcess(e, callbackContext, "initPrivateIdentity");
        }
    }

    private void exportMnemonic(JSONArray args, CallbackContext callbackContext) throws JSONException {
        int idx = 0;
        String didStoreId = args.getString(idx++);
        String storepass = args.getString(idx++);

        if (args.length() != idx) {
            errorProcess(callbackContext, errCodeInvalidArg, idx + " parameters are expected");
            return;
        }

        try {
            DIDStore didStore = mDIDStoreMap.get(didStoreId);
            callbackContext.success(didStore.exportMnemonic(storepass));
        }
        catch(DIDException e) {
            exceptionProcess(e, callbackContext, "exportMnemonic");
        }
    }

    private void setResolverUrl(JSONArray args, CallbackContext callbackContext) throws JSONException {
        int idx = 0;
        String didStoreId = args.getString(idx++);
        String resolver = args.getString(idx++);

        if (args.length() != idx) {
            errorProcess(callbackContext, errCodeInvalidArg, idx + " parameters are expected");
            return;
        }

        try {
            String cacheDir = getDefaultCacheDir();
            DIDBackend.initialize(resolver, cacheDir);
            callbackContext.success();
        }
        catch(DIDException e) {
            exceptionProcess(e, callbackContext, "setResolverUrl");
        }
        catch(Exception e) {
            exceptionProcess(e, callbackContext, "setResolverUrl");
        }
    }

    private void synchronize(JSONArray args, CallbackContext callbackContext) throws JSONException {
        int idx = 0;
        String didStoreId = args.getString(idx++);
        String storepass = args.getString(idx++);

        if (args.length() != idx) {
            errorProcess(callbackContext, errCodeInvalidArg, idx + " parameters are expected");
            return;
        }

        try {
            DIDStore didStore = mDIDStoreMap.get(didStoreId);
            didStore.synchronize(storepass);
            callbackContext.success();
        }
        catch(DIDException e) {
            exceptionProcess(e, callbackContext, "synchronize");
        }
    }

    private void deleteDid(JSONArray args, CallbackContext callbackContext) throws JSONException {
        int idx = 0;
        String didStoreId = args.getString(idx++);
        String didString = args.getString(idx++);

        if (args.length() != idx) {
            errorProcess(callbackContext, errCodeInvalidArg, idx + " parameters are expected");
            return;
        }

        try {
            DIDStore didStore = mDIDStoreMap.get(didStoreId);
            didStore.deleteDid(didString);
            callbackContext.success();
        }
        catch (DIDException e) {
            exceptionProcess(e, callbackContext, "deleteDid ");
        }
    }

    private void newDid(JSONArray args, CallbackContext callbackContext) throws JSONException {
        int idx = 0;
        String didStoreId = args.getString(idx++);
        String passphrase = args.getString(idx++);
        String alias = args.getString(idx++);

        if (args.length() != idx) {
            errorProcess(callbackContext, errCodeInvalidArg, idx + " parameters are expected");
            return;
        }

        try {
            DIDStore didStore = mDIDStoreMap.get(didStoreId);
            DIDDocument didDocument = didStore.newDid(alias, passphrase);

            DID did = didDocument.getSubject();
            String didString = did.toString();

            mDocumentMap.put(didString, didDocument);
            JSONObject r = new JSONObject();
            r.put("did", didString);
            callbackContext.success(r);
        }
        catch (DIDException e) {
            exceptionProcess(e, callbackContext, "newDid ");
        }
    }

    private void loadDid(JSONArray args, CallbackContext callbackContext) throws JSONException {
        int idx = 0;
        String didStoreId = args.getString(idx++);
        String didString = args.getString(idx++);

        if (args.length() != idx) {
            errorProcess(callbackContext, errCodeInvalidArg, idx + " parameters are expected");
            return;
        }

        try {
            DIDStore didStore = mDIDStoreMap.get(didStoreId);
            DIDDocument didDocument = didStore.loadDid(didString);

            if (didDocument != null) { // Should normally not happen but... happened (sdk bug).
                mDocumentMap.put(didDocument.getSubject().toString(), didDocument);
            }

            JSONObject r = new JSONObject();
            r.put("diddoc", didDocument.toString(true));
            r.put("updated", didDocument.getUpdated());
            callbackContext.success(r);
        }
        catch (DIDException e) {
            exceptionProcess(e, callbackContext, "loadDid ");
        }
    }

    private void listDids(JSONArray args, CallbackContext callbackContext) throws JSONException {
        int idx = 0;
        String didStoreId = args.getString(idx++);
        Integer filter = args.getInt(idx++);

        if (args.length() != idx) {
            errorProcess(callbackContext, errCodeInvalidArg, idx + " parameters are expected");
            return;
        }

        try {
            DIDStore didStore = mDIDStoreMap.get(didStoreId);
            List<DID> dids = didStore.listDids(filter);
            JSONObject r = JSONObjectHolder.getDIDsInfoJson(dids);
            callbackContext.success(r);
        }
        catch (DIDException e) {
            exceptionProcess(e, callbackContext, "listDids ");
        }
    }

    private void publishDid(JSONArray args, CallbackContext callbackContext) throws JSONException {
        int idx = 0;
        String didStoreId = args.getString(idx++);
        String didString = args.getString(idx++);
        String storepass = args.getString(idx++);

        if (args.length() != idx) {
            errorProcess(callbackContext, errCodeInvalidArg, idx + " parameters are expected");
            return;
        }

        try {
            DIDStore didStore = mDIDStoreMap.get(didStoreId);
            String txId = didStore.publishDid(didString, 0, null, true, storepass);
            callbackContext.success(txId);
        }
        catch (DIDException e) {
            exceptionProcess(e, callbackContext, "publishDid ");
        }
    }

    // use thread to do publishDID,
    // then dapp send the txID to did sdk by setTransactionResult
    private void publishDidAsync(JSONArray args, CallbackContext callbackContext) throws JSONException {
        int idx = 0;
        String didStoreId = args.getString(idx++);
        String didString = args.getString(idx++);
        String storepass = args.getString(idx++);

        if (args.length() != idx) {
            errorProcess(callbackContext, errCodeInvalidArg, idx + " parameters are expected");
            return;
        }

        globalDidAdapter.setPublishAsync(true);

        new Thread(() -> {
            try {
                DIDStore didStore = mDIDStoreMap.get(didStoreId);
                didStore.publishDid(didString, storepass);
            }
            catch (DIDException e) {
                synchronized (globalDidAdapter) {
                    globalDidAdapter.notifyAll();
                }
                exceptionProcess(e, callbackContext, "publishDid ");
            }
        }).start();

        try {
            synchronized (globalDidAdapter) {
                globalDidAdapter.wait();
            }
        } catch (InterruptedException e) {
            e.printStackTrace();
        }

        if (globalDidAdapter.isWaitIdTransaction())
            callbackContext.success();
    }

    private void setTransactionResult(JSONArray args, CallbackContext callbackContext) throws JSONException {
        int idx = 0;
        String didStoreId = args.getString(idx++);
        String txID = args.getString(idx++);

        if (args.length() != idx) {
            errorProcess(callbackContext, errCodeInvalidArg, idx + " parameters are expected");
            return;
        }

        globalDidAdapter.setTransactionID(txID);

        callbackContext.success();
    }

    private void resolveDid(JSONArray args, CallbackContext callbackContext) throws JSONException {
        int idx = 0;
        String didString = args.getString(idx++);

        if (args.length() != idx) {
            errorProcess(callbackContext, errCodeInvalidArg, idx + " parameters are expected");
            return;
        }

        try {
            DID did = new DID(didString);
            // Resolve and force to NOT use a locally cached copy.
            DIDDocument didDocument = did.resolve(true);

            mDocumentMap.put(didDocument.getSubject().toString(), didDocument);
            JSONObject r = new JSONObject();
            r.put("diddoc", didDocument.toString(true));
            r.put("updated", didDocument.getUpdated());
            callbackContext.success(r);
        }
        catch (Exception e) {
            exceptionProcess(e, callbackContext, "resolveDid ");
        }
    }

    private void storeDid(JSONArray args, CallbackContext callbackContext) throws JSONException {
        int idx = 0;
        String didStoreId = args.getString(idx++);
        String didString = args.getString(idx++);
        DIDDocument didDocument = mDocumentMap.get(didString);
        String alias = args.getString(idx++);

        if (args.length() != idx) {
            errorProcess(callbackContext, errCodeInvalidArg, idx + " parameters are expected");
            return;
        }

        try {
            DIDStore didStore = mDIDStoreMap.get(didStoreId);
            didStore.storeDid(didDocument, alias);
            callbackContext.success("true");
        }
        catch (DIDException e) {
            exceptionProcess(e, callbackContext, "storeDid ");
        }
    }

    private void prepareIssuer(JSONArray args, CallbackContext callbackContext) throws JSONException {
        int idx = 0;
        String didStoreId = args.getString(idx++);
        String didString = args.getString(idx++);

        try {
            DIDStore didStore = mDIDStoreMap.get(didStoreId);
            DID did = new DID(didString);
            Issuer issuer = new Issuer(did, didStore);
            mIssuerMap.put(didString, issuer);
        }
        catch (DIDException e) {
            exceptionProcess(e, callbackContext, "prepareIssuer ");
        }
    }

    private void CreateCredential(JSONArray args, CallbackContext callbackContext) throws JSONException {
        int idx = 0;
        String didStoreId = args.getString(idx++);
        String didString = args.getString(idx++);
        String subjectDidString = args.getString(idx++);
        String credentialId = args.getString(idx++);
        JSONArray type = args.getJSONArray(idx++);
        String[] typeArray = JSONArray2Array(type);

        Integer days = args.getInt(idx++);
        JSONObject properties = args.getJSONObject(idx++);
        Map<String, String> props = JSONObject2Map(properties);
        String passphrase = args.getString(idx++);

        if (!ensureCredentialIDFormat(credentialId)) {
            errorProcess(callbackContext, errCodeInvalidArg, "Wrong DIDURL format: "+credentialId);
            return;
        }

        if (args.length() != idx) {
            errorProcess(callbackContext, errCodeInvalidArg, idx + " parameters are expected");
            return;
        }

        try {
            DID subjectDid = new DID(subjectDidString);

            Issuer issuer = mIssuerMap.get(didString);
            if (issuer == null) {
                DIDStore didStore = mDIDStoreMap.get(didStoreId);
                DID did = new DID(didString);
                issuer = new Issuer(did, didStore);
                mIssuerMap.put(didString, issuer);
            }

            Calendar cal = Calendar.getInstance();
            cal.set(Calendar.DATE, cal.get(Calendar.DATE) + days);
            Date expire = cal.getTime();

            VerifiableCredential vc = issuer.issueFor(subjectDid)
                    .id(getDidUrlFragment(credentialId))
                    .type(typeArray)
                    .expirationDate(expire)
                    .properties(props)
                    .seal(passphrase);

            //Integer objId = System.identityHashCode(vc);

            //mCredentialMap.put(objId, vc);
            JSONObject ret= new JSONObject();
            ret.put("credential", vc.toString(true));
            System.out.println("credential="+vc.toString(true));
            callbackContext.success(ret);
        }
        catch(DIDException e) {
            exceptionProcess(e, callbackContext, "CreateCredential ");
        }
    }

    private void loadCredential(JSONArray args, CallbackContext callbackContext) throws JSONException {
        int idx = 0;
        String didStoreId = args.getString(idx++);
        String didString = args.getString(idx++);
        String didUrlString = args.getString(idx++);

        if (!ensureCredentialIDFormat(didUrlString)) {
            errorProcess(callbackContext, errCodeInvalidArg, "Wrong DIDURL format: "+didUrlString);
            return;
        }

        if (args.length() != idx) {
            errorProcess(callbackContext, errCodeInvalidArg, idx + " parameters are expected");
            return;
        }

        try {
            DIDStore didStore = mDIDStoreMap.get(didStoreId);

            VerifiableCredential vc = null;

            if (didUrlString.startsWith("did:elastos:")) {
                vc = didStore.loadCredential(new DID(didString), new DIDURL(didUrlString));
            }
            else {
                vc = didStore.loadCredential(didString, didUrlString);
            }

            if (vc == null) {
                errorProcess(callbackContext, errCodeInvalidArg, " Null credential returned for didString "+didString+" and didUrlString "+didUrlString);
                return;
            }

            mCredentialMap.put(didUrlString, vc);
            JSONObject ret= new JSONObject();
            ret.put("credential", vc.toString(true));
            callbackContext.success(ret);
        }
        catch (DIDException e) {
            exceptionProcess(e, callbackContext, "loadCredential ");
        }
    }

    private void storeCredential(JSONArray args, CallbackContext callbackContext) throws JSONException {
        int idx = 0;
        String didStoreId = args.getString(idx++);
        String credentialJson = args.getString(idx++);

        if (args.length() != idx) {
            errorProcess(callbackContext, errCodeInvalidArg, idx + " parameters are expected");
            return;
        }

        try {
            DIDStore didStore = mDIDStoreMap.get(didStoreId);

            VerifiableCredential credential = VerifiableCredential.fromJson(credentialJson);
            didStore.storeCredential(credential);
            mCredentialMap.put(credential.getId().toString(), credential);
            callbackContext.success();
        }
        catch (DIDException e) {
            exceptionProcess(e, callbackContext, "storeCredential ");
        }
    }

    private void deleteCredential(JSONArray args, CallbackContext callbackContext) throws JSONException {
        int idx = 0;
        String didStoreId = args.getString(idx++);
        String didString = args.getString(idx++);
        String didUrlString = args.getString(idx++);

        if (!ensureCredentialIDFormat(didUrlString)) {
            errorProcess(callbackContext, errCodeInvalidArg, "Wrong DIDURL format: "+didUrlString);
            return;
        }

        if (args.length() != idx) {
            errorProcess(callbackContext, errCodeInvalidArg, idx + " parameters are expected");
            return;
        }

        try {
            DIDStore didStore = mDIDStoreMap.get(didStoreId);

            boolean ret = false;
            if (didUrlString.startsWith("did:elastos:")) {
                ret = didStore.deleteCredential(new DID(didString), new DIDURL(didUrlString));
            }
            else {
                ret = didStore.deleteCredential(didString, didUrlString);
            }

            if (ret) {
                callbackContext.success();
            }
            else {
                errorProcess(callbackContext, errCodeDeleteCredential, "deleteCredential return false!");
            }
        }
        catch (DIDException e) {
            exceptionProcess(e, callbackContext, "deleteCredential ");
        }
    }

    private void DID_loadCredentials(JSONArray args, CallbackContext callbackContext) throws JSONException {
        int idx = 0;
        String didStoreId = args.getString(idx++);
        String didString = args.getString(idx++);

        if (args.length() != idx) {
            errorProcess(callbackContext, errCodeInvalidArg, idx + " parameters are expected");
            return;
        }

        try {
            DIDStore didStore = mDIDStoreMap.get(didStoreId);

            DID did = new DID(didString);
            List<DIDURL> unloadedCredentials = didStore.listCredentials(did);

            ArrayList<VerifiableCredential> credentials = new ArrayList<>();
            for (DIDURL url : unloadedCredentials) {
                VerifiableCredential credential = didStore.loadCredential(did, url);
                credentials.add(credential);
            }

            JSONObject r = new JSONObject();
            r.put("items", credentials);

            callbackContext.success(r);
        }
        catch (DIDException e) {
            exceptionProcess(e, callbackContext, "listCredentials ");
        }
    }

    private void getDefaultPublicKey(JSONArray args, CallbackContext callbackContext) throws JSONException {
        String didUrl = args.getString(0);
        DIDDocument didDocument = mDocumentMap.get(didUrl);
        DIDURL publicKeyId = didDocument.getDefaultPublicKey();

        JSONObject r = new JSONObject();
        if (publicKeyId != null) {
            DIDDocument.PublicKey pk = didDocument.getPublicKey(publicKeyId);
            if (pk == null)
                r.put("publickey", null);
            else {
                JSONObject publicKeyJson = new JSONObject();
                publicKeyJson.put("controller", pk.getController().toString());
                publicKeyJson.put("keyBase58", pk.getPublicKeyBase58());
                r.put("publickey", publicKeyJson.toString());
            }
        }
        else {
            r.put("publickey", null);
        }

        callbackContext.success(r);
    }

    private void DIDDocument_addService(JSONArray args, CallbackContext callbackContext) throws JSONException {
        int idx = 0;
        String didStoreId = args.getString(idx++);
        String didString = args.getString(idx++);
        String serviceJson = args.getString(idx++);
        String storepass = args.getString(idx++);

        if (args.length() != idx) {
            errorProcess(callbackContext, errCodeInvalidArg, idx + " parameters are expected");
            return;
        }

        try {
            DIDStore didStore = mDIDStoreMap.get(didStoreId);

            DIDDocument didDocument = mDocumentMap.get(didString);
            DIDDocument.Builder db = didDocument.edit();

            JSONObject serviceJsonObj = new JSONObject(serviceJson);

            String serviceId = serviceJsonObj.getString("id");
            String serviceType = serviceJsonObj.getString("type");
            String serviceEndpoint = serviceJsonObj.getString("endpoint");

            db.addService(serviceId, serviceType, serviceEndpoint);
            DIDDocument document = db.seal(storepass);
            didStore.storeDid(document);

            // Update cached document with newly generated one
            mDocumentMap.put(didString, document);

            callbackContext.success();
        }
        catch (DIDException e) {
            e.printStackTrace();
            errorProcess(callbackContext, errCodeNullPointer, "DIDDocument_addService exception: " + e.toString());
        }
        catch (Exception e) {
            e.printStackTrace();
            errorProcess(callbackContext, errCodeNullPointer, "DIDDocument_addService exception: " + e.toString());
        }
    }

    private void DIDDocument_removeService(JSONArray args, CallbackContext callbackContext) throws JSONException, DIDStoreException {
        int idx = 0;
        String didStoreId = args.getString(idx++);
        String didString = args.getString(idx++);
        String serviceDidUrl = args.getString(idx++);
        String storepass = args.getString(idx++);

        if (args.length() != idx) {
            errorProcess(callbackContext, errCodeInvalidArg, idx + " parameters are expected");
            return;
        }

        try {
            DIDStore didStore = mDIDStoreMap.get(didStoreId);

            DIDDocument didDocument = mDocumentMap.get(didString);
            DIDDocument.Builder db = didDocument.edit();

            db.removeService(serviceDidUrl);
            DIDDocument document = db.seal(storepass);
            didStore.storeDid(document);

            // Update cached document with newly generated one
            mDocumentMap.put(didString, document);

            callbackContext.success();
        }
        catch (DIDException e) {
            e.printStackTrace();
            errorProcess(callbackContext, errCodeNullPointer, "DIDDocument_removeService exception: " + e.toString());
        }
    }

    private void addCredential(JSONArray args, CallbackContext callbackContext) throws JSONException, DIDStoreException {
        int idx = 0;
        String didStoreId = args.getString(idx++);
        String didString = args.getString(idx++);
        String credentialJson = args.getString(idx++);
        String storepass = args.getString(idx++);

        if (args.length() != idx) {
            errorProcess(callbackContext, errCodeInvalidArg, idx + " parameters are expected");
            return;
        }

        try {
            DIDStore didStore = mDIDStoreMap.get(didStoreId);

            DIDDocument didDocument = mDocumentMap.get(didString);
            DIDDocument.Builder db = didDocument.edit();

            VerifiableCredential vc = VerifiableCredential.fromJson(credentialJson);
            db.addCredential(vc);
            DIDDocument issuer = db.seal(storepass);
            didStore.storeDid(issuer);

            // Update cached document with newly generated one
            mDocumentMap.put(didString, issuer);

            callbackContext.success();
        }
        catch (DIDException e) {
            e.printStackTrace();
            errorProcess(callbackContext, errCodeNullPointer, "addCredential exception: " + e.toString());
        }
    }

    private void DIDDocument_deleteCredential(JSONArray args, CallbackContext callbackContext) throws JSONException, DIDStoreException {
        int idx = 0;
        String didStoreId = args.getString(idx++);
        String didString = args.getString(idx++);
        String credentialJson = args.getString(idx++);
        String storepass = args.getString(idx++);

        if (args.length() != idx) {
            errorProcess(callbackContext, errCodeInvalidArg, idx + " parameters are expected");
            return;
        }

        try {
            DIDStore didStore = mDIDStoreMap.get(didStoreId);

            DIDDocument didDocument = mDocumentMap.get(didString);
            DIDDocument.Builder db = didDocument.edit();

            VerifiableCredential vc = VerifiableCredential.fromJson(credentialJson);
            db.removeCredential(vc.getId());
            DIDDocument issuer = db.seal(storepass);
            didStore.storeDid(issuer);

            // Update cached document with newly generated one
            mDocumentMap.put(didString, issuer);

            callbackContext.success();
        }
        catch (DIDException e) {
            e.printStackTrace();
            errorProcess(callbackContext, errCodeNullPointer, "DIDDocument_deleteCredential exception: " + e.toString());
        }
    }

    private void DIDDocument_getCredentials(JSONArray args, CallbackContext callbackContext) throws JSONException, DIDStoreException {
        int idx = 0;
        String didString = args.getString(idx++);

        if (args.length() != idx) {
            errorProcess(callbackContext, errCodeInvalidArg, idx + " parameters are expected");
            return;
        }

        try {
            DIDDocument didDocument = mDocumentMap.get(didString);
            List<VerifiableCredential> credentials = didDocument.getCredentials();

            JSONObject r = new JSONObject();
            r.put("credentials", credentials);

            callbackContext.success(r);
        }
        catch (Exception e) {
            e.printStackTrace();
            errorProcess(callbackContext, errCodeNullPointer, "DIDDocument_getCredentials exception: " + e.toString());
        }
    }

    private void sign(JSONArray args, CallbackContext callbackContext) throws JSONException, DIDStoreException {
        int idx = 0;
        String didString = args.getString(idx++);

        DIDDocument didDocument = mDocumentMap.get(didString);

        String storepass = args.getString(idx++);
        String originString = args.getString(idx++);

        if (args.length() != idx) {
            errorProcess(callbackContext, errCodeInvalidArg, idx + " parameters are expected");
            return;
        }

        String signString = didDocument.sign(storepass, originString.getBytes());
        callbackContext.success(signString);
    }

    private void verify(JSONArray args, CallbackContext callbackContext) throws JSONException, DIDException {
        int idx = 0;
        String didString = args.getString(idx++);

        DIDDocument didDocument = mDocumentMap.get(didString);

        String signString = args.getString(idx++);
        String originString = args.getString(idx++);

        if (args.length() != idx) {
            errorProcess(callbackContext, errCodeInvalidArg, idx + " parameters are expected");
            return;
        }

        boolean ret = didDocument.verify(signString, originString.getBytes());
        if (ret) {
            callbackContext.success();
        }
        else {
            errorProcess(callbackContext, errCodeVerify, "verify return false!");
        }
    }

    // PublicKey
    private void getMethod(JSONArray args, CallbackContext callbackContext) throws JSONException {
        String didString = args.getString(0);
        DID did = mDIDMap.get(didString);
        String method = did.getMethod();
        callbackContext.success(method);
    }

    private void getMethodSpecificId(JSONArray args, CallbackContext callbackContext) throws JSONException {
        String didString = args.getString(0);
        DID did = mDIDMap.get(didString);
        String methodSpecificId = did.getMethodSpecificId();
        callbackContext.success(methodSpecificId);
    }

    private void getController(JSONArray args, CallbackContext callbackContext) throws JSONException {
        Integer id = args.getInt(0);
        DIDDocument.PublicKey publicKey = mPublicKeyMap.get(id);
        DID did = publicKey.getController();

        mDIDMap.put(did.toString(), did);
        JSONObject r = new JSONObject();
        r.put("didstring", did.toString());
        callbackContext.success(r);
    }

    private void getPublicKeyBase58(JSONArray args, CallbackContext callbackContext) throws JSONException {
        Integer id = args.getInt(0);
        DIDDocument.PublicKey publicKey = mPublicKeyMap.get(id);
        String keyBase58 = publicKey.getPublicKeyBase58();
        callbackContext.success(keyBase58);
    }

    private void createVerifiablePresentationFromCredentials(JSONArray args, CallbackContext callbackContext) throws JSONException {
        int idx = 0;
        String didStoreId = args.getString(idx++);
        String didString = args.getString(idx++);
        JSONArray creds = args.getJSONArray((idx++));
        String realm = args.getString(idx++);
        String nonce = args.getString(idx++);
        String storePass = args.getString(idx++);

        if (args.length() != idx) {
            errorProcess(callbackContext, errCodeInvalidArg, idx + " parameters are expected");
            return;
        }

        try {
            DIDStore didStore = mDIDStoreMap.get(didStoreId);
            DID did = new DID(didString);

            // Rebuild our credentials from their JSON form
            ArrayList<VerifiableCredential> credentials = new ArrayList<>();
            for (int i=0; i<creds.length(); i++) {
                credentials.add(VerifiableCredential.fromJson(creds.getJSONObject(i).toString()));
            }

            VerifiablePresentation.Builder builder = VerifiablePresentation.createFor(did, didStore);
            VerifiableCredential[] credsArray = credentials.toArray(new VerifiableCredential[creds.length()]);
            VerifiablePresentation presentation = builder.credentials(credsArray)
                    .nonce(nonce)
                    .realm(realm)
                    .seal(storePass);

            callbackContext.success(presentation.toString());
        } catch (DIDException e) {
            exceptionProcess(e, callbackContext, "createVerifiablePresentationFromCredentials ");
        }
    }

    private void verifiablePresentationIsValid(JSONArray args, CallbackContext callbackContext) throws JSONException {
        int idx = 0;

        JSONObject pres = args.getJSONObject(idx++);

        if (args.length() != idx) {
            errorProcess(callbackContext, errCodeInvalidArg, idx + " parameters are expected");
            return;
        }

        try {
            VerifiablePresentation presentation = VerifiablePresentation.fromJson(pres.toString());

            JSONObject r = new JSONObject();
            r.put("isvalid", presentation.isValid());
            callbackContext.success(r);
        } catch (DIDException e) {
            exceptionProcess(e, callbackContext, "verifiablePresentationIsValid ");
        }
    }

    private void verifiablePresentationIsGenuine(JSONArray args, CallbackContext callbackContext) throws JSONException {
        int idx = 0;

        JSONObject pres = args.getJSONObject(idx++);

        if (args.length() != idx) {
            errorProcess(callbackContext, errCodeInvalidArg, idx + " parameters are expected");
            return;
        }

        try {
            VerifiablePresentation presentation = VerifiablePresentation.fromJson(pres.toString());

            JSONObject r = new JSONObject();
            r.put("isgenuine", presentation.isGenuine());
            callbackContext.success(r);
        } catch (DIDException e) {
            exceptionProcess(e, callbackContext, "verifiablePresentationIsGenuine ");
        }
    }

    private boolean ensureCredentialIDFormat(String didUrl) {
        if (didUrl.startsWith("#"))
            return true;

        URI uri = URI.create(didUrl);
        if (uri == null || uri.getFragment() == null || uri.getFragment().equals(""))
            return false;

        return true;
    }

    /**
     * Converts long or short form DIDURL into the a fragment only.
     * did:elastos:abcdef#my-key -> my-key
     * #my-key -> my-key
     */
    private String getDidUrlFragment(String didUrl) {
        if (didUrl.indexOf("#") == 0)
            return didUrl.substring(1);
        else if (didUrl.contains("#"))
            return didUrl.substring(didUrl.indexOf("#")+1);
        else
            return didUrl;
    }
}
