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

 declare module DIDPlugin {
    const enum DIDStoreFilter {
        DID_HAS_PRIVATEKEY = 0,
        DID_NO_PRIVATEKEY = 1,
        DID_ALL = 2
    }

    const enum Mnemonic {
        ENGLISH = 0,
        FRENCH = 1,
        SPANISH = 2,
        CHINESE_SIMPLIFIED = 3,
        CHINESE_TRADITIONAL = 4,
        JAPANESE = 5
    }

    interface VerifiableCredential {
        // TODO: define onSuccess and onError? callbacks parameters with more accurate types
        getFragment: (onSuccess: (data: any)=>void, onError?: (err: any)=>void)=>void;
        getType: (onSuccess: (data: any)=>void, onError?: (err: any)=>void)=>void;
        getIssuer: (onSuccess: (data: any)=>void, onError?: (err: any)=>void)=>void;
        getIssuanceDate: (onSuccess: (data: any)=>void, onError?: (err: any)=>void)=>void;
        getExpirationDate: (onSuccess: (data: any)=>void, onError?: (err: any)=>void)=>void;
        getProperties: (onSuccess: (data: any)=>void, onError?: (err: any)=>void)=>void;
        toString: (onSuccess: (data: any)=>void, onError?: (err: any)=>void)=>void;
    }

    interface PublicKey {
        // TODO: define onSuccess and onError? callbacks parameters with more accurate types
        getController: (onSuccess: (data: any)=>void, onError?: (err: any)=>void)=>void;
        getPublicKeyBase58: (method: any, onSuccess: (data: any)=>void, onError?: (err: any)=>void)=>void; // TODO: define "method" type
    }

    interface DID {
        // TODO: define onSuccess and onError? callbacks parameters with more accurate types
        getId: ()=>string;
        getMethod: (onSuccess: (data: any)=>void, onError?: (err: any)=>void)=>void;
        getMethodSpecificId: (onSuccess: (data: any)=>void, onError?: (err: any)=>void)=>void;
        resolve: (onSuccess: (data: any)=>void, onError?: (err: any)=>void)=>void;
        toString: (onSuccess: (data: any)=>void, onError?: (err: any)=>void)=>void;
    }

    interface DIDDocument {
        // TODO: define onSuccess and onError? callbacks parameters with more accurate types
        getId: ()=>string;
        setSubject: (subject: any, onSuccess?: (data: any)=>void, onError?: (err: any)=>void)=>void; // TODO: "subject" type
        getSubject: (onSuccess: (data: any)=>void, onError?: (err: any)=>void)=>void;
        getPublicKeyCount: (onSuccess: (data: any)=>void, onError?: (err: any)=>void)=>void;
        getDefaultPublicKey: (onSuccess: (data: any)=>void, onError?: (err: any)=>void)=>void;
        getPublicKey: (didString: string, onSuccess: (data: any)=>void, onError?: (err: any)=>void)=>void;
        getPublicKeys: (onSuccess: (data: any)=>void, onError?: (err: any)=>void)=>void;
        addCredential: (credentialId: any, onSuccess?: (data: any)=>void, onError?: (err: any)=>void)=>void; // TODO "credentialId" type
        getCredential: (credentialId: any, onSuccess?: (data: any)=>void, onError?: (err: any)=>void)=>void; // TODO "credentialId" type
        sign: (storePass: string, originString: string, onSuccess: (data: any)=>void, onError?: (err: any)=>void)=>void;  // TODO: What is "originString" ?
        verify: (signString: string, originString: string, onSuccess: (data: any)=>void, onError?: (err: any)=>void)=>void;
    }

    interface DIDStore {
        // TODO: define onSuccess and onError? callbacks parameters with more accurate types
        getId: ()=>string;
        initPrivateIdentity: (language: any, mnemonic: string, passphrase: string, storepass: string, force: Boolean, onSuccess: (data: any)=>void, onError?: (err: any)=>void)=>void;
        hasPrivateIdentity: (onSuccess: (data: any)=>void, onError?: (err: any)=>void)=>void;
        deleteDid: (didString: string, onSuccess: (data: any)=>void, onError?: (err: any)=>void)=>void;
        newDid: (passphrase: string, hint: string, onSuccess: (data: any)=>void, onError?: (err: any)=>void)=>void;
        listDids: (filter: any, onSuccess: (data: any)=>void, onError?: (err: any)=>void)=>void; // TODO: "filter" type
        loadDid: (didString: string, onSuccess: (data: any)=>void, onError?: (err: any)=>void)=>void;
        publishDid: (didDocumentId: string, didUrlString: string, storepass: string, onSuccess?: (data: any)=>void, onError?: (err: any)=>void)=>void;
        resolveDid: (didString: string, onSuccess: (data: any)=>void, onError?: (err: any)=>void)=>void;
        storeDid: (didDocumentId: string, hint:string, onSuccess: (data: any)=>void, onError?: (err: any)=>void)=>void;
        updateDid: (didDocumentId: string, didUrlString: string, storepass: string, onSuccess?: (data: any)=>void, onError?: (err: any)=>void)=>void;
        createCredential: (didString: string, credentialId: string, type: any, expirationDate: any, properties: any, passphrase: string, onSuccess: (data: any)=>void, onError?: (err: any)=>void)=>void; // TODO: types for all "any"
        deleteCredential: (didString: string, didUrlString: string, onSuccess?: (data: any)=>void, onError?: (err: any)=>void)=>void;
        listCredentials: (didString: string, onSuccess: (data: any)=>void, onError?: (err: any)=>void)=>void;
        loadCredential: (didString: string, didUrlString: string, onSuccess: (data: any)=>void, onError?: (err: any)=>void)=>void;
        storeCredential: (credentialId: string, onSuccess?: (data: any)=>void, onError?: (err: any)=>void)=>void;
    }

    interface DIDManager {
        // TODO: define onSuccess and onError? callbacks parameters with more accurate types
        getVersion: (onSuccess: (version: string)=>void, onError?: (err: any)=>void)=>void;
        initDidStore: (location: string, onSuccess?: (didStore: DIDStore)=>void, onError?: (err: any)=>void)=>void;
        createDIDDocumentFromJson: (json: any, onSuccess: (didDocument: DIDDocument)=>void, onError?: (err: any)=>void)=>void; // TODO: "json" type
        generateMnemonic: (language: any, onSuccess: (mnemonic: string)=>void, onError?: (err: any)=>void)=>void; // TODO: "language" type
        isMnemonicValid: (language: any, mnemonic: string, onSuccess: (isValid: boolean)=>void, onError?: (err: any)=>void)=>void; // TODO: "language" type
    }
}