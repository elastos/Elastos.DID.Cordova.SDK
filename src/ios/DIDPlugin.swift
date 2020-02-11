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

import Foundation
import ElastosDIDSDK

@objc(DIDPlugin)
class DIDPlugin : TrinityPlugin {
    internal static let TAG = "DIDPlugin"
    
    internal let keyCode        = "code"
    internal let keyMessage     = "message"
    internal let keyException   = "exception"
    
    internal let errCodeParseJsonInAction          = 10000
    internal let errCodeInvalidArg                 = 10001
    internal let errCodeNullPointer                = 10002
    internal let errCodeDidStoreUninitialized      = 10003
    internal let errCodeInvalidDidDocment          = 10004
    internal let errCodeInvalidDid                 = 10005
    internal let errCodeInvalidPublicKey           = 10006
    internal let errCodeInvalidCredential          = 10007
    internal let errCodeLoadDid                    = 10008
    internal let errCodePublishDid                 = 10009
    internal let errCodeUpdateDid                  = 10010
    internal let errCodeLoadCredential             = 10011
    internal let errCodeDeleteCredential           = 10012
    internal let errCodeVerify                     = 10013
    internal let errCodeActionNotFound             = 10014
    internal let errCodeDidException               = 20000
    
    internal static let IDTRANSACTION  = 1
    
    // Model
    internal var globalDidAdapter: DIDPluginAdapter? = nil
    internal var idTransactionCC: CDVInvokedUrlCommand? = nil
    internal var mDIDStoreMap : [String: DIDStore] = [:]
    
    private func success(_ command: CDVInvokedUrlCommand, retAsString: String) {
        let result = CDVPluginResult(status: CDVCommandStatus_OK,
                                     messageAs: retAsString);

        self.commandDelegate.send(result, callbackId: command.callbackId)
    }
    
    private func success(_ command: CDVInvokedUrlCommand, retAsDict: NSDictionary) {
        let result = CDVPluginResult(status: CDVCommandStatus_OK,
                                     messageAs: (retAsDict as! [AnyHashable : Any]));

        self.commandDelegate.send(result, callbackId: command.callbackId)
    }
    
    private func error(_ command: CDVInvokedUrlCommand, retAsString: String) {
        let result = CDVPluginResult(status: CDVCommandStatus_ERROR,
                                     messageAs: retAsString);

        self.commandDelegate.send(result, callbackId: command.callbackId)
    }
    
    private func exceptionProcess(_ e: Error, _ command: CDVInvokedUrlCommand, msg: String) {
        NSLog(msg + " - " + e.localizedDescription)
        self.error(command, retAsString: msg + " " + e.localizedDescription)
    }

    /* TODO private func exceptionProcess(DIDException e, CallbackContext cc, String msg) {
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
    }*/
    
    private func log(message: String) {
        NSLog(DIDPlugin.TAG+": "+message)
    }
    
    private func errorProcess(_ command: CDVInvokedUrlCommand, code: Int, msg: String) {
        let errJson : NSMutableDictionary = [:]
        errJson.setValue(code, forKey: keyCode)
        errJson.setValue(msg, forKey: keyMessage)
        
        self.log(message: "(" + command.methodName + ") - " + errJson.description)
        
        let result = CDVPluginResult(status: CDVCommandStatus_ERROR, messageAs: (errJson as! [AnyHashable : Any]))
        self.commandDelegate.send(result, callbackId: command.callbackId)
    }
    
    private func sendWrongParametersCount(_ command: CDVInvokedUrlCommand, expected: Int) {
        self.errorProcess(command, code: errCodeInvalidArg, msg: "Wrong number of parameters passed. Expected \(expected).")
            return
    }
    
    private func sendNotImplementedError(_ command: CDVInvokedUrlCommand) {
        self.errorProcess(command, code: errCodeActionNotFound, msg: "Method not yet implemented")
    }
    
    private func getDIDDataDir() -> String {
        return Bundle.main.sharedSupportPath!
    }

    private func getBackendCacheDir() -> String {
        // TODO: this is NOT a auto-cleanable folder! We need to let our cache folder be cleanable by system/user
        let cacheDir = Bundle.main.sharedSupportPath! + "cache/"
        
        // Create folder in case it's missing
        try? FileManager.default.createDirectory(atPath: cacheDir, withIntermediateDirectories: false, attributes: nil)
        
        return cacheDir
    }

    @objc func setListener(_ command: CDVInvokedUrlCommand) {
        guard command.arguments.count == 1 else {
            self.sendWrongParametersCount(command, expected: 1)
            return
        }
        
        let type = command.arguments[0] as! Int

        switch (type) {
        case DIDPlugin.IDTRANSACTION:
            idTransactionCC = command
        default:
            self.error(command, retAsString: "Expected a valid type, got \(type)")
            return
        }

        // Don't return any result now
        let result = CDVPluginResult(status: CDVCommandStatus_NO_RESULT);
        result?.setKeepCallbackAs(true);
        self.commandDelegate.send(result, callbackId: command.callbackId)
    }

    @objc func initDidStore(_ command: CDVInvokedUrlCommand) {
        guard command.arguments.count == 2 else {
            self.sendWrongParametersCount(command, expected: 2)
            return
        }
        
        guard idTransactionCC != nil else {
            self.error(command, retAsString: "Transaction ID callback not set. Call setListener() first")
            return
        }
        
        let didStoreId = command.arguments[0] as! String
        let dataDir = getDIDDataDir() + didStoreId;
        let callbackId = command.arguments[1] as! Int

        globalDidAdapter = DIDPluginAdapter(id: callbackId, command: idTransactionCC!, commandDelegate: self.commandDelegate)
        // TODO mDidAdapterMap.put(didStoreId, globalDidAdapter);

        do {
            let cacheDir = self.getBackendCacheDir()
            try DIDBackend.creatInstance(globalDidAdapter!, cacheDir)

            // NOTE: this overwrite any previously initialized adapter if any.
            let didStore = try DIDStore.open("filesystem", dataDir)
            mDIDStoreMap[didStoreId] = didStore
            
            let ret: NSDictionary = [:];
            self.success(command, retAsDict: ret);
        }
        catch {
            self.exceptionProcess(error, command, msg: error.localizedDescription)
        }
    }

    @objc func deleteDidStore(_ command: CDVInvokedUrlCommand) {
        guard command.arguments.count == 1 else {
            self.sendWrongParametersCount(command, expected: 1)
            return
        }
        
        //String dataDir = cordova.getActivity().getFilesDir() + "/data/did/" + args.getString(idx++);
        
        //java.io.File dirFile = new java.io.File(dataDir);
        //deleteFile(dirFile);
        //callbackContext.success();
        
        //let ret: NSDictionary = [:];
        //self.success(command, retAsDict: ret);
        
        self.sendNotImplementedError(command);
     }
    
    @objc func generateMnemonic(_ command: CDVInvokedUrlCommand) {
        guard command.arguments.count == 1 else {
           self.sendWrongParametersCount(command, expected: 1)
           return
        }

        let language = command.arguments[0] as! Int

        let mnemonic = HDKey.generateMnemonic(language)
        NSLog("TMP generated mnemonic: \(mnemonic)")
       
        self.success(command, retAsString: mnemonic);
    }
    
    @objc func isMnemonicValid(_ command: CDVInvokedUrlCommand) {
       guard command.arguments.count == 2 else {
           self.sendWrongParametersCount(command, expected: 2)
           return
       }
       
        let language = command.arguments[0] as! Int
        let mnemonic = command.arguments[1] as! String
       
       /*
         Boolean ret = Mnemonic.isValid(language, mnemonic);
       callbackContext.success(ret.toString());
         */
       
       //let ret: NSDictionary = [:];
       //self.success(command, retAsDict: ret);
       
       self.sendNotImplementedError(command);
    }
    
    @objc func DIDManager_resolveDIDDocument(_ command: CDVInvokedUrlCommand) {
       guard command.arguments.count == 2 else {
           self.sendWrongParametersCount(command, expected: 2)
           return
       }
       
        let didString = command.arguments[0] as! String
        let forceRemote = command.arguments[1] as! Bool
       
       /*
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
         */
       
       //let ret: NSDictionary = [:];
       //self.success(command, retAsDict: ret);
       
       self.sendNotImplementedError(command);
    }
    
    @objc func DIDStore_changePassword(_ command: CDVInvokedUrlCommand) {
       guard command.arguments.count == 3 else {
           self.sendWrongParametersCount(command, expected: 3)
           return
       }
       
        let didStoreId = command.arguments[0] as! String
        let oldPassword = command.arguments[1] as! String
        let newPassword = command.arguments[2] as! String
       
       /*
         try {
             DIDStore didStore = mDIDStoreMap.get(didStoreId);
             didStore.changePassword(oldPassword, newPassword);
             callbackContext.success();
         }
         catch (DIDStoreException e) {
             exceptionProcess(e, callbackContext, "DIDStore_changePassword ");
         }
         */
       
       //let ret: NSDictionary = [:];
       //self.success(command, retAsDict: ret);
       
       self.sendNotImplementedError(command);
    }
    
    @objc func containsPrivateIdentity(_ command: CDVInvokedUrlCommand) {
       guard command.arguments.count == 1 else {
           self.sendWrongParametersCount(command, expected: 1)
           return
       }
       
        let didStoreId = command.arguments[0] as! String
       
       /*
         try {
             DIDStore didStore = mDIDStoreMap.get(didStoreId);
             Boolean ret = didStore.containsPrivateIdentity();
             callbackContext.success(ret.toString());
         }
         catch (DIDException e) {
             exceptionProcess(e, callbackContext, "containsPrivateIdentity ");
         }
         */
       
       //let ret: NSDictionary = [:];
       //self.success(command, retAsDict: ret);
       
       self.sendNotImplementedError(command);
    }
    
    @objc func initPrivateIdentity(_ command: CDVInvokedUrlCommand) {
       guard command.arguments.count == 6 else {
           self.sendWrongParametersCount(command, expected: 6)
           return
       }
       
        let didStoreId = command.arguments[0] as! String
        let language = command.arguments[1] as! String
        let mnemonic = command.arguments[2] as! String
        let passphrase = command.arguments[3] as! String
        let storepass = command.arguments[4] as! String
        let force = command.arguments[5] as! Bool
        
       /*
         try {
             DIDStore didStore = mDIDStoreMap.get(didStoreId);
             didStore.initPrivateIdentity(language, mnemonic, passphrase, storepass, force);
             callbackContext.success();
         }
         catch(Exception e) {
             exceptionProcess(e, callbackContext, "initPrivateIdentity");
         }
         */
       
       //let ret: NSDictionary = [:];
       //self.success(command, retAsDict: ret);
       
       self.sendNotImplementedError(command);
    }
    
    @objc func exportMnemonic(_ command: CDVInvokedUrlCommand) {
       guard command.arguments.count == 2 else {
           self.sendWrongParametersCount(command, expected: 2)
           return
       }
       
        let didStoreId = command.arguments[0] as! String
        let storepass = command.arguments[1] as! String
        
       /*
         try {
             DIDStore didStore = mDIDStoreMap.get(didStoreId);
             callbackContext.success(didStore.exportMnemonic(storepass));
         }
         catch(Exception e) {
             exceptionProcess(e, callbackContext, "exportMnemonic");
         }
         */
       
       //let ret: NSDictionary = [:];
       //self.success(command, retAsDict: ret);
       
       self.sendNotImplementedError(command);
    }
    
    @objc func setResolverUrl(_ command: CDVInvokedUrlCommand) {
       guard command.arguments.count == 2 else {
           self.sendWrongParametersCount(command, expected: 2)
           return
       }
       
        let adapterId = command.arguments[0] as! Int
        let resolver = command.arguments[1] as! String
        
       /*
         try {
             DIDPluginAdapter didAdapter = mDidAdapterMap.get(adapterId);
             didAdapter.setResolver(resolver);
             callbackContext.success();
         }
         catch(Exception e) {
             exceptionProcess(e, callbackContext, "setResolverUrl");
         }
         */
       
       //let ret: NSDictionary = [:];
       //self.success(command, retAsDict: ret);
       
       self.sendNotImplementedError(command);
    }
    
    @objc func synchronize(_ command: CDVInvokedUrlCommand) {
       guard command.arguments.count == 2 else {
           self.sendWrongParametersCount(command, expected: 2)
           return
       }
       
        let didStoreId = command.arguments[0] as! String
        let storepass = command.arguments[1] as! String
        
       /*
         try {
             DIDStore didStore = mDIDStoreMap.get(didStoreId);
             didStore.synchronize(storepass);
             callbackContext.success();
         }
         catch(Exception e) {
             exceptionProcess(e, callbackContext, "synchronize");
         }
         */
       
       //let ret: NSDictionary = [:];
       //self.success(command, retAsDict: ret);
       
       self.sendNotImplementedError(command);
    }
    
    @objc func deleteDid(_ command: CDVInvokedUrlCommand) {
       guard command.arguments.count == 2 else {
           self.sendWrongParametersCount(command, expected: 2)
           return
       }
       
        let didStoreId = command.arguments[0] as! String
        let didString = command.arguments[1] as! String
        
       /*
         try {
             DIDStore didStore = mDIDStoreMap.get(didStoreId);
             didStore.deleteDid(didString);
             callbackContext.success();
         }
         catch (DIDException e) {
             exceptionProcess(e, callbackContext, "deleteDid ");
         }
         */
       
       //let ret: NSDictionary = [:];
       //self.success(command, retAsDict: ret);
       
       self.sendNotImplementedError(command);
    }
    
    @objc func newDid(_ command: CDVInvokedUrlCommand) {
       guard command.arguments.count == 3 else {
           self.sendWrongParametersCount(command, expected: 3)
           return
       }
       
        let didStoreId = command.arguments[0] as! String
        let passphrase = command.arguments[1] as! String
        let alias = command.arguments[2] as! String
        
       /*
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
         */
       
       //let ret: NSDictionary = [:];
       //self.success(command, retAsDict: ret);
       
       self.sendNotImplementedError(command);
    }
    
    @objc func loadDid(_ command: CDVInvokedUrlCommand) {
       guard command.arguments.count == 3 else {
           self.sendWrongParametersCount(command, expected: 3)
           return
       }
       
        let didStoreId = command.arguments[0] as! String
        let didString = command.arguments[1] as! String
        
       /*
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
         */
       
       //let ret: NSDictionary = [:];
       //self.success(command, retAsDict: ret);
       
       self.sendNotImplementedError(command);
    }
    
    @objc func listDids(_ command: CDVInvokedUrlCommand) {
        guard command.arguments.count == 2 else {
            self.sendWrongParametersCount(command, expected: 2)
            return
        }
        
        let didStoreId = command.arguments[0] as! String
        let filter = command.arguments[1] as! Int
        
        do {
            let didStore = mDIDStoreMap[didStoreId]
            var dids: [DID]? = nil
            if let didStore = didStore {
                dids = try didStore.listDids(filter)
            }
            let r = try JSONObjectHolder.getDIDsInfoJson(dids: dids)
            self.success(command, retAsDict: r)
        }
        catch {
            self.exceptionProcess(error, command, msg: "listDids")
        }
    }
    
    @objc func publishDid(_ command: CDVInvokedUrlCommand) {
        guard command.arguments.count == 3 else {
            self.sendWrongParametersCount(command, expected: 3)
            return
        }
        
        let didStoreId = command.arguments[0] as! String
        let didString = command.arguments[1] as! String
        let storepass = command.arguments[2] as! String
        
        /*try {
            DIDStore didStore = mDIDStoreMap.get(didStoreId);
            String txId = didStore.publishDid(didString, storepass);
            callbackContext.success(txId);
        }
        catch (DIDException e) {
            exceptionProcess(e, callbackContext, "publishDid ");
        }*/
        
        self.sendNotImplementedError(command);
    }
    
    @objc func resolveDid(_ command: CDVInvokedUrlCommand) {
        guard command.arguments.count == 1 else {
            self.sendWrongParametersCount(command, expected: 1)
            return
        }
        
        let didString = command.arguments[0] as! String
        
        /*
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
         */
        
        self.sendNotImplementedError(command);
    }
    
    @objc func storeDid(_ command: CDVInvokedUrlCommand) {
        guard command.arguments.count == 3 else {
            self.sendWrongParametersCount(command, expected: 3)
            return
        }
        
        let didStoreId = command.arguments[0] as! String
        let didId = command.arguments[1] as! Int
        //DIDDocument didDocument = mDocumentMap.get(didId);
        let alias = command.arguments[2] as! String
        
        /*
         try {
             DIDStore didStore = mDIDStoreMap.get(didStoreId);
             didStore.storeDid(didDocument, alias);
             callbackContext.success("true");
         }
         catch (DIDException e) {
             exceptionProcess(e, callbackContext, "storeDid ");
         }
         */
        
        self.sendNotImplementedError(command);
    }
    
    @objc func prepareIssuer(_ command: CDVInvokedUrlCommand) {
        guard command.arguments.count == 2 else {
            self.sendWrongParametersCount(command, expected: 2)
            return
        }
        
        let didStoreId = command.arguments[0] as! String
        let didString = command.arguments[1] as! String
        
        /*
         try {
             DIDStore didStore = mDIDStoreMap.get(didStoreId);
             DID did = new DID(didString);
             Issuer issuer = new Issuer(did, didStore);
             mIssuerMap.put(didString, issuer);
         }
         catch (DIDException e) {
             exceptionProcess(e, callbackContext, "prepareIssuer ");
         }
         */
        
        self.sendNotImplementedError(command);
    }
    
    @objc func CreateCredential(_ command: CDVInvokedUrlCommand) {
        guard command.arguments.count == 9 else {
            self.sendWrongParametersCount(command, expected: 9)
            return
        }
        
        let didStoreId = command.arguments[0] as! String
        let didString = command.arguments[1] as! String
        let subjectDidString = command.arguments[2] as! String
        let credentialId = command.arguments[3] as! String
        let type = command.arguments[4] as! String //JSONArray type = args.getJSONArray(idx++);
        let typeArray = command.arguments[5] as! String
        //String[] typeArray = JSONArray2Array(type);
        let days = command.arguments[6] as! String
        let properties = command.arguments[7] as! String //JSONObject properties = args.getJSONObject(idx++);
        //Map<String, String> props = JSONObject2Map(properties);
        let passphrase = command.arguments[8] as! String
        
        /*
         if (!ensureCredentialIDFormat(credentialId)) {
             errorProcess(callbackContext, errCodeInvalidArg, "Wrong DIDURL format: "+credentialId);
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
         */
        
        self.sendNotImplementedError(command);
    }
    
    @objc func loadCredential(_ command: CDVInvokedUrlCommand) {
        guard command.arguments.count == 3 else {
            self.sendWrongParametersCount(command, expected: 3)
            return
        }
        
        let didStoreId = command.arguments[0] as! String
        let didString = command.arguments[1] as! String
        let didUrlString = command.arguments[2] as! String
        
        /*
         if (!ensureCredentialIDFormat(didUrlString)) {
             errorProcess(callbackContext, errCodeInvalidArg, "Wrong DIDURL format: "+didUrlString);
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
         */
        
        self.sendNotImplementedError(command);
    }
    
    @objc func storeCredential(_ command: CDVInvokedUrlCommand) {
        guard command.arguments.count == 2 else {
            self.sendWrongParametersCount(command, expected: 2)
            return
        }
        
        let didStoreId = command.arguments[0] as! String
        let credentialJson = command.arguments[1] as! String
        
        /*
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
         */
        
        self.sendNotImplementedError(command);
    }
    
    @objc func deleteCredential(_ command: CDVInvokedUrlCommand) {
        guard command.arguments.count == 3 else {
            self.sendWrongParametersCount(command, expected: 3)
            return
        }
        
        let didStoreId = command.arguments[0] as! String
        let didString = command.arguments[1] as! String
        let didUrlString = command.arguments[2] as! String
        
        /*
         if (!ensureCredentialIDFormat(didUrlString)) {
             errorProcess(callbackContext, errCodeInvalidArg, "Wrong DIDURL format: "+didUrlString);
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
         */
        
        self.sendNotImplementedError(command);
    }
    
    @objc func DID_loadCredentials(_ command: CDVInvokedUrlCommand) {
        guard command.arguments.count == 2 else {
            self.sendWrongParametersCount(command, expected: 2)
            return
        }
        
        let didStoreId = command.arguments[0] as! String
        let didString = command.arguments[1] as! String
        
        /*
        
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
         */
        
        self.sendNotImplementedError(command);
    }
    
    @objc func getDefaultPublicKey(_ command: CDVInvokedUrlCommand) {
        guard command.arguments.count == 2 else {
            self.sendWrongParametersCount(command, expected: 2)
            return
        }
        
        let didUrl = command.arguments[0] as! String
        let didString = command.arguments[1] as! String
        
        /*
        
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
         */
        
        self.sendNotImplementedError(command);
    }
    
    @objc func addCredential(_ command: CDVInvokedUrlCommand) {
        guard command.arguments.count == 4 else {
            self.sendWrongParametersCount(command, expected: 4)
            return
        }
        
        let didStoreId = command.arguments[0] as! String
        let didString = command.arguments[1] as! String
        let credentialJson = command.arguments[2] as! String
        let storepass = command.arguments[3] as! String
        
        /*
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
         */
        
        self.sendNotImplementedError(command);
    }
    
    @objc func DIDDocument_deleteCredential(_ command: CDVInvokedUrlCommand) {
        guard command.arguments.count == 4 else {
            self.sendWrongParametersCount(command, expected: 4)
            return
        }
        
        let didStoreId = command.arguments[0] as! String
        let didString = command.arguments[1] as! String
        let credentialJson = command.arguments[2] as! String
        let storepass = command.arguments[3] as! String
        
        /*
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
         */
        
        self.sendNotImplementedError(command);
    }
    
    @objc func DIDDocument_getCredentials(_ command: CDVInvokedUrlCommand) {
        guard command.arguments.count == 1 else {
            self.sendWrongParametersCount(command, expected: 1)
            return
        }
        
        let didString = command.arguments[0] as! String
        
        /*
        try {
            DIDDocument didDocument = mDocumentMap.get(didString);
            List<VerifiableCredential> credentials = didDocument.getCredentials();

            JSONObject r = new JSONObject();
            r.put("credentials", credentials);

            callbackContext.success();
        }
        catch (Exception e) {
            e.printStackTrace();
            errorProcess(callbackContext, errCodeNullPointer, "DIDDocument_getCredentials exception: " + e.toString());
        }
         */
        
        self.sendNotImplementedError(command);
    }
    
  /*
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
     
     */
}
