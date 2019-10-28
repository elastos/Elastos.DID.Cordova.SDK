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
import org.elastos.credential.Issuer;
import org.elastos.credential.VerifiableCredential;
import org.elastos.did.backend.DIDBackend;
import org.elastos.did.util.Mnemonic;
import org.elastos.trinity.runtime.TrinityPlugin;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;
import java.util.Calendar;
import java.util.Date;
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

    private HashMap<Integer, DIDStore> mDidStoreMap;
    private HashMap<Integer, DIDDocument> mDocumentMap;
    private HashMap<Integer, DID> mDIDMap;
    private HashMap<Integer, PublicKey> mPublicKeyMap;
    private HashMap<Integer, VerifiableCredential> mCredentialMap;

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
        mDidStoreMap = new HashMap<>();
        mDocumentMap = new HashMap<>();
        mDIDMap = new HashMap<>();
        mPublicKeyMap = new HashMap<>();
        mCredentialMap = new HashMap<>();

        DIDBackend.initialize(new FakeConsoleAdaptor());
    }

    private void exceptionProcess(DIDException e, CallbackContext cc, String msg) throws JSONException {
        e.printStackTrace();

        try {
            JSONObject errJson = new JSONObject();
            errJson.put(keyCode, errCodeDidException);
            errJson.put(keyMessage, msg + ": " + e.toString());
            Log.e(TAG, errJson.toString());
            cc.error(errJson);
        } catch (JSONException je) {
            JSONObject errJson = new JSONObject();
            errJson.put(keyCode, errCodeDidException);
            errJson.put(keyMessage, msg);
            errJson.put(keyException, e.toString());
            Log.e(TAG, errJson.toString());
            cc.error(errJson);
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
            case "initDidStore":
                this.initDidStore(args, callbackContext);
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
            //DidStore
            case "hasPrivateIdentity":
                this.hasPrivateIdentity(args, callbackContext);
                break;
            case "initPrivateIdentity":
                this.initPrivateIdentity(args, callbackContext);
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
            case "listCredentials":
                this.listCredentials(args, callbackContext);
                break;
            case "loadCredential":
                this.loadCredential(args, callbackContext);
                break;
            case "storeCredential":
                this.storeCredential(args, callbackContext);
                break;
            //DIDDocument
            case "getSubject":
                this.getSubject(args, callbackContext);
                break;
            case "getPublicKeyCount":
                this.getPublicKeyCount(args, callbackContext);
                break;
            case "getDefaultPublicKey":
                this.getDefaultPublicKey(args, callbackContext);
                break;
            case "getPublicKey":
                this.getPublicKey(args, callbackContext);
                break;
            case "getPublicKeys":
                this.getPublicKeys(args, callbackContext);
                break;
            case "addCredential":
                this.addCredential(args, callbackContext);
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
            case "didToString":
                this.didToString(args, callbackContext);
                break;
            //PublicKey
            case "getController":
                this.getController(args, callbackContext);
                break;
            case "getPublicKeyBase58":
                this.getPublicKeyBase58(args, callbackContext);
                break;
            //credential
            case "getFragment":
                this.getFragment(args, callbackContext);
                break;
            case "getType":
                this.getType(args, callbackContext);
                break;
            case "getIssuanceDate":
                this.getIssuanceDate(args, callbackContext);
                break;
            case "getExpirationDate":
                this.getExpirationDate(args, callbackContext);
                break;
            case "getProperties":
                this.getProperties(args, callbackContext);
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

    private void getVersion(JSONArray args, CallbackContext callbackContext) {
        String version = "ElastosDIDSDK-v0.1";
        callbackContext.success(version);
    }

    private void CreateDIDDocumentFromJson(JSONArray args, CallbackContext callbackContext) throws JSONException {
        String json = args.getString(0);

        try {
            DIDDocument didDocument = DIDDocument.fromJson(json);
            Integer objId = System.identityHashCode(didDocument);

            mDocumentMap.put(objId, didDocument);
            JSONObject ret= new JSONObject();
            ret.put("id", objId);
            callbackContext.success(ret);
        }
        catch(DIDException e) {
            exceptionProcess(e, callbackContext, "CreateDIDDocumentFromJson ");
        }
    }

    private void initDidStore(JSONArray args, CallbackContext callbackContext) throws JSONException {
        String dataDir = cordova.getActivity().getFilesDir() + "/data/did/" + args.getString(0);
        String passphrase = args.getString(1);

        Log.i("DIDPlugin", "dataDir:" + dataDir + " passphrase:" + passphrase);

        try {
            DIDStore.initialize("filesystem", dataDir, passphrase);
            DIDStore didStore = DIDStore.getInstance();
            Integer objId = System.identityHashCode(didStore);
            mDidStoreMap.put(objId, didStore);
            JSONObject ret = new JSONObject();
            ret.put("id", objId);
            callbackContext.success(ret);
        }
        catch(DIDException e) {
            exceptionProcess(e, callbackContext, "initDidStore ");
        }
    }

    private void generateMnemonic(JSONArray args, CallbackContext callbackContext) throws JSONException {
        Integer language = args.getInt(0);
        String mnemonic = Mnemonic.generate(language);
        callbackContext.success(mnemonic);
    }

    private void isMnemonicValid(JSONArray args, CallbackContext callbackContext) throws JSONException {
        Integer language = args.getInt(0);
        String mnemonic = args.getString(1);
        Boolean ret = Mnemonic.isValid(language, mnemonic);
        callbackContext.success(ret.toString());
    }

    private void hasPrivateIdentity(JSONArray args, CallbackContext callbackContext) throws JSONException {
        Integer id = args.getInt(0);
        DIDStore didStore = mDidStoreMap.get(id);
        try {
            Boolean ret = didStore.hasPrivateIdentity();
            callbackContext.success(ret.toString());
        }
        catch (DIDException e) {
            exceptionProcess(e, callbackContext, "hasPrivateIdentity ");
        }
    }

    private void initPrivateIdentity(JSONArray args, CallbackContext callbackContext) throws JSONException {
        Integer id = args.getInt(0);
        DIDStore didStore = mDidStoreMap.get(id);
        String mnemonic = args.getString(1);
        String passphrase = args.getString(2);
        String storepass = args.getString(3);
        boolean force = args.getBoolean(4);

        try {
            didStore.initPrivateIdentity(mnemonic, passphrase, storepass, force);
            callbackContext.success();
        }
        catch(DIDException e) {
            exceptionProcess(e, callbackContext, "initPrivateIdentity ");
        }
    }

    private void deleteDid(JSONArray args, CallbackContext callbackContext) throws JSONException {
        Integer id = args.getInt(0);
        DIDStore didStore = mDidStoreMap.get(id);
        String didString = args.getString(1);

        try {
            didStore.deleteDid(didString);
            callbackContext.success();
        }
        catch (DIDException e) {
            exceptionProcess(e, callbackContext, "deleteDid ");
        }
    }

    private void newDid(JSONArray args, CallbackContext callbackContext) throws JSONException {
        Integer id = args.getInt(0);
        DIDStore didStore = mDidStoreMap.get(id);
        String passphrase = args.getString(1);
        String hint = args.getString(2);

        try {
            DIDDocument didDocument = didStore.newDid(passphrase, hint);
            Integer objId = System.identityHashCode(didDocument);

            mDocumentMap.put(objId, didDocument);
            JSONObject r = new JSONObject();
            r.put("id", objId);
            callbackContext.success(r);
        }
        catch (DIDException e) {
            exceptionProcess(e, callbackContext, "newDid ");
        }
    }

    private void loadDid(JSONArray args, CallbackContext callbackContext) throws JSONException {
        Integer id = args.getInt(0);
        DIDStore didStore = mDidStoreMap.get(id);
        String didString = args.getString(1);

        try {
            DIDDocument didDocument = didStore.loadDid(didString);
            Integer objId = System.identityHashCode(didDocument);

            mDocumentMap.put(objId, didDocument);
            JSONObject r = new JSONObject();
            r.put("id", objId);
            callbackContext.success(r);
        }
        catch (DIDException e) {
            exceptionProcess(e, callbackContext, "loadDid ");
        }
    }

    private void listDids(JSONArray args, CallbackContext callbackContext) throws JSONException {
        Integer id = args.getInt(0);
        DIDStore didStore = mDidStoreMap.get(id);
        Integer filter = args.getInt(1);

        try {
            List<DIDStore.Entry<DID, String>> dids = didStore.listDids(filter);

            JSONObject r = JSONObjectHolder.getDIDsInfoJson(dids);
            callbackContext.success(r);
        }
        catch (DIDException e) {
            exceptionProcess(e, callbackContext, "listDids ");
        }
    }

    private void publishDid(JSONArray args, CallbackContext callbackContext) throws JSONException {
        Integer id = args.getInt(0);
        DIDStore didStore = mDidStoreMap.get(id);
        Integer didId = args.getInt(1);
        DIDDocument didDocument = mDocumentMap.get(didId);
        String didUrlString = args.getString(2);
        String storepass = args.getString(3);

        try {
            DIDURL signKey = new DIDURL(didUrlString);
            boolean ret = didStore.publishDid(didDocument, signKey, storepass);
            if (ret) {
                callbackContext.success();
            }
            else {
                errorProcess(callbackContext, errCodePublishDid, "publishDid return false!");
            }
        }
        catch (DIDException e) {
            exceptionProcess(e, callbackContext, "publishDid ");
        }
    }

    private void resolveDid(JSONArray args, CallbackContext callbackContext) throws JSONException {
        Integer id = args.getInt(0);
        DIDStore didStore = mDidStoreMap.get(id);
        String didString = args.getString(1);

        try {
            DID did = new DID(didString);
            DIDDocument didDocument = didStore.resolveDid(did);
            Integer objId = System.identityHashCode(did);

            mDocumentMap.put(objId, didDocument);
            JSONObject r = new JSONObject();
            r.put("id", objId);
            callbackContext.success(r);
        }
        catch (DIDException e) {
            exceptionProcess(e, callbackContext, "resolveDid ");
        }
    }

    private void storeDid(JSONArray args, CallbackContext callbackContext) throws JSONException {
        Integer id = args.getInt(0);
        DIDStore didStore = mDidStoreMap.get(id);
        Integer didId = args.getInt(1);
        DIDDocument didDocument = mDocumentMap.get(didId);
        String hint = args.getString(2);

        try {
            didStore.storeDid(didDocument, hint);
            callbackContext.success("true");
        }
        catch (DIDException e) {
            exceptionProcess(e, callbackContext, "storeDid ");
        }
    }

    private void updateDid(JSONArray args, CallbackContext callbackContext) throws JSONException {
        Integer id = args.getInt(0);
        DIDStore didStore = mDidStoreMap.get(id);
        Integer didId = args.getInt(1);
        DIDDocument didDocument = mDocumentMap.get(didId);
        String didUrlString = args.getString(2);
        String storepass = args.getString(3);

        try {
            DIDURL signKey = new DIDURL(didUrlString);
            boolean ret = didStore.updateDid(didDocument, signKey, storepass);
            if (ret) {
                callbackContext.success();
            }
            else {
                errorProcess(callbackContext, errCodeUpdateDid, "updateDid return false!");
            }
        }
        catch (DIDException e) {
            exceptionProcess(e, callbackContext, "updateDid ");
        }
    }

    private void CreateCredential(JSONArray args, CallbackContext callbackContext) throws JSONException {
        Integer id = args.getInt(0);
        DIDStore didStore = mDidStoreMap.get(id);
        String didString = args.getString(1);
        String credentialId = args.getString(2);
        JSONArray type = args.getJSONArray(3);
        String[] typeArray = JSONArray2Array(type);

        Integer year = args.getInt(4);
        JSONObject properties = args.getJSONObject(5);
        Map<String, String> props = JSONObject2Map(properties);
        String passphrase = args.getString(6);

        try {
            DID did = new DID(didString);
            Issuer issuer = new Issuer(did);

            Calendar cal = Calendar.getInstance();
            cal.set(Calendar.YEAR, cal.get(Calendar.YEAR) + year);
            Date expire = cal.getTime();

            VerifiableCredential vc = issuer.issueFor(did)
                    .id(credentialId)
                    .type(typeArray)
                    .expirationDate(expire)
                    .properties(props)
                    .sign(passphrase);

            Integer objId = System.identityHashCode(vc);

            mCredentialMap.put(objId, vc);
            JSONObject ret= new JSONObject();
            ret.put("id", objId);
            callbackContext.success(ret);
        }
        catch(DIDException e) {
            exceptionProcess(e, callbackContext, "CreateCredential ");
        }
    }

    private void loadCredential(JSONArray args, CallbackContext callbackContext) throws JSONException {
        Integer id = args.getInt(0);
        DIDStore didStore = mDidStoreMap.get(id);
        String didString = args.getString(1);
        String credId = args.getString(2);

        try {
            VerifiableCredential vc = didStore.loadCredential(didString, didString + "#" + credId);
            Integer objId = System.identityHashCode(vc);

            mCredentialMap.put(objId, vc);
            JSONObject ret= new JSONObject();
            ret.put("id", objId);
            callbackContext.success(ret);
        }
        catch (DIDException e) {
            exceptionProcess(e, callbackContext, "loadCredential ");
        }
    }

    private void storeCredential(JSONArray args, CallbackContext callbackContext) throws JSONException {
        Integer id = args.getInt(0);
        DIDStore didStore = mDidStoreMap.get(id);
        Integer credentialId = args.getInt(1);
        VerifiableCredential credential = mCredentialMap.get(credentialId);

        try {
            didStore.storeCredential(credential);
            callbackContext.success();
        }
        catch (DIDException e) {
            exceptionProcess(e, callbackContext, "storeCredential ");
        }
    }

    private void deleteCredential(JSONArray args, CallbackContext callbackContext) throws JSONException {
        Integer id = args.getInt(0);
        DIDStore didStore = mDidStoreMap.get(id);
        String didString = args.getString(1);
        String didUrlString = args.getString(2);

        try {
            boolean ret = didStore.deleteCredential(didString, didUrlString);
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

    private void listCredentials(JSONArray args, CallbackContext callbackContext) throws JSONException {
        Integer id = args.getInt(0);
        DIDStore didStore = mDidStoreMap.get(id);
        String didString = args.getString(1);

        try {
            DID did = new DID(didString);
            List<DIDStore.Entry<DIDURL, String>> credentials = didStore.listCredentials(did);
            JSONObject r = JSONObjectHolder.getCredentialsInfoJson(credentials);
            callbackContext.success(r);
        }
        catch (DIDException e) {
            exceptionProcess(e, callbackContext, "listCredentials ");
        }
    }

    // DIDDocument
    private void getSubject(JSONArray args, CallbackContext callbackContext) throws JSONException {
        Integer id = args.getInt(0);
        DIDDocument didDocument = mDocumentMap.get(id);
        try {
            DID did = didDocument.getSubject();
            Integer objId = System.identityHashCode(did);

            mDIDMap.put(objId, did);
            JSONObject r = new JSONObject();
            r.put("id", objId);
            callbackContext.success(r);
        } catch (NullPointerException e) {
            e.printStackTrace();
            errorProcess(callbackContext, errCodeNullPointer, "getSubject exception: " + e.toString());
        }
    }

    private void getPublicKeyCount(JSONArray args, CallbackContext callbackContext) throws JSONException {
        Integer id = args.getInt(0);
        DIDDocument didDocument = mDocumentMap.get(id);
        Integer keyCount = didDocument.getPublicKeyCount();
        callbackContext.success(keyCount);
    }

    private void getPublicKey(JSONArray args, CallbackContext callbackContext) throws JSONException {
        Integer id = args.getInt(0);
        String didString = args.getString(1);
        try {
            DIDDocument didDocument = mDocumentMap.get(id);
            PublicKey publicKey = didDocument.getPublicKey(didString);
            Integer objId = System.identityHashCode(publicKey);

            mPublicKeyMap.put(objId, publicKey);
            JSONObject r = new JSONObject();
            r.put("id", objId);
            callbackContext.success(r);
        }
        catch (DIDException e) {
            exceptionProcess(e, callbackContext, "getPublicKey ");
        }
    }

    private void getPublicKeys(JSONArray args, CallbackContext callbackContext) throws JSONException {
        Integer id = args.getInt(0);
        try {
            DIDDocument didDocument = mDocumentMap.get(id);
            List<PublicKey> publicKeys = didDocument.getPublicKeys();

            JSONObject r = JSONObjectHolder.getPublicKeysInfoJson(publicKeys);
            callbackContext.success(r);
        } catch (NullPointerException e) {
            e.printStackTrace();
            errorProcess(callbackContext, errCodeNullPointer, "getPublicKeys exception: " + e.toString());
        }
    }

    private void getDefaultPublicKey(JSONArray args, CallbackContext callbackContext) throws JSONException {
        Integer id = args.getInt(0);
        DIDDocument didDocument = mDocumentMap.get(id);
        DIDURL publicKeyId = didDocument.getDefaultPublicKey();
        callbackContext.success(publicKeyId.toString());
    }

    private void addCredential(JSONArray args, CallbackContext callbackContext) throws JSONException {
        Integer id = args.getInt(0);
        DIDDocument didDocument = mDocumentMap.get(id);

        Integer credentialId = args.getInt(1);
        VerifiableCredential vc = mCredentialMap.get(credentialId);
        didDocument.addCredential(vc);

        callbackContext.success();
    }

    private void sign(JSONArray args, CallbackContext callbackContext) throws JSONException, DIDStoreException {
        Integer id = args.getInt(0);
        DIDDocument didDocument = mDocumentMap.get(id);

        String storepass = args.getString(1);
        String originString = args.getString(2);

        String signString = didDocument.sign(storepass, originString.getBytes());
        callbackContext.success(signString);
    }

    private void verify(JSONArray args, CallbackContext callbackContext) throws JSONException, DIDStoreException {
        Integer id = args.getInt(0);
        DIDDocument didDocument = mDocumentMap.get(id);

        String signString = args.getString(1);
        String originString = args.getString(2);

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
        Integer id = args.getInt(0);
        DID did = mDIDMap.get(id);
        String method = did.getMethod();
        callbackContext.success(method);
    }

    private void getMethodSpecificId(JSONArray args, CallbackContext callbackContext) throws JSONException {
        Integer id = args.getInt(0);
        DID did = mDIDMap.get(id);
        String methodSpecificId = did.getMethodSpecificId();
        callbackContext.success(methodSpecificId);
    }

    private void didToString(JSONArray args, CallbackContext callbackContext) throws JSONException {
        Integer id = args.getInt(0);
        DID did = mDIDMap.get(id);
        String didString = did.toString();
        callbackContext.success(didString);
    }

    private void getController(JSONArray args, CallbackContext callbackContext) throws JSONException {
        Integer id = args.getInt(0);
        PublicKey publicKey = mPublicKeyMap.get(id);
        DID did = publicKey.getController();
        Integer objId = System.identityHashCode(did);

        mDIDMap.put(objId, did);
        JSONObject r = new JSONObject();
        r.put("id", objId);
        callbackContext.success(r);
    }

    private void getPublicKeyBase58(JSONArray args, CallbackContext callbackContext) throws JSONException {
        Integer id = args.getInt(0);
        PublicKey publicKey = mPublicKeyMap.get(id);
        String keyBase58 = publicKey.getPublicKeyBase58();
        callbackContext.success(keyBase58);
    }

    //Credential
    private void getFragment(JSONArray args, CallbackContext callbackContext) throws JSONException {
        Integer id = args.getInt(0);
        VerifiableCredential credential = mCredentialMap.get(id);

        DIDURL didUrl = credential.getId();
        String fragment = didUrl.getFragment();
        callbackContext.success(fragment);
    }

    private void getType(JSONArray args, CallbackContext callbackContext) throws JSONException {
        Integer id = args.getInt(0);
        VerifiableCredential credential = mCredentialMap.get(id);

        String type = credential.getType();
        callbackContext.success(type);
    }

    private void getIssuanceDate(JSONArray args, CallbackContext callbackContext) throws JSONException {
        Integer id = args.getInt(0);
        VerifiableCredential credential = mCredentialMap.get(id);

        Date date = credential.getIssuanceDate();
        callbackContext.success(date.toString());
    }

    private void getExpirationDate(JSONArray args, CallbackContext callbackContext) throws JSONException {
        Integer id = args.getInt(0);
        VerifiableCredential credential = mCredentialMap.get(id);

        Date date = credential.getExpirationDate();
        callbackContext.success(date.toString());
    }

    private void getProperties(JSONArray args, CallbackContext callbackContext) throws JSONException {
        Integer id = args.getInt(0);
        VerifiableCredential credential = mCredentialMap.get(id);

        VerifiableCredential.CredentialSubject cs = credential.getSubject();
        Map<String, String> props = cs.getProperties();
        JSONObject r = new JSONObject(props);
        callbackContext.success(r);
    }
}
