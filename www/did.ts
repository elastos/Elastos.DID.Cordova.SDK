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

class DIDImpl implements DIDPlugin.DID {
    clazz = 3;

    constructor(private didString: string, private alias: string) {
        this.didString = didString;
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
        exec(onSuccess, onError, 'DIDPlugin', 'resolve', [this.didString]);
    }

    issueCredential(subjectDID: DIDPlugin.DIDString, credentialId: DIDPlugin.CredentialID, types: string[], expirationDate: Date, properties: any, passphrase: string, onSuccess: (credential: DIDPlugin.VerifiableCredential)=>void, onError?: (err: any)=>void) {
        var _onSuccess = function(ret) {
            let javaVc = JavaVerifiableCredential.createFromJson(ret.credential);
            let credential = javaVc.toVerifiableCredential();
            if (onSuccess)
                onSuccess(credential);
        }

        exec(_onSuccess, onError, 'DIDPlugin', 'CreateCredential',
            [this.didString, subjectDID, credentialId, types, expirationDate, properties, passphrase]);
    }

    deleteCredential(credentialId: DIDPlugin.CredentialID, onSuccess?: ()=>void, onError?: (err: any)=>void) {
        exec(onSuccess, onError, 'DIDPlugin', 'deleteCredential', [this.didString, credentialId]);
    }

    listCredentials(onSuccess: (credentials: DIDPlugin.UnloadedVerifiableCredential[])=>void, onError?: (err: any)=>void) {
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
        exec(_onSuccess, onError, 'DIDPlugin', 'listCredentials', [this.didString]);
    }

    loadCredential(credentialId: DIDPlugin.CredentialID, onSuccess: (credential: DIDPlugin.VerifiableCredential)=>void, onError?: (err: any)=>void) {
        var _onSuccess = function(ret) {
            let javaVc = JavaVerifiableCredential.createFromJson(ret.credential);
            let credential = javaVc.toVerifiableCredential();
            if (onSuccess)
                onSuccess(credential);
        }

        exec(_onSuccess, onError, 'DIDPlugin', 'loadCredential', [this.didString, credentialId]);
    }

    async storeCredential(credential: VerifiableCredentialImpl, onSuccess?: ()=>void, onError?: (err: any)=>void) {
        try {
            let passedCredential = JavaVerifiableCredential.createFromVerifiableCredential(credential);
            console.log("passedCredential", passedCredential);

            exec(onSuccess, onError, 'DIDPlugin', 'storeCredential', [passedCredential]);
        }
        catch (err) {
            if (onError)
                onError(err);
        }
    }

    createVerifiablePresentation(credentials: DIDPlugin.VerifiableCredential[], realm: string, nonce: string, storepass: string, onSuccess: (presentation: DIDPlugin.VerifiablePresentation) => void, onError?: (err: any) => void) {
        // Convert our credentials format to java format
        let javaCredentials: JavaVerifiableCredential[] = [];
        javaCredentials = credentials.map((cred)=>{
            return JavaVerifiableCredential.createFromVerifiableCredential(cred);
        });

        var _onSuccess = function(presentationJson) {
            let builder: VerifiablePresentationBuilderImpl = didManager.VerifiablePresentationBuilder as VerifiablePresentationBuilderImpl;
            let presentation = builder.fromNativeJson(presentationJson);
            onSuccess(presentation);
        }

        exec(_onSuccess, onError, 'DIDPlugin', 'createVerifiablePresentationFromCredentials', [this.didString, javaCredentials, realm, nonce, storepass]);
    }
}

class DIDDocumentImpl implements DIDPlugin.DIDDocument {
    objId  = null;
    clazz  = 2;
    DidString = "";
    did: DIDPlugin.DID = null;

    getId(): string {
        return this.objId;
    }

    setSubject(subject: any, onSuccess?: (data: any) => void, onError?: (err: any) => void) {
        exec(onSuccess, onError, 'DIDPlugin', 'setSubject', [this.objId, subject]);
    }

    getSubject(onSuccess: (data: any) => void, onError?: (err: any) => void) {
        var _onSuccess = function(ret) {
            var did = new DIDImpl(ret.didstring,"");
            onSuccess(did);
        }

        exec(_onSuccess, onError, 'DIDPlugin', 'getSubject', [this.objId]);
    }

    getPublicKeyCount(onSuccess: (data: any) => void, onError?: (err: any) => void) {
        exec(onSuccess, onError, 'DIDPlugin', 'getPublicKeyCount', [this.objId]);
    }

    getDefaultPublicKey(onSuccess: (data: any) => void, onError?: (err: any) => void) {
        exec(onSuccess, onError, 'DIDPlugin', 'getDefaultPublicKey', [this.objId]);
    }

    getPublicKey(didString: string, onSuccess: (data: any) => void, onError?: (err: any) => void) {
        var publicKey = new PublicKeyImpl();

        var _onSuccess = function(ret) {
            publicKey.objId = ret.id;
            if (onSuccess) onSuccess(publicKey);
        }

        exec(_onSuccess, onError, 'DIDPlugin', 'getPublicKey', [this.objId, didString]);
    }

    getPublicKeys(onSuccess: (data: any) => void, onError?: (err: any) => void) {
        exec(onSuccess, onError, 'DIDPlugin', 'getPublicKeys', [this.objId]);
    }

    addCredential(credentialId: any, storePass: string, onSuccess?: (data: any) => void, onError?: (err: any) => void) {
        exec(onSuccess, onError, 'DIDPlugin', 'addCredential', [this.objId, credentialId, storePass]);
    }

    getCredential(credentialId: any, onSuccess?: (data: any) => void, onError?: (err: any) => void) {
        exec(onSuccess, onError, 'DIDPlugin', 'getCredential', [this.objId, credentialId]);
    }

    sign(storePass: string, originString: string, onSuccess: (data: any) => void, onError?: (err: any) => void) {
        exec(onSuccess, onError, 'DIDPlugin', 'sign', [this.objId, storePass, originString]);
    }

    verify(signString: string, originString: string, onSuccess: (data: any) => void, onError?: (err: any) => void) {
        exec(onSuccess, onError, 'DIDPlugin', 'verify', [this.objId, signString, originString]);
    }

    publish(storepass: string, onSuccess?: () => void, onError?: (err: any) => void) {
        exec(onSuccess, onError, 'DIDPlugin', 'publishDid', [this.objId, storepass]);
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

        // Re-create real credential objects based on json data
        presentation.verifiableCredential = [];
        jsonPresentation.verifiableCredential.map((jsonVc)=>{
            let javaVc = JavaVerifiableCredential.createFromJson(JSON.stringify(jsonVc));
            let vc = javaVc.toVerifiableCredential();
            presentation.verifiableCredential.push(vc);
        })

        return presentation;
    }
}

class VerifiablePresentationImpl implements DIDPlugin.VerifiablePresentation {
    public type: string;
    public verifiableCredential: DIDPlugin.VerifiableCredential[] // As named by W3C
    public proof: any;

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
}

class DIDStoreImpl implements DIDPlugin.DIDStore {
    objId  = null;
    adapterId = null;
    clazz  = 1;

    getId(): string {
        return this.objId;
    }

    initPrivateIdentity(language: number, mnemonic: string, passphrase: string, storepass: string, force: Boolean, onSuccess: (data: any) => void, onError?: (err: any) => void) {
        exec(onSuccess, onError, 'DIDPlugin', 'initPrivateIdentity', [language, mnemonic, passphrase, storepass, force]);
    }

    containsPrivateIdentity(onSuccess: (data: any) => void, onError?: (err: any) => void) {
        exec(onSuccess, onError, 'DIDPlugin', 'containsPrivateIdentity', []);
    }

    deleteDid(didString: string, onSuccess: (data: any) => void, onError?: (err: any) => void) {
        exec(onSuccess, onError, 'DIDPlugin', 'deleteDid', [didString]);
    }

    newDid(passphrase: string, alias: string, onSuccess: (didString: DIDPlugin.DIDString, didDocument: DIDPlugin.DIDDocument)=>void, onError?: (err: any)=>void) {
         var _onSuccess = function(ret) {
             var diddoc = new DIDDocumentImpl();
             let didString = ret.did;
             diddoc.objId = ret.id;
             if (onSuccess)
                onSuccess(didString, diddoc);
         }

         exec(_onSuccess, onError, 'DIDPlugin', 'newDid', [passphrase, alias]);
    }

    listDids(filter: any, onSuccess: (dids: DIDPlugin.DID[])=>void, onError?: (err: any)=>void) {
        var _onSuccess = function(ret) {
            let dids: DIDPlugin.DID[] = [];
            ret.items.map((item)=>{
                let did = new DIDImpl(item.did, item.alias);
                dids.push(did);
            });

            onSuccess(dids);
        }
        exec(_onSuccess, onError, 'DIDPlugin', 'listDids', [filter]);
    }

    loadDidDocument(didString: string, onSuccess: (didDocument: DIDPlugin.DIDDocument) => void, onError?: (err: any) => void) {
         var _onSuccess = function(ret) {
             var diddoc = new DIDDocumentImpl();
             diddoc.objId = ret.id;
             if (onSuccess)
                onSuccess(diddoc);
         }

         exec(_onSuccess, onError, 'DIDPlugin', 'loadDid', [didString]);
    }

    resolveDidDocument(didString: string, onSuccess: (didDocument: DIDPlugin.DIDDocument)=>void, onError?: (err: any)=>void) {
        var _onSuccess = function(ret) {
            var diddoc = new DIDDocumentImpl();
            diddoc.objId = ret.id;
            if (onSuccess)
                onSuccess(diddoc);
        }

        exec(_onSuccess, onError, 'DIDPlugin', 'resolveDid', [didString]);
    }

    storeDidDocument(didDocument: DIDDocumentImpl, alias: string, onSuccess: () => void, onError?: (err: any) => void) {
        exec(onSuccess, onError, 'DIDPlugin', 'storeDid', [didDocument.objId, alias]);
    }

    updateDidDocument(didDocument: DIDDocumentImpl, storepass: string, onSuccess?: () => void, onError?: (err: any) => void) {
        exec(onSuccess, onError, 'DIDPlugin', 'updateDid', [didDocument.objId, didDocument.DidString, storepass]);
    }

    setResolverUrl(resolver: string, onSuccess: ()=>void, onError?: (err: any)=>void) {
        exec(onSuccess, onError, 'DIDPlugin', 'setResolverUrl', [this.adapterId, resolver]);
    }

    synchronize(storepass: string, onSuccess: () => void, onError?: (err: any) => void) {
        exec(onSuccess, onError, 'DIDPlugin', 'synchronize', [storepass]);
    }
}

const LISTENER_IDTRANSACTION  = 1;
type DIDManagerEvent = {
    callback: Function;
    object: any;
};

class DIDManagerImpl implements DIDPlugin.DIDManager {
    VerifiableCredentialBuilder: DIDPlugin.VerifiableCredentialBuilder = new VerifiableCredentialBuilderImpl();
    VerifiablePresentationBuilder: DIDPlugin.VerifiablePresentationBuilder = new VerifiablePresentationBuilderImpl();
    createIdTransactionEvent:DIDManagerEvent;

    constructor() {
        Object.freeze(DIDManagerImpl.prototype);
        Object.freeze(DIDStoreImpl.prototype);
        Object.freeze(DIDDocumentImpl.prototype);
        Object.freeze(DIDImpl.prototype);
        Object.freeze(PublicKeyImpl.prototype);
        Object.freeze(VerifiableCredentialImpl.prototype);
        Object.freeze(UnloadedVerifiableCredentialImpl.prototype);

        this.setListener(LISTENER_IDTRANSACTION, (event) => {
            this.createIdTransactionEvent.callback(event.payload, event.memo);
        });
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

    setListener(type: any, eventCallback: Function) {
        exec(eventCallback, null, 'DIDPlugin', 'setListener', [type]);
    }

    initDidStore(didStoreId: string, createIdTransactionCallback: DIDPlugin.OnCreateIdTransaction, onSuccess?: (didStore: DIDPlugin.DIDStore)=>void, onError?: (err: any)=>void) {
        var callbackId = 0;
        if (typeof createIdTransactionCallback === "function") {
            callbackId = this.addCreateIdTransactionCB(createIdTransactionCallback);
        }

        var _onSuccess = function(ret) {
            var didStore = new DIDStoreImpl();
            didStore.objId = didStoreId;
            didStore.adapterId = ret.adapterId;
            if (onSuccess)
                onSuccess(didStore);
        }
        exec(_onSuccess, onError, 'DIDPlugin', 'initDidStore', [didStoreId, callbackId]);
    }

    deleteDidStore(didStoreId: string, onSuccess?: ()=>void, onError?: (err: any)=>void) {
        exec(onSuccess, onError, 'DIDPlugin', 'deleteDidStore', [didStoreId]);
    }

    createDIDDocumentFromJson(json: any, onSuccess?: (didDocument: DIDPlugin.DIDDocument)=>void, onError?: (err: any)=>void){
        var _onSuccess = function(ret) {
            var didDocument = new DIDDocumentImpl();
            didDocument.objId = ret.id;
            if (onSuccess)
                onSuccess(didDocument);
        }

        exec(_onSuccess, onError, 'DIDPlugin', 'CreateDIDDocumentFromJson', [json]);
    }

    generateMnemonic(language: any, onSuccess: (mnemonic: string)=>void, onError?: (err: any)=>void) {
        exec(onSuccess, onError, 'DIDPlugin', 'generateMnemonic', [language]);
    }

    isMnemonicValid(language: any, mnemonic: string, onSuccess: (isValid: boolean)=>void, onError?: (err: any)=>void) {
        exec(onSuccess, onError, 'DIDPlugin', 'isMnemonicValid', [language, mnemonic]);
    }
}

class VerifiableCredentialBuilderImpl implements DIDPlugin.VerifiableCredentialBuilder {
    // json string presentation coming from the plugin (plugin objects)
    fromJson(credentialJson: string): DIDPlugin.VerifiableCredential {
        try {
            let jsonObj = JSON.parse(credentialJson);
            let credential = new VerifiableCredentialImpl();
            Object.assign(credential, jsonObj);
            /*credential.credentialId = jsonObj.id;
            credential.expirationDate = new Date(jsonObj.expirationDate);
            credential.fragment = new URL(jsonObj.id).hash.replace("#","");
            credential.issuanceDate = new Date(jsonObj.issuanceDate);
            credential.issuer = jsonObj.issuer;
            credential.credentialSubject = jsonObj.credentialSubject;
            credential.proof = jsonObj.proof;
            credential.type = jsonObj.type;*/
            return credential;
        }
        catch (e) {
            throw e;
        }
    }
}

class UnloadedVerifiableCredentialImpl implements DIDPlugin.UnloadedVerifiableCredential {
    credentialId: string = null;
    alias: string = null;
}

class VerifiableCredentialImpl implements DIDPlugin.VerifiableCredential {
    credentialId: DIDPlugin.CredentialID = null; // did:elastos:abc#fragment OR just fragment
    clazz = 5;
    fragment: string = null;
    type: string = null;
    issuer: string = null;
    issuanceDate: Date = null;
    expirationDate: Date = null;
    credentialSubject: any = null;
    proof: any = null;

    getId(): DIDPlugin.CredentialID {
        return this.credentialId;
    }

    getFragment() : string {
        return this.fragment;
    }

    getType() : string {
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
        return new Promise((resolve, reject)=>{
            exec(function(ret) {
                resolve(ret);
            }, function(err) {
                reject(err);
            }, 'DIDPlugin', 'credential2string', [this.credentialId]);
        });
    }
}

class JavaVerifiableCredential {
    id: string;
    expirationDate: string; // Not a JS Date, so keep this as a string.
    issuanceDate: string; // Not a JS Date, so keep this as a string.
    fragment: string;
    issuer: string;
    credentialSubject: any;
    proof: any;
    type: string;

    toVerifiableCredential(): DIDPlugin.VerifiableCredential {
        let credential = new VerifiableCredentialImpl();
        credential.credentialId = this.id;
        credential.expirationDate = new Date(this.expirationDate);
        credential.fragment = new URL(this.id).hash.replace("#","");
        credential.issuanceDate = new Date(this.issuanceDate);
        credential.issuer = this.issuer;
        credential.credentialSubject = this.credentialSubject;
        credential.proof = this.proof;
        credential.type = this.type;
        return credential;
    }

    static createFromVerifiableCredential(vc: DIDPlugin.VerifiableCredential): JavaVerifiableCredential {
        let javaVc = new JavaVerifiableCredential();
        // The native part needs a id field, not credentialId, so we just give it.
        javaVc.id = vc.getId();
        // JS Date format is ISO format, including milliseconds, but Java side is expecting
        // no milliseconds, so we make a dirty convertion here.
        javaVc.expirationDate = vc.getExpirationDate().toISOString().replace(".000","");
        javaVc.issuanceDate = vc.getIssuanceDate().toISOString().replace(".000","");
        javaVc.fragment = vc.getFragment();
        javaVc.issuer = vc.getIssuer();
        javaVc.credentialSubject = vc.getSubject();
        javaVc.proof = vc.getProof();
        javaVc.type = vc.getType();
        return javaVc;
    }

    static createFromJson(javaVcJson: string): JavaVerifiableCredential {
        try {
            let jsonObj = JSON.parse(javaVcJson);
            let javaVc = new JavaVerifiableCredential();
            Object.assign(javaVc, jsonObj);
            /*credential.id = jsonObj.id;
            credential.expirationDate = new Date(jsonObj.expirationDate);
            credential.fragment = new URL(jsonObj.id).hash.replace("#","");
            credential.issuanceDate = new Date(jsonObj.issuanceDate);
            credential.issuer = jsonObj.issuer;
            credential.credentialSubject = jsonObj.credentialSubject;
            credential.proof = jsonObj.proof;
            credential.type = jsonObj.type;*/
            return javaVc;
        }
        catch (e) {
            throw e;
        }
    }
}

class PublicKeyImpl implements DIDPlugin.PublicKey {
    objId = null;
    clazz = 4;
    manager: DIDPlugin.DIDManager = null;

    getController(onSuccess: (did: DIDPlugin.DID) => void, onError?: (err: any) => void) {
        var manager = this.manager;

        var _onSuccess = function(ret) {
            var did = new DIDImpl(ret.didstring, "");
            onSuccess(did);
        }

        exec(_onSuccess, onError, 'DIDPlugin', 'getController', [this.objId]);
    }

    getPublicKeyBase58(method: any, onSuccess: (data: any) => void, onError?: (err: any) => void) {
        exec(onSuccess, onError, 'DIDPlugin', 'getPublicKeyBase58', [this.objId, method]);
    }
}

let didManager = new DIDManagerImpl();
export = didManager;
