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

//    private DIDStore didStore = null;

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
                case "containsPrivateIdentity":
                    this.containsPrivateIdentity(args, callbackContext);
                    break;
                case "initPrivateIdentity":
                    this.initPrivateIdentity(args, callbackContext);
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
                case "resolveDid":
                    this.resolveDid(args, callbackContext);
                    break;
                case "storeDid":
                    this.storeDid(args, callbackContext);
                    break;
                case "updateDid":
                    this.updateDid(args, callbackContext);
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
                case "credential2string":
                    this.credential2string(args, callbackContext);
                    break;
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
            ret.put("diddoc", didDocument);
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
            // NOTE: this overwrite any previously initialized adapter if any.
            globalDidAdapter = new DIDPluginAdapter(callbackId, idTransactionCC);//map the adapter?
            mDidAdapterMap.put(didStoreId, globalDidAdapter);

            DIDBackend.initialize(globalDidAdapter);

            DIDStore didStore = DIDStore.open("filesystem", dataDir);
            mDIDStoreMap.put(didStoreId, didStore);

            callbackContext.success();
        }
        catch(DIDStoreException e) {
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
        Integer language = args.getInt(idx++);

        if (args.length() != idx) {
            errorProcess(callbackContext, errCodeInvalidArg, idx + " parameters are expected");
            return;
        }

        try {
            String mnemonic = Mnemonic.generate(language);
            callbackContext.success(mnemonic);
        }
        catch (DIDException e) {
            exceptionProcess(e, callbackContext, "generateMnemonic ");
        }
    }

    private void isMnemonicValid(JSONArray args, CallbackContext callbackContext) throws JSONException {
        int idx = 0;
        Integer language = args.getInt(idx++);
        String mnemonic = args.getString(idx++);

        if (args.length() != idx) {
            errorProcess(callbackContext, errCodeInvalidArg, idx + " parameters are expected");
            return;
        }

        Boolean ret = Mnemonic.isValid(language, mnemonic);
        callbackContext.success(ret.toString());
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
                DIDPluginAdapter tempAdapter = new DIDPluginAdapter(-1, null);
                DIDBackend.initialize(tempAdapter);
            }

            DIDDocument didDocument = new DID(didString).resolve(forceRemote);
            JSONObject ret = new JSONObject();
            ret.put("diddoc", didDocument);
            if (didDocument != null)
                ret.put("updated", didDocument.getUpdated());
            callbackContext.success(ret);
        }
        catch(DIDException e) {
            exceptionProcess(e, callbackContext, "DIDManager_resolveDIDDocument ");
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
        int language = args.getInt(idx++);
        String mnemonic = args.getString(idx++);
        String passphrase = args.getString(idx++);
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
        catch(Exception e) {
            exceptionProcess(e, callbackContext, "initPrivateIdentity");
        }
    }

    private void setResolverUrl(JSONArray args, CallbackContext callbackContext) throws JSONException {
        int idx = 0;
        Integer adapterId = args.getInt(idx++);
        String resolver = args.getString(idx++);

        if (args.length() != idx) {
            errorProcess(callbackContext, errCodeInvalidArg, idx + " parameters are expected");
            return;
        }

        try {
            DIDPluginAdapter didAdapter = mDidAdapterMap.get(adapterId);
            didAdapter.setResolver(resolver);
            callbackContext.success();
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
        catch(Exception e) {
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
            r.put("diddoc", didDocument);
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
        String didUrl = args.getString(idx++);
        DIDDocument didDocument = mDocumentMap.get(didUrl);
        // String didUrlString = args.getString(idx++);
        String storepass = args.getString(idx++);

        if (args.length() != idx) {
            errorProcess(callbackContext, errCodeInvalidArg, idx + " parameters are expected");
            return;
        }

        try {
            DIDStore didStore = mDIDStoreMap.get(didStoreId);
            String txId = didStore.publishDid(didDocument, storepass);
            callbackContext.success(txId);
        }
        catch (DIDException e) {
            exceptionProcess(e, callbackContext, "publishDid ");
        }
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
            r.put("diddoc", didDocument);
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
        Integer didId = args.getInt(idx++);
        DIDDocument didDocument = mDocumentMap.get(didId);
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

    private void updateDid(JSONArray args, CallbackContext callbackContext) throws JSONException {
        int idx = 0;
        String didStoreId = args.getString(idx++);
        String didUrlString = args.getString(idx++);
        String didDocumentJson = args.getString(idx++);
        String storepass = args.getString(idx++);

        if (args.length() != idx) {
            errorProcess(callbackContext, errCodeInvalidArg, idx + " parameters are expected");
            return;
        }

        try {
            DIDDocument didDocument = DIDDocument.fromJson(didDocumentJson);
            DIDURL signKey = new DIDURL(didUrlString);
            DIDStore didStore = mDIDStoreMap.get(didStoreId);
            String txId = didStore.updateDid(didDocument, signKey, storepass);
            callbackContext.success(txId);
        }
        catch (DIDException e) {
            exceptionProcess(e, callbackContext, "updateDid ");
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
        callbackContext.success(publicKeyId.toString());
    }

    private void addCredential(JSONArray args, CallbackContext callbackContext) throws JSONException, DIDStoreException {
        int idx = 0;
        String didStoreId = args.getString(idx++);
        String didUrl = args.getString(idx++);
        String credentialJson = args.getString(idx++);
        String storepass = args.getString(idx++);

        if (args.length() != idx) {
            errorProcess(callbackContext, errCodeInvalidArg, idx + " parameters are expected");
            return;
        }

        try {
            DIDStore didStore = mDIDStoreMap.get(didStoreId);

            DIDDocument didDocument = mDocumentMap.get(didUrl);
            DIDDocument.Builder db = didDocument.edit();

            VerifiableCredential vc = VerifiableCredential.fromJson(credentialJson);
            db.addCredential(vc);
            DIDDocument issuer = db.seal(storepass);
            didStore.storeDid(issuer);

            // Update cached document with newly generated one
            mDocumentMap.put(didUrl, issuer);

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
        String didUrl = args.getString(idx++);
        String credentialJson = args.getString(idx++);
        String storepass = args.getString(idx++);

        if (args.length() != idx) {
            errorProcess(callbackContext, errCodeInvalidArg, idx + " parameters are expected");
            return;
        }

        try {
            DIDStore didStore = mDIDStoreMap.get(didStoreId);

            DIDDocument didDocument = mDocumentMap.get(didUrl);
            DIDDocument.Builder db = didDocument.edit();

            VerifiableCredential vc = VerifiableCredential.fromJson(credentialJson);
            db.removeCredential(vc.getId());
            DIDDocument issuer = db.seal(storepass);
            didStore.storeDid(issuer);

            // Update cached document with newly generated one
            mDocumentMap.put(didUrl, issuer);

            callbackContext.success();
        }
        catch (DIDException e) {
            e.printStackTrace();
            errorProcess(callbackContext, errCodeNullPointer, "DIDDocument_deleteCredential exception: " + e.toString());
        }
    }

    private void DIDDocument_getCredentials(JSONArray args, CallbackContext callbackContext) throws JSONException, DIDStoreException {
        int idx = 0;
        String didUrl = args.getString(idx++);

        if (args.length() != idx) {
            errorProcess(callbackContext, errCodeInvalidArg, idx + " parameters are expected");
            return;
        }

        try {
            DIDDocument didDocument = mDocumentMap.get(didUrl);
            List<VerifiableCredential> credentials = didDocument.getCredentials();

            JSONObject r = new JSONObject();
            r.put("credentials", credentials);

            callbackContext.success();
        }
        catch (Exception e) {
            e.printStackTrace();
            errorProcess(callbackContext, errCodeNullPointer, "DIDDocument_getCredentials exception: " + e.toString());
        }
    }

    private void sign(JSONArray args, CallbackContext callbackContext) throws JSONException, DIDStoreException {
        int idx = 0;
        String didUrl = args.getString(idx++);

        if (!ensureCredentialIDFormat(didUrl)) {
            errorProcess(callbackContext, errCodeInvalidArg, "Wrong DIDURL format: "+didUrl);
            return;
        }

        DIDDocument didDocument = mDocumentMap.get(didUrl);

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
        String didUrl = args.getString(idx++);

        if (!ensureCredentialIDFormat(didUrl)) {
            errorProcess(callbackContext, errCodeInvalidArg, "Wrong DIDURL format: "+didUrl);
            return;
        }

        DIDDocument didDocument = mDocumentMap.get(didUrl);

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

    private void credential2string(JSONArray args, CallbackContext callbackContext) throws JSONException {
        String didUrl = args.getString(0);

        if (!ensureCredentialIDFormat(didUrl)) {
            errorProcess(callbackContext, errCodeInvalidArg, "Wrong DIDURL format: "+didUrl);
            return;
        }

        VerifiableCredential credential = mCredentialMap.get(didUrl);
        if (credential == null) {
            errorProcess(callbackContext, errCodeInvalidArg, "No credential found in map for id "+didUrl);
            return;
        }

        callbackContext.success(credential.toString());
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
            callbackContext.success();
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
            callbackContext.success();
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
     * Converts long or short form DIDURL into short form (fragment).
     * did:elastos:abcdef#my-key -> my-key
     * my-key -> my-key
     */
    private String getDidUrlFragment(String didUrl) {
        if (!didUrl.contains("#"))
            return didUrl;

        return URI.create(didUrl).getFragment();
    }
}
