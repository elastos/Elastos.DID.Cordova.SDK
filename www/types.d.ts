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

 /**
* This is about DID which is a new type of identifier to provide verifiable,
* decentralized digital identity.
* <br><br>
* Please use 'DIDPlugin' as the plugin name in the manifest.json if you want to use
* this facility.
* <br><br>
* Usage:
* <br>
* declare let didManager: DIDPlugin.DIDManager;
*/

declare module DIDPlugin {
    const enum DIDStoreFilter {
        DID_HAS_PRIVATEKEY = 0,
        DID_NO_PRIVATEKEY = 1,
        DID_ALL = 2
    }

    const enum MnemonicLanguage {
        ENGLISH = 0,
        FRENCH = 1,
        SPANISH = 2,
        CHINESE_SIMPLIFIED = 3,
        CHINESE_TRADITIONAL = 4,
        JAPANESE = 5
    }

    /**
    * The callback function to receive the payload of createIdTransaction.
    *
    * @callback OnCreateIdTransaction
    *
    * @param payload     The payload of the IdTransaction.
    * @param memo        The memo of the IdTransaction.
    */
    type OnCreateIdTransaction = (payload: String, memo: string)=>void;

    interface VerifiableCredentialBuilder {
        fromJson: (credentialJson: string) => DIDPlugin.VerifiableCredential;
    }

    type UnloadedVerifiableCredential = {
        credentialId: CredentialID;
        alias: string;
    }

    interface VerifiableCredential {
        getId: ()=>string;
        getFragment: ()=>string;
        getType: ()=>string
        getIssuer: ()=>string;
        getIssuanceDate: ()=>Date;
        getExpirationDate: ()=>Date;
        getSubject: ()=>any;
        getProof: ()=>any;
        toString: ()=>Promise<string>;
    }

    interface PublicKey {
        // TODO: define onSuccess and onError? callbacks parameters with more accurate types
        getController: (onSuccess: (did: DIDPlugin.DID)=>void, onError?: (err: any)=>void)=>void;
        getPublicKeyBase58: (method: any, onSuccess: (data: any)=>void, onError?: (err: any)=>void)=>void; // TODO: define "method" type
    }

    /**
     * This is the most usual format when talking about DIDs.
     * Format: did:elastos:abcdef
     */
    type DIDString = string;

    /**
     * A DIDURLFragment is the part that comes after the DIDString, in a DIDURL.
     * Ex: "my-special-use" in "did:elastos:abcdef#my-special-use"
     */
    type DIDURLFragment = string;

    /**
     * A DIDURL is a DIDString with an additional fragment part.
     * Ex: did:elastos:abcdef#my-special-use
     */
    type DIDURL = string;

    /**
     * A CredentialID can have the form of either a full DIDURL, or just the short fragment part.
     * Ex: "did:elastos:abcdef#twitter" or "twitter"
     */
    type CredentialID = DIDURL | DIDURLFragment;

    interface DID {
        // TODO: define onSuccess and onError? callbacks parameters with more accurate types
        getDIDString: ()=>string;
        getMethod: (onSuccess: (data: any)=>void, onError?: (err: any)=>void)=>void;
        getMethodSpecificId: (onSuccess: (data: any)=>void, onError?: (err: any)=>void)=>void;
        resolveDidDocument: (onSuccess: (didDocument: DIDDocument)=>void, onError?: (err: any)=>void)=>void;

        /**
         * Issuing a credential is done from a issuer, to a subject (ex: a university issues a credential to
         * a student). After this credential is issued locally on the issuer's device, it can be shared to the
         * subject, and the subject can add it to his DIDStore.
         *
         * @param subjectDID DIDString of the target subject that will own this credential.
         * @param credentialId Unique identifier for the generated credential. Usually a random string used as a DIDURLFragment.
         * @param types List of credential type names that help categorizing this credential.
         * @param expirationDate Date at which the credential will become invalid.
         * @param properties Any multi-level object that contains the actual information about this credential.
         * @param passphrase Password of the issuer's DIDStore, used to sign the created credential with the issuer's DID.
         * @param onSuccess Callback returning the created VerifiableCredential object in case of success.
         * @param onError Callback returning an error object in case of error.
         */
        issueCredential: (subjectDID: DIDString, credentialId: CredentialID, types: string[], expirationDate: Date, properties: any, passphrase: string, onSuccess: (credential: VerifiableCredential)=>void, onError?: (err: any)=>void)=>void; // TODO: types for all "any"

        deleteCredential: (credentialId: CredentialID, onSuccess?: ()=>void, onError?: (err: any)=>void)=>void;
        listCredentials: (onSuccess: (credentials: UnloadedVerifiableCredential[])=>void, onError?: (err: any)=>void)=>void;
        loadCredential: (credentialId: CredentialID, onSuccess: (credential: VerifiableCredential)=>void, onError?: (err: any)=>void)=>void;
        storeCredential: (credential: VerifiableCredential, onSuccess?: ()=>void, onError?: (err: any)=>void)=>void;

        /**
         * Creates a new VerifiablePresentation that embeds one or several credentials. This presentation is signed by a DID
         * and thus the store password has to be provided.
         *
         * @param credentials   List of credentials to embed in the presentation.
         * @param realm         Requester specific purpose to request this presentation. Usually the requester domain name.
         * @param nonce         Random requested generated challenge code to prevent replay attacks.
         * @param storepass     Store password, used to sign the presentation.
         */
        createVerifiablePresentation: (credentials: VerifiableCredential[], realm: string, nonce: string, storepass: string, onSuccess: (presentation: VerifiablePresentation)=>void, onError?: (err: any)=>void)=>void;
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
        addCredential: (credential: VerifiableCredential, storePass: string, onSuccess?: (d)=>void, onError?: (err: any)=>void)=>void; // TODO "credentialId" type
        getCredential: (credentialId: CredentialID, onSuccess?: (credential: VerifiableCredential)=>void, onError?: (err: any)=>void)=>void; // TODO "credentialId" type
        sign: (storePass: string, originString: string, onSuccess: (data: any)=>void, onError?: (err: any)=>void)=>void;  // TODO: What is "originString" ?
        verify: (signString: string, originString: string, onSuccess: (data: any)=>void, onError?: (err: any)=>void)=>void;
        publish: (storepass: string, onSuccess?: ()=>void, onError?: (err: any)=>void)=>void;
    }

    interface VerifiablePresentationBuilder {
        fromJson: (json: string, onSuccess: (presentation: VerifiablePresentation)=>void, onError?: (err: any)=>void)=>void;
    }

    /**
     * Object that contains one or more credentials picked from a DID store and signed by a DID.
     * Such presentation is usually used to let end users pick some credentials to share and deliver
     * them to a requester. The requester can then make sure that the delivered content has not been altered.
     */
    interface VerifiablePresentation {
        getCredentials: ()=>VerifiableCredential[];
        isValid: (onSuccess: (isValid: boolean)=>void, onError?: (err: any)=>void)=>void;
        isGenuine: (onSuccess: (isValid: boolean)=>void, onError?: (err: any)=>void)=>void;
    }

    interface DIDStore {
        getId: ()=>string;
        initPrivateIdentity: (language: MnemonicLanguage, mnemonic: string, passphrase: string, storepass: string, force: Boolean, onSuccess: ()=>void, onError?: (err: any)=>void)=>void;
        containsPrivateIdentity: (onSuccess: (hasPrivateIdentity: boolean)=>void, onError?: (err: any)=>void)=>void;
        deleteDid: (didString: string, onSuccess: ()=>void, onError?: (err: any)=>void)=>void;
        newDid: (passphrase: string, alias: string, onSuccess: (did: DID, didDocument: DIDDocument)=>void, onError?: (err: any)=>void)=>void;
        listDids: (filter: any, onSuccess: (dids: DID[])=>void, onError?: (err: any)=>void)=>void; // TODO: "filter" type
        loadDidDocument: (didString: string, onSuccess: (didDocument: DIDDocument)=>void, onError?: (err: any)=>void)=>void;
        resolveDidDocument: (didString: string, onSuccess: (didDocument: DIDDocument)=>void, onError?: (err: any)=>void)=>void;
        storeDidDocument: (didDocument: DIDDocument, alias:string, onSuccess: ()=>void, onError?: (err: any)=>void)=>void;
        updateDidDocument: (didDocument: DIDDocument, storepass: string, onSuccess?: ()=>void, onError?: (err: any)=>void)=>void;
        setResolverUrl: (resolver: string, onSuccess: ()=>void, onError?: (err: any)=>void)=>void;

        /**
         * This methods synchronizes a whole DID store content, from the DID sidechain, to the local device.
         * - Every DID previously generated by this DID store (same mnemonic = same private identity) will be found on chain
         * and re-created locally if it doesn't exist.
         * - All DID documents and credentials on chain will also be restored locally.
         * 
         * This method can be used in 2 different use cases:
         * 1. To restore a user's identity from scratch
         * 2. In case user uses the same identity on multiple devices, to synchronize data changed on chain by one app
         * to the second app.
         * 
         * NOTE: Only data previously saved on chain can be restore. This method cannot restore private credentials
         * kept by the user on his device.
         */
        synchronize: (storepass: string, onSuccess: ()=>void, onError?: (err: any)=>void)=>void;
    }

    interface DIDManager {
        getVersion: (onSuccess: (version: string)=>void, onError?: (err: any)=>void)=>void;
        initDidStore: (didStoreId: string, createIdTransactionCallback: OnCreateIdTransaction, onSuccess?: (didStore: DIDStore)=>void, onError?: (err: any)=>void)=>void;
        deleteDidStore: (didStoreId: string, onSuccess?: ()=>void, onError?: (err: any)=>void)=>void;
        createDIDDocumentFromJson: (json: any, onSuccess: (didDocument: DIDDocument)=>void, onError?: (err: any)=>void)=>void; // TODO: "json" type
        generateMnemonic: (language: MnemonicLanguage, onSuccess: (mnemonic: string)=>void, onError?: (err: any)=>void)=>void;
        isMnemonicValid: (language: MnemonicLanguage, mnemonic: string, onSuccess: (isValid: boolean)=>void, onError?: (err: any)=>void)=>void;

        VerifiableCredentialBuilder: VerifiableCredentialBuilder;
        VerifiablePresentationBuilder: VerifiablePresentationBuilder;
    }
}
