/*
* Copyright (c) 2018-2020 Elastos Foundation
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
* This is about AppManager which makes it possible to send intents, messages, etc. between DApps.
* <br><br>
* There is no need to use 'AppManagerPlugin' as the plugin name in the manifest.json if you want to use
* this facility, because it's available by default.
* <br><br>
* Usage:
* <br>
* declare let appManager: AppManagerPlugin.AppManager;
*/

declare namespace AppManagerPlugin {
    /**
     * The icons info.
     */
    type Icon = {
        /** The icon src. */
        src: string;
        /** The icon sizes. */
        sizes: any; // TODO - Should be some kind of Pair<number, number> array ?
        /** The icon type. */
        type: string;
    }

    /**
     * @description
     * Message type to send or receive.
     *
     * @enum {number}
     */
    const enum MessageType {
        /** The internal message */
        INTERNAL = 1,
        /** The internal return message. */
        IN_RETURN = 2,
        /** The internal refresh message. */
        IN_REFRESH = 3,
        /** The installing message. */
        INSTALLING = 4,

        /** The external message */
        EXTERNAL = 11,
        /** The external launcher message */
        EX_LAUNCHER = 12,
        /** The external install message */
        EX_INSTALL = 13,
        /** The external return message. */
        EX_RETURN = 14,
    }

    /**
     * @description
     * Message type to send or receive.
     *
     * @enum {number}
     */
    const enum AuthorityStatus {
        /** Not initialized */
        NOINIT = 0,
        /** Ask for authority. */
        ASK = 1,
        /** Allow the authority. */
        ALLOW = 2,
        /** Deny the authority. */
        DENY = 3
    }

    /**
     * The plugin authority status.
     */
    type PluginAuthority = {
        /** The plugin name. */
        plugin: string;
        /** The authority status. */
        authority: AuthorityStatus;
    }

    /**
     * The access url authority status.
     */
    type UrlAuthority = {
        /** The url access. */
        url: string;
        /** The authority status. */
        authority: AuthorityStatus;
    }

    /**
     * The locale.
     */
    type Locale = {
        /** The language. */
        language: string;
        /** The language name. */
        name: string;
        /** The language shortName. */
        shortName: string;
        /** The language description. */
        description: string;
        /** The language authorName. */
        authorName: string;
    }

    /**
     * The framework.
     */
    type Framework = {
        /** The Framework name. */
        name: string;
        /** The Framework version. */
        version: string;
    }

    /**
     * The platform.
     */
    type Platform = {
        /** The Platform name. */
        name: string;
        /** The Platform version. */
        version: string;
    }

    /**
     * The App information.
     */
    type AppInfo = {
        /** The app id. */
        id: string;
        /** The app version. */
        version: string;
        /** The app name. */
        name: string;
        /** The app shortName. */
        shortName: string;
        /** The app description. */
        description: string;
        /** The app startUrl. */
        startUrl: string;
        /** The app icons. */
        icons: Icon[];
        /** The app authorName. */
        authorName: string;
        /** The app authorEmail. */
        authorEmail: string;
        /** The app defaultLocale. */
        defaultLocale: string;
        /** The app category. */
        category: string;
        /** The app keyWords. */
        keywords: string;
        /** The app PluginAuthority list. */
        plugins: PluginAuthority[];
        /** The app UrlAuthoritylist. */
        urls: UrlAuthority[];
        /** The app backgroundColor. */
        backgroundColor: string;
        /** The app theme display. */
        themeDisplay: string;
        /** The app theme color. */
        themeColor: string;
        /** The app theme font name. */
        themeFontName: string;
        /** The app theme font color. */
        themeFontColor: string;
        /** The app intall time. */
        installTime: Number;
        /** The app builtIn. */
        builtIn: Boolean;
        /** The app is remote？. */
        remote: Boolean;
        /** The app path. */
        appPath: string;
        /** The app data path. */
        dataPath: string;
        /** The app locales. */
        locales: Locale[];
        /** The app frameworks. */
        frameworks: Framework[];
        /** The app platforms. */
        platforms: Platform[];
    }

    /**
     * Object received when receiving a message.
     */
    type ReceivedMessage = {
        /** The message receive */
        msg: string;
        /** The message type */
        type: Number;
        /** The message from */
        from: string;
    }

    /**
     * Object received when receiving an intent.
     */
    type ReceivedIntent = {
        /** The action requested from the receiving application. */
        action: string;
        /** Custom intent parameters provided by the calling application. */
        params: any;
        /** Application package id of the calling application. */
        from: string;
        /** Unique intent ID that has to be sent back when sending the intent response. */
        intentId: Number;
    }

    /**
     * Options passed to sendIntent().
     */
    type IntentOptions = {
        /** The target app package id, in case the intent should be sent to a specific app instead of being brodcast. */
        appId?: string
    }
    
    /**
     * The class representing dapp manager for launcher.
     */
    interface AppManager {
        /**
         * Get locale.
         *
         * @param onSuccess  The function to call when success.the param include 'defaultLang', 'currentLang' and 'systemLang'.
         * defaultLang: default value is en, and you can set the defaultLang in the dapp's manifest.
         * currentLang: the language in elastos.
         * systemLang: the language in device.
         */
        getLocale(onSuccess: (defaultLang: string, currentLang: string, systemLang: string)=>void);

        /**
         * Set current locale.
         *
         * @param code       The current locale code.
         * @param onSuccess  The function to call when success.
         * @param onError    The function to call when error, the param is a String. Or set to null.
         */
        setCurrentLocale(code: string, onSuccess?: ()=>void, onError?:(err:string)=>void);

        /**
         * Install a dapp by path.
         *
         * @param url        The dapp install url.
         * @param update     The dapp install update.
         * @param onSuccess  The function to call when success.the param is a AppInfo.
         * @param onError    The function to call when error, the param is a String. Or set to null.
         */
        install(url: string, update: Boolean, onSuccess:(appInfo: AppInfo)=>void, onError?:(err: string)=>void);

        /**
         * Uninstall a dapp by id.
         *
         * @param id         The dapp id.
         * @param onSuccess  The function to call when success.the param is the id.
         * @param onError    The function to call when error, the param is a String. Or set to null.
         */
        unInstall(id: string, onSuccess:(id: string)=>void, onError?:(err: string)=>void);

        /**
         * Get dapp info.
         *
         * @param onSuccess  The function to call when success, the param is a AppInfo.
         * @param onError    The function to call when error, the param is a String. Or set to null.
         */
        getInfo(onSuccess:(appInfo: AppInfo)=>void, onError?:(err: string)=>void);

        /**
         * Get a dapp info.
         *
         * @param id         The dapp id.
         * @param onSuccess  The function to call when success, the param is a AppInfo.
         * @param onError    The function to call when error, the param is a String. Or set to null.
         */
        getAppInfo(id: string, onSuccess:(appInfo: AppInfo)=>void, onError?:(err: string)=>void);

        /**
         * Get a dapp info.
         *
         * @param onSuccess  The function to call when success, the param is include 'appsInfo' and 'idList'.
         */
        getAppInfos(onSuccess:(appsInfo: AppInfo[], idList:string[])=>void);

        /**
         * Start a dapp by id. If the dapp running, it will be swith to curent.
         *
         * @param id         The dapp id.
         * @param onSuccess  The function to call when success.
         * @param onError    The function to call when error, the param is a String. Or set to null.
         */
        start(id: string, onSuccess?:()=>void, onError?:(err: string)=>void);

        /**
         * Start the launcher.If the launcher running, it will be swith to curent.
         *
         * @param onSuccess  The function to call when success.
         * @param onError    The function to call when error, the param is a String. Or set to null.
         */
        launcher(onSuccess?:()=>void, onError?:(err: string)=>void);

        /**
         * Close dapp.
         *
         * @param onSuccess  The function to call when success.
         * @param onError    The function to call when error, the param is a String. Or set to null.
         */
        close(onSuccess?:()=>void, onError?:(err: string)=>void);

        /**
         * Close a dapp by id.
         *
         * @param id         The dapp id.
         * @param onSuccess  The function to call when success.
         * @param onError    The function to call when error, the param is a String. Or set to null.
         */
        closeApp(id: string, onSuccess?:()=>void, onError?:(err: string)=>void);

        /**
         * Send a message by id.
         *
         * @param id         The dapp id.
         * @param type       The message type.
         * @param msg        The message content.
         * @param onSuccess  The function to call when success.
         * @param onError    The function to call when error, the param is a String. Or set to null.
         */
        sendMessage(id: string, type: MessageType, msg: string, onSuccess:()=>void, onError?:(err: string)=>void);

        /**
         * Set listener for message callback.
         *
         * @param callback   The function receive the message.
         */
        setListener(callback: (msg: ReceivedMessage)=>void);

        /**
         * Get running list.
         *
         * @param onSuccess  The function to call when success,the param is a dapp id list.
         */
        getRunningList(onSuccess:(ids: string[])=>void);

        /**
         * Get dapp list.
         *
         * @param onSuccess  The function to call when success,the param is a dapp id list.
         */
        getAppList(onSuccess:(ids: string[])=>void);

        /**
         * Get last run list.
         *
         * @param onSuccess  The function to call when success,the param is a dapp id list.
         */
        getLastList(onSuccess:(ids: string[])=>void);

        /**
         * Set a plugin authority. Only the launcher can set.
         *
         * @param id         The dapp id.
         * @param plugin     The plugin id to set authorty.
         * @param authority  The authority to set.
         * @param onSuccess  The function to call when success.
         * @param onError    The function to call when error, the param is a String. Or set to null.
         */
        setPluginAuthority(id: string, plugin: string, authority: PluginAuthority, onSuccess: ()=>void, onError: (err:any)=>void);

        /**
         * Set a url authority. Only the launcher can set.
         *
         * @param id         The dapp id.
         * @param url        The url to set authority.
         * @param authority  The authority to set.
         * @param onSuccess  The function to call when success.
         * @param onError    The function to call when error, the param is a String. Or set to null.
         */
        setUrlAuthority(id: string, url: string, authority: UrlAuthority, onSuccess: ()=>void, onError: (err:any)=>void);

        /**
         * Display a alert dialog prompt.
         *
         * @param title       The dialog title.
         * @param message     The dialog message.
         */
        alertPrompt(title: string, message: string);

        /**
         * Display a info dialog prompt.
         *
         * @param title       The dialog title.
         * @param message     The dialog message.
         */
        infoPrompt(title: string, message: string);

        /**
         * Display a ask dialog prompt.
         *
         * @param title       The dialog title.
         * @param message     The dialog message.
         * @param onOK        The function to call when click ok.
         */
        askPrompt(title: string, message: string, onOK:()=>void);

        /**
         * Send a intent by action.
         *
         * @param action     The intent action.
         * @param params     The intent params.
         * @param options    Optional options passed to sendIntent().
         * @param onSuccess  The function to call when success.
         * @param onError    The function to call when error, the param is a String. Or set to null.
         */
        sendIntent(action: string, params: any, options?: IntentOptions, onSuccess?: (ret: any)=>void, onError?: (err:any)=>void);

        /**
         * Send a intent by url.
         *
         * @param url        The intent url.
         * @param onSuccess  The function to call when success.
         * @param onError    The function to call when error, the param is a String. Or set to null.
         */
        sendUrlIntent(url: string, onSuccess: ()=>void, onError: (err:any)=>void);

        /**
         * Set intent listener for message callback.
         *
         * @param callback   The function receive the intent.
         */
        setIntentListener(callback: (msg: ReceivedIntent)=>void);

        /**
         * Send a intent response by id.
         *
         * @param action     The intent action.
         * @param result     The intent response result.
         * @param intentId   The intent id.
         * @param onSuccess  The function to call when success.
         * @param onError    The function to call when error, the param is a String. Or set to null.
         */
        sendIntentResponse(action: string, result: any, intentId: Number, onSuccess?: (response: any)=>void, onError?: (err:any)=>void);

        /**
         * Check is there is a pending intent for the current application. A pending intent is an action
         * requested by a third party application, launching the current application to execute a specific
         * action. In such case, when hasPendingIntent() is true, we want to directly show the appropriate
         * application screen instead of going through the home screen.
         *
         * @param onSuccess  Callback that returns if there is a pending intent or not.
         * @param onError    Function called in case of error.
         */
        hasPendingIntent(onSuccess: (hasPendingIntent: boolean) => void, onError?: (err: any) => void);

        /**
         * Send dapp show or hide.
         *
         * @param visible    The app visible: 'show' or 'hide'.
         * @param onSuccess  The function to call when success.
         * @param onError    The function to call when error, the param is a String. Or set to null.
         */
        setVisible(visible: string, onSuccess?: ()=>void, onError?: (err:any)=>void);

        /**
         * Get trinity version.
         *
         * @param onSuccess  The function to call when success. The param is the version.
         * @param onError    The function to call when error, the param is a String. Or set to null.
         */
        getVersion(onSuccess: (version: string) => void, onError?: (err: string) => void);

        /**
         * Returns a TitleBar object, used to interact with the global title bar.
         * 
         * @returns The main title bar instance.
         */
        getTitleBar(): TitleBar;
    }

    /**
     * Type of activity indicators that the title bar can display.
     * Activity indicators are icon animations showing that something is currently busy.
     */
   const enum TitleBarActivityType {
        /** There is an on going download. */
        DOWNLOAD = 0,
        /** There is an on going upload. */
        UPLOAD = 1,
        /** There is on going application launch. */
        LAUNCH = 2,
        /** There is another on going operation of an indeterminate type. */
        OTHER = 3
    }

    interface TitleBar {
        /**
         * Shows an indicator on the title bar to indicate that something is busy.
         * Several dApps can interact with an activity indicator at the same time. As long as there
         * is at least one dApp setting an indicator active, that indicator remains shown.
         * 
         * @param type Type of activity indicator to start showing.
         */
        showActivityIndicator(type: TitleBarActivityType);

        /**
         * Requests to hide a given activity indicator. In case other dApps are still busy using
         * this indicator, the activity indicator remains active, until the last dApp releases it.
         * 
         * @param type Type of activity indicator to stop showing for the active dApp.
         */
        hideActivityIndicator(type: TitleBarActivityType);

        /**
         * Sets the main title bar title information. Pass null to clear the previous title.
         * DApps are responsible for managing this title from their internal screens.
         * 
         * @param title Main title to show on the title bar.
         */
        setTitle(title: String);
    }
}