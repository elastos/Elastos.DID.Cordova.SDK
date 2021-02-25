/*
 * Copyright (c) 2019-2020 Elastos Foundation
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

var exec = cordova.exec;

class DIDURL {
    /**
     * Short form of a DIDURL (# + fragment part).
     */
    static shortForm(didUrl: string) {
        if (didUrl.indexOf("#") == 0) {
            return didUrl; // Already short form
        }

        return new URL(didUrl).hash; // already contains a #
    }
}

class DIDImpl implements DIDPlugin.DID {
    private loadedCredentials: DIDPlugin.VerifiableCredential[] = null;

    constructor(private storeId: string, private didString: string, private alias: string) {
    }

    /**
     * Method to be called only after creating an empty DID
     */
    initEmptyDID() {
        this.loadedCredentials = [];
    }

    getDIDString(): string {
        return this.didString;
    }

    getMethod(onSuccess: (data: any) => void, onError?: (err: any) => void) {
        exec(onSuccess, onError, 'DIDPlugin', 'getMethod', [this.didString]);
    }

    getMethodSpecificId(onSuccess: (data: any) => void, onError?: (err: any) => void) {
        exec(onSuccess, onError, 'DIDPlugin', 'getMethodSpecificId', [this.didString]);
    }

    resolveDidDocument(onSuccess: (didDocument: DIDPlugin.DIDDocument)=>void, onError?: (err: any)=>void) {
        var storeId = this.storeId;
        var _onSuccess = function(ret: {diddoc: string, updated: string}) {
            var diddoc = NativeDIDDocument.createFromJson(ret.diddoc, ret.updated);
            onSuccess(diddoc.toDIDDocument(storeId));
        }

        exec(_onSuccess, onError, 'DIDPlugin', 'resolveDid', [this.didString]);
    }

    prepareIssuer(onSuccess?: () => void) {
        exec(onSuccess, null, 'DIDPlugin', 'prepareIssuer', [this.storeId, this.didString]);
    }

    issueCredential(subjectDID: DIDPlugin.DIDString, credentialId: DIDPlugin.CredentialID, types: string[], validityDays: number, properties: any, passphrase: string, onSuccess: (credential: DIDPlugin.VerifiableCredential)=>void, onError?: (err: any)=>void) {
        var _onSuccess = function(ret) {
            let nativeVc = NativeVerifiableCredential.createFromJson(ret.credential);
            let credential = nativeVc.toVerifiableCredential();
            if (onSuccess)
                onSuccess(credential);
        }

        exec(_onSuccess, onError, 'DIDPlugin', 'CreateCredential',
            [this.storeId, this.didString, subjectDID, credentialId, types, validityDays | 0, properties, passphrase]);
    }

    async addCredential(credential: VerifiableCredentialImpl, onSuccess?: ()=>void, onError?: (err: any)=>void) {
        if (!this.loadedCredentials)
            throw new Error("Load credentials by calling loadCredentials() before calling this.");

        try {
            var self = this;
            var _onSuccess = function(ret) {
                // Add credential to our local model
                self.loadedCredentials.push(credential);

                if (onSuccess)
                    onSuccess();
            };

            let passedCredential = NativeVerifiableCredential.createFromVerifiableCredential(credential);

            exec(_onSuccess, onError, 'DIDPlugin', 'storeCredential', [this.storeId, passedCredential]);
        }
        catch (err) {
            if (onError)
                onError(err);
        }
    }

    loadCredentials(onSuccess: (credentials: DIDPlugin.VerifiableCredential[]) => void, onError?: (err: any) => void) {
        var self = this;
        var _onSuccess = function(ret: {items: string}) {
            self.loadedCredentials = [];
            let items = JSON.parse(ret.items);
            items.map((credentialJson)=>{
                let nativeCredential = NativeVerifiableCredential.createFromJson(JSON.stringify(credentialJson));
                self.loadedCredentials.push(nativeCredential.toVerifiableCredential());
            });

            onSuccess(self.loadedCredentials);
        }
        exec(_onSuccess, onError, 'DIDPlugin', 'DID_loadCredentials', [this.storeId, this.didString]);
    }

    getCredential(credentialId: string): DIDPlugin.VerifiableCredential {
        if (!this.loadedCredentials)
            throw new Error("Load credentials by calling loadCredentials() before calling getCredential().");

        return this.loadedCredentials.find((c)=>{
            return DIDURL.shortForm(c.getId()) == DIDURL.shortForm(credentialId);
        });
    }

    findCredentials(includedTypes?: string[], includedPropertyName?: string): DIDPlugin.VerifiableCredential[] {
        return Helper.findCredentials(this.loadedCredentials, includedTypes, includedPropertyName);
    }

    deleteCredential(credentialId: DIDPlugin.CredentialID, onSuccess?: ()=>void, onError?: (err: any)=>void) {
        if (!this.loadedCredentials)
            throw new Error("Load credentials by calling loadCredentials() before calling this.");

        var self = this;
        var _onSuccess = function(ret) {
            // Remove credential from our local model
            let credentialIndex = self.loadedCredentials.findIndex((c)=>{
                return DIDURL.shortForm(c.getId()) == DIDURL.shortForm(credentialId);
            })
            self.loadedCredentials.splice(credentialIndex, 1);

            if (onSuccess)
                onSuccess();
        };

        exec(_onSuccess, onError, 'DIDPlugin', 'deleteCredential', [this.storeId, this.didString, credentialId]);
    }

    /*istCredentials(onSuccess: (credentials: DIDPlugin.UnloadedVerifiableCredential[])=>void, onError?: (err: any)=>void) {
        var _onSuccess = function(ret) {
            let uvcs = [];
            ret.items.map((item)=>{
                uvcs.push({
                    credentialId: item.didurl,
                    alias: item.alias
                })
            });

            onSuccess(uvcs);
        }
        exec(_onSuccess, onError, 'DIDPlugin', 'listCredentials', [this.storeId, this.didString]);
    }*/

    loadCredential(credentialId: DIDPlugin.CredentialID, onSuccess: (credential: DIDPlugin.VerifiableCredential)=>void, onError?: (err: any)=>void) {
        var _onSuccess = function(ret) {
            let nativeVc = NativeVerifiableCredential.createFromJson(ret.credential);
            let credential = nativeVc.toVerifiableCredential();
            if (onSuccess)
                onSuccess(credential);
        }

        exec(_onSuccess, onError, 'DIDPlugin', 'loadCredential', [this.storeId, this.didString, credentialId]);
    }

    createVerifiablePresentation(credentials: DIDPlugin.VerifiableCredential[], realm: string, nonce: string, storepass: string, onSuccess: (presentation: DIDPlugin.VerifiablePresentation) => void, onError?: (err: any) => void) {
        // Convert our credentials format to java format
        let nativeCredentials: NativeVerifiableCredential[] = [];
        nativeCredentials = credentials.map((cred)=>{
            return NativeVerifiableCredential.createFromVerifiableCredential(cred);
        });

        var _onSuccess = function(presentationJson) {
            let builder: VerifiablePresentationBuilderImpl = didManager.VerifiablePresentationBuilder as VerifiablePresentationBuilderImpl;
            let presentation = builder.fromNativeJson(presentationJson);
            onSuccess(presentation);
        }

        exec(_onSuccess, onError, 'DIDPlugin', 'createVerifiablePresentationFromCredentials', [this.storeId, this.didString, nativeCredentials, realm, nonce, storepass]);
    }
}

class NativeDIDDocument {
    id: string; // W3C spec: getSubject() actually maps to "id".
    created: string = null; // Not a JS Date, so keep this as a string.
    updated: string = null; // Not a JS Date, so keep this as a string.
    verifiableCredential: any[];
    publicKey: any[];
    authentication: any[];
    authorization: any[];
    service: any[];
    expires: string; // Not a JS Date, so keep this as a string.
    //proof: any;
    //deactivated: boolean;
    //alias: string;

    toDIDDocument(storeId = ""): DIDPlugin.DIDDocument {
        let didDocument = new DIDDocumentImpl();
        let didImpl = new DIDImpl(storeId, this.id, "");
        didDocument.id = didImpl;

        didDocument.created = (this.created?new Date(this.created):null);
        didDocument.updated = (this.updated?new Date(this.updated):null);
        didDocument.expires = new Date(this.expires);

        didDocument.verifiableCredential = []
        if (this.verifiableCredential) { // Could be undefined
            this.verifiableCredential.forEach((c)=>{
                let vc = NativeVerifiableCredential.createFromJson(JSON.stringify(c));
                didDocument.verifiableCredential.push(vc.toVerifiableCredential());
            });
        }

        didDocument.services = []
        if (this.service) { // Could be undefined
            this.service.forEach(function (s) {
                let service = NativeService.createFromJson(JSON.stringify(s));
                didDocument.services.push(service.toService());
            });
        }

        didDocument.publicKey = [];
        if (this.publicKey) { // Could be undefined
            this.publicKey.forEach(function (k) {
                let publicKey = NativePublicKey.createFromJson(JSON.stringify(k));
                didDocument.publicKey.push(publicKey.toPublicKey());
            });
        }

        didDocument.authentication = null; // TODO
        didDocument.authorization = null; // TODO
        didDocument.storeId = storeId;
        return didDocument;
    }

    static createFromDIDDocument(didDocument: DIDPlugin.DIDDocument): NativeDIDDocument {
        let nativeDidDocument = new NativeDIDDocument();
        // JS Date format is ISO format, including milliseconds, but Java side is expecting
        // no milliseconds, so we make a dirty convertion here.
        nativeDidDocument.id = didDocument.getSubject().getDIDString();

        if (didDocument.getCreated())
            nativeDidDocument.created = didDocument.getCreated().toISOString().replace(".000","");

        if (didDocument.getUpdated())
            nativeDidDocument.updated = didDocument.getUpdated().toISOString().replace(".000","");

        if (didDocument.getExpires())
            nativeDidDocument.expires = didDocument.getExpires().toISOString().replace(".000", "");

        nativeDidDocument.verifiableCredential = [];
        didDocument.getCredentials().forEach((c)=>{
            nativeDidDocument.verifiableCredential.push(NativeVerifiableCredential.createFromVerifiableCredential(c));
        });

        nativeDidDocument.service = [];
        didDocument.getServices().forEach((s)=>{
            nativeDidDocument.service.push(NativeService.createFromService(s));
        });

        nativeDidDocument.publicKey = null; // TODO
        nativeDidDocument.authentication = null; // TODO
        nativeDidDocument.authorization = null; // TODO
        return nativeDidDocument;
    }

    static createFromJson(nativeDidDocumentJson: string, updated: string): NativeDIDDocument {
        try {
            let jsonObj = JSON.parse(nativeDidDocumentJson);
            let nativeDidDocument = new NativeDIDDocument();
            Object.assign(nativeDidDocument, jsonObj);

            // "updated" is handled separately because it's not part of the document, it's provided by the sdk.
            nativeDidDocument.updated = updated;

            return nativeDidDocument;
        }
        catch (e) {
            throw e;
        }
    }
}

class DIDDocumentImpl implements DIDPlugin.DIDDocument {
    storeId: string;

    id: DIDPlugin.DID;
    created: Date;
    updated: Date;
    verifiableCredential: DIDPlugin.VerifiableCredential[];
    publicKey: DIDPlugin.PublicKey[];
    authentication: DIDPlugin.PublicKey[];
    authorization: DIDPlugin.PublicKey[];
    services: ServiceImpl[];
    expires: Date;
    //proof: DIDPlugin.Proof;
    //deactivated: boolean;
    //alias: string;

    setSubject(subject: DIDPlugin.DID) {
        this.id = subject;
    }

    getSubject(): DIDPlugin.DID {
        return this.id;
    }

    getCreated(): Date {
        return this.created;
    }

    getUpdated(): Date {
        return this.updated;
    }

    getExpires(): Date {
        return this.expires;
    }

    getPublicKeyCount(): Number {
        return this.getPublicKeys().length;
    }

    getDefaultPublicKey(onSuccess: (publicKey: DIDPlugin.PublicKey) => void, onError?: (err: any) => void) {
        var _onSuccess = function(ret: {publickey: string}) {
            var nativePublicKey = NativePublicKey.createFromJson(ret.publickey);
            onSuccess(nativePublicKey.toPublicKey());
        }

        exec(_onSuccess, onError, 'DIDPlugin', 'getDefaultPublicKey', [this.id.getDIDString()]);
    }

    getPublicKey(didUrl: DIDURL): DIDPlugin.PublicKey {
        return null; // TODO
    }

    getPublicKeys(): DIDPlugin.PublicKey[] {
        return this.publicKey;
    }

    getServicesCount(): Number {
        return this.services.length;
    }

    getService(didUrl: string): DIDPlugin.Service {
        return this.services.find(s => {
            return DIDURL.shortForm(s.getId()) == DIDURL.shortForm(didUrl);
        });
    }

    getServices(): DIDPlugin.Service[] {
        return this.services;
    }

    addService(service: ServiceImpl, storePass: string, onSuccess?: () => void, onError?: (err: any) => void) {
        let nativeService = NativeService.createFromService(service);

        exec(() => {
            // Also save the service locally. Remove first if it already exists (update case)
            this.deleteLocalService(service);
            this.services.push(service);

            if (onSuccess)
                onSuccess();
        }, onError, 'DIDPlugin', 'DIDDocument_addService', [this.storeId, this.id.getDIDString(), nativeService, storePass]);
    }

    removeService(didUrl: DIDPlugin.DIDURL, storePass: string, onSuccess?: () => void, onError?: (err: any) => void) {
        exec(() => {
            // Also remove the service locally.
            this.deleteLocalServiceByUrl(didUrl);

            if (onSuccess)
                onSuccess();
        }, onError, 'DIDPlugin', 'DIDDocument_removeService', [this.storeId, this.id.getDIDString(), didUrl, storePass]);
    }

    private deleteLocalService(service: DIDPlugin.Service) {
        return this.deleteLocalServiceByUrl(service.getId());
    }

    private deleteLocalServiceByUrl(didUrl: DIDPlugin.DIDURL) {
        let serviceIndex = this.services.findIndex((s)=>{
            return DIDURL.shortForm(s.getId()) == DIDURL.shortForm(didUrl);
        })
        if (serviceIndex >= 0)
            this.services.splice(serviceIndex, 1);
    }

    addCredential(credential: DIDPlugin.VerifiableCredential, storePass: string, onSuccess?: () => void, onError?: (err: any) => void) {
        let nativeVc = NativeVerifiableCredential.createFromVerifiableCredential(credential);

        var self = this;
        var _onSuccess = function() {
            // Also save the credential locally. Remove first if it already exists (update case)
            self.deleteLocalCredential(credential);
            self.verifiableCredential.push(credential);

            if (onSuccess)
                onSuccess();
        }

        exec(_onSuccess, onError, 'DIDPlugin', 'addCredential', [this.storeId, this.id.getDIDString(), nativeVc, storePass]);
    }

    private deleteLocalCredential(credential: DIDPlugin.VerifiableCredential) {
        let credentialIndex = this.verifiableCredential.findIndex((c)=>{
            return DIDURL.shortForm(c.getId()) == DIDURL.shortForm(credential.getId());
        })
        if (credentialIndex >= 0)
            this.verifiableCredential.splice(credentialIndex, 1);
    }

    deleteCredential(credential: DIDPlugin.VerifiableCredential, storePass: string, onSuccess?: ()=>void, onError?: (err: any)=>void) {
        let nativeVc = NativeVerifiableCredential.createFromVerifiableCredential(credential);

        var self = this;
        var _onSuccess = function() {
            // Also delete the credential locally.
            self.deleteLocalCredential(credential);

            if (onSuccess)
                onSuccess();
        }

        exec(_onSuccess, onError, 'DIDPlugin', 'DIDDocument_deleteCredential', [this.storeId, this.id.getDIDString(), nativeVc, storePass]);
    }

    getCredential(credentialId: DIDPlugin.CredentialID) {
        return this.verifiableCredential.find((c)=>{
            return DIDURL.shortForm(c.getId()) == DIDURL.shortForm(credentialId);
        })
    }

    getCredentials(): DIDPlugin.VerifiableCredential[] {
        return this.verifiableCredential;
    }

    findCredentials(includedTypes?: string[], includedPropertyName?: string): DIDPlugin.VerifiableCredential[] {
        return Helper.findCredentials(this.verifiableCredential, includedTypes, includedPropertyName);
    }

    sign(storePass: string, originString: string, onSuccess: (data: any) => void, onError?: (err: any) => void) {
        exec(onSuccess, onError, 'DIDPlugin', 'sign', [this.id.getDIDString(), storePass, originString]);
    }

    verify(signString: string, originString: string, onSuccess: (data: any) => void, onError?: (err: any) => void) {
        exec(onSuccess, onError, 'DIDPlugin', 'verify', [this.id.getDIDString(), signString, originString]);
    }

    signDigest(storePass: string, digest: string, onSuccess: (data: any) => void, onError?: (err: any) => void) {
      exec(onSuccess, onError, 'DIDPlugin', 'signDigest', [this.id.getDIDString(), storePass, digest]);
  }

    publish(storepass: string, onSuccess?: () => void, onError?: (err: any) => void) {
        exec(onSuccess, onError, 'DIDPlugin', 'publishDid', [this.storeId, this.id.getDIDString(), storepass]);
    }

    createJWT(properties: any, validityDays: Number, storepass: string, onSuccess: (token: string) => void, onError?: (err: any) => void) {
        exec(onSuccess, onError, 'DIDPlugin', 'createJWT', [this.id.getDIDString(), properties, validityDays, storepass]);
    }

    toJson(): Promise<string> {
        return new Promise((resolve, reject)=>{
            exec((jsonString)=>{
                resolve(jsonString);
            }, (err)=>{
                reject(err);
            }, 'DIDPlugin', 'DIDDocument_toJson', [this.id.getDIDString()]);
        });
    }
}

class VerifiablePresentationBuilderImpl implements DIDPlugin.VerifiablePresentationBuilder {
    // json string presentation coming from the plugin (plugin objects)
    fromJson(json: string, onSuccess: (presentation: DIDPlugin.VerifiablePresentation) => void, onError?: (err: any) => void) {
        let jsonPresentation = JSON.parse(json);
        let presentation = new VerifiablePresentationImpl();

        presentation.type = jsonPresentation.type;
        presentation.proof = jsonPresentation.proof;

        // Re-create real credential objects based on json data
        presentation.verifiableCredential = [];
        jsonPresentation.verifiableCredential.map((jsonVc)=>{
            let vc = didManager.VerifiableCredentialBuilder.fromJson(JSON.stringify(jsonVc))
            presentation.verifiableCredential.push(vc);
        })

        onSuccess(presentation);
    }

    // json string presentation coming from the native side (native objects)
    fromNativeJson(json: string): DIDPlugin.VerifiablePresentation {
        let jsonPresentation = JSON.parse(json);
        let presentation = new VerifiablePresentationImpl();

        presentation.type = jsonPresentation.type;
        presentation.proof = jsonPresentation.proof;
        presentation.created = (jsonPresentation.created?new Date(jsonPresentation.created):null);
        presentation.updated = (jsonPresentation.updated?new Date(jsonPresentation.updated):null);

        // Re-create real credential objects based on json data
        presentation.verifiableCredential = [];
        jsonPresentation.verifiableCredential.map((jsonVc)=>{
            let nativeVc = NativeVerifiableCredential.createFromJson(JSON.stringify(jsonVc));
            let vc = nativeVc.toVerifiableCredential();
            presentation.verifiableCredential.push(vc);
        })

        return presentation;
    }
}

class VerifiablePresentationImpl implements DIDPlugin.VerifiablePresentation {
    public type: string;
    public verifiableCredential: DIDPlugin.VerifiableCredential[] // As named by W3C
    public proof: any;
    created: Date;
    updated: Date;

    getCredentials(): DIDPlugin.VerifiableCredential[] {
        return this.verifiableCredential;
    }

    isValid(onSuccess: (isValid: boolean) => void, onError?: (err: any) => void) {
        var _onSuccess = function(ret) {
            if (onSuccess)
                onSuccess(ret.isvalid);
        }
        exec(_onSuccess, onError, 'DIDPlugin', 'verifiablePresentationIsValid', [this]);
    }

    isGenuine(onSuccess: (isValid: boolean) => void, onError?: (err: any) => void) {
        var _onSuccess = function(ret) {
            if (onSuccess)
                onSuccess(ret.isgenuine);
        }
        exec(_onSuccess, onError, 'DIDPlugin', 'verifiablePresentationIsGenuine', [this]);
    }

    toJson(): Promise<string> {
        return new Promise((resolve, reject)=>{
            exec((presentationString)=>{
                resolve(presentationString);
            }, (err)=>{
                reject(err);
            }, 'DIDPlugin', 'verifiablePresentationToJson', [this]);
        })
    }
}

class DIDStoreImpl implements DIDPlugin.DIDStore {
    objId  = null;

    getId(): string {
        return this.objId;
    }

    initPrivateIdentity(language: DIDPlugin.MnemonicLanguage, mnemonic: string, passphrase: string, storepass: string, force: Boolean, onSuccess: (data: any) => void, onError?: (err: any) => void) {
        exec(onSuccess, onError, 'DIDPlugin', 'initPrivateIdentity', [this.objId, language, mnemonic, passphrase, storepass, force]);
    }

    changePassword(oldPassword: string, newPassword: string, onSuccess: () => void, onError?: (err: any) => void) {
        exec(onSuccess, onError, 'DIDPlugin', 'DIDStore_changePassword', [this.objId, oldPassword, newPassword]);
    }

    containsPrivateIdentity(onSuccess: (hasPrivateIdentity: boolean) => void, onError?: (err: any) => void) {
        var _onSuccess = function(ret : string) {
            onSuccess(ret == "true");
        }
        exec(_onSuccess, onError, 'DIDPlugin', 'containsPrivateIdentity', [this.objId]);
    }

    deleteDid(didString: string, onSuccess: (data: any) => void, onError?: (err: any) => void) {
        exec(onSuccess, onError, 'DIDPlugin', 'deleteDid', [this.objId, didString]);
    }

    newDid(passphrase: string, alias: string, onSuccess: (did: DIDPlugin.DID)=>void, onError?: (err: any)=>void) {
         var didStoreId = this.objId;
         var _onSuccess = function(ret) {
             let didString = ret.did;
             let did = new DIDImpl(didStoreId, didString, "");
             did.initEmptyDID();

             if (onSuccess)
                onSuccess(did);
         }

         exec(_onSuccess, onError, 'DIDPlugin', 'newDid', [this.objId, passphrase, alias]);
    }

    listDids(filter: DIDPlugin.DIDStoreFilter, onSuccess: (dids: DIDPlugin.DID[])=>void, onError?: (err: any)=>void) {
        var didStoreId = this.objId;
        var _onSuccess = function(ret) {
            let dids: DIDPlugin.DID[] = [];
            ret.items.map((item)=>{
                let did = new DIDImpl(didStoreId, item.did, item.alias);
                dids.push(did);
            });

            onSuccess(dids);
        }
        exec(_onSuccess, onError, 'DIDPlugin', 'listDids', [this.objId, filter]);
    }

    loadDidDocument(didString: string, onSuccess: (didDocument: DIDPlugin.DIDDocument) => void, onError?: (err: any) => void) {
         var storeId = this.objId;
         var _onSuccess = function(ret: {diddoc: string, updated: string}) {
             var nativeDidDocument = NativeDIDDocument.createFromJson(ret.diddoc, ret.updated);
             onSuccess(nativeDidDocument.toDIDDocument(storeId));
         }

         exec(_onSuccess, onError, 'DIDPlugin', 'loadDid', [this.objId, didString]);
    }

    // resolveDidDocument(didString: string, onSuccess: (didDocument: DIDPlugin.DIDDocument)=>void, onError?: (err: any)=>void) {
    //     var _onSuccess = function(ret: {diddoc: string}) {
    //         var diddoc = NativeDIDDocument.createFromJson(ret.diddoc);
    //         onSuccess(diddoc.toDIDDocument());
    //     }

    //     exec(_onSuccess, onError, 'DIDPlugin', 'resolveDid', [this.objId, didString]);
    // }

    storeDidDocument(didDocument: DIDDocumentImpl, alias: string, onSuccess: () => void, onError?: (err: any) => void) {
        var storeId = this.objId;
        var _onSuccess = function() {
            didDocument.storeId = storeId;
            onSuccess();
        }
        exec(_onSuccess, onError, 'DIDPlugin', 'storeDid', [this.objId, didDocument.getSubject().getDIDString(), alias]);
    }

    // updateDidDocument(didDocument: DIDDocumentImpl, storepass: string, onSuccess?: () => void, onError?: (err: any) => void) {
    //     let nativeDidDocument = NativeDIDDocument.createFromDIDDocument(didDocument);
    //     exec(onSuccess, onError, 'DIDPlugin', 'updateDid', [this.objId, didDocument.getSubject().getDIDString(), nativeDidDocument, storepass]);
    // }

    synchronize(storepass: string, onSuccess: () => void, onError?: (err: any) => void) {
        exec(onSuccess, onError, 'DIDPlugin', 'synchronize', [this.objId, storepass]);
    }

    exportMnemonic(storepass: string, onSuccess: (mnemonic: string) => void, onError?: (err: any) => void) {
        exec(onSuccess, onError, 'DIDPlugin', 'exportMnemonic', [this.objId, storepass]);
    }
}

const LISTENER_IDTRANSACTION = 1;
type DIDManagerEvent = {
    callback: Function;
    object: any;
};

class DIDManagerImpl implements DIDPlugin.DIDManager {
    VerifiableCredentialBuilder: DIDPlugin.VerifiableCredentialBuilder = new VerifiableCredentialBuilderImpl();
    VerifiablePresentationBuilder: DIDPlugin.VerifiablePresentationBuilder = new VerifiablePresentationBuilderImpl();
    ServiceBuilder: DIDPlugin.ServiceBuilder = new ServiceBuilderImpl();

    private createIdTransactionEvent:DIDManagerEvent;

    hasSetListener = false;

    constructor() {
        Object.freeze(DIDManagerImpl.prototype);
        Object.freeze(DIDStoreImpl.prototype);
        Object.freeze(DIDDocumentImpl.prototype);
        Object.freeze(DIDImpl.prototype);
        Object.freeze(PublicKeyImpl.prototype);
        Object.freeze(ServiceImpl.prototype);
        Object.freeze(VerifiableCredentialImpl.prototype);
    }

    addCreateIdTransactionCB(callback) {
        var eventcb: DIDManagerEvent = {
            callback: callback,
            object: null
        };

        this.createIdTransactionEvent = eventcb;
        return 0;
    }

    getVersion(onSuccess: (version: string)=>void, onError?: (err: any)=>void) {
        exec(onSuccess, onError, 'DIDPlugin', 'getVersion', []);
    }

    setListener(type: number, eventCallback: Function) {
        exec(eventCallback, null, 'DIDPlugin', 'setListener', [type]);
    }

    initDidStore(didStoreId: string, createIdTransactionCallback: DIDPlugin.OnCreateIdTransaction, onSuccess?: (didStore: DIDPlugin.DIDStore)=>void, onError?: (err: any)=>void) {
        if (!this.hasSetListener) {
            this.setListener(LISTENER_IDTRANSACTION, (event) => {
                this.createIdTransactionEvent.callback(event.payload, event.memo);
            });
            this.hasSetListener = true;
        }

        var callbackId = 0;
        if (typeof createIdTransactionCallback === "function") {
            callbackId = this.addCreateIdTransactionCB(createIdTransactionCallback);
        }

        var _onSuccess = function() {
            var didStore = new DIDStoreImpl();
            didStore.objId = didStoreId;
            if (onSuccess)
                onSuccess(didStore);
        }
        exec(_onSuccess, onError, 'DIDPlugin', 'initDidStore', [didStoreId, callbackId]);
    }

    deleteDidStore(didStoreId: string, onSuccess?: ()=>void, onError?: (err: any)=>void) {
        exec(onSuccess, onError, 'DIDPlugin', 'deleteDidStore', [didStoreId]);
    }

    createDIDDocumentFromJson(json: any, onSuccess: (didDocument: DIDPlugin.DIDDocument)=>void, onError?: (err: any)=>void){
        var _onSuccess = function(ret: {diddoc: string, updated: string}) {
            var didDocument = NativeDIDDocument.createFromJson(ret.diddoc, ret.updated);
            onSuccess(didDocument.toDIDDocument());
        }

        exec(_onSuccess, onError, 'DIDPlugin', 'CreateDIDDocumentFromJson', [json]);
    }

    generateMnemonic(language: any, onSuccess: (mnemonic: string)=>void, onError?: (err: any)=>void) {
        exec(onSuccess, onError, 'DIDPlugin', 'generateMnemonic', [language]);
    }

    isMnemonicValid(language: any, mnemonic: string, onSuccess: (isValid: boolean)=>void, onError?: (err: any)=>void) {
        var _onSuccess = function(ret : string) {
            onSuccess(ret == "true");
        }
        exec(_onSuccess, onError, 'DIDPlugin', 'isMnemonicValid', [language, mnemonic]);
    }

    setResolverUrl(resolver: string, onSuccess: ()=>void, onError?: (err: any)=>void) {
        exec(onSuccess, onError, 'DIDPlugin', 'setResolverUrl', [resolver]);
    }

    resolveDidDocument(didString: string, forceRemote: boolean, onSuccess: (didDocument: DIDPlugin.DIDDocument)=>void, onError?: (err: any)=>void) {
        var _onSuccess = function(ret: { diddoc?: string, updated: string }) {
            if (ret.diddoc) {
                var didDocument = NativeDIDDocument.createFromJson(ret.diddoc, ret.updated);
                onSuccess(didDocument.toDIDDocument());
            }
            else
                onSuccess(null);
        }
        exec(_onSuccess, onError, 'DIDPlugin', 'DIDManager_resolveDIDDocument', [didString, forceRemote]);
    }

    parseJWT(shouldVerifySignature: boolean, jwtToken: String): Promise<DIDPlugin.ParseJWTResult> {
        return new Promise((resolve, reject)=>{
            exec((ret: DIDPlugin.ParseJWTResult)=>{
                resolve(ret);
            }, (err)=>{
                reject(err);
            }, 'DIDPlugin', 'DIDManager_parseJWT', [shouldVerifySignature, jwtToken]);
        })
    }
}

class VerifiableCredentialBuilderImpl implements DIDPlugin.VerifiableCredentialBuilder {
    // json string presentation coming from the plugin (plugin objects)
    fromJson(credentialJson: string): DIDPlugin.VerifiableCredential {
        try {
            let jsonObj = JSON.parse(credentialJson);
            let credential = new VerifiableCredentialImpl();
            Object.assign(credential, jsonObj);

            // Override values with non basic (string, number) types
            if (jsonObj.expirationDate)
                credential.expirationDate = new Date(jsonObj.expirationDate);

            if (jsonObj.issuanceDate)
                credential.issuanceDate = new Date(jsonObj.issuanceDate);

            return credential;
        }
        catch (e) {
            throw e;
        }
    }
}

class VerifiableCredentialImpl implements DIDPlugin.VerifiableCredential {
    id: DIDPlugin.CredentialID = null; // did:elastos:abc#fragment OR #fragment
    type: string[] = null;
    issuer: string = null;
    issuanceDate: Date = null;
    expirationDate: Date = null;
    credentialSubject: any = null;
    proof: any = null;

    getId(): DIDPlugin.CredentialID {
        return this.id;
    }

    getFragment() : string {
        return new URL(this.id).hash.replace("#","");
    }

    getTypes() : string[] {
        return this.type;
    }

    getIssuer() : string {
        return this.issuer;
    }

    getIssuanceDate() : Date {
        return this.issuanceDate;
    }

    getExpirationDate() : Date {
        return this.expirationDate;
    }

    getSubject() : any {
        return this.credentialSubject;
    }

    getProof() : any {
        return this.proof;
    }

    toString() : Promise<string> {
        return Promise.resolve(JSON.stringify(this));
    }
}

class ServiceBuilderImpl implements DIDPlugin.ServiceBuilder {
    createService(id: string, type: string, serviceEndPoint: string): DIDPlugin.Service {
        try {
            let service = new ServiceImpl();
            service.id = id;
            service.type = type;
            service.serviceEndpoint = serviceEndPoint;
            return service;
        }
        catch (e) {
            throw e;
        }
    }
}

class NativeVerifiableCredential {
    id: string;
    expirationDate: string; // Not a JS Date, so keep this as a string.
    issuanceDate: string; // Not a JS Date, so keep this as a string.
    issuer: string;
    credentialSubject: any;
    proof: any;
    type: string[];

    toVerifiableCredential(): DIDPlugin.VerifiableCredential {
        let credential = new VerifiableCredentialImpl();
        credential.id = this.id;
        credential.expirationDate = new Date(this.expirationDate);
        credential.issuanceDate = new Date(this.issuanceDate);
        credential.issuer = this.issuer;
        credential.credentialSubject = this.credentialSubject;
        credential.proof = this.proof;
        credential.type = this.type;
        return credential;
    }

    static createFromVerifiableCredential(vc: DIDPlugin.VerifiableCredential): NativeVerifiableCredential {
        let nativeVc = new NativeVerifiableCredential();
        // The native part needs a id field, not credentialId, so we just give it.
        nativeVc.id = vc.getId();
        // JS Date format is ISO format, including milliseconds, but Java side is expecting
        // no milliseconds, so we make a dirty convertion here.
        nativeVc.expirationDate = (vc.getExpirationDate()?vc.getExpirationDate().toISOString().replace(".000",""):null);
        nativeVc.issuanceDate = (vc.getIssuanceDate()?vc.getIssuanceDate().toISOString().replace(".000",""):null);
        nativeVc.issuer = vc.getIssuer();
        nativeVc.credentialSubject = vc.getSubject();
        nativeVc.proof = vc.getProof();
        nativeVc.type = vc.getTypes();
        return nativeVc;
    }

    static createFromJson(nativeVcJson: string): NativeVerifiableCredential {
        try {
            let jsonObj = JSON.parse(nativeVcJson);
            let nativeVc = new NativeVerifiableCredential();
            Object.assign(nativeVc, jsonObj);
            /*credential.id = jsonObj.id;
            credential.expirationDate = new Date(jsonObj.expirationDate);
            credential.fragment = new URL(jsonObj.id).hash.replace("#","");
            credential.issuanceDate = new Date(jsonObj.issuanceDate);
            credential.issuer = jsonObj.issuer;
            credential.credentialSubject = jsonObj.credentialSubject;
            credential.proof = jsonObj.proof;
            credential.type = jsonObj.type;*/
            return nativeVc;
        }
        catch (e) {
            throw e;
        }
    }
}

class NativePublicKey {
    controller: string;
    keyBase58: string;

    toPublicKey(): DIDPlugin.PublicKey {
        let publicKey = new PublicKeyImpl();
        publicKey.controller = this.controller;
        publicKey.keyBase58 = this.keyBase58;

        return publicKey;
    }

    static createFromJson(nativePublicKeyJson: string): NativePublicKey {
        try {
            let jsonObj = JSON.parse(nativePublicKeyJson);
            let nativePublicKey = new NativePublicKey();
            Object.assign(nativePublicKey, jsonObj);
            return nativePublicKey;
        }
        catch (e) {
            throw e;
        }
    }
}

class PublicKeyImpl implements DIDPlugin.PublicKey {
    controller: DIDPlugin.DIDString;
    keyBase58: DIDPlugin.Base58PublicKey;

    getController(): DIDPlugin.DIDString {
        return this.controller;
    }

    getPublicKeyBase58(): DIDPlugin.Base58PublicKey {
        return this.keyBase58;
    }
}

class NativeService {
    id: string;
    type: string;
    serviceEndpoint: string;

    toService(): ServiceImpl {
        let service = new ServiceImpl();
        Object.assign(service, this);
        return service;
    }

    static createFromService(service: DIDPlugin.Service): NativeService {
        let nativeService = new NativeService();
        Object.assign(nativeService, service);
        return nativeService;
    }

    static createFromJson(nativeServiceJson: string): NativeService {
        try {
            let jsonObj = JSON.parse(nativeServiceJson);
            let nativeService = new NativeService();
            Object.assign(nativeService, jsonObj);
            return nativeService;
        }
        catch (e) {
            throw e;
        }
    }
}

class ServiceImpl implements DIDPlugin.Service {
    id: string;
    type: string;
    serviceEndpoint;

    getId(): string {
        return this.id;
    }

    getType(): string {
        return this.type;
    }

    getEndpoint(): string {
        return this.serviceEndpoint;
    }
}

class Helper {
    static findCredentials(credentials: DIDPlugin.VerifiableCredential[], includedTypes?: string[], includedPropertyName?: string) {
        if (!credentials)
            return [];

        return credentials.filter((c)=>{
            if (includedTypes) {
                // Make sure all required types are found
                let foundTypes = c.getTypes().filter((type)=>{
                    return includedTypes.indexOf(type.trim()) >= 0;
                });
                if (foundTypes.length != includedTypes.length)
                    return false;
            }

            if (includedPropertyName) {
                // Property field is not defined = no match
                if (!c.getSubject()[includedPropertyName])
                    return false;
            }

            return true;
        });
    }
}

let didManager = new DIDManagerImpl();
export default didManager;
