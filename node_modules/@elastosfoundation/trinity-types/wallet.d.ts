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
* This is about Wallet which can only be used by wallet application by default.
* However, you can change this by editing the group.json correctly.
* <br><br>
* Please use 'Wallet' as the plugin name in the manifest.json if you want to use
* this facility. Additionally, you need to make sure you have permission(granted
* in the group.json) to use it.
* <br><br>
* Usage:
* <br>
* declare let walletManager: WalletPlugin.WalletManager;
*/

declare module WalletPlugin {
    interface WalletManager {
        // TODO: define types for all arguments and callback parameters
        print(args, success, error);
        recoverWallet(args, success, error);
        createWallet(args, success, error);
        start(args, success, error);
        stop(args, success, error);
        createSubWallet(args, success, error);
        recoverSubWallet(args, success, error);
        createMasterWallet(args, success, error);
        importWalletWithKeystore(args, success, error);
        importWalletWithMnemonic(args, success, error);
        exportWalletWithKeystore(args, success, error);
        exportWalletWithMnemonic(args, success, error);
        syncStart(args, success, error);
        syncStop(args, success, error);
        getBalanceInfo(args, success, error);
        getBalance(args, success, error);
        createAddress(args, success, error);
        getAllAddress(args, success, error);
        getBalanceWithAddress(args, success, error);
        // generateMultiSignTransaction(args, success, error);
        // createMultiSignAddress(args, success, error);
        getAllTransaction(args, success, error);
        sign(args, success, error);
        checkSign(args, success, error);
        deriveIdAndKeyForPurpose(args, success, error);
        getAllMasterWallets(args, success, error);
        registerWalletListener(args, success, error);
        isAddressValid(args, success, error);
        generateMnemonic(args, success, error);
        getWalletId(args, success, error);
        getAllChainIds(args, success, error);
        getSupportedChains(args, success, error);
        getAllSubWallets(args, success, error);
        changePassword(args, success, error);
        sendRawTransaction(args, success, error);
        createTransaction(args, success, error);
        destroyWallet(args, success, error);
        createIdTransaction(args, success, error);
        getResolveDIDInfo(args, success, error);
        getAllDID(args, success, error);
        didSign(args, success, error);
        didSignDigest(args, success, error);
        verifySignature(args, success, error);
        getPublicKeyDID(args, success, error);
        generateDIDInfoPayload(args, success, error);
        createDepositTransaction(args, success, error);
        createWithdrawTransaction(args, success, error);
        getGenesisAddress(args, success, error);
        didGenerateProgram(args, success, error);
        getAllCreatedSubWallets(args, success, error);
        createMultiSignMasterWalletWithPrivKey(args, success, error);
        createMultiSignMasterWallet(args, success, error);
        getMasterWalletBasicInfo(args, success, error);
        signTransaction(args, success, error);
        publishTransaction(args, success, error);
        // getMasterWalletPublicKey(args, success, error);
        // getSubWalletPublicKey(args, success, error);
        createMultiSignMasterWalletWithMnemonic(args, success, error);
        removeWalletListener(args, success, error);
        disposeNative(args, success, error);
        // getMultiSignPubKeyWithMnemonic(args, success, error);
        // getMultiSignPubKeyWithPrivKey(args, success, error);
        getTransactionSignedSigners(args, success, error);
        // importWalletWithOldKeystore(args, success, error);
        getVersion(args, success, error);
        destroySubWallet(args, success, error);
        getVotedProducerList(args, success, error);
        createVoteProducerTransaction(args, success, error);
        createCancelProducerTransaction(args, success, error);
        getRegisteredProducerInfo(args, success, error);
        createRegisterProducerTransaction(args, success, error);
        generateProducerPayload(args, success, error);
        generateCancelProducerPayload(args, success, error);
        getPublicKeyForVote(args, success, error);
        createRetrieveDepositTransaction(args, success, error);
        createUpdateProducerTransaction(args, success, error);
    }
}