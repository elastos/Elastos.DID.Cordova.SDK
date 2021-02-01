var DIDPluginProxy = {
    getVersion: async function(success, error, opts) {
        await window.didManagerImpl.getVersion(success, error, opts);
    },

    setListener: function(success, error, opts) {
		window.didManagerImpl.setListener((args) => {
            success(args, {keepCallback: true});
        }, error, opts);
    },
	
	initDidStore: async function(success, error, opts) {
        await window.didManagerImpl.initDidStore(success, error, opts);
    },

    deleteDidStore: async function(success, error, opts) {
        await window.didManagerImpl.deleteDidStore(success, error, opts);
    },

    CreateDIDDocumentFromJson: async function(success, error, opts) {
        await window.didManagerImpl.CreateDIDDocumentFromJson(success, error, opts);
    },

    generateMnemonic: async function(success, error, opts) {
        await window.didManagerImpl.generateMnemonic(success, error, opts);
    },

    isMnemonicValid: async function(success, error, opts) {
        await window.didManagerImpl.isMnemonicValid(success, error, opts);
    },

    DIDManager_resolveDIDDocument: async function(success, error, opts) {
        await window.didManagerImpl.DIDManager_resolveDIDDocument(success, error, opts);
    },

    DIDStore_changePassword: async function(success, error, opts) {
        await window.didManagerImpl.DIDStore_changePassword(success, error, opts);
    },

    exportMnemonic: async function(success, error, opts) {
        await window.didManagerImpl.exportMnemonic(success, error, opts);
    },

    setResolverUrl: async function(success, error, opts) {
        await window.didManagerImpl.setResolverUrl(success, error, opts);
    },

    synchronize: async function(success, error, opts) {
        await window.didManagerImpl.synchronize(success, error, opts);
    },

    deleteDid: async function(success, error, opts) {
        await window.didManagerImpl.deleteDid(success, error, opts);
    },

    newDid: async function(success, error, opts) {
        await window.didManagerImpl.newDid(success, error, opts);
    },

    listDids: async function(success, error, opts) {
        await window.didManagerImpl.listDids(success, error, opts);
    },

    loadDid: async function(success, error, opts) {
        await window.didManagerImpl.loadDid(success, error, opts);
    },

    publishDid: async function(success, error, opts) {
        await window.didManagerImpl.publishDid(success, error, opts);
    },

    resolveDid: async function(success, error, opts) {
        await window.didManagerImpl.resolveDid(success, error, opts);
    },

    storeDid: async function(success, error, opts) {
        await window.didManagerImpl.storeDid(success, error, opts);
    },

    CreateCredential: async function(success, error, opts) {
        await window.didManagerImpl.CreateCredential(success, error, opts);
    },

    deleteCredential: async function(success, error, opts) {
        await window.didManagerImpl.deleteCredential(success, error, opts);
    },

    DID_loadCredentials: async function(success, error, opts) {
        await window.didManagerImpl.DID_loadCredentials(success, error, opts);
    },

    loadCredential: async function(success, error, opts) {
        await window.didManagerImpl.loadCredential(success, error, opts);
    },

    storeCredential: async function(success, error, opts) {
        await window.didManagerImpl.storeCredential(success, error, opts);
    },

    getDefaultPublicKey: async function(success, error, opts) {
        await window.didManagerImpl.getDefaultPublicKey(success, error, opts);
    },

    DIDDocument_addService: async function(success, error, opts) {
        await window.didManagerImpl.DIDDocument_addService(success, error, opts);
    },

    DIDDocument_removeService: async function(success, error, opts) {
        await window.didManagerImpl.DIDDocument_removeService(success, error, opts);
    },

    DIDDocument_toJson: async function(success, error, opts) {
        await window.didManagerImpl.DIDDocument_toJson(success, error, opts);
    },

    addCredential: async function(success, error, opts) {
        await window.didManagerImpl.addCredential(success, error, opts);
    },

    DIDDocument_deleteCredential: async function(success, error, opts) {
        await window.didManagerImpl.DIDDocument_deleteCredential(success, error, opts);
    },

    DIDDocument_getCredentials: async function(success, error, opts) {
        await window.didManagerImpl.DIDDocument_getCredentials(success, error, opts);
    },

    sign: async function(success, error, opts) {
        await window.didManagerImpl.sign(success, error, opts);
    },

    verify: async function(success, error, opts) {
        await window.didManagerImpl.verify(success, error, opts);
    },

    signDigest: async function(success, error, opts) {
        await window.didManagerImpl.signDigest(success, error, opts);
    },

    createJWT: async function(success, error, opts) {
        await window.didManagerImpl.createJWT(success, error, opts);
    },

    getMethod: async function(success, error, opts) {
        await window.didManagerImpl.getMethod(success, error, opts);
    },

    getMethodSpecificId: async function(success, error, opts) {
        await window.didManagerImpl.getMethodSpecificId(success, error, opts);
    },

    prepareIssuer: async function(success, error, opts) {
        await window.didManagerImpl.prepareIssuer(success, error, opts);
    },

    getController: async function(success, error, opts) {
        await window.didManagerImpl.getController(success, error, opts);
    },

    getPublicKeyBase58: async function(success, error, opts) {
        await window.didManagerImpl.getPublicKeyBase58(success, error, opts);
    },

    createVerifiablePresentationFromCredentials: async function(success, error, opts) {
        await window.didManagerImpl.createVerifiablePresentationFromCredentials(success, error, opts);
    },

    verifiablePresentationIsValid: async function(success, error, opts) {
        await window.didManagerImpl.verifiablePresentationIsValid(success, error, opts);
    },

    verifiablePresentationIsGenuine: async function(success, error, opts) {
        await window.didManagerImpl.verifiablePresentationIsGenuine(success, error, opts);
    },

    verifiablePresentationToJson: async function(success, error, opts) {
        await window.didManagerImpl.verifiablePresentationToJson(success, error, opts);
    },

    DIDManager_parseJWT: async function(success, error, opts) {
        await window.didManagerImpl.DIDManager_parseJWT(success, error, opts);
    }
};

module.exports = DIDPluginProxy;

require("cordova/exec/proxy").add("DIDPlugin", DIDPluginProxy);

