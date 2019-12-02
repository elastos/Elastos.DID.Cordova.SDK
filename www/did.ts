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

class VerifiableCredentialImpl implements DIDPlugin.VerifiableCredential {
    objId = null;
    clazz = 5;
    info: any = null;

    getFragment(onSuccess: (data: any) => void, onError?: (err: any) => void) {
        exec(onSuccess, onError, 'DIDPlugin', 'getFragment', [this.objId]);
    }

    getType(onSuccess: (data: any) => void, onError?: (err: any) => void) {
        exec(onSuccess, onError, 'DIDPlugin', 'getType', [this.objId]);
    }

    getIssuer(onSuccess: (data: any) => void, onError?: (err: any) => void) {
        exec(onSuccess, onError, 'DIDPlugin', 'getIssuer', [this.objId]);
    }

    getIssuanceDate(onSuccess: (data: any) => void, onError?: (err: any) => void) {
        exec(onSuccess, onError, 'DIDPlugin', 'getIssuanceDate', [this.objId]);
    }

    getExpirationDate(onSuccess: (data: any) => void, onError?: (err: any) => void) {
        exec(onSuccess, onError, 'DIDPlugin', 'getExpirationDate', [this.objId]);
    }

    getProperties(onSuccess: (data: any) => void, onError?: (err: any) => void) {
        exec(onSuccess, onError, 'DIDPlugin', 'getProperties', [this.objId]);
    }

    toString(onSuccess: (data: any) => void, onError?: (err: any) => void) {
        exec(onSuccess, onError, 'DIDPlugin', 'credential2string', [this.objId]);
    }
}

class PublicKeyImpl implements DIDPlugin.PublicKey {
    objId = null;
    clazz = 4;
    manager: DIDPlugin.DIDManager = null;

    getController(onSuccess: (data: any) => void, onError?: (err: any) => void) {
        var did = new DIDImpl();
        var manager = this.manager;

        var _onSuccess = function(ret) {
            did.objId = ret.id;
            did.manager = manager;
            if (onSuccess) onSuccess(did);
        }

        exec(_onSuccess, onError, 'DIDPlugin', 'getController', [this.objId]);
    }

    getPublicKeyBase58(method: any, onSuccess: (data: any) => void, onError?: (err: any) => void) {
        exec(onSuccess, onError, 'DIDPlugin', 'getPublicKeyBase58', [this.objId, method]);
    }
}

class DIDImpl implements DIDPlugin.DID {
    objId = null;
    clazz = 3;
    manager: DIDPlugin.DIDManager = null;

    getId(): string {
        return this.objId;
    }

    getMethod(onSuccess: (data: any) => void, onError?: (err: any) => void) {
        exec(onSuccess, onError, 'DIDPlugin', 'getMethod', [this.objId]);
    }

    getMethodSpecificId(onSuccess: (data: any) => void, onError?: (err: any) => void) {
        exec(onSuccess, onError, 'DIDPlugin', 'getMethodSpecificId', [this.objId]);
    }

    resolve(onSuccess: (data: any) => void, onError?: (err: any) => void) {
        exec(onSuccess, onError, 'DIDPlugin', 'resolve', [this.objId]);
    }

    toString(onSuccess: (data: any) => void, onError?: (err: any) => void) {
        exec(onSuccess, onError, 'DIDPlugin', 'didToString', [this.objId]);
    }
}

class DIDDocumentImpl implements DIDPlugin.DIDDocument {
    objId  = null;
    clazz  = 2;
    DidString = "";
    manager: DIDPlugin.DIDManager = null;
    did: DIDPlugin.DID = null;

    getId(): string {
        return this.objId;
    }

    setSubject(subject: any, onSuccess?: (data: any) => void, onError?: (err: any) => void) {
        exec(onSuccess, onError, 'DIDPlugin', 'setSubject', [this.objId, subject]);
    }

    getSubject(onSuccess: (data: any) => void, onError?: (err: any) => void) {
        var did = new DIDImpl();
        var manager = this.manager;

        var _onSuccess = function(ret) {
            did.objId = ret.id;
            did.manager = manager;
            if (onSuccess) onSuccess(did);
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
        var manager = this.manager;

        var _onSuccess = function(ret) {
            publicKey.objId = ret.id;
            publicKey.manager = manager;
            if (onSuccess) onSuccess(publicKey);
        }

        exec(_onSuccess, onError, 'DIDPlugin', 'getPublicKey', [this.objId, didString]);
    }

    getPublicKeys(onSuccess: (data: any) => void, onError?: (err: any) => void) {
        exec(onSuccess, onError, 'DIDPlugin', 'getPublicKeys', [this.objId]);
    }

    addCredential(credentialId: any, onSuccess?: (data: any) => void, onError?: (err: any) => void) {
        exec(onSuccess, onError, 'DIDPlugin', 'addCredential', [this.objId, credentialId]);
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
}

class DIDStoreImpl implements DIDPlugin.DIDStore {
    objId  = null;
    clazz  = 1;

    getId(): string {
        return this.objId;
    }

    initPrivateIdentity(language: any, mnemonic: string, passphrase: string, storepass: string, force: Boolean, onSuccess: (data: any) => void, onError?: (err: any) => void) {
        exec(onSuccess, onError, 'DIDPlugin', 'initPrivateIdentity', [this.objId, language, mnemonic, passphrase, storepass, force]);
    }

    hasPrivateIdentity(onSuccess: (data: any) => void, onError?: (err: any) => void) {
        exec(onSuccess, onError, 'DIDPlugin', 'hasPrivateIdentity', [this.objId]);
    }

    deleteDid(didString: string, onSuccess: (data: any) => void, onError?: (err: any) => void) {
        exec(onSuccess, onError, 'DIDPlugin', 'deleteDid', [this.objId, didString]);
    }

    newDid(passphrase: string, hint: string, onSuccess: (data: any) => void, onError?: (err: any) => void) {
         var diddoc = new DIDDocumentImpl();

         var _onSuccess = function(ret) {
             diddoc.objId = ret.id;
             diddoc.did = ret.did;
             if (onSuccess) onSuccess(diddoc);
         }

         exec(_onSuccess, onError, 'DIDPlugin', 'newDid', [this.objId, passphrase, hint]);
    }

    listDids(filter: any, onSuccess: (data: any) => void, onError?: (err: any) => void) {
        exec(onSuccess, onError, 'DIDPlugin', 'listDids', [this.objId, filter]);
    }

    loadDid(didString: string, onSuccess: (data: any) => void, onError?: (err: any) => void) {
         var diddoc = new DIDDocumentImpl();

         var _onSuccess = function(ret) {
             diddoc.objId = ret.id;
             if (onSuccess) onSuccess(diddoc);
         }

         exec(_onSuccess, onError, 'DIDPlugin', 'loadDid', [this.objId, didString]);
    }

    publishDid(didDocumentId: string, didUrlString: string, storepass: string, onSuccess?: (data: any) => void, onError?: (err: any) => void) {
        exec(onSuccess, onError, 'DIDPlugin', 'publishDid', [this.objId, didDocumentId, didUrlString, storepass]);
    }

    resolveDid(didString: string, onSuccess: (data: any) => void, onError?: (err: any) => void) {
        var diddoc = new DIDDocumentImpl();

        var _onSuccess = function(ret) {
            diddoc.objId = ret.id;
            if (onSuccess) onSuccess(diddoc);
        }

        exec(_onSuccess, onError, 'DIDPlugin', 'resolveDid', [this.objId, didString]);
    }

    storeDid(didDocumentId: string, hint: string, onSuccess: (data: any) => void, onError?: (err: any) => void) {
        exec(onSuccess, onError, 'DIDPlugin', 'storeDid', [this.objId, didDocumentId, hint]);
    }

    updateDid(didDocumentId: string, didUrlString: string, storepass: string, onSuccess?: (data: any) => void, onError?: (err: any) => void) {
        exec(onSuccess, onError, 'DIDPlugin', 'updateDid', [this.objId, didDocumentId, didUrlString, storepass]);
    }

    createCredential(didString: string, credentialId: string, type: any, expirationDate: any, properties: any, passphrase: string, onSuccess: (data: any) => void, onError?: (err: any) => void) {
        var credential = new VerifiableCredentialImpl();

        var _onSuccess = function(ret) {
            credential.objId = ret.id;
            if (onSuccess) onSuccess(credential);
        }

        exec(_onSuccess, onError, 'DIDPlugin', 'CreateCredential',
                   [didString, credentialId, type, expirationDate, properties, passphrase]);
    }

    deleteCredential(didString: string, didUrlString: string, onSuccess?: (data: any) => void, onError?: (err: any) => void) {
        exec(onSuccess, onError, 'DIDPlugin', 'deleteCredential', [this.objId, didString, didUrlString]);
    }

    listCredentials(didString: string, onSuccess: (data: any) => void, onError?: (err: any) => void) {
        exec(onSuccess, onError, 'DIDPlugin', 'listCredentials', [this.objId, didString]);
    }

    loadCredential(didString: string, didUrlString: string, onSuccess: (data: any) => void, onError?: (err: any) => void) {
        var credential = new VerifiableCredentialImpl();

        var _onSuccess = function(ret) {
            credential.objId = ret.id;
            credential.info = ret;
            if (onSuccess) onSuccess(credential);
        }

        exec(_onSuccess, onError, 'DIDPlugin', 'loadCredential', [this.objId, didString, didUrlString]);
    }

    storeCredential(credentialId: string, onSuccess?: (data: any) => void, onError?: (err: any) => void) {
        exec(onSuccess, onError, 'DIDPlugin', 'storeCredential', [this.objId, credentialId]);
    }
}

class DIDManagerImpl implements DIDPlugin.DIDManager {
    constructor() {
        Object.freeze(DIDManagerImpl.prototype);
        Object.freeze(DIDStoreImpl.prototype);
        Object.freeze(DIDDocumentImpl.prototype);
        Object.freeze(DIDImpl.prototype);
        Object.freeze(PublicKeyImpl.prototype);
        Object.freeze(VerifiableCredentialImpl.prototype);

        exec(function () {}, null, 'DIDPlugin', 'initVal', []);
    }

    getVersion(onSuccess: (version: string)=>void, onError?: (err: any)=>void) {
        exec(onSuccess, onError, 'DIDPlugin', 'getVersion', []);
    }

    initDidStore(location: string, onSuccess?: (didStore: DIDPlugin.DIDStore)=>void, onError?: (err: any)=>void) {
        var didStore = new DIDStoreImpl();

        var _onSuccess = function(ret: any) {
            didStore.objId = ret.id;
            if (onSuccess) 
                onSuccess(didStore);
        }
        exec(_onSuccess, onError, 'DIDPlugin', 'initDidStore', [location]);
    }

    createDIDDocumentFromJson(json: any, onSuccess?: (didDocument: DIDPlugin.DIDDocument)=>void, onError?: (err: any)=>void){
        var didDocument = new DIDDocumentImpl();

        var _onSuccess = function(ret) {
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

export = new DIDManagerImpl();
