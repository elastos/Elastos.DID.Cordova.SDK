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
    internal let errCodeUnspecified                = 10015
    internal let errCodeDidException               = 20000
    internal let errCodeException                  = 20001
    
    internal static let IDTRANSACTION  = 1
    
    // Model
    internal var globalDidAdapter: DIDPluginAdapter? = nil
    internal var idTransactionCC: CDVInvokedUrlCommand? = nil
    
    internal var mDIDStoreMap : [String: DIDStore] = [:]
    internal var mDocumentMap : [String: DIDDocument] = [:]
    internal var mIssuerMap : [String: Issuer] = [:]
    internal var mDidAdapterMap : [String: DIDPluginAdapter] = [:]
    internal var mCredentialMap : [String: VerifiableCredential] = [:]
    
    private func success(_ command: CDVInvokedUrlCommand) {
        let result = CDVPluginResult(status: CDVCommandStatus_OK);

        self.commandDelegate.send(result, callbackId: command.callbackId)
    }
    
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
    
    /** Dirty way to convert booleans to strings but we are following the original implementation mechanism for now. */
    private func success(_ command: CDVInvokedUrlCommand, retAsFakeBool: Bool) {
        let result = CDVPluginResult(status: CDVCommandStatus_OK, messageAs: (retAsFakeBool ? "true" : "false"));

        self.commandDelegate.send(result, callbackId: command.callbackId)
    }
    
    private func error(_ command: CDVInvokedUrlCommand, retAsString: String) {
        self.error(command, code: errCodeUnspecified, msg: retAsString)
    }
    
    private func error(_ command: CDVInvokedUrlCommand, code: Int, msg: String) {
           let errJson : NSMutableDictionary = [:]
           errJson.setValue(code, forKey: keyCode)
           errJson.setValue(msg, forKey: keyMessage)
           
           self.log(message: "(" + command.methodName + ") - " + errJson.description)
           
           let result = CDVPluginResult(status: CDVCommandStatus_ERROR, messageAs: (errJson as! [AnyHashable : Any]))
           self.commandDelegate.send(result, callbackId: command.callbackId)
       }
    
    private func exception(_ e: Error, _ command: CDVInvokedUrlCommand) {
        let msg = "(" + command.methodName + ") - " + e.localizedDescription
        
        NSLog(msg)
        
        self.error(command, code: errCodeException, msg: msg)
    }
    
    private func exception(_ e: DIDError, _ command: CDVInvokedUrlCommand) {
        let msg = "(" + command.methodName + ") - " + e.localizedDescription
        
        NSLog(msg)
        
        self.error(command, code: errCodeDidException, msg: msg)
    }

    private func log(message: String) {
        NSLog(DIDPlugin.TAG+": "+message)
    }
    
    private func sendWrongParametersCount(_ command: CDVInvokedUrlCommand, expected: Int) {
        self.error(command, code: errCodeInvalidArg, msg: "Wrong number of parameters passed. Expected \(expected).")
            return
    }
    
    private func sendNotImplementedError(_ command: CDVInvokedUrlCommand) {
        self.error(command, code: errCodeActionNotFound, msg: "Method not yet implemented")
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
        mDidAdapterMap[didStoreId] = globalDidAdapter

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
            self.exception(error, command)
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
        
        self.sendNotImplementedError(command)
     }
    
    @objc func generateMnemonic(_ command: CDVInvokedUrlCommand) {
        guard command.arguments.count == 1 else {
           self.sendWrongParametersCount(command, expected: 1)
           return
        }

        let language = command.arguments[0] as! Int

        let mnemonic = HDKey.generateMnemonic(language)
       
        self.success(command, retAsString: mnemonic);
    }
    
    @objc func isMnemonicValid(_ command: CDVInvokedUrlCommand) {
       guard command.arguments.count == 2 else {
           self.sendWrongParametersCount(command, expected: 2)
           return
       }
       
        let language = command.arguments[0] as! Int
        let mnemonic = command.arguments[1] as! String

       /* TODO
         Boolean ret = Mnemonic.isValid(language, mnemonic);
       callbackContext.success(ret.toString());
         */
        
        self.success(command, retAsFakeBool: true) // TMP ! TODO
    }
    
    @objc func DIDManager_resolveDIDDocument(_ command: CDVInvokedUrlCommand) {
       guard command.arguments.count == 2 else {
           self.sendWrongParametersCount(command, expected: 2)
           return
       }
       
        let didString = command.arguments[0] as! String
        let forceRemote = command.arguments[1] as! Bool
       
          do {
             // DIRTY: BECAUSE DIDBACKEND SINGLETON NEEDS AN ADAPTER...
             // This is "ok" as long as the DID App is the only one to call publish().
             //
             // If no initDidStore() has been called yet, we need to initialize the DID backend
             // to resolve DIDs. If later on the DID app needs to initDidStore(), it will call
             // DIDBackend.initialize() with a real adapter that will overwrite our init.
             if (globalDidAdapter == nil) {
                // TODO ? WHY NO ADAPTER ON IOS ? let tempAdapter = DIDPluginAdapter(id: -1, command: command, commandDelegate: self.commandDelegate)
                 DIDBackend.initialize()
             }

             let didDocument = try DID(didString).resolve(forceRemote)
             let ret = NSMutableDictionary()

             if let didDocument = didDocument {
                ret.setValue(didDocument.description(true), forKey: "diddoc")
                ret.setValue(didDocument.getUpdated(), forKey: "updated")
             }
             else {
                ret.setValue(nil, forKey: "diddoc")
             }
            self.success(command, retAsDict: ret)
         }
         catch  {
             self.exception(error, command)
         }
    }
    
    @objc func DIDStore_changePassword(_ command: CDVInvokedUrlCommand) {
        guard command.arguments.count == 3 else {
            self.sendWrongParametersCount(command, expected: 3)
            return
        }
        
        let didStoreId = command.arguments[0] as! String
        let oldPassword = command.arguments[1] as! String
        let newPassword = command.arguments[2] as! String
        
        do {
            let didStore = mDIDStoreMap[didStoreId]
            if let didStore = didStore {
                try didStore.changePassword(oldPassword, newPassword);
                self.success(command)
            }
            else {
                self.error(command, retAsString: "No DID store found matching ID \(didStoreId)")
                return
            }
        }
        catch {
            self.exception(error, command)
        }
    }
    
    @objc func containsPrivateIdentity(_ command: CDVInvokedUrlCommand) {
        guard command.arguments.count == 1 else {
            self.sendWrongParametersCount(command, expected: 1)
            return
        }
        
        let didStoreId = command.arguments[0] as! String
        
        do {
            let didStore = mDIDStoreMap[didStoreId]
            if let didStore = didStore  {
                let ret = try didStore.containsPrivateIdentity()
                self.success(command, retAsString: (ret ? "true" : "false"))
            }
            else {
                self.error(command, retAsString: "No DID store found matching ID \(didStoreId)")
                return
            }
        }
        catch {
            self.exception(error, command)
        }
    }
    
    @objc func initPrivateIdentity(_ command: CDVInvokedUrlCommand) {
        guard command.arguments.count == 6 else {
            self.sendWrongParametersCount(command, expected: 6)
            return
        }
        
        let didStoreId = command.arguments[0] as! String
        let language = command.arguments[1] as! Int
        let mnemonic = command.arguments[2] as! String
        let passphrase = command.arguments[3] as! String
        let storepass = command.arguments[4] as! String
        let force = command.arguments[5] as! Bool
        
        do {
            let didStore = mDIDStoreMap[didStoreId]
            if let didStore = didStore {
                try didStore.initPrivateIdentity(language, mnemonic, passphrase, storepass, force);
                self.success(command)
            }
            else {
                self.error(command, retAsString: "No DID store found matching ID \(didStoreId)")
                return
            }
        }
        catch {
            self.exception(error, command)
        }
    }
    
    @objc func exportMnemonic(_ command: CDVInvokedUrlCommand) {
        guard command.arguments.count == 2 else {
            self.sendWrongParametersCount(command, expected: 2)
            return
        }
        
        let didStoreId = command.arguments[0] as! String
        let storepass = command.arguments[1] as! String
        
        do {
            let didStore = mDIDStoreMap[didStoreId]
            if let didStore = didStore {
                let mnemonic = try didStore.exportMnemonic(storepass)
                self.success(command, retAsString: mnemonic)
            }
            else {
                self.error(command, retAsString: "No DID store found matching ID \(didStoreId)")
                return
            }
        }
        catch {
            self.exception(error, command)
        }
    }
    
    @objc func setResolverUrl(_ command: CDVInvokedUrlCommand) {
        guard command.arguments.count == 2 else {
            self.sendWrongParametersCount(command, expected: 2)
            return
        }
        
        let didStoreId = command.arguments[0] as! String
        let resolver = command.arguments[1] as! String
        
        do {
            let didAdapter = mDidAdapterMap[didStoreId]!
            didAdapter.setResolver(resolver)
            self.success(command)
        }
        catch {
            self.exception(error, command)
        }
    }
    
    @objc func synchronize(_ command: CDVInvokedUrlCommand) {
        guard command.arguments.count == 2 else {
            self.sendWrongParametersCount(command, expected: 2)
            return
        }
        
        let didStoreId = command.arguments[0] as! String
        let storepass = command.arguments[1] as! String
        
        do {
            let didStore = mDIDStoreMap[didStoreId]
            if let didStore = didStore {
                try didStore.synchronize(storepass)
                self.success(command)
            }
            else {
                self.error(command, retAsString: "No DID store found matching ID \(didStoreId)")
                return
            }
        }
        catch {
            self.exception(error, command)
        }
    }
    
    @objc func deleteDid(_ command: CDVInvokedUrlCommand) {
        guard command.arguments.count == 2 else {
            self.sendWrongParametersCount(command, expected: 2)
            return
        }
        
        let didStoreId = command.arguments[0] as! String
        let didString = command.arguments[1] as! String
        
        do {
            let didStore = mDIDStoreMap[didStoreId]
            if let didStore = didStore {
                _ = try didStore.deleteDid(didString)
                self.success(command)
            }
            else {
                self.error(command, retAsString: "No DID store found matching ID \(didStoreId)")
                return
            }
        }
        catch {
            self.exception(error, command)
        }
        
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
        
        do {
            let didStore = mDIDStoreMap[didStoreId]
            if let didStore = didStore {
                let didDocument = try didStore.newDid(storepass: passphrase, alias: alias)
                
                let did = didDocument.subject! // assume a DIDDocument always has a non null DID.
                let didString = did.description
                
                mDocumentMap[didString] = didDocument
                
                let r = NSMutableDictionary()
                r.setValue(didString, forKey: "did")
                self.success(command, retAsDict: r)
            }
            else {
                self.error(command, retAsString: "No DID store found matching ID \(didStoreId)")
                return
            }
        }
        catch {
            self.exception(error, command)
        }
    }
    
    @objc func loadDid(_ command: CDVInvokedUrlCommand) {
        guard command.arguments.count == 2 else {
            self.sendWrongParametersCount(command, expected: 2)
            return
        }
        
        let didStoreId = command.arguments[0] as! String
        let didString = command.arguments[1] as! String
        
        do {
            let didStore = mDIDStoreMap[didStoreId]
            if let didStore = didStore {
                let didDocument = try didStore.loadDid(didString)
                
                if (didDocument != nil) { // Should normally not happen but... happened (sdk bug).
                    mDocumentMap[didDocument!.subject!.description] = didDocument
                    
                    let r = NSMutableDictionary()
                    r.setValue(didDocument!.description(true), forKey: "diddoc")
                    r.setValue(didDocument!.getUpdated(), forKey: "updated")
                   
                    self.success(command, retAsDict: r)
                }
                else {
                    self.error(command, retAsString: "Failed to load DID document for \(didString)")
                    return
                }
            }
            else {
                self.error(command, retAsString: "No DID store found matching ID \(didStoreId)")
                return
            }
        }
        catch {
            self.exception(error, command)
        }
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
            self.exception(error, command)
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
        
        do {
            let didStore = mDIDStoreMap[didStoreId]
            if let didStore = didStore {
                let txId = try didStore.publishDid(didString, storepass)
                self.success(command, retAsString: txId!)
            }
            else {
                self.error(command, retAsString: "No DID store found matching ID \(didStoreId)")
                return
            }
        }
        catch {
            self.exception(error, command)
        }
    }
    
    @objc func resolveDid(_ command: CDVInvokedUrlCommand) {
        guard command.arguments.count == 1 else {
            self.sendWrongParametersCount(command, expected: 1)
            return
        }
        
        let didString = command.arguments[0] as! String
        
        do {
            let did = try DID(didString)
            // Resolve and force to NOT use a locally cached copy.
            let didDocument = try did.resolve(true)
            
            mDocumentMap[didDocument!.subject!.description] = didDocument
            
            let r = NSMutableDictionary()
            r.setValue(didDocument!.description(true), forKey: "diddoc")
            r.setValue(didDocument!.getUpdated(), forKey: "updated")
            
            self.success(command, retAsDict: r)
        }
        catch {
            self.exception(error, command)
        }
    }
    
    @objc func storeDid(_ command: CDVInvokedUrlCommand) {
        guard command.arguments.count == 3 else {
            self.sendWrongParametersCount(command, expected: 3)
            return
        }
        
        let didStoreId = command.arguments[0] as! String
        let didString = command.arguments[1] as! String
        let alias = command.arguments[2] as! String
        
        if let didDocument = mDocumentMap[didString] {
            do {
                let didStore = mDIDStoreMap[didStoreId]
                if let didStore = didStore {
                    try didStore.storeDid(didDocument, alias)
                    self.success(command)
                }
                else {
                    self.error(command, retAsString: "No DID store found matching ID \(didStoreId)")
                    return
                }
            }
            catch {
                self.exception(error, command)
            }
        }
        else {
            self.error(command, retAsString: "No DID document found matching DID string \(didString)")
            return
        }
    }
    
    @objc func prepareIssuer(_ command: CDVInvokedUrlCommand) {
        guard command.arguments.count == 2 else {
            self.sendWrongParametersCount(command, expected: 2)
            return
        }
        
        let didStoreId = command.arguments[0] as! String
        let didString = command.arguments[1] as! String
        
        do {
            let didStore = mDIDStoreMap[didStoreId]
            if let didStore = didStore {
                let did = try DID(didString)
                let issuer = try Issuer(did, didStore)
                mIssuerMap[didString] = issuer
            }
            else {
                self.error(command, retAsString: "No DID store found matching ID \(didStoreId)")
                return
            }
        }
        catch {
            self.exception(error, command)
        }
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
        
        do {
            let didStore = mDIDStoreMap[didStoreId]
            if let didStore = didStore {
                let credential = try VerifiableCredential.fromJson(credentialJson)
                try didStore.storeCredential(credential)
                mCredentialMap[credential.id.description] = credential
                self.success(command)
            }
            else {
                self.error(command, retAsString: "No DID store found matching ID \(didStoreId)")
                return
            }
        }
        catch {
            self.exception(error, command)
        }
    }
    
    @objc func deleteCredential(_ command: CDVInvokedUrlCommand) {
        guard command.arguments.count == 3 else {
            self.sendWrongParametersCount(command, expected: 3)
            return
        }
        
        let didStoreId = command.arguments[0] as! String
        let didString = command.arguments[1] as! String
        let didUrlString = command.arguments[2] as! String
        
        if (!self.ensureCredentialIDFormat(didUrl: didUrlString)) {
            self.error(command, code: errCodeInvalidArg, msg: "Wrong DIDURL format: \(didUrlString)")
            return
        }
        
        do {
            let didStore = mDIDStoreMap[didStoreId]
            if let didStore = didStore {
                
                var ret = false
                if (didUrlString.hasPrefix("did:elastos:")) {
                    ret = try didStore.deleteCredential(DID(didString), DIDURL(didUrlString))
                }
                else {
                    ret = try didStore.deleteCredential(didString, didUrlString)
                }
                
                if (ret) {
                    self.success(command)
                }
                else {
                    self.error(command, code: errCodeDeleteCredential, msg: "deleteCredential returned false!")
                }
            }
            else {
                self.error(command, retAsString: "No DID store found matching ID \(didStoreId)")
                return
            }
        }
        catch {
            self.exception(error, command)
        }
    }
    
    @objc func DID_loadCredentials(_ command: CDVInvokedUrlCommand) {
        guard command.arguments.count == 2 else {
            self.sendWrongParametersCount(command, expected: 2)
            return
        }
        
        let didStoreId = command.arguments[0] as! String
        let didString = command.arguments[1] as! String
        
        do {
            let didStore = mDIDStoreMap[didStoreId]
            if let didStore = didStore {
                let did = try DID(didString)
                let unloadedCredentials = try didStore.listCredentials(did)

                var credentials: [VerifiableCredential] = []
                for url in unloadedCredentials {
                    let credential = try didStore.loadCredential(did, url)
                    credentials.append(credential!)
                }

                let r = NSMutableDictionary()
                r.setValue(credentials, forKey: "items")
                
                self.success(command, retAsDict: r)
            }
            else {
                self.error(command, retAsString: "No DID store found matching ID \(didStoreId)")
                return
            }
        }
        catch {
            self.exception(error, command)
        }
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
    
    @objc func sign(_ command: CDVInvokedUrlCommand) {
        guard command.arguments.count == 3 else {
            self.sendWrongParametersCount(command, expected: 3)
            return
        }
        
        let didString = command.arguments[0] as! String
        //DIDDocument didDocument = mDocumentMap.get(didString);
        let storepass = command.arguments[1] as! String
        let originString = command.arguments[2] as! String
        
        /*
        String signString = didDocument.sign(storepass, originString.getBytes());
        callbackContext.success(signString);
         */
        
        self.sendNotImplementedError(command);
    }
    
    @objc func verify(_ command: CDVInvokedUrlCommand) {
        guard command.arguments.count == 3 else {
            self.sendWrongParametersCount(command, expected: 3)
            return
        }
        
        let didString = command.arguments[0] as! String
        //DIDDocument didDocument = mDocumentMap.get(didString);
        let signString = command.arguments[1] as! String
        let originString = command.arguments[2] as! String
        
        /*
        boolean ret = didDocument.verify(signString, originString.getBytes());
        if (ret) {
            callbackContext.success();
        }
        else {
            errorProcess(callbackContext, errCodeVerify, "verify return false!");
        }
         */
        
        self.sendNotImplementedError(command);
    }
    
    // PublicKey
    @objc func getMethod(_ command: CDVInvokedUrlCommand) {
        guard command.arguments.count == 1 else {
            self.sendWrongParametersCount(command, expected: 1)
            return
        }
        
        let didString = command.arguments[0] as! String
        
        /*
        DID did = mDIDMap.get(didString);
        String method = did.getMethod();
        callbackContext.success(method);
         */
        
        self.sendNotImplementedError(command);
    }
    
    @objc func getMethodSpecificId(_ command: CDVInvokedUrlCommand) {
        guard command.arguments.count == 1 else {
            self.sendWrongParametersCount(command, expected: 1)
            return
        }
        
        let didString = command.arguments[0] as! String
        
        /*
        DID did = mDIDMap.get(didString);
        String methodSpecificId = did.getMethodSpecificId();
        callbackContext.success(methodSpecificId);
         */
        
        self.sendNotImplementedError(command);
    }
    
    @objc func getController(_ command: CDVInvokedUrlCommand) {
        guard command.arguments.count == 1 else {
            self.sendWrongParametersCount(command, expected: 1)
            return
        }
        
        let id = command.arguments[0] as! Int
        
        /*
        DIDDocument.PublicKey publicKey = mPublicKeyMap.get(id);
        DID did = publicKey.getController();

        mDIDMap.put(did.toString(), did);
        JSONObject r = new JSONObject();
        r.put("didstring", did.toString());
        callbackContext.success(r);
         */
        
        self.sendNotImplementedError(command);
    }
    
    @objc func getPublicKeyBase58(_ command: CDVInvokedUrlCommand) {
        guard command.arguments.count == 1 else {
            self.sendWrongParametersCount(command, expected: 1)
            return
        }
        
        let id = command.arguments[0] as! Int
        
        /*
        DIDDocument.PublicKey publicKey = mPublicKeyMap.get(id);
        String keyBase58 = publicKey.getPublicKeyBase58();
        callbackContext.success(keyBase58);
         */
        
        self.sendNotImplementedError(command);
    }
    
    @objc func createVerifiablePresentationFromCredentials(_ command: CDVInvokedUrlCommand) {
        guard command.arguments.count == 6 else {
            self.sendWrongParametersCount(command, expected: 6)
            return
        }
        
        let didStoreId = command.arguments[0] as! String
        let didString = command.arguments[1] as! String
        let creds = command.arguments[2] as! NSDictionary // TODO good type for JSONArray?
        let realm = command.arguments[3] as! String
        let nonce = command.arguments[4] as! String
        let storePass = command.arguments[5] as! String
        
        /*
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
         */
        
        self.sendNotImplementedError(command);
    }
    
    @objc func verifiablePresentationIsValid(_ command: CDVInvokedUrlCommand) {
        guard command.arguments.count == 1 else {
            self.sendWrongParametersCount(command, expected: 1)
            return
        }
        
        let pres = command.arguments[0] as! NSDictionary //JSONObject pres = args.getJSONObject(idx++);
        
        /*
        try {
            VerifiablePresentation presentation = VerifiablePresentation.fromJson(pres.toString());

            JSONObject r = new JSONObject();
            r.put("isvalid", presentation.isValid());
            callbackContext.success();
        } catch (DIDException e) {
            exceptionProcess(e, callbackContext, "verifiablePresentationIsValid ");
        }
         */
        
        self.sendNotImplementedError(command);
    }
    
    @objc func verifiablePresentationIsGenuine(_ command: CDVInvokedUrlCommand) {
        guard command.arguments.count == 1 else {
            self.sendWrongParametersCount(command, expected: 1)
            return
        }
        
        let pres = command.arguments[0] as! NSDictionary //JSONObject pres = args.getJSONObject(idx++);
        
        /*
        try {
            VerifiablePresentation presentation = VerifiablePresentation.fromJson(pres.toString());

            JSONObject r = new JSONObject();
            r.put("isgenuine", presentation.isGenuine());
            callbackContext.success();
        } catch (DIDException e) {
            exceptionProcess(e, callbackContext, "verifiablePresentationIsGenuine ");
        }
         */
        
        self.sendNotImplementedError(command);
    }
    
    private func ensureCredentialIDFormat(didUrl: String) -> Bool {
        if (didUrl.hasPrefix("#")) {
            return true
        }

        let uri = URL(string: didUrl)
        if (uri == nil || uri!.fragment == nil || uri!.fragment! == "") {
            return false
        }

        return true
    }
    
  /*
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
