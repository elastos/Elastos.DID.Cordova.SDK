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

import android.annotation.SuppressLint;
import android.content.Context;
import android.os.AsyncTask;
import android.util.Base64;
import android.util.Log;

import org.apache.cordova.CallbackContext;
import org.apache.cordova.CordovaPlugin;
import org.apache.cordova.PluginResult;
import org.elastos.did.DID;
import org.elastos.did.DIDBackend;
import org.elastos.did.DIDDocument;
import org.elastos.did.DIDStore;
import org.elastos.did.DIDURL;
import org.elastos.did.Issuer;
import org.elastos.did.Mnemonic;
import org.elastos.did.RootIdentity;
import org.elastos.did.VerifiableCredential;
import org.elastos.did.VerifiablePresentation;
import org.elastos.did.exception.DIDException;
import org.elastos.did.exception.DIDResolveException;
import org.elastos.did.exception.DIDStoreException;
import org.elastos.did.exception.MalformedDIDException;
import org.elastos.did.exception.MalformedDocumentException;
import org.elastos.did.exception.WrongPasswordException;
import org.elastos.did.jwt.Claims;
import org.elastos.did.jwt.ExpiredJwtException;
import org.elastos.did.jwt.Header;
import org.elastos.did.jwt.JwsHeader;
import org.elastos.did.jwt.JwsSignatureException;
import org.elastos.did.jwt.Jwt;
import org.elastos.did.jwt.JwtBuilder;
import org.elastos.did.jwt.JwtParserBuilder;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.io.File;
import java.net.URI;
import java.util.ArrayList;
import java.util.Calendar;
import java.util.Date;
import java.util.HashMap;
import java.util.Iterator;
import java.util.List;
import java.util.Map;

/**
 * This class echoes a string called from JavaScript.
 */
public class DIDPlugin extends CordovaPlugin {
    private static String TAG = "DIDPlugin";

    private static final int IDTRANSACTION  = 1;

    private static String s_didResolverUrl = "https://api.elastos.io/eid";

    private CallbackContext idTransactionCC  = null;

    public static DIDPluginAdapter globalDidAdapter = null;

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

    RootIdentity rootIdentity = null;

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
                case "setResolverUrl":
                    this.setResolverUrl(args, callbackContext);
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
                case "DIDDocument_toJson":
                    this.DIDDocument_toJson(args, callbackContext);
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
                case "signDigest":
                    this.signDigest(args, callbackContext);
                    break;
                case "createJWT":
                    this.createJWT(args, callbackContext);
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
                case "verifiablePresentationToJson":
                    this.verifiablePresentationToJson(args, callbackContext);
                    break;
                case "DIDManager_parseJWT":
                    this.DIDManager_parseJWT(args, callbackContext);
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

    private Map<String, Object> JSONObject2Map(JSONObject jsonobj)  throws JSONException {
        Map<String, Object> map = new HashMap<String, Object>();
        Iterator<String> keys = jsonobj.keys();
        while(keys.hasNext()) {
            String key = keys.next();
            map.put(key, jsonobj.get(key));
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

    private static String getDefaultCacheDir(Context context) {
        return context.getFilesDir() + "/data/did/.cache.did.elastos";
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
            ret.put("updated", didDocument.getMetadata().getPublishTime());
            callbackContext.success(ret);
        }
        catch(MalformedDocumentException e) {
            exceptionProcess(e, callbackContext, "CreateDIDDocumentFromJson ");
        }
    }

    private String getStoreDataDir(String didStoreId) {
//        if (appId.equals(DID_APPLICATION_APP_ID) || appId.equals(DID_SESSION_APPLICATION_APP_ID)) {
//            return cordova.getActivity().getFilesDir() + "/data/did/useridentities/" + didStoreId;
//        }
//        else {
//            return getDataPath() + "did/" + didStoreId;
//        }
        return cordova.getActivity().getFilesDir() + "/data/did/" + didStoreId;
    }

    private void initDidStore(JSONArray args, CallbackContext callbackContext) throws JSONException {
        int idx = 0;
        String didStoreId = (args.isNull(0) ? null : args.getString(idx++));
        if (didStoreId == null) {
            errorProcess(callbackContext, errCodeNullPointer, "initDidStore(): DID Store ID cannot be null");
            return;
        }

        String dataDir = getStoreDataDir(didStoreId);

        int callbackId = args.getInt(idx++);

        if (args.length() != idx) {
            errorProcess(callbackContext, errCodeInvalidArg, idx + " parameters are expected");
            return;
        }
        try {
            globalDidAdapter = new DIDPluginAdapter(s_didResolverUrl, callbackId);

            initializeDIDBackend();

            mDidAdapterMap.put(didStoreId, globalDidAdapter);
            globalDidAdapter.setCallbackContext(idTransactionCC);

//            DIDStore didStore = DIDStore.open("filesystem", dataDir, globalDidAdapter);
            DIDStore didStore = DIDStore.open(dataDir);
            mDIDStoreMap.put(didStoreId, didStore);

            callbackContext.success();
        }
        catch(DIDException e) {
            exceptionProcess(e, callbackContext, "initDidStore ");
        }
    }

    private void deleteDidStore(JSONArray args, CallbackContext callbackContext) throws JSONException {
        int idx = 0;
        String didStoreId = args.getString(idx++);
        String dataDir = getStoreDataDir(didStoreId);

        if (args.length() != idx) {
            errorProcess(callbackContext, errCodeInvalidArg, idx + " parameters are expected");
            return;
        }

        DIDStore didStore = mDIDStoreMap.get(didStoreId);
        try {
//            List<DID> dids = didStore.listDids(DIDStore.DID_ALL);
            List<DID> dids = didStore.listDids();
            for (DID entry : dids) {
                String didString = entry.toString();
                mIssuerMap.remove(didString);
                mDIDMap.remove(didString);
                // TODO others
            }
        }
        catch (Exception e) {
            Log.d(TAG, "deleteDidStore listDids error:" + e.getLocalizedMessage());
        }

        mDIDStoreMap.remove(didStoreId);

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

    public static void initializeDIDBackend() throws DIDResolveException {
        DIDBackend.initialize(globalDidAdapter);
    }

    @SuppressLint("StaticFieldLeak")
    private void DIDManager_resolveDIDDocument(JSONArray args, CallbackContext callbackContext) throws JSONException {
        int idx = 0;
        String didString = args.getString(idx++);
        boolean forceRemote = args.getBoolean(idx++);

        if (args.length() != idx) {
            errorProcess(callbackContext, errCodeInvalidArg, idx + " parameters are expected");
            return;
        }

        try {
            initializeDIDBackend();

            new AsyncTask<Void, Void, DIDDocument>() {
                @Override
                protected DIDDocument doInBackground(Void... voids) {
                    DIDDocument didDocument;
                    try {
                        didDocument = new DID(didString).resolve(forceRemote);
                    } catch (DIDException | MalformedDIDException e) {
                        e.printStackTrace();
                        return null;
                    }
                    return didDocument;
                }

                @Override
                protected void onPostExecute(DIDDocument didDocument) {
                    JSONObject ret = new JSONObject();

                    try {
                        if (didDocument != null) {
                            ret.put("diddoc", didDocument.toString(true));
                            ret.put("updated", didDocument.getMetadata().getPublishTime());
                        } else {
                            ret.put("diddoc", null);
                        }
                        callbackContext.success(ret);
                    }
                    catch (Exception e) {
                        exceptionProcess(e, callbackContext, "DIDManager_resolveDIDDocument ");
                    }
                }
            }.execute();
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
        String did = args.getString(1);

        try {
            DIDStore didStore = mDIDStoreMap.get(didStoreId);
//            Boolean ret = didStore.containsPrivateIdentity();
            Boolean ret = didStore.containsPrivateKey(did);
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
//            didStore.initPrivateIdentity(language, mnemonic, passphrase, storepass, force);
            rootIdentity = RootIdentity.create(mnemonic, passphrase, force, didStore, storepass);
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
            callbackContext.success(didStore.loadRootIdentity().exportMnemonic(storepass));

        }
        catch(DIDException e) {
            exceptionProcess(e, callbackContext, "exportMnemonic");
        }
    }

    /**
     * Call this before initDidStore
     */
    private void setResolverUrl(JSONArray args, CallbackContext callbackContext) throws JSONException {
        int idx = 0;
        String resolver = args.getString(idx++);

        if (args.length() != idx) {
            errorProcess(callbackContext, errCodeInvalidArg, idx + " parameters are expected");
            return;
        }

        s_didResolverUrl = resolver;
        callbackContext.success();
    }

    private void synchronize(JSONArray args, CallbackContext callbackContext) throws JSONException {
        int idx = 0;
        String didStoreId = args.getString(idx++);
        String storepass = args.getString(idx++);

        if (args.length() != idx) {
            errorProcess(callbackContext, errCodeInvalidArg, idx + " parameters are expected");
            return;
        }

        new Thread(() -> {
            try {
                DIDStore didStore = mDIDStoreMap.get(didStoreId);
                didStore.synchronize();
                callbackContext.success();
            }
            catch (Exception e) {
                exceptionProcess(e, callbackContext, "synchronize");
            }
        }).start();
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
//            DIDDocument didDocument = didStore.newDid(alias, passphrase);
            DIDDocument didDocument = rootIdentity.newDid(passphrase);
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

            if (didDocument != null) {
                mDocumentMap.put(didDocument.getSubject().toString(), didDocument);

                JSONObject r = new JSONObject();
                r.put("diddoc", didDocument.toString(true));
                r.put("updated", didDocument.getMetadata().getPublishTime());
                callbackContext.success(r);
            }
            else {
                errorProcess(callbackContext, errCodeInvalidArg, "DID "+didString+" cannot be found in store ID "+didStoreId);
            }
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
            List<DID> dids = didStore.listDids();
            JSONObject r = JSONObjectHolder.getDIDsInfoJson(dids);
            callbackContext.success(r);
        }
        catch (DIDException e) {
            exceptionProcess(e, callbackContext, "listDids ");
        }
    }

    /*private void publishDid(JSONArray args, CallbackContext callbackContext) throws JSONException {
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
    }*/

    /**
     * Initiate a DID document publication process from the local device to the DID sidechain.
     *
     * During this process, the DID SDK generates a "publish DID" request, and this request is passed
     * to the createIdTransactionCallback() previously setup when calling initDIDStore.
     */
    private void publishDid(JSONArray args, CallbackContext callbackContext) throws JSONException {
        int idx = 0;
        String didStoreId = args.getString(idx++);
        String didString = args.getString(idx++);
        String storepass = args.getString(idx++);

        if (args.length() != idx) {
            errorProcess(callbackContext, errCodeInvalidArg, idx + " parameters are expected");
            return;
        }

        new Thread(() -> {
            try {
//                DIDStore didStore = mDIDStoreMap.get(didStoreId);
//                didStore.publishDid(didString, storepass);
                DIDDocument didDocument = mDocumentMap.get(didString);
                globalDidAdapter.setPublicationStoreId(didStoreId);
                didDocument.publish(storepass);
                callbackContext.success();
            }
            catch (Exception e) {
                exceptionProcess(e, callbackContext, "publishDid ");
            }
        }).start();
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
            r.put("updated", didDocument.getMetadata().getPublishTime());
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
            didDocument.getMetadata().setAlias(alias);
            didStore.storeDid(didDocument);
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
            cal.add(Calendar.DATE, days);
            Date expire = cal.getTime();

            VerifiableCredential vc = issuer.issueFor(subjectDid)
                    .id(getDidUrlFragment(credentialId))
                    .type(typeArray)
                    .expirationDate(expire)
                    .properties(properties.toString())
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
//                vc = didStore.loadCredential(new DID(didString), new DIDURL(didUrlString));
                vc = didStore.loadCredential(didUrlString);
            }
            else {
//                vc = didStore.loadCredential(didString, didUrlString);
                vc = didStore.loadCredential(didUrlString);
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
//                ret = didStore.deleteCredential(new DID(didString), new DIDURL(didUrlString));
                ret = didStore.deleteCredential(didUrlString);
            }
            else {
//                ret = didStore.deleteCredential(didString, didUrlString);
                ret = didStore.deleteCredential(didUrlString);
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
//                VerifiableCredential credential = didStore.loadCredential(did, url);
                VerifiableCredential credential = didStore.loadCredential(url);
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
        /*
        DIDURL publicKeyId = didDocument.getDefaultPublicKey();
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
        */
        JSONObject r = new JSONObject();
        DIDDocument.PublicKey pk = didDocument.getDefaultPublicKey();
        if (pk == null)
            r.put("publickey", null);
        else {
            JSONObject publicKeyJson = new JSONObject();
            publicKeyJson.put("controller", pk.getController().toString());
            publicKeyJson.put("keyBase58", pk.getPublicKeyBase58());
            r.put("publickey", publicKeyJson.toString());
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
            String serviceEndpoint = serviceJsonObj.getString("serviceEndpoint");

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

    public byte[] hex2byte(String inputString) {
        if (inputString == null || inputString.length() < 2) {
            return new byte[0];
        }
        inputString = inputString.toLowerCase();
        int l = inputString.length() / 2;
        byte[] result = new byte[l];
        for (int i = 0; i < l; ++i) {
            String tmp = inputString.substring(2 * i, 2 * i + 2);
            result[i] = (byte) (Integer.parseInt(tmp, 16) & 0xFF);
        }
        return result;
    }

    private void signDigest(JSONArray args, CallbackContext callbackContext) throws JSONException, DIDStoreException {
        int idx = 0;
        String didString = args.getString(idx++);

        DIDDocument didDocument = mDocumentMap.get(didString);

        String storepass = args.getString(idx++);
        String originString = args.getString(idx++);

        if (args.length() != idx) {
            errorProcess(callbackContext, errCodeInvalidArg, idx + " parameters are expected");
            return;
        }

        String signString = didDocument.signDigest(storepass, hex2byte(originString));
        callbackContext.success(signString);
    }

    private void createJWT(JSONArray args, CallbackContext callbackContext) throws JSONException {
        int idx = 0;
        String didString = args.getString(idx++);
        JSONObject properties = args.getJSONObject(idx++);
        Integer days = args.getInt(idx++);
        String storepass = args.getString(idx++);

        if (args.length() != idx) {
            errorProcess(callbackContext, errCodeInvalidArg, idx + " parameters are expected");
            return;
        }

        try {
            DIDDocument didDocument = mDocumentMap.get(didString);

            JwsHeader header = JwtBuilder.createJwsHeader();
            header.setType(Header.JWT_TYPE)
                    .setContentType("json");

            Calendar cal = Calendar.getInstance();
            cal.set(Calendar.MILLISECOND, 0);
            Date iat = cal.getTime();
            cal.add(Calendar.DATE, days);
            Date exp = cal.getTime();

            Claims body = JwtBuilder.createClaims();
            body.setIssuer(didString)
                    .setIssuedAt(iat)
                    .setExpiration(exp)
                    .putAllWithJson(properties.toString());

            String token = didDocument.jwtBuilder()
                    .setHeader(header)
                    .setClaims(body)
                    .sign(storepass)
                    .compact();

            callbackContext.success(token);
        }
        catch (DIDException e) {
            exceptionProcess(e, callbackContext, "createJWT ");
        }
    }

    private void DIDDocument_toJson(JSONArray args, CallbackContext callbackContext) throws JSONException {
        int idx = 0;
        String didString = args.getString(idx++);

        if (args.length() != idx) {
            errorProcess(callbackContext, errCodeInvalidArg, idx + " parameters are expected");
            return;
        }

        DIDDocument didDocument = mDocumentMap.get(didString);
        String jsonString = didDocument.toString();

        callbackContext.success(jsonString);
    }

    private static JSONObject parseJWT(String jwt) throws Exception {
        // Remove the Signature from the received JWT for now, we don't handle this.
        // TODO: extract the JWT issuer field from the JWT, resolve its DID from the DID sidechain, and
        // verify the JWT using the public key. JWT will have to be signed by the app developer's DID's private key.
        String[] splitToken = jwt.split("\\.");

        if (splitToken.length == 0)
            throw new Exception("Invalid JWT Token in parseJWT(): it contains only a header but no payload or signature");

        String jwtPayload = splitToken[1];
        byte[] b64PayloadBytes = Base64.decode(jwtPayload, Base64.URL_SAFE);
        String b64Payload = new String(b64PayloadBytes, "UTF-8");

        JSONObject jwtPayloadJson = new JSONObject(b64Payload);

        return jwtPayloadJson;
    }

    private void DIDManager_parseJWT(JSONArray args, CallbackContext callbackContext) throws JSONException {
        int idx = 0;
        boolean verifySignature = args.getBoolean(idx++);
        String jwtToken = args.getString(idx++);

        if (args.length() != idx) {
            errorProcess(callbackContext, errCodeInvalidArg, idx + " parameters are expected");
            return;
        }

        try {
            if (verifySignature) {
                JSONObject r = new JSONObject();

                // The DID SDK JWT parser already does the whole verification itself. Run this in a
                // background thread because there is potentially a network call involved.
                new Thread(() -> {
                    try {
                        try {
                            Jwt parsedAndVerifiedJwt = new JwtParserBuilder().build().parse(jwtToken);
                            Claims claims = (Claims) parsedAndVerifiedJwt.getBody();
                            JSONObject jsonPayload = new JSONObject(claims);

                            r.put("signatureIsValid", true);
                            r.put("payload", jsonPayload);
                        } catch (JwsSignatureException e) {
                            // In case of signature verification error, we still want to return the payload to the caller.
                            // It can decide whether to use it or not.
                            JSONObject jsonPayload = parseJWT(jwtToken);

                            r.put("signatureIsValid", false);
                            r.put("payload", jsonPayload);
                            r.put("errorReason", "DID not found on chain, or invalid signature");
                        } catch (ExpiredJwtException e) {
                            // In case of signature verification error, we still want to return the payload to the caller.
                            // It can decide whether to use it or not.
                            JSONObject jsonPayload = parseJWT(jwtToken);

                            r.put("signatureIsValid", false);
                            r.put("payload", jsonPayload);
                            r.put("errorReason", "JWT token is expired");
                        } catch (IllegalArgumentException e) {
                            // In case of signature verification error, we still want to return the payload to the caller.
                            // It can decide whether to use it or not.
                            JSONObject jsonPayload = parseJWT(jwtToken);

                            r.put("signatureIsValid", false);
                            r.put("payload", jsonPayload);
                            r.put("errorReason", "Illegal argument. It's possible that the JWT signature information is incorrect (no signing key information)");
                        }
                        callbackContext.success(r);
                    }
                    catch (Exception e) {
                        exceptionProcess(e, callbackContext, "DIDManager_parseJWT ");
                    }
                }).start();
            }
            else {
                // No need to verify the JWT signature - just extract the payload manually without verification
                // We can't use the DID parser as it will foce signature verification.
                JSONObject jsonPayload = parseJWT(jwtToken);

                JSONObject r = new JSONObject();
                r.put("signatureIsValid", false);
                r.put("payload", jsonPayload);

                callbackContext.success(r);
            }
        }
        catch (DIDException e) {
            exceptionProcess(e, callbackContext, "DIDManager_parseJWT ");
        }
        catch (Exception e) {
            exceptionProcess(e, callbackContext, "DIDManager_parseJWT ");
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

    private void verifiablePresentationToJson(JSONArray args, CallbackContext callbackContext) throws JSONException {
        int idx = 0;

        JSONObject pres = args.getJSONObject(idx++);

        if (args.length() != idx) {
            errorProcess(callbackContext, errCodeInvalidArg, idx + " parameters are expected");
            return;
        }

        try {
            VerifiablePresentation presentation = VerifiablePresentation.fromJson(pres.toString());
            callbackContext.success(presentation.toString());
        } catch (DIDException e) {
            exceptionProcess(e, callbackContext, "verifiablePresentationToJson ");
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
