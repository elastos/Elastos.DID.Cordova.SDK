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
* This plugin provides biometric authentication features (android fingerprint, android face recognition, ios touch id, ios face id).
* It allows dApps to simply authenticate users using their fingerprint, but it also provides a way to encrypt and
* decrypt (one or more) passwords.
*
* <br><br>
* Use 'FingerprintPlugin' in your dApp's manifest.json to use this plugin.
*
* <br><br>
* Usage:
* <br>
* declare let fingerprintManager: FingerprintPlugin.FingerprintManager;
*/
declare namespace FingerprintPlugin {
    /**
     * Error codes returns by promises rejections in case of error.
     */
    const enum PluginError {
        BIOMETRIC_UNKNOWN_ERROR= -100,
        BIOMETRIC_UNAVAILABLE= -101,
        BIOMETRIC_AUTHENTICATION_FAILED= -102,
        BIOMETRIC_SDK_NOT_SUPPORTED= -103,
        BIOMETRIC_HARDWARE_NOT_SUPPORTED= -104,
        BIOMETRIC_PERMISSION_NOT_GRANTED= -105,
        BIOMETRIC_NOT_ENROLLED= -106,
        BIOMETRIC_INTERNAL_PLUGIN_ERROR= -107,
        BIOMETRIC_DISMISSED= -108,
        BIOMETRIC_PIN_OR_PATTERN_DISMISSED= -109,
        BIOMETRIC_SCREEN_GUARD_UNSECURED= -110,
        BIOMETRIC_LOCKED_OUT= -111,
        BIOMETRIC_LOCKED_OUT_PERMANENT= -112
    }

    interface FingerprintManager {
        /**
         * Tells if a biometric authentication (one or many) is available and enabled on the device.
         *
         * @returns True if a biometric authentication method is available, false otherwise.
         */
        isBiometricAuthenticationMethodAvailable(): Promise<boolean>;

        /**
         * Simple authentication. If the user is able to authenticate using a biometric sensor,
         * the promise is resolved. Otherwise, the promise is rejected.
         */
        authenticate(): Promise<void>;

        /**
         * Authenticates user, then securely stores the given password on the device.
         *
         * @param passwordKey User-defined string used to allow multiple passwords to be stored within the same application.
         * @param password Clear text password that will be encrypted with biometric-protected encoding keys. The stored password can later be retrieve by calling authenticateAndGetPassword().
         */
        authenticateAndSavePassword(passwordKey: string, password: string): Promise<void>;

        /**
         * Authenticates user, then returns a previously saved clear text password.
         *
         * @param passwordKey User-defined string used to allow multiple passwords to be stored within the same application.
         *
         * @returns Clear text password, if any.
         */
        authenticateAndGetPassword(passwordKey: string): Promise<string>;
    }
}