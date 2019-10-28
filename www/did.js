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

var exec = require('cordova/exec');

function VerifiableCredential() {
    this.objId  = null;
    this.clazz  = 5;
}

VerifiableCredential.prototype = {
    constructor: VerifiableCredential,

    getFragment: function(onSuccess, onError) {
        exec(onSuccess, onError, 'DIDPlugin', 'getFragment', [this.objId]);
    },

    getType: function(onSuccess, onError) {
        exec(onSuccess, onError, 'DIDPlugin', 'getType', [this.objId]);
    },

    getIssuer: function(onSuccess, onError) {
        exec(onSuccess, onError, 'DIDPlugin', 'getIssuer', [this.objId]);
    },

    getIssuanceDate: function(onSuccess, onError) {
        exec(onSuccess, onError, 'DIDPlugin', 'getIssuanceDate', [this.objId]);
    },

    getExpirationDate: function(onSuccess, onError) {
        exec(onSuccess, onError, 'DIDPlugin', 'getExpirationDate', [this.objId]);
    },

    getProperties: function(onSuccess, onError) {
        exec(onSuccess, onError, 'DIDPlugin', 'getProperties', [this.objId]);
    }
}

function PublicKey() {
    this.objId  = null;
    this.clazz  = 4;
}

PublicKey.prototype = {
    constructor: PublicKey,

    getController: function(onSuccess, onError) {
        var did = new DID();
        var plugin = this.plugin;

        var _onSuccess = function(ret) {
            did.objId = ret.id;
            did.plugin = plugin;
            if (onSuccess) onSuccess(did);
        }

        exec(_onSuccess, onError, 'DIDPlugin', 'getController', [this.objId]);
    },

    getPublicKeyBase58: function(onSuccess, onError, method) {
        exec(onSuccess, onError, 'DIDPlugin', 'getPublicKeyBase58', [this.objId, method]);
    }
}

function DID() {
    this.objId  = null;
    this.clazz  = 3;
}

DID.prototype = {
    constructor: DID,

    getMethod: function(onSuccess, onError) {
        exec(onSuccess, onError, 'DIDPlugin', 'getMethod', [this.objId]);
    },

    getMethodSpecificId: function(onSuccess, onError) {
        exec(onSuccess, onError, 'DIDPlugin', 'getMethodSpecificId', [this.objId]);
    },

    resolve: function(onSuccess, onError) {
        exec(onSuccess, onError, 'DIDPlugin', 'resolve', [this.objId]);
    },

    toString: function(onSuccess, onError) {
        exec(onSuccess, onError, 'DIDPlugin', 'didToString', [this.objId]);
    }
}

function DIDDocument() {
    this.objId  = null;
    this.clazz  = 2;
}

DIDDocument.prototype = {
    constructor: DIDDocument,

    setSubject: function(onSuccess, onError, subject) {
        exec(onSuccess, onError, 'DIDPlugin', 'setSubject', [this.objId, subject]);
    },

    getSubject: function(onSuccess, onError) {
        var did = new DID();
        var plugin = this.plugin;

        var _onSuccess = function(ret) {
            did.objId = ret.id;
            did.plugin = plugin;
            if (onSuccess) onSuccess(did);
        }

        exec(_onSuccess, onError, 'DIDPlugin', 'getSubject', [this.objId]);
    },

    getPublicKeyCount: function(onSuccess, onError) {
        exec(onSuccess, onError, 'DIDPlugin', 'getPublicKeyCount', [this.objId]);
    },

    getDefaultPublicKey: function(onSuccess, onError) {
        exec(onSuccess, onError, 'DIDPlugin', 'getDefaultPublicKey', [this.objId]);
    },

    getPublicKey: function(onSuccess, onError, didString) {
        var publicKey = new PublicKey();
        var plugin = this.plugin;

        var _onSuccess = function(ret) {
            publicKey.objId = ret.id;
            publicKey.plugin = plugin;
            if (onSuccess) onSuccess(publicKey);
        }

        exec(_onSuccess, onError, 'DIDPlugin', 'getPublicKey', [this.objId, didString]);
    },

    getPublicKeys: function(onSuccess, onError) {
        exec(onSuccess, onError, 'DIDPlugin', 'getPublicKeys', [this.objId]);
    },

    addCredential: function(onSuccess, onError, credentialId) {
        exec(onSuccess, onError, 'DIDPlugin', 'addCredential', [this.objId, credentialId]);
    },

    getCredential: function(onSuccess, onError, credentialId) {
        exec(onSuccess, onError, 'DIDPlugin', 'getCredential', [this.objId, credentialId]);
    },

    sign: function(onSuccess, onError, storepass, originString) {
        exec(onSuccess, onError, 'DIDPlugin', 'sign', [this.objId, storepass, originString]);
    },

    verify: function(onSuccess, onError, signString, originString) {
        exec(onSuccess, onError, 'DIDPlugin', 'verify', [this.objId, signString, originString]);
    },
}

function DIDStore() {
    this.objId  = null;
    this.clazz  = 1;
}

DIDStore.prototype = {
    constructor: DIDStore,

    initPrivateIdentity: function(onSuccess, onError, mnemonic, passphrase, storepass, force) {
        exec(onSuccess, onError, 'DIDPlugin', 'initPrivateIdentity', [this.objId, mnemonic, passphrase, storepass, force]);
    },

    hasPrivateIdentity: function(onSuccess, onError) {
        exec(onSuccess, onError, 'DIDPlugin', 'hasPrivateIdentity', [this.objId, ]);
    },

    deleteDid: function(onSuccess, onError, didString) {
        exec(onSuccess, onError, 'DIDPlugin', 'deleteDid', [this.objId, didString]);
    },

    newDid: function(onSuccess, onError, passphrase, hint) {
         var diddoc = new DIDDocument();

         var _onSuccess = function(ret) {
             diddoc.objId = ret.id;
             if (onSuccess) onSuccess(diddoc);
         }

         exec(_onSuccess, onError, 'DIDPlugin', 'newDid', [this.objId, passphrase, hint]);
    },

    listDids: function(onSuccess, onError, filter) {
        exec(onSuccess, onError, 'DIDPlugin', 'listDids', [this.objId, filter]);
    },

    loadDid: function(onSuccess, onError, didString) {
         var diddoc = new DIDDocument();

         var _onSuccess = function(ret) {
             diddoc.objId = ret.id;
             if (onSuccess) onSuccess(diddoc);
         }

         exec(_onSuccess, onError, 'DIDPlugin', 'loadDid', [this.objId, didString]);
    },

    publishDid: function(onSuccess, onError, didDocumentId, didUrlString, storepass) {
        exec(onSuccess, onError, 'DIDPlugin', 'publishDid', [this.objId, didDocumentId, didUrlString, storepass]);
    },

    resolveDid: function(onSuccess, onError, didString) {
        var diddoc = new DIDDocument();

        var _onSuccess = function(ret) {
            diddoc.objId = ret.id;
            if (onSuccess) onSuccess(diddoc);
        }

        exec(_onSuccess, onError, 'DIDPlugin', 'resolveDid', [this.objId, didString]);
    },

    storeDid: function(onSuccess, onError, didDocumentId, hint) {
        exec(onSuccess, onError, 'DIDPlugin', 'storeDid', [this.objId, didDocumentId, hint]);
    },

    updateDid: function(onSuccess, onError, didDocumentId, didUrlString, storepass) {
        exec(onSuccess, onError, 'DIDPlugin', 'updateDid', [this.objId, didDocumentId, didUrlString, storepass]);
    },

    CreateCredential: function(onSuccess, onError, didString, credentialId, type, expirationDate, properties, passphrase) {
        var credential = new VerifiableCredential();

        var _onSuccess = function(ret) {
            credential.objId = ret.id;
            if (onSuccess) onSuccess(credential);
        }

        exec(_onSuccess, onError, 'DIDPlugin', 'CreateCredential',
                   [this.objId, didString, credentialId, type, expirationDate, properties, passphrase]);
    },

    deleteCredential: function(onSuccess, onError, didString, didUrlString) {
        exec(onSuccess, onError, 'DIDPlugin', 'deleteCredential', [this.objId, didString, didUrlString]);
    },

    listCredentials: function(onSuccess, onError, didString) {
        exec(onSuccess, onError, 'DIDPlugin', 'listCredentials', [this.objId, didString]);
    },

    loadCredential: function(onSuccess, onError, didString, credId) {
        var credential = new VerifiableCredential();

        var _onSuccess = function(ret) {
            credential.objId = ret.id;
            if (onSuccess) onSuccess(credential);
        }

        exec(_onSuccess, onError, 'DIDPlugin', 'loadCredential', [this.objId, didString, credId]);
    },

    storeCredential: function(onSuccess, onError, credentialId) {
        exec(onSuccess, onError, 'DIDPlugin', 'storeCredential', [this.objId, credentialId]);
    }
}

function DIDPlugin() {
    this.DIDStoreFilter = {
        DID_HAS_PRIVATEKEY: 0,
        DID_NO_PRIVATEKEY: 1,
        DID_ALL: 2,
    };

    this.Mnemonic = {
        ENGLISH: 0,
        FRENCH: 1,
        SPANISH: 2,
        CHINESE_SIMPLIFIED: 3,
        CHINESE_TRADITIONAL: 4,
        JAPANESE: 5,
    }

    Object.freeze(DIDPlugin.prototype);
    Object.freeze(DIDStore.prototype);
    Object.freeze(DIDDocument.prototype);
    Object.freeze(DID.prototype);
    Object.freeze(PublicKey.prototype);
    Object.freeze(VerifiableCredential.prototype);

    Object.freeze(this.DIDStoreFilter);
    Object.freeze(this.Mnemonic);

    exec(function () {}, null, 'DIDPlugin', 'initVal', []);
}

DIDPlugin.prototype = {
    constructor: DIDPlugin,

    getVersion: function(onSuccess, onError) {
        exec(onSuccess, onError, 'DIDPlugin', 'getVersion', []);
    },

    initDidStore: function(onSuccess, onError, passphrase="") {
        var didStore = new DIDStore();

        var _onSuccess = function(ret) {
            didStore.objId = ret.id;
            if (onSuccess) onSuccess(didStore);
        }
        exec(_onSuccess, onError, 'DIDPlugin', 'initDidStore', ["DIDStore", passphrase]);
    },

    createDIDDocumentFromJson: function(onSuccess, onError, json) {
        var didDocument = new DIDDocument();

        var _onSuccess = function(ret) {
            didDocument.objId = ret.id;
            if (onSuccess) onSuccess(didDocument);
        }

        exec(_onSuccess, onError, 'DIDPlugin', 'CreateDIDDocumentFromJson', [json]);
    },

    generateMnemonic: function(onSuccess, onError, language) {
        exec(onSuccess, onError, 'DIDPlugin', 'generateMnemonic', [language]);
    },

    isMnemonicValid: function(onSuccess, onError, language, mnemonic) {
        exec(onSuccess, onError, 'DIDPlugin', 'isMnemonicValid', [language, mnemonic]);
    },

}

module.exports = new DIDPlugin();
