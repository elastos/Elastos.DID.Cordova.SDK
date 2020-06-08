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
    
    private static let DID_APPLICATION_APP_ID = "org.elastos.trinity.dapp.did"
    private static let DID_SESSION_APPLICATION_APP_ID = "org.elastos.trinity.dapp.didsession"

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
    internal let errCodeWrongPassword              = 10016
    internal let errCodeDidException               = 20000
    internal let errCodeException                  = 20001

    internal static let IDTRANSACTION  = 1

    // Model
    internal var globalDidAdapter: DIDPluginAdapter? = nil
    internal var idTransactionCC: CDVInvokedUrlCommand? = nil

    internal var mDIDStoreMap : [String: DIDStore] = [:]
    internal var mDIDMap: [String : DID] = [:]
    internal var mDocumentMap : [String: DIDDocument] = [:]
    internal var mIssuerMap : [String: VerifiableCredentialIssuer] = [:]
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

    /**
     * Tries to rework a DID SDK exceprtion into something more user friendly. Otherwise, simply throw the original exception.
     */
    private func exception(_ e: Error, _ command: CDVInvokedUrlCommand) {
        let msg = "(" + command.methodName + ") - " + e.localizedDescription

        NSLog(msg)

        if let err = e as? DIDError {
            switch err {
            case .didStoreError(let desc):
                if desc != nil && desc!.contains("decryptFromBase64 error") {
                    // Wrong password exception
                    self.error(command, code: errCodeWrongPassword, msg: msg)
                    return
                }
            default:
                self.error(command, code: errCodeDidException, msg: msg)
                break
            }
        }

        self.error(command, code: errCodeException, msg: msg)
    }

    private func log(message: String) {
        NSLog(DIDPlugin.TAG+": "+message)
    }

    private func sendWrongParametersCount(_ command: CDVInvokedUrlCommand, expected: Int) {
        self.error(command, code: errCodeInvalidArg, msg: "Wrong number of parameters passed. Expected \(expected).")
            return
    }

    private func getDIDResolverUrl() -> String {
        return PreferenceManager.getShareInstance().getDIDResolver();
    }

    private func getDIDDataDir() -> String {
        return self.getDataPath()+"/did"
    }

    private func getBackendCacheDir() -> String {
        // TODO: this is NOT a auto-cleanable folder! We need to let our cache folder be cleanable by system/user
        let cacheDir = self.getDataPath() + "/did/.cache.did.elastos"

        // Create folder in case it's missing
        try? FileManager.default.createDirectory(atPath: cacheDir, withIntermediateDirectories: true, attributes: nil)

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
    
    private func getStoreDataDir(didStoreId: String) -> String {
        if appId == DIDPlugin.DID_APPLICATION_APP_ID || appId == DIDPlugin.DID_SESSION_APPLICATION_APP_ID {
            return NSHomeDirectory() + "/Documents/data/did/useridentities/" + didStoreId
        }
        else {
            return getDataPath() + "did/" + didStoreId
        }
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
        let dataDir = getStoreDataDir(didStoreId: didStoreId)
        let callbackId = command.arguments[1] as! Int

        do {
            let cacheDir = getBackendCacheDir();
            let resolver = getDIDResolverUrl();

            try DIDBackend.initializeInstance(resolver, cacheDir);

            globalDidAdapter = DIDPluginAdapter(id: callbackId, command: idTransactionCC!, commandDelegate: self.commandDelegate)
            mDidAdapterMap[didStoreId] = globalDidAdapter

            // NOTE: this overwrite any previously initialized adapter if any.
            let didStore = try DIDStore.open(atPath: dataDir, withType: "filesystem", adapter: globalDidAdapter!);
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

        let didStoreId = command.arguments[0] as! String

        do {
            let dataDir = getDIDDataDir() + didStoreId
            try FileManager.default.removeItem(at: URL(fileURLWithPath: dataDir))
        }
        catch {
            self.exception(error, command)
        }

        self.success(command)
     }

    @objc func generateMnemonic(_ command: CDVInvokedUrlCommand) {
        guard command.arguments.count == 1 else {
           self.sendWrongParametersCount(command, expected: 1)
           return
        }

        let language = command.arguments[0] as! String

        do {
            let mnemonic = try Mnemonic.generate(language)
            self.success(command, retAsString: mnemonic);
        }
        catch {
            self.exception(error, command)
        }
    }

    @objc func isMnemonicValid(_ command: CDVInvokedUrlCommand) {
       guard command.arguments.count == 2 else {
           self.sendWrongParametersCount(command, expected: 2)
           return
       }

        let language = command.arguments[0] as! String
        let mnemonic = command.arguments[1] as! String

        do {
            let isValid = try Mnemonic.isValid(language, mnemonic)
            self.success(command, retAsFakeBool: isValid)
        }
        catch {
            self.exception(error, command)
        }
    }

    @objc func DIDManager_resolveDIDDocument(_ command: CDVInvokedUrlCommand) {
        guard command.arguments.count == 2 else {
            self.sendWrongParametersCount(command, expected: 2)
            return
        }

        let didString = command.arguments[0] as? String ?? ""
        let forceRemote = command.arguments[1] as! Bool

        do {
            // DIRTY: BECAUSE DIDBACKEND SINGLETON NEEDS AN ADAPTER...
            // This is "ok" as long as the DID App is the only one to call publish().
            //
            // If no initDidStore() has been called yet, we need to initialize the DID backend
            // to resolve DIDs. If later on the DID app needs to initDidStore(), it will call
            // DIDBackend.initializeInstance() with a real adapter that will overwrite our init.
            if (globalDidAdapter == nil) {
                let cacheDir = getBackendCacheDir();
                let resolver = getDIDResolverUrl();
                try DIDBackend.initializeInstance(resolver, cacheDir);
            }

            let ret = NSMutableDictionary()

            // Resolve in a background thread as this runs a blocking netwok call.
            DispatchQueue(label: "DIDresolve").async {
                do {
                    let didDocument: DIDDocument = try DID(didString).resolve(forceRemote)
                    ret.setValue(didDocument.description, forKey: "diddoc")

                    if let updated = didDocument.updatedDate {
                        let isoDate = ISO8601DateFormatter.string(from: updated, timeZone: TimeZone.init(secondsFromGMT: 0)!, formatOptions: [.withInternetDateTime, .withFractionalSeconds])
                        ret.setValue(isoDate, forKey: "updated")
                    }
                    else {
                        ret.setValue(nil, forKey: "updated")
                    }
                   
                    self.success(command, retAsDict: ret)
                }
                catch (let error) {
                    self.exception(error, command)
                }
            }
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
            if let didStore = mDIDStoreMap[didStoreId] {
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
            if let didStore = mDIDStoreMap[didStoreId]  {
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
        let language = command.arguments[1] as! String
        let mnemonic = command.arguments[2] as! String
        let passphrase = command.arguments[3] as? String ?? ""
        let storepass = command.arguments[4] as! String
        let force = command.arguments[5] as! Bool

        do {
            if let didStore = mDIDStoreMap[didStoreId] {
                try didStore.initializePrivateIdentity(language, mnemonic, passphrase, storepass, force);
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
            if let didStore = mDIDStoreMap[didStoreId] {
                let mnemonic = try didStore.exportMnemonic(using: storepass)
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

        let cacheDir = getBackendCacheDir();
        do {
            try DIDBackend.initializeInstance(resolver, cacheDir);
        }
        catch {
            self.exception(error, command)
        }
        self.success(command)
    }

    @objc func synchronize(_ command: CDVInvokedUrlCommand) {
        guard command.arguments.count == 2 else {
            self.sendWrongParametersCount(command, expected: 2)
            return
        }

        let didStoreId = command.arguments[0] as! String
        let storepass = command.arguments[1] as! String

        do {
            if let didStore = mDIDStoreMap[didStoreId] {
                try didStore.synchronize(using: storepass)
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
            if let didStore = mDIDStoreMap[didStoreId] {
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
    }

    @objc func newDid(_ command: CDVInvokedUrlCommand) {
        guard command.arguments.count == 3 else {
            self.sendWrongParametersCount(command, expected: 3)
            return
        }

        let didStoreId = command.arguments[0] as! String
        let passphrase = command.arguments[1] as! String
        let alias = command.arguments[2] as? String ?? ""

        do {
            if let didStore = mDIDStoreMap[didStoreId] {
                let didDocument = try didStore.newDid(withAlias: alias, using: passphrase)

                let did = didDocument.subject // assume a DIDDocument always has a non null DID.
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
            if let didStore = mDIDStoreMap[didStoreId] {
                if let didDocument: DIDDocument = try didStore.loadDid(didString) {
                    mDocumentMap[didDocument.subject.description] = didDocument

                    let r = NSMutableDictionary()
                    r.setValue(didDocument.description, forKey: "diddoc")

                    if let updated = didDocument.updatedDate {
                        let isoDate = ISO8601DateFormatter.string(from: updated, timeZone: TimeZone.init(secondsFromGMT: 0)!, formatOptions: [.withInternetDateTime, .withFractionalSeconds])
                        r.setValue(isoDate, forKey: "updated")
                    }
                    else {
                        r.setValue(nil, forKey: "updated")
                    }

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
            var dids: [DID]? = nil
            if let didStore = mDIDStoreMap[didStoreId] {
                dids = try didStore.listDids(using: filter)
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
            if let didStore = mDIDStoreMap[didStoreId] {
                let txId = try didStore.publishDid(for: didString, using: storepass)
                self.success(command, retAsString: txId)
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

            mDocumentMap[didDocument.subject.description] = didDocument

            let r = NSMutableDictionary()
            r.setValue(didDocument.description, forKey: "diddoc")
            r.setValue(didDocument.updatedDate, forKey: "updated")

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
                if let didStore = mDIDStoreMap[didStoreId] {
                    try didStore.storeDid(using: didDocument, with: alias)
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
            if let didStore = mDIDStoreMap[didStoreId] {
                let did = try DID(didString)
                let issuer = try VerifiableCredentialIssuer(did, didStore)
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
        guard command.arguments.count == 8 else {
            self.sendWrongParametersCount(command, expected: 8)
            return
        }

        let didStoreId = command.arguments[0] as! String
        let didString = command.arguments[1] as! String
        let subjectDidString = command.arguments[2] as! String
        let credentialId = command.arguments[3] as! String
        let types = command.arguments[4] as! Array<String>
        let days = command.arguments[5] as! Int
        let properties = command.arguments[6] as! Dictionary<String, Any>
        //Map<String, String> props = JSONObject2Map(properties);
        let passphrase = command.arguments[7] as! String

        if (!self.ensureCredentialIDFormat(didUrl: credentialId)) {
            self.error(command, code: errCodeInvalidArg, msg: "Wrong DIDURL format: \(credentialId)")
            return
        }

        do {
            let subjectDid = try DID(subjectDidString)

            var issuer = mIssuerMap[didString]
            if (issuer == nil) {
                if let didStore = mDIDStoreMap[didStoreId] {
                    let did = try DID(didString)
                    issuer = try VerifiableCredentialIssuer(did, didStore)
                    mIssuerMap[didString] = issuer
                }
                else {
                    self.error(command, retAsString: "No DID store found matching ID \(didStoreId)")
                    return
                }
            }

            let expire = Calendar.current.date(byAdding: .day, value: days, to: Date())!

            if let propsAsString = properties.toString() {
                let vc = try issuer!.editingVerifiableCredentialFor(did: subjectDid)
                    .withId(self.getDidUrlFragment(didUrl: credentialId))
                    .withTypes(types)
                    .withExpirationDate(expire)
                    .withProperties(propsAsString)
                    .sealed(using: passphrase)

                let ret = NSMutableDictionary()
                ret.setValue(vc.description, forKey: "credential")
                self.success(command, retAsDict: ret)
            }
            else {
                self.error(command, retAsString: "Invalid json format for credential properties")
            }
        }
        catch {
            self.exception(error, command)
        }
    }

    @objc func loadCredential(_ command: CDVInvokedUrlCommand) {
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
            if let didStore = mDIDStoreMap[didStoreId] {
                var vc: VerifiableCredential? = nil

                if (didUrlString.hasPrefix("did:elastos:")) {
                    vc = try didStore.loadCredential(for: DID(didString), byId: DIDURL(didUrlString))
                }
                else {
                    vc = try didStore.loadCredential(for: didString, byId: didUrlString)
                }

                if (vc == nil) {
                    self.error(command, code: errCodeInvalidArg, msg: " Null credential returned for didString \(didString) and didUrlString \(didUrlString)")
                    return
                }

                mCredentialMap[didUrlString] = vc
                let ret = NSMutableDictionary()
                ret.setValue(vc?.description, forKey: "credential")
                self.success(command, retAsDict: ret)
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

    @objc func storeCredential(_ command: CDVInvokedUrlCommand) {
        guard command.arguments.count == 2 else {
            self.sendWrongParametersCount(command, expected: 2)
            return
        }

        let didStoreId = command.arguments[0] as! String
        let credentials = command.arguments[1] as! Dictionary<String, Any>

        do {
            if let didStore = mDIDStoreMap[didStoreId] {
                let credential = try VerifiableCredential.fromJson(credentials)
                try didStore.storeCredential(using: credential)
                mCredentialMap[credential.getId().description] = credential
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
            if let didStore = mDIDStoreMap[didStoreId] {
                var ret = false
                if (didUrlString.hasPrefix("did:elastos:")) {
                    ret = try didStore.deleteCredential(for: DID(didString), id: DIDURL(didUrlString))
                }
                else {
                    ret = didStore.deleteCredential(for: didString, id: didUrlString)
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
            if let didStore = mDIDStoreMap[didStoreId] {
                let did = try DID(didString)
                let unloadedCredentials = try didStore.listCredentials(for: did)

                var credentials: [Any] = []
                for url in unloadedCredentials {
                    if let credential = try didStore.loadCredential(for: did, byId: url) {
                        let credAsJson = try JSONSerialization.jsonObject(with: credential.description.data(using: .utf8)!, options:[])
                        credentials.append(credAsJson)
                    }
                    else {
                        print("Failed to load credential \(url)")
                    }
                }

                // items should be a JSON string representing an array of credentials...
                let credsAsJsonString = String(data: try!JSONSerialization.data(withJSONObject: credentials, options: []), encoding: .utf8)!

                let r = NSMutableDictionary()
                r.setValue(credsAsJsonString, forKey: "items")

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
        guard command.arguments.count == 1 else {
            self.sendWrongParametersCount(command, expected: 1)
            return
        }

        let didUrl = command.arguments[0] as! String

        do {
            if let didDocument = mDocumentMap[didUrl] {
                let publicKeyId = didDocument.defaultPublicKey

                let r = NSMutableDictionary()

                if let pk = try didDocument.publicKey(ofId: publicKeyId) {
                    let publicKeyJson = NSMutableDictionary()
                    publicKeyJson.setValue(pk.controller.description, forKey: "controller")
                    publicKeyJson.setValue(pk.publicKeyBase58, forKey: "keyBase58")

                    let publicKeyAsString = String(data: try!JSONSerialization.data(withJSONObject: publicKeyJson, options: []), encoding: .utf8)!

                    r.setValue(publicKeyAsString, forKey: "publickey")
                }
                else {
                    r.setValue(nil, forKey: "publickey")
                }

                self.success(command, retAsDict: r)
            }
            else {
                self.error(command, retAsString: "No DID document found matching url \(didUrl)")
                return
            }
        }
        catch {
            self.exception(error, command)
        }
    }

    @objc func DIDDocument_addService(_ command: CDVInvokedUrlCommand) {
        guard command.arguments.count == 4 else {
            self.sendWrongParametersCount(command, expected: 4)
            return
        }

        let didStoreId = command.arguments[0] as! String
        let didString = command.arguments[1] as! String
        let service = command.arguments[2] as! Dictionary<String, Any>
        let storepass = command.arguments[3] as! String

        do {
            if let didStore = mDIDStoreMap[didStoreId] {
                if let didDocument = mDocumentMap[didString] {
                    let db = didDocument.editing()

                    let serviceId = service["id"] as! String
                    let serviceType = service["type"] as! String
                    let serviceEndpoint = service["endpoint"] as! String

                    _ = try db.appendService(with: serviceId, type: serviceType, endpoint: serviceEndpoint)
                    let issuer = try db.sealed(using: storepass)
                    try didStore.storeDid(using: issuer)

                    // Update cached document with newly generated one
                    mDocumentMap[didString] = issuer

                    self.success(command)
                }
                else {
                    self.error(command, retAsString: "No DID document found matching string \(didString)")
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

    @objc func DIDDocument_removeService(_ command: CDVInvokedUrlCommand) {
        guard command.arguments.count == 4 else {
            self.sendWrongParametersCount(command, expected: 4)
            return
        }

        let didStoreId = command.arguments[0] as! String
        let didString = command.arguments[1] as! String
        let serviceDidUrl = command.arguments[2] as! String
        let storepass = command.arguments[3] as! String

        do {
            if let didStore = mDIDStoreMap[didStoreId] {
                if let didDocument = mDocumentMap[didString] {
                    let db = didDocument.editing();

                    _ = try db.removeService(with: serviceDidUrl)
                    let issuer = try db.sealed(using: storepass)
                    try didStore.storeDid(using: issuer)

                    // Update cached document with newly generated one
                    mDocumentMap[didString] = issuer

                    self.success(command)
                }
                else {
                    self.error(command, retAsString: "No DID document found matching string \(didString)")
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

    @objc func addCredential(_ command: CDVInvokedUrlCommand) {
        guard command.arguments.count == 4 else {
            self.sendWrongParametersCount(command, expected: 4)
            return
        }

        let didStoreId = command.arguments[0] as! String
        let didString = command.arguments[1] as! String
        let credential = command.arguments[2] as! Dictionary<String, Any>
        let storepass = command.arguments[3] as! String

        do {
            if let didStore = mDIDStoreMap[didStoreId] {
                if let didDocument = mDocumentMap[didString] {
                    let db = didDocument.editing()

                    let vc = try VerifiableCredential.fromJson(credential)
                    _ = try db.appendCredential(with: vc)
                    let issuer = try db.sealed(using: storepass)
                    try didStore.storeDid(using: issuer)

                    // Update cached document with newly generated one
                    mDocumentMap[didString] = issuer

                    self.success(command)
                }
                else {
                    self.error(command, retAsString: "No DID document found matching string \(didString)")
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

    @objc func DIDDocument_deleteCredential(_ command: CDVInvokedUrlCommand) {
        guard command.arguments.count == 4 else {
            self.sendWrongParametersCount(command, expected: 4)
            return
        }

        let didStoreId = command.arguments[0] as! String
        let didString = command.arguments[1] as! String
        let credential = command.arguments[2] as! Dictionary<String, Any>
        let storepass = command.arguments[3] as! String

        do {
            if let didStore = mDIDStoreMap[didStoreId] {
                if let didDocument = mDocumentMap[didString] {
                    let db = didDocument.editing();

                    let vc = try VerifiableCredential.fromJson(credential)
                    _ = try db.removeCredential(with: vc.getId())
                    let issuer = try db.sealed(using: storepass)
                    try didStore.storeDid(using: issuer)

                    // Update cached document with newly generated one
                    mDocumentMap[didString] = issuer

                    self.success(command)
                }
                else {
                    self.error(command, retAsString: "No DID document found matching string \(didString)")
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

    @objc func DIDDocument_getCredentials(_ command: CDVInvokedUrlCommand) {
        guard command.arguments.count == 1 else {
            self.sendWrongParametersCount(command, expected: 1)
            return
        }

        let didString = command.arguments[0] as! String

        if let didDocument = mDocumentMap[didString] {
            let credentials = didDocument.credentials()

            let r = NSMutableDictionary()
            r.setValue(credentials, forKey: "credentials")

            self.success(command, retAsDict: r)
        }
        else {
            self.error(command, retAsString: "No DID document found matching string \(didString)")
            return
        }
    }

    @objc func sign(_ command: CDVInvokedUrlCommand) {
        guard command.arguments.count == 3 else {
            self.sendWrongParametersCount(command, expected: 3)
            return
        }

        let didString = command.arguments[0] as! String
        let storepass = command.arguments[1] as! String
        let stringToSign = command.arguments[2] as! String

        do {
            if let didDocument = mDocumentMap[didString] {
                let signString = try didDocument.sign(using: storepass, for: stringToSign.data(using: .utf8)!)
                self.success(command, retAsString: signString)
            }
            else {
                self.error(command, retAsString: "No DID document found matching string \(didString)")
                return
            }
        }
        catch {
            self.exception(error, command)
        }
    }

    @objc func verify(_ command: CDVInvokedUrlCommand) {
        guard command.arguments.count == 3 else {
            self.sendWrongParametersCount(command, expected: 3)
            return
        }

        let didString = command.arguments[0] as! String
        let signString = command.arguments[1] as! String
        let stringToVerify = command.arguments[2] as! String

        do {
            if let didDocument = mDocumentMap[didString] {
                let ret = try didDocument.verify(signature: signString, onto: stringToVerify.data(using: .utf8)!)
                if ret {
                    self.success(command)
                }
                else {
                    self.error(command, code: errCodeVerify, msg: "verify return false!")
                }
            }
            else {
                self.error(command, retAsString: "No DID document found matching string \(didString)")
                return
            }
        }
        catch {
            self.exception(error, command)
        }
    }

    @objc func createJWT(_ command: CDVInvokedUrlCommand) {
        guard command.arguments.count == 5 else {
            self.sendWrongParametersCount(command, expected: 5)
            return
        }

        let didString = command.arguments[1] as! String
        let properties = command.arguments[2] as! Dictionary<String, Any>
        let days = command.arguments[3] as! Int
        let storepass = command.arguments[4] as! String

        do {
            if let didDocument = mDocumentMap[didString] {

                // TODO
                self.error(command, retAsString: "Not implemented")
            }
            else {
                self.error(command, retAsString: "No DID document found matching did string \(didString)")
                return
            }
        }
        catch {
            self.exception(error, command)
        }
    }

    // PublicKey
    @objc func getMethod(_ command: CDVInvokedUrlCommand) {
        guard command.arguments.count == 1 else {
            self.sendWrongParametersCount(command, expected: 1)
            return
        }

        let didString = command.arguments[0] as! String

        if let did = mDIDMap[didString] {
            self.success(command, retAsString: did.method)
        }
        else {
            self.error(command, retAsString: "No DID found in map for string \(didString)")
        }
    }

    @objc func getMethodSpecificId(_ command: CDVInvokedUrlCommand) {
        guard command.arguments.count == 1 else {
            self.sendWrongParametersCount(command, expected: 1)
            return
        }

        let didString = command.arguments[0] as! String

        if let did = mDIDMap[didString] {
            self.success(command, retAsString: did.methodSpecificId)
        }
        else {
            self.error(command, retAsString: "No DID found in map for string \(didString)")
        }
    }

    @objc func createVerifiablePresentationFromCredentials(_ command: CDVInvokedUrlCommand) {
        guard command.arguments.count == 6 else {
            self.sendWrongParametersCount(command, expected: 6)
            return
        }

        let didStoreId = command.arguments[0] as! String
        let didString = command.arguments[1] as! String
        let creds = command.arguments[2] as! Array<Dictionary<String, Any>>
        let realm = command.arguments[3] as! String
        let nonce = command.arguments[4] as! String
        let storePass = command.arguments[5] as! String

        do {
            if let didStore = mDIDStoreMap[didStoreId] {
                let did = try DID(didString)

                // Rebuild our credentials from their JSON form
                var credentials : Array<VerifiableCredential> = Array()
                for cred in creds {
                    credentials.append(try VerifiableCredential.fromJson(cred))
                }

                let builder = try VerifiablePresentation.editingVerifiablePresentation(for: did, using: didStore)
                let presentation = try builder.withCredentials(credentials)
                        .withNonce(nonce)
                        .withRealm(realm)
                        .sealed(using: storePass);

                self.success(command, retAsString: presentation.description)
            }
            else {
                self.error(command, retAsString: "No DID store found matching ID \(didStoreId)")
                return
            }
        } catch  {
            self.exception(error, command)
        }
    }

    @objc func verifiablePresentationIsValid(_ command: CDVInvokedUrlCommand) {
        guard command.arguments.count == 1 else {
            self.sendWrongParametersCount(command, expected: 1)
            return
        }

        let pres = command.arguments[0] as! String

        do {
            let presentation = try VerifiablePresentation.fromJson(pres.description);

            let r = NSMutableDictionary()
            r.setValue(try presentation.isValid, forKey: "isvalid");
            self.success(command, retAsDict: r)
        } catch {
            self.exception(error, command)
        }
    }

    @objc func verifiablePresentationIsGenuine(_ command: CDVInvokedUrlCommand) {
        guard command.arguments.count == 1 else {
            self.sendWrongParametersCount(command, expected: 1)
            return
        }

        let pres = command.arguments[0] as! String

        do {
            let presentation = try VerifiablePresentation.fromJson(pres.description);

            let r = NSMutableDictionary()
            r.setValue(try presentation.isGenuine, forKey: "isgenuine");
            self.success(command, retAsDict: r)
        } catch {
            self.exception(error, command)
        }
    }

    // Acceptable formats:
    // #cred
    // did:xxxxxx#cred
    private func ensureCredentialIDFormat(didUrl: String) -> Bool {
        if (didUrl.hasPrefix("#")) {
            return true
        }

        if (didUrl.hasPrefix("did:") && didUrl.contains("#")) {
            return true
        }

        return false
    }

     /**
     * Converts long or short form DIDURL into the a fragment only.
     * did:elastos:abcdef#my-key -> my-key
     * #my-key -> my-key
     */
    private func getDidUrlFragment(didUrl: String) -> String {
        if (didUrl.hasPrefix("#")) {
            return String(didUrl.suffix(from: (didUrl.index(didUrl.startIndex, offsetBy: 1))))
        }
        else if (didUrl.contains("#")) {
            return String(didUrl.suffix(from: didUrl.index(didUrl.index(of: "#")!, offsetBy: 1)))
        }
        else {
            return didUrl
        }
    }
}

/**
 * The DID SDK returns OrderedDictionary which contains additional keys creating exception when trying to convert to JSON.
 * This extensions allows converting it to a NSDictionary that can then work well with JSON.
 */
extension OrderedDictionary {
    func asUnorderedDictionary() -> NSDictionary {
        let dict = NSMutableDictionary()
        self.forEach { pair in
            let key = pair.0 as! String
            if let value = pair.1 as? OrderedDictionary {
                dict.setValue(value.asUnorderedDictionary(), forKey: key)
            }
            else {
                let value = pair.1
                dict.setValue(value, forKey: key)
            }
        }
        return dict
    }
}
