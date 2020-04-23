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
* This plugin is the Elastos implementation of W3C's Decentralized Identity specification.
* Decentralized identities allow users to be owner of their identities, without relying on third party
* providers.
*
* <br><br>
* Add 'DIDPlugin' as plugin name in your manifest.json in order to request permission to use this plugin.
* <br><br>
* Declaration:
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
        ENGLISH = "english",
        FRENCH = "french",
        SPANISH = "spanish",
        CHINESE_SIMPLIFIED = "chinese_simplified",
        CHINESE_TRADITIONAL = "chinese_traditional",
        JAPANESE = "japanese"
    }

    /**
     * This is the most usual format when talking about DIDs.
     * Format: did:elastos:abcdef
     */
    type DIDString = string;

    /**
     * A DIDURL is a DIDString with an additional fragment part.
     * Ex: did:elastos:abcdef#my-special-use or #my-special-use.
     *
     * For simplicity, generally use the short form only.
     */
    type DIDURL = string;

    /**
     * A CredentialID can have the form of either a full DIDURL, or just the short form.
     * Ex: "did:elastos:abcdef#twitter" or "#twitter"
     */
    type CredentialID = DIDURL;

    /**
     * Public key string representation.
     */
    type Base58PublicKey = string;

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
        fromJson(credentialJson: string): DIDPlugin.VerifiableCredential;
    }

    interface VerifiableCredential {
        getId():string;
        getFragment():string;
        getTypes():string[];
        getIssuer():string;
        getIssuanceDate():Date;
        getExpirationDate():Date;
        getSubject():any;
        getProof():any;
        toString():Promise<string>;
    }

    interface PublicKey {
        getController(): DIDString;
        getPublicKeyBase58(): Base58PublicKey;
    }

    interface Service {
        getId(): DIDURL;
        getType(): string;
        getEndpoint(): string;
    }

    interface ServiceBuilder {
        /**
         * Creates a new Service object with the given properties.
         * All fields are mandatory.
         *
         * @param id Unique identifier for this service. Usually use a short form DIDURL such as "#myservicename"
         * @param type Application specific string that identities your type of service.
         * @param endpoint HTTP address or any other network protocol based endpoint that can be used to communicate with the service.
         */
        createService(id: DIDURL, type: string, endpoint: string): Service;
    }

    interface DID {
        getDIDString():string;
        getMethod(onSuccess: (data: any)=>void, onError?: (err: any)=>void);
        getMethodSpecificId(onSuccess: (data: any)=>void, onError?: (err: any)=>void);
        resolveDidDocument(onSuccess: (didDocument: DIDDocument)=>void, onError?: (err: any)=>void);

        /**
          * Call prepareIssue before issueCredential. It will resolve did.
        */
        prepareIssuer(onSuccess?: ()=>void);

        /**
         * Issuing a credential is done from a issuer, to a subject (ex: a university issues a credential to
         * a student). After this credential is issued locally on the issuer's device, it can be shared to the
         * subject, and the subject can add it to his DIDStore.
         *
         * @param subjectDID DIDString of the target subject that will own this credential.
         * @param credentialId Unique identifier for the generated credential. Usually a random string used as a DIDURLFragment.
         * @param types List of credential type names that help categorizing this credential.
         * @param validityDays Number of Days at which the credential will become invalid, the max validity days is 5 years.
         * @param properties Any multi-level object that contains the actual information about this credential.
         * @param passphrase Password of the issuer's DIDStore, used to sign the created credential with the issuer's DID.
         * @param onSuccess Callback returning the created VerifiableCredential object in case of success.
         * @param onError Callback returning an error object in case of error.
         */
        issueCredential(subjectDID: DIDString, credentialId: CredentialID, types: string[], validityDays: Number, properties: any, passphrase: string, onSuccess: (credential: VerifiableCredential)=>void, onError?: (err: any)=>void); // TODO: types for all "any"

        addCredential(credential: VerifiableCredential, onSuccess?: ()=>void, onError?: (err: any)=>void);
        deleteCredential(credentialId: CredentialID, onSuccess?: ()=>void, onError?: (err: any)=>void);
        loadCredentials(onSuccess: (credentials: VerifiableCredential[])=>void, onError?: (err: any)=>void);
        getCredential(credentialId: CredentialID): VerifiableCredential;

        /**
         * Convenience method to filter some kind of credentials from the full ist of credentials.
         * Helps retrieving credentials by type, properties.
         *
         * @param includedTypes List of credential type names that must be included in one credential (AND). Ex: ["BasicProfileCredential"]
         * @param includedPropertyName Field name that must be included in the credential. Ex: "name"
         */
        findCredentials(includedTypes?: string[], includedPropertyName?: string): DIDPlugin.VerifiableCredential[];

        /**
         * Creates a new VerifiablePresentation that embeds one or several credentials. This presentation is signed by a DID
         * and thus the store password has to be provided.
         *
         * @param credentials   List of credentials to embed in the presentation.
         * @param realm         Requester specific purpose to request this presentation. Usually the requester domain name.
         * @param nonce         Random requested generated challenge code to prevent replay attacks.
         * @param storepass     Store password, used to sign the presentation.
         */
        createVerifiablePresentation(credentials: VerifiableCredential[], realm: string, nonce: string, storepass: string, onSuccess: (presentation: VerifiablePresentation)=>void, onError?: (err: any)=>void);
    }

    interface DIDDocument {
        getCreated(): Date;
        getUpdated(): Date;
        getExpires(): Date;
        setSubject(subject: DID);
        getSubject(): DID;

        getPublicKeyCount(): Number;
        getDefaultPublicKey(onSuccess: (publicKey: PublicKey) => void, onError?: (err: any) => void);
        getPublicKey(didUrl: DIDURL): PublicKey;
        getPublicKeys(): PublicKey[];

        /**
         * Returns the number of currently registered services in this DID document.
         *
         * @returns The number of services.
         */
        getServicesCount(): Number;

        /**
         * Returns a service, if existing, from its DID string.
         *
         * @param didString The Service's did string identifier.
         *
         * @returns The searched service if any, null otherwise.
         */
        getService(didUrl: DIDURL): Service;

        /**
         * Returns all services currently registered in this DID document.
         *
         * @returns All services.
         */
        getServices(): Service[];

        /**
         * Adds a new service to this DID document.
         *
         * @param service The service to be added. Usually, create one with ServiceBuilder.createService().
         */
        addService(service: Service, storePass: string, onSuccess?: () => void, onError?: (err: any) => void);

        /**
         * Removes a given service from the DID document.
         *
         * @param didURL DID url identifier of the service to be removed.
         */
        removeService(didURL: DIDURL, storePass: string, onSuccess?: () => void, onError?: (err: any) => void);

        addCredential(credential: VerifiableCredential, storePass: string, onSuccess?: ()=>void, onError?: (err: any)=>void);
        deleteCredential(credential: VerifiableCredential, storePass: string, onSuccess?: ()=>void, onError?: (err: any)=>void);
        getCredentials(): DIDPlugin.VerifiableCredential[];
        getCredential(credentialId: CredentialID): VerifiableCredential;

        /**
         * Convenience method to filter some kind of credentials from the full ist of credentials.
         * Helps retrieving credentials by type, properties.
         *
         * @param includedTypes List of credential type names that must be included in one credential (AND). Ex: ["BasicProfileCredential"]
         * @param includedPropertyName Field name that must be included in the credential. Ex: "name"
         */
        findCredentials(includedTypes?: string[], includedPropertyName?: string): DIDPlugin.VerifiableCredential[];

        sign(storePass: string, originString: string, onSuccess: (data: any)=>void, onError?: (err: any)=>void);  // TODO: What is "originString" ?
        verify(signString: string, originString: string, onSuccess: (data: any)=>void, onError?: (err: any)=>void);
        publish(storepass: string, onSuccess?: ()=>void, onError?: (err: any)=>void);

        /**
         * create JWT, signed by DID document.
         *
         * @param validityDays Number of Days at which the JWT will become invalid.
         * @param properties Any multi-level object that contains the actual information.
         */
        createJWT(properties: any, validityDays: Number, storepass: string, onSuccess: (token: string)=>void, onError?: (err: any)=>void);
    }

    interface VerifiablePresentationBuilder {
        fromJson(json: string, onSuccess: (presentation: VerifiablePresentation)=>void, onError?: (err: any)=>void);
    }

    /**
     * Object that contains one or more credentials picked from a DID store and signed by a DID.
     * Such presentation is usually used to let end users pick some credentials to share and deliver
     * them to a requester. The requester can then make sure that the delivered content has not been altered.
     */
    interface VerifiablePresentation {
        getCredentials(): VerifiableCredential[];
        isValid(onSuccess: (isValid: boolean)=>void, onError?: (err: any)=>void);
        isGenuine(onSuccess: (isValid: boolean)=>void, onError?: (err: any)=>void);
    }

    interface DIDStore {
        getId():string;
        initPrivateIdentity(language: MnemonicLanguage, mnemonic: string, passphrase: string, storepass: string, force: Boolean, onSuccess: ()=>void, onError?: (err: any)=>void);
        /**
         * Change the didstore password
         *
         * @param oldPassword  The old password.
         * @param newPassword  The new password.
         */
        changePassword(oldPassword: string, newPassword: string, onSuccess: ()=>void, onError?: (err: any)=>void);
        containsPrivateIdentity(onSuccess: (hasPrivateIdentity: boolean)=>void, onError?: (err: any)=>void);
        deleteDid(didString: string, onSuccess: ()=>void, onError?: (err: any)=>void);
        newDid(passphrase: string, alias: string, onSuccess: (did: DID)=>void, onError?: (err: any)=>void);
        listDids(filter: DIDStoreFilter, onSuccess: (dids: DID[])=>void, onError?: (err: any)=>void); // TODO: "filter" type
        loadDidDocument(didString: string, onSuccess: (didDocument: DIDDocument)=>void, onError?: (err: any)=>void);
        storeDidDocument(didDocument: DIDDocument, alias:string, onSuccess: ()=>void, onError?: (err: any)=>void);
        // updateDidDocument(didDocument: DIDDocument, storepass: string, onSuccess?: ()=>void, onError?: (err: any)=>void);
        setResolverUrl(resolver: string, onSuccess: ()=>void, onError?: (err: any)=>void);

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
        synchronize(storepass: string, onSuccess: ()=>void, onError?: (err: any)=>void);
        exportMnemonic(storePass: string, onSuccess: (mnemonic: string)=>void, onError?: (err: any)=>void);
        setTransactionResult(txID: string, onSuccess?: ()=>void, onError?: (err: any)=>void);
    }

    interface DIDManager {
        getVersion(onSuccess: (version: string)=>void, onError?: (err: any)=>void);
        initDidStore(didStoreId: string, createIdTransactionCallback: OnCreateIdTransaction, onSuccess?: (didStore: DIDStore)=>void, onError?: (err: any)=>void);
        deleteDidStore(didStoreId: string, onSuccess?: ()=>void, onError?: (err: any)=>void);
        createDIDDocumentFromJson(json: any, onSuccess: (didDocument: DIDDocument)=>void, onError?: (err: any)=>void); // TODO: "json" type
        generateMnemonic(language: MnemonicLanguage, onSuccess: (mnemonic: string)=>void, onError?: (err: any)=>void);
        isMnemonicValid(language: MnemonicLanguage, mnemonic: string, onSuccess: (isValid: boolean)=>void, onError?: (err: any)=>void);

        /**
         * Resolve any kind of DID document that does not belong to a local DIDStore. This is useful to
         * resolve DID Document of public/friends/external DID entities that we don't own in a local DIDStore.
         *
         * Those resolved documents are cached inside the shared DIDBackend.
         *
         * @param forceRemote True will not use previously resolved document stored locally in cache. False will try to load locally then load from chain if nothing found (or expired).
         */
        resolveDidDocument(didString: string, forceRemote: boolean, onSuccess: (didDocument: DIDDocument)=>void, onError?: (err: any)=>void);

        VerifiableCredentialBuilder: VerifiableCredentialBuilder;
        VerifiablePresentationBuilder: VerifiablePresentationBuilder;
        ServiceBuilder: ServiceBuilder;
    }
}
