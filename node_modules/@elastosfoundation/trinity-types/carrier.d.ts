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
* This is about carrier, a decentralized distributed peer-to-peer networking system.
* With carrier, you can friend someone and use sessions, file transfers among friends.
* <br><br>
* Please use 'CarrierPlugin' as the plugin name in the manifest.json if you want to use
* this facility.
* <br><br>
* Usage:
* <br>
* declare let carrierManager: CarrierPlugin.CarrierManager;
*/

declare namespace CarrierPlugin {
    type Opaque<T, K> = T & { __opaque__: K };
    type Int = Opaque<number, 'Int'>;

    /**
    * The callback function to receive session request complete event.
    *
    * @callback OnSessionRequestComplete
    *
    * @param session     The carrier session instance.
    * @param status      The status code of the response. 0 is success, otherwise is error.
    * @param reason      The error message if status is error, or nil if session request error happened.
    * @param sdp         The remote users SDP. Reference: https://tools.ietf.org/html/rfc4566
    */
    type OnSessionRequestComplete = (session: Session, status: Number, reason: string, sdp: string)=>void;

    /**
    * The callback function to process the friend invite response.
    *
    * @callback OnFriendInviteResponse
    *
    * @param from     The target user ID of who sends a friend invite response
    * @param status   The status code of invite response. 0 is success, otherwise error
    * @param reason   The error message if status is error, otherwise null
    * @param data     The application defined data return by target user
    */
    type OnFriendInviteResponse = (from: string, status: Number, reason: string, data: string)=>void;

    /**
    * The bootstrap node information.
    */
    type BootstrapNode = {
        /** The server ipv4. */
        ipv4: string;
        /** The server ipv6. */
        ipv6: string;
        /** The server port. */
        port: string;
        /** The public key */
        publicKey: string;
    }

    /**
    * Options defines several settings that control the way the Carrier node connects to the carrier network.
    * Default values are not defined for bootstraps options, so application should be set bootstrap nodes clearly.
    */
    type Options = {
        /** Set to use udp transport or not. Setting this value to false will force carrier node to TCP only,
            which will potentially slow down the message to run through. */
        udpEnabled: Boolean;
        /** Set the persistent data location. The location must be set. */
        persistentLocation: string;
        /** BootstrapNode Array. */
        bootstraps: BootstrapNode[];
    }

    /**
    * The Carrier user information such as ID, nickname, brief description, avatar, gender, phone number, email
    * address and region.
    */
    type UserInfo = {
        /** The user ID. */
        userId: string;
        /** The nickname. */
        name: string;
        /** User's brief description. */
        description: string;
        /** Has avatar or not. */
        hasAvatar: Boolean;
        /** The gender. */
        gender: string;
        /** The phone number. */
        phone: string;
        /** The email address. */
        email: string;
        /** The region. */
        region: string;
    }

    /**
    * The Carrier friend information such as user info, presence status, connection status and label name.
    */
    type FriendInfo = {
        /** The user info. */
        userInfo: UserInfo;
        /** The presence status. */
        presence: PresenceStatus;
        /** The connection status. */
        connection: ConnectionStatus;
        /** The friend's label name. */
        label: string;
    }

    /**
    * The network address information.
    */
    type AddressInfo = {
        /** The address type. */
        type: CandidateType;
        /** The address. */
        address: string;
        /** The port. */
        port: string;
        /** The related address status. */
        relatedAddress?: string;
        /** The related port. */
        relatedPort?: string;
    }

    /**
    * The file transfer information.
    */
    type FileTransferInfo = {
        /** The file name. */
        filename: string;
        /** The file ID. */
        fileId: string;
        /** The file size. */
        size: Number;
    }

    /**
    * The network transport information.
    */
    type TransportInfo = {
        /** The network topology. */
        topology: NetworkTopology;
        /** The local address. */
        localAddr: AddressInfo;
        /** The remote address. */
        remoteAddr: AddressInfo;
    }

    /**
    * The Stream callbacks.
    */
    type StreamCallbacks = {
        /**
        * The callback function to report state of stream when it's state changes.
        *
        * @callback onStateChanged
        *
        * @param stream      The carrier stream instance
        * @param state       Stream state defined in StreamState
        */
        onStateChanged?(stream: Stream, state: StreamState);

        /**
        * The callback will be called when the stream receives incoming packet.
        * If the stream enabled multiplexing mode, application will not
        * receive stream-layered data callback any more. All data will reported
        * as multiplexing channel data.
        *
        * @callback onStreamData
        *
        * @param stream      The carrier stream instance
        * @param data        The received packet data.
        */
        onStreamData?(stream: Stream, data: string);

        /**
        * The callback function to be called when new multiplexing channel request to open.
        *
        * @callback onChannelOpen
        *
        * @param stream      The carrier stream instance
        * @param channel     The current channel ID.
        * @param cookie      Application defined string data receives from remote peer.
        */
        onChannelOpen?(stream: Stream, channel: Number, cookie: string);

        /**
        * The callback function to be called when new multiplexing channel opened.
        *
        * @callback onChannelOpened
        *
        * @param stream      The carrier stream instance
        * @param channel     The current channel ID.
        */
        onChannelOpened?(stream: Stream, channel: Number);

        /**
        * The callback function to be called when channel close.
        *
        * @callback onChannelClose
        *
        * @param stream      The carrier stream instance
        * @param channel     The current channel ID.
        * @param reason      Channel close reason code, defined in CloseReason.
        */
        onChannelClose?(stream: Stream, channel: Number, reason: string);

        /**
        * The callback function to be called when channel receives incoming data.
        *
        * @callback onChannelData
        *
        * @param stream      The carrier stream instance
        * @param channel     The current channel ID.
        * @param data        The received packet data.
        */
        onChannelData?(stream: Stream, channel: Number, data: string);

        /**
        * The callback function to be called when remote peer asks to pend data sending.
        *
        * @callback onChannelPending
        *
        * @param stream      The carrier stream instance
        * @param channel     The current channel ID.
        */
        onChannelPending?(stream: Stream, channel: Number);

        /**
        * The callback function to be called when remote peer ask to resume data sending.
        *
        * @callback onChannelResume
        *
        * @param stream      The carrier stream instance
        * @param channel     The current channel ID.
        */
        onChannelResume?(stream: Stream, channel: Number);
    }

    /**
    * The class representing Carrier stream.
    */
    interface Stream {
        /** @property id Stream ID. **/
        id: Int;
        /** @property carrier Parent carrier object. **/
        carrier: Carrier;
        /** @property session Parent session object. **/
        session: Session;
        /** @property type Type of the stream. **/
        type: StreamType;

        callbacks: StreamCallbacks;

        /**
        * Get transport info of carrier stream.
        * @param onSuccess  The function to call when success, the param is a TransportInfo object
        * @param onError    The function to call when error, the param is a string. Or set to null.
        */
        getTransportInfo(onSuccess: (transportInfo: TransportInfo)=>void, onError?:(err: string)=>void);

        /**
        * Send outgoing data to remote peer.
        * If the stream is in multiplexing mode, application can not call this function.
        *
        * @param onSuccess  The function to call when success, the param is a Number: Bytes of data sent.
        * @param onError    The function to call when error, the param is a string. Or set to null.
        * @param data       The data to send.
        */
        write(data: string, onSuccess:(bytesSent: Number)=>void, onError?:(err: string)=>void);

        /**
        * Open a new channel on multiplexing stream.
        * If the stream is in multiplexing mode, application can not call this function.
        *
        * @param onSuccess  The function to call when success, the param is a Number: New channel ID.
        * @param onError    The function to call when error, the param is a string. Or set to null.
        * @param cookie     The application defined data passed to remote peer
        */
        openChannel(cookie: string, onSuccess:(channelId: Number)=>void, onError?:(err: string)=>void);

        /**
        * Close a new channel on multiplexing stream.
        * If the stream is in multiplexing mode, application can not call this function.
        *
        * @param onSuccess  The function to call when success.
        * @param onError    The function to call when error, the param is a string. Or set to null.
        * @param channel    The channel ID to close
        */
        closeChannel(channel: Number, onSuccess:()=>void, onError?:(err: string)=>void);

        /**
        * Send outgoing data to remote peer.
        * If the stream is in multiplexing mode, application can not call this function.
        *
        * @param onSuccess  The function to call when success, the param is a Number: Bytes of data sent.
        * @param onError    The function to call when error, the param is a string. Or set to null.
        * @param channel    The current channel ID.
        * @param data       The data to send.
        */
        writeChannel(channel: Number, data: string, onSuccess:(bytesSent: Number)=>void, onError?:(err: string)=>void);

        /**
        * Request remote peer to pend channel data sending.
        * If the stream is in multiplexing mode, application can not call this function.
        *
        * @param onSuccess  The function to call when success.
        * @param onError    The function to call when error, the param is a string. Or set to null.
        * @param channel    The current channel ID.
        */
        pendChannel(channel: Number, onSuccess:()=>void, onError?:(err: string)=>void);

        /**
        * Request remote peer to resume channel data sending.
        * If the stream is in multiplexing mode, application can not call this function.
        *
        * @param onSuccess  The function to call when success.
        * @param onError    The function to call when error, the param is a string. Or set to null.
        * @param channel    The current channel ID.
        */
        resumeChannel(channel: Number, onSuccess:()=>void, onError?:(err: string)=>void);

        /**
        * Open a port forwarding to remote service over multiplexing.
        * If the stream is in multiplexing mode, application can not call this function.
        *
        * @param onSuccess  The function to call when success, the param is a Number: Port forwarding ID.
        * @param onError    The function to call when error, the param is a string. Or set to null.
        * @param service    The remote service name
        * @param protocol   Port forwarding protocol
        * @param host       Local host or IP address to binding. If host is null, port forwarding will bind to localhost
        * @param port       Local port to binding.
        */
        openPortForwarding(service: string, protocol: PortForwardingProtocol,  host: string, port: Number, onSuccess:(portForwardingId: Number)=>void, onError?:(err: string)=>void);

        /**
        * Close a port forwarding.
        * If the stream is in multiplexing mode, application can not call this function.
        *
        * @param onSuccess       The function to call when success.
        * @param onError         The function to call when error, the param is a string. Or set to null.
        * @param portForwarding  The portforwarding ID.
        */
        closePortForwarding(portForwarding: Number, onSuccess:()=>void, onError?:(err: string)=>void);
    }

    /**
    * The class representing Carrier Session.
    */
    interface Session {
        /** @property peer The remote peer user ID. **/
        peer: string;
        /** @property carrier Parent carrier object. */
        carrier: Carrier;

        /**
        * Close a session to friend. All resources include streams, channels, portforwardings
        * associated with current session will be destroyed.
        */
        close(onSuccess?:()=>void, onError?:(err: string)=>void);

        /**
        * Send session request to the friend.
        *
        * @param onSuccess  The function to call when success.
        * @param onError    The function to call when error, the param is a string. Or set to null.
        * @param handler    A handler to the SessionRequestCompleteHandler to receive the session response
        */
        request(handler: OnSessionRequestComplete, onSuccess:()=>void, onError?:(err: string)=>void);

        /**
        * Reply the session request from friend.
        * This function will send a session response to friend.
        *
        * @param onSuccess  The function to call when success.
        * @param onError    The function to call when error, the param is a string. Or set to null.
        * @param status     The status code of the response. 0 is success, otherwise is error
        * @param reason     The error message if status is error, or null if success
        */
        replyRequest(status: Number, reason: string, onSuccess:()=>void, onError?:(err: string)=>void);

        /**
        * Begin to start a session.
        * All streams in current session will try to connect with remote friend.
        * The stream status will update to application by stream's StreamHandler.
        *
        * @param onSuccess  The function to call when success.
        * @param onError    The function to call when error, the param is a string. Or set to null.
        * @param sdp        The remote user's SDP.  Reference: https://tools.ietf.org/html/rfc4566
        */
        start(sdp: string, onSuccess:()=>void, onError?:(err: string)=>void);

        /**
        * Add a new stream to session.
        * Carrier stream supports several underlying transport mechanisms:
        *   - Plain/encrypted UDP data gram protocol
        *   - Plain/encrypted TCP like reliable stream protocol
        *   - Multiplexing over UDP
        *   - Multiplexing over TCP like reliable protocol
        *  Application can use options to specify the new stream mode.
        *  Multiplexing over UDP can not provide reliable transport.
        *
        * @param onSuccess  The function to call when success, the param is a Stream object: The new added carrier stream.
        * @param onError    The function to call when error, the param is a string. Or set to null.
        * @param type       The stream type defined in StreamType
        * @param options    The stream mode options. Options are constructed by a bitwise-inclusive OR of flags
        * @param callbacks  The stream callbacks.
        */
        addStream(type: StreamType, options: Number, callbacks: StreamCallbacks, onSuccess:(stream: Stream)=>void, onError?:(err: string)=>void);

        /**
        * Remove a stream from session.
        *
        * @param onSuccess  The function to call when success.
        * @param onError    The function to call when error, the param is a string. Or set to null.
        * @param stream     The Stream to be removed
        */
        removeStream(stream: Stream, onSuccess:(stream: Stream)=>void, onError?:(err: string)=>void);

        /**
        * Add a new portforwarding service to session.
        * The registered services can be used by remote peer in portforwarding request.
        *
        * @param onSuccess The function to call when success.
        * @param onError   The function to call when error, the param is a string. Or set to null.
        * @param service   The new service name, should be unique in session scope.
        * @param protocol  The protocol of the service.
        * @param host      The host name or IP address of the service.
        * @param port      The port of the service.
        */
        addService(service: string, protocol: PortForwardingProtocol, host: string, port: Number, onSuccess:()=>void, onError?:(err: string)=>void);

        /**
        * Remove a portforwarding server to session.
        * This function has not effect on existing portforwardings.
        *
        * @param onSuccess  The function to call when success.
        * @param onError    The function to call when error, the param is a string. Or set to null.
        * @param service    The service name.
        */
        removeService(service: string, onSuccess:()=>void, onError?:(err: string)=>void);
    }

    /**
    * The Carrier callbacks.
    */
    type CarrierCallbacks = {
        /**
        * The callback function to process the self connection status.
        *
        *@callback onConnection
        *
        * @param carrier   Carrier node instance
        * @param status    Current connection status. @see ConnectionStatus
        */
        onConnection?(carrier: Carrier, status: ConnectionStatus);

        /**
        * The callback function to process the ready notification.
        * Application should wait this callback invoked before calling any
        * function to interact with friends.
        *
        * @callback onReady
        *
        * @param carrier   Carrier node instance
        */
        onReady?(carrier: Carrier);

        /**
        * The callback function to process the self info changed event.
        *
        * @callback onSelfInfoChanged
        *
        * @param carrier  Carrier node instance
        * @param userInfo The updated user information
        */
        onSelfInfoChanged?(carrier: Carrier, userInfo: UserInfo);

        /**
        * The callback function to iterate the each friend item in friend list.
        *
        * @callback onFriends
        *
        * @param carrier  Carrier node instance
        * @param friends  The friends list.
        */
        onFriends?(carrier: Carrier, friends: FriendInfo[]);

        /**
        * The callback function to process the friend connections status changed event.
        *
        * @callback onFriendConnection
        *
        * @param carrier   Carrier node instance
        * @param friendId  The friend's user ID.
        * @param status    The connection status of friend. @see ConnectionStatus
        */
        onFriendConnection?(carrier: Carrier, friendId: string, status: ConnectionStatus);

        /**
        * The callback function to process the friend information changed event.
        *
        * @callback onFriendInfoChanged
        *
        * @param carrier   Carrier node instance
        * @param friendId  The friend's user ID
        * @param info      The updated friend information
        */
        onFriendInfoChanged?(carrier: Carrier, friendId: string, info: FriendInfo);

        /**
        * The callback function to process the friend presence changed event.
        *
        * @callback onFriendPresence
        *
        * @param carrier   Carrier node instance
        * @param friendId  The friend's user ID
        * @param presence  The presence status of the friend
        */
        onFriendPresence?(carrier: Carrier, friendId: string, presence: PresenceStatus);

        /**
        * The callback function to process the friend request.
        *
        * @callback onFriendRequest
        *
        * @param carrier  Carrier node instance
        * @param userId   The user ID of who wants to be friend with current user
        * @param info     The user information to `userId`
        * @param hello    The PIN for target user, or any application defined content
        */
        onFriendRequest?(carrier: Carrier, userId: string, info: UserInfo, hello: string);

        /**
        * The callback function to process the new friend added event.
        *
        * @callback onFriendAdded
        *
        * @param carrier    Carrier node instance
        * @param friendInfo The added friend's information
        */
        onFriendAdded?(carrier: Carrier, friendInfo: FriendInfo);

        /**
        * The callback function to process the friend removed event.
        *
        * @callback onFriendRemoved
        *
        * @param carrier   Carrier node instance
        * @param friendId  The friend's user ID
        */
        onFriendRemoved?(carrier: Carrier, friendId: string);

        /**
        * The callback function to process the friend message.
        *
        * @callback onFriendMessage
        *
        * @param carrier    Carrier node instance
        * @param from       The ID of who sends the message
        * @param message    The message content
        * @param isOffline  Whether this message was sent as online message or
        *   offline message. The value of true means the message was sent as
        *   online message, otherwise as offline message.
        */
        onFriendMessage?(carrier: Carrier, from: string, messate: string, isOffline: Boolean);

        /**
        * The callback function to process the friend invite request.
        *
        * @callback onFriendInviteRequest
        *
        * @param carrier   Carrier node instance
        * @param from      The user ID of who sends the invite request
        * @param data      The application defined data sent by friend
        */
        onFriendInviteRequest?(carrier: Carrier, from: string, data: string);

        /**
        * The callback function that handle session request.
        *
        * @callback onSessionRequest
        *
        * @param carrier   Carrier node instance
        * @param from      The ID of who sends the message
        * @param sdp       The remote users SDP. Reference: https://tools.ietf.org/html/rfc4566
        */
        onSessionRequest?(carrier: Carrier, from: string, sdp: string);

        /**
        * The callback function that handle group invite.
        *
        * @callback onGroupInvite
        *
        * @param carrier    Carrier node instance
        * @param groupTitle Current group title
        */
        onGroupInvite?(carrier: Carrier, groupTitle: string);

        /**
        * A callback function that handle file transfer connect request.
        *
        * @callback onConnectRequest
        *
        * @param carrier     Carrier node instance
        * @param from        The ID of who sends the request
        * @param fileInfo    Information of the file which the requester wants to send
        */
        onConnectRequest?(carrier: Carrier, from: string, fileInfo: FileTransferInfo);
    }

    /**
    * The class representing Carrier.
    */
    interface Carrier {
        /** @property nodeId Node ID. **/
        nodeId: string;
        /** @property userId User ID. **/
        userId: string;
        /** @property address Node address. **/
        address: string;

        callbacks: CarrierCallbacks;

        /**
        * Start carrier node asynchronously to connect to carrier network. If the connection
        * to network is successful, carrier node starts working.
        *
        * @param onSuccess       The function to call when success.
        * @param onError         The function to call when error, the param is a string. Or set to null.
        * @param iterateInterval Internal loop interval, in milliseconds.
        */
        start(iterateInterval: Number, onSuccess:()=>void, onError?:(err: string)=>void);

        /**
        * Get self user information.
        *
        * @param onSuccess  The function to call when success, the param is a UserInfo: the user information to the carrier node.
        * @param onError    The function to call when error, the param is a string. Or set to null.
        */
        getSelfInfo(onSuccess:(userInfo: UserInfo)=>void, onError?:(err: string)=>void);

        /**
        * Update self user information.
        * After self user information changed, carrier node will update this information
        * to carrier network, and thereupon network broadcasts the change to all friends.
        *
        * @param onSuccess  The function to call when success.
        * @param onError    The function to call when error, the param is a string. Or set to null.
        * @param userinfo   The user information to update for this carrier node.
        */
        setSelfInfo(name: string, value: string, onSuccess:()=>void, onError?:(err: string)=>void);

        /**
        * Check if carrier node instance is being ready.
        * All carrier interactive APIs should be called only if carrier node instance
        * is being ready.
        *
        * @param onSuccess  The function to call when success, the param is a Boolean: true if the carrier node instance is ready, or false if not.
        * @param onError    The function to call when error, the param is a string. Or set to null.
        */
        isReady(onSuccess:(ready: Boolean)=>void, onError?:(err: string)=>void);

        /**
        * Get friends list.
        *
        * @param onSuccess  The function to call when success, the param is a {friendId: info} Object: The list of friend information to current user.
        * @param onError    The function to call when error, the param is a string. Or set to null.
        */
        getFriends(onSuccess:(friends: FriendInfo[])=>void, onError?:(err: string)=>void);

        /**
        * Get specified friend information.
        *
        * @param onSuccess  The function to call when success, the param is a FriendInfo: The friend information.
        * @param onError    The function to call when error, the param is a string. Or set to null.
        * @param userId     The user identifier of friend
        */
        getFriend(userId: string, onSuccess:(friend: FriendInfo)=>void, onError?:(err: string)=>void);

        /**
        * Set the label of the specified friend.
        * The label of a friend is a private alias name for current user. It can be
        * seen by current user only, and has no impact to the target friend itself.
        *
        * @param onSuccess  The function to call when success.
        * @param onError    The function to call when error, the param is a string. Or set to null.
        * @param userId     The friend's user identifier
        * @param label      The new label of specified friend
        */
        labelFriend(userId: string, label: string, onSuccess:()=>void, onError?:(err: string)=>void);

        /**
        * Check if the user ID is friend.
        *
        * @param onSuccess  The function to call when success, the param is a Boolean: True if the user is a friend, or false if not.
        * @param onError    The function to call when error, the param is a string. Or set to null.
        * @param userId     The userId to check.
        */
        isFriend(userId: string, onSuccess:(isFriend: Boolean)=>void, onError?:(err: string)=>void);

        /**
        * Add friend by sending a new friend request.
        * This function will add a new friend with specific address, and then
        * send a friend request to the target node.
        *
        * @param onSuccess  The function to call when success.
        * @param onError    The function to call when error, the param is a string. Or set to null.
        * @param address    The target user address of remote carrier node.
        * @param hello      PIN for target user, or any application defined content.
        */
        addFriend(address: string, hello: string, onSuccess:()=>void, onError?:(err: string)=>void);

        /**
        * Accept the friend request.
        * This function is used to add a friend in response to a friend request.
        *
        * @param onSuccess  The function to call when success.
        * @param onError    The function to call when error, the param is a string. Or set to null.
        * @param userId     The user ID who wants to be friend with us.
        */
        acceptFriend(userId: string, onSuccess:()=>void, onError?:(err: string)=>void);

        /**
        * Remove a friend.
        * This function will remove a friend on this carrier node.
        *
        * @param onSuccess  The function to call when success.
        * @param onError    The function to call when error, the param is a string. Or set to null.
        * @param userId     The target user ID to remove friendship
        */
        removeFriend(userId: string, onSuccess:()=>void, onError?:(err: string)=>void);

        /**
        * Send a message to a friend.
        * The message length may not exceed MAX_APP_MESSAGE_LEN, and message itself
        * should be text-formatted. Larger messages must be split by application
        * and sent as separate messages. Other nodes can reassemble the fragments.
        *
        * @param onSuccess  The function to call when success.
        * @param onError    The function to call when error, the param is a string. Or set to null.
        * @param to         The target ID
        * @param message    The message content defined by application
        */
        sendFriendMessage(to: string, message: string, onSuccess:()=>void, onError?:(err: string)=>void);

        /**
        * Send invite request to a friend.
        * Application can attach the application defined data with in the invite
        * request, and the data will be sent to target friend.
        *
        * @param onSuccess   The function to call when success.
        * @param onError     The function to call when error, the param is a string. Or set to null.
        * @param to          The target ID
        * @param data        The application defined data sent to target user
        * @param handler     The handler to receive invite reponse
        */
        inviteFriend(to: string, data: string, handler: OnFriendInviteResponse, onSuccess:()=>void, onError?:(err: string)=>void);

        /**
        * Reply the friend invite request.
        * This function will send an invite response to friend.
        *
        * @param onSuccess  The function to call when success.
        * @param onError    The function to call when error, the param is a string. Or set to null.
        * @param to         The ID of who sends invite request
        * @param status     The status code of the response. 0 is success, otherwise is error
        * @param reason     The error message if status is error, or null if success
        * @param data       The application defined data sent to target user. If the status is error, this will be ignored
        */
        replyFriendInvite(to: string, status: Number, reason: string, data: string, onSuccess:()=>void, onError?:(err: string)=>void);

        /**
        * Create a new group request.
        * This function will create a new group.
        *
        * @param {Function} onSuccess  The function to call when success, the param is Group object.
        * @param {Function} onError    The function to call when error, the param is a string. Or set to null.
        */
        newGroup(callbacks: GroupCallbacks, onSuccess:(group: Group)=>void, onError?:(err: string)=>void);

        /**
        * Join a group request.
        * Join a group associating with cookie into which remote friend invites.
        *
        * @param onSuccess  The function to call when success, the param is Group object
        * @param onError    The function to call when error, the param is a string. Or set to null.
        * @param friendId   The friend who sends a group invitation
        * @param cookieCode The cookieCode information to join group,from onGroupInvite.
        */
        groupJoin(friendId: string, cookieCode: string, callbacks: GroupCallbacks, onSuccess:(group: Group)=>void, onError?:(err: string)=>void);

        /**
        * Leave a group.
        *
        * @param onSuccess  The function to call when success
        * @param onError    The function to call when error, the param is a string. Or set to null.
        * @param group      Group object
        */
        groupLeave(group: Group, onSuccess:(group: Group)=>void, onError?:(err: string)=>void);

        /**
         * Get all Groups request.
         *
         * @param onSuccess  The function to call when success.The param is a group array object ,
         * @param onError    The function to call when error, the param is a string. Or set to null.
         */
        getGroups(onSuccess:(groups: Group[])=>void, onError?:(err: string)=>void);

        /**
        * Create a new file transfer to a friend.
        * The file transfer object represents a conversation handle to a friend.
        *
        * @param onSuccess           The function to call when success.The param is fileTransfer instance,
        * @param onError             The function to call when error, the param is a string. Or set to null.
        * @param to                  The target ID(userid or userid@nodeid).
        * @param fileTransferInfo    Information of the file to be transferred.
        */
        newFileTransfer(to:string, fileTransferInfo: FileTransferInfo, callbacks: FileTransferCallbacks, onSuccess?:(fileTransfer: FileTransfer)=>void, onError?:(err: String)=>void);

        /**
         * Generate unique file identifier with random algorithm.
         *
         * @param onSuccess  The function to call when success.The param is fileId,
         */
        generateFileId(onSuccess: (fileId: Int)=>void);

        /**
        * Create a new session to a friend.
        * The session object represents a conversation handle to a friend.
        *
        * @param onSuccess  The function to call when success, the param is a Session Object: The new Session object
        * @param onError    The function to call when error, the param is a string. Or set to null.
        * @param to         The target ID(userid or userid@nodeid).
        */
        newSession(to: string, onSuccess:(session: Session)=>void, onError?:(err: string)=>void);

        /**
        * Disconnect carrier node from carrier network, and destroy all associated resources to carreier node instance.
        * After calling the method, the carrier node instance becomes invalid.
        *
        * @param onSuccess  The function to call when success.
        * @param onError    The function to call when error, the param is a string. Or set to null.
        */
        destroy(onSuccess?:()=>void, onError?:(err: string)=>void);
    }

    type GroupCallbacks = {
        /**
        * The callback function that handles group connect status.
        *
        * @callback onGroupConnected
        *
        * @param group      The group instance .
        */
        onGroupConnected?();

        /**
        * The callback function that handles group message.
        *
        * @callback onGroupMessage
        *
        * @param group      The group instance .
        * @param from       The friend's user ID.
        * @param message    The message content
        */
        onGroupMessage?(from: string, message: string);

        /**
        * The callback function that handles group title changed.
        *
        * @callback onGroupTitle
        *
        * @param group      The group instance .
        * @param from       The user ID of the modifier
        * @param title      New group title
        */
        onGroupTitle?(from: string, title: string);

        /**
        * The callback function that handles peer name changed.
        *
        * @callback onPeerName
        *
        * @param group      The group instance .
        * @param peerId     The peer's user ID.
        * @param peerName   The peer's name.
        */
        onPeerName?(peerId: string, peerName: string);

        /**
        * The callback function that handles peer list changed.
        *
        * @callback onPeerListChanged
        *
        * @param group      The group instance .
        */
        onPeerListChanged?();
    }

    /**
    * The class representing Group.
    */
    interface Group {
        groupId: Int;
        callbacks: GroupCallbacks;

        /**
        * Invite a friend into group request.
        *
        * @param onSuccess  The function to call when success.The param is a string "Success!",
        * @param onError    The function to call when error, the param is a string. Or set to null.
        * @param friendId   The friend's ID
        */
        invite(friendId: string, onSuccess:()=>void, onError?:(err: string)=>void);

        /**
        * Send a message to a group request.
        *
        * @param onSuccess  The function to call when success.
        * @param onError    The function to call when error, the param is a string. Or set to null.
        * @param message    The message content defined by application
        */
        sendMessage(message: string, onSuccess:()=>void, onError?:(err: string)=>void);

        /**
        * Get group title request.
        *
        * @param onSuccess  The function to call when success.The param is a string, group title information
        * @param onError    The function to call when error, the param is a string. Or set to null.
        */
        getTitle(onSuccess:(groupTitle: string)=>void, onError?:(err: string)=>void);

        /**
        * Modify group title request.
        *
        * @param onSuccess  The function to call when success.The param is a json string, group title information,
        * @param onError    The function to call when error, the param is a string. Or set to null.
        * @param groupTitle New group's title
        */
        setTitle(groupTitle: string, onSuccess:(groupTitle: string)=>void, onError?:(err: string)=>void);

        /**
        * Get peers from Group request.
        *
        * @param onSuccess  The function to call when success.The param is a json string, group peers information,
        *                   like this {"PEER_ID":{"peerName":"PEER_NAME","peerUserId":"PEER_ID"}}.
        * @param onError    The function to call when error, the param is a string. Or set to null.
        */
        getPeers(onSuccess:(peers: any)=>void, onError?:(err: string)=>void); // TODO: define a Peer type

        /**
        * Get a peer from Group request.
        *
        * @param onSuccess  The function to call when success.The param is a json string, a peer information,
        *                   like this{"peerName":"PEER_NAME","peerUserId":"PEER_ID"}.
        * @param onError    The function to call when error, the param is a string. Or set to null.
        * @param peerId     The peer's ID
        */
        getPeer(peerId: string, onSuccess:(peer: any)=>void, onError?:(err: string)=>void); // TODO: define a Peer type
    }

    const enum FileTransferState {
        /** The file transfer connection is initialized. */
        Initialized = 1,
        /** The file transfer connection is connecting.*/
        Connecting = 2,
        /** The file transfer connection has been established. */
        Connected = 3,
        /** The file transfer connection is closed and disconnected. */
        Closed = 4,
        /** The file transfer connection failed with some reason. */
        Failed = 5
    }

    type FileTransferCallbacks = {
        /**
         * The callback function that handles the state changed event.
         * An application-defined function that handles the state changed event.
         *
         * @callback onStateChanged
         * @param fileTransfer   The fileTransfer instance .
         * @param state          The file transfer connection state.
         */
        onStateChanged?(fileTransfer: FileTransfer, state: FileTransferState);

        /**
         * An application-defined function that handles transfer file request event.
         *
         * @callback onFileRequest
         *
         * @param fileTransfer   The fileTransfer instance .
         * @param fileId         The file identifier.
         * @param filename       The file name.
         * @param size           The total file size.
         */
        onFileRequest?(fileTransfer: FileTransfer, fileId: string, filename: string, size: Int);

        /**
         * An application-defined function that handles file transfer pull request event.
         *
         * @callback onPullRequest
         *
         * @param fileTransfer   The fileTransfer instance.
         * @param fileId         The unique identifier of transferring file.
         * @param offset         The offset of file where transfer begins.
         */
        onPullRequest?(fileTransfer: FileTransfer, fileId: string, offset: string);

        /**
         * An application-defined function that performs receiving data.
         *
         * @callback onData
         *
         * @param fileTransfer   The fileTransfer instance .
         * @param fileId         The unique identifier of transferring file.
         * @param data           The received data.
         */
        onData?(fileTransfer: FileTransfer, fileId: string, data: string);

        /**
         * An application-defined function that handles the event of end of receiving data.
         *
         * @callback onDataFinished
         *
         * @param fileTransfer   The fileTransfer instance .
         * @param fileId         The unique identifier of transferring file.
         */
        onDataFinished?(fileTransfer: FileTransfer, fileId: string);

        /**
         * An application-defined function that handles pause file transfer
         * notification from the peer.
         *
         * @callback onPending
         *
         * @param fileTransfer   The fileTransfer instance .
         * @param fileId         The unique identifier of transferring file.
         */
        onPending?(fileTransfer: FileTransfer, fileId: string);

        /**
         * An application-defined function that handles resume file transfer
         * notification from the peer.
         *
         * @callback onResume
         *
         * @param fileTransfer   The fileTransfer instance .
         * @param fileId         The unique identifier of transferring file.
         */
        onResume?(fileTransfer: FileTransfer, fileId: string);

        /**
         * An application-defined function that handles cancel file transfer
         * notification from the peer.
         *
         * @callback onCancel
         *
         * @param fileTransfer   The fileTransfer instance .
         * @param fileId         The unique identifier of transferring file.
         * @param status         Cancel transfer status code.
         * @param reason         Cancel transfer reason.
         */
        onCancel?(fileTransfer: FileTransfer, fileId: string, status: Int, reason: string);
    }

    /**
     * The class representing FileTransfer.
     */
    interface FileTransfer {
        callbacks: FileTransferCallbacks;

        /**
         * Close file transfer instance.
         *
         * @param onSuccess  The function to call when success.The param is a string "Success!",
         * @param onError    The function to call when error, the param is a string. Or set to null.
         */
        close(onSuccess?:()=>void, onError?:(err:string)=>void);

        /**
         * Get an unique file identifier of specified file.
         * Each file has its unique file ID used between two peers.
         *
         * @param filename   The target file name.
         * @param onSuccess  The function to call when success.The param is fileId,
         * @param onError    The function to call when error, the param is a string. Or set to null.
         */
        getFileId(filename: string, onSuccess?:(fileId: string)=>void, onError?:(err:string)=>void);

        /**
         * Get file name by file ID.
         * Each file has its unique file ID used between two peers.
         *
         * @param fileId     The target file identifier.
         * @param onSuccess  The function to call when success.The param is filename,
         * @param onError    The function to call when error, the param is a string. Or set to null.
         */
        getFileName(fileId: string, onSuccess?:(filename: string)=>void, onError?:(err:string)=>void);

        /**
         * Send a file transfer connect request to target peer.
         *
         * @param onSuccess  The function to call when success.The param is a string "Success!",
         * @param onError    The function to call when error, the param is a string. Or set to null.
         *
         */
        connect(onSuccess?:()=>void, onError?:(err:string)=>void);

        /**
         * Accept file transfer connection request.
         *
         * @param onSuccess  The function to call when success.The param is a string "Success!",
         * @param onError    The function to call when error, the param is a string. Or set to null.
         *
         */
        acceptConnect(onSuccess?:()=>void, onError?:(err:string)=>void);

        /**
         * Add a file to queue of file transfer.
         *
         * @param fileinfo   Information of the file to be added.
         * @param onSuccess  The function to call when success.The param is a string "Success!",
         * @param onError    The function to call when error, the param is a string. Or set to null.
         */
        addFile(fileInfo: FileTransferInfo, onSuccess?:()=>void, onError?:(err:string)=>void);

        /**
         * To send pull request to transfer file with a specified fileId.
         *
         * @param fileId     The file identifier.
         * @param offset     The offset of file where transfer begins.
         * @param onSuccess  The function to call when success.The param is a string "Success!",
         * @param onError    The function to call when error, the param is a string. Or set to null.
         */
        pullData(fileId: string, offset: Int, onSuccess?:()=>void, onError?:(err:string)=>void);

        /**
         * To transfer file data with a specified fileId.
         *
         * @param onSuccess  The function to call when success.The param is a string "Success!",
         * @param onError    The function to call when error, the param is a string. Or set to null.
         * @param fileId     The file identifier.
         * @param data       The data to transfer for file.
         */
        writeData(fileId: string, data: string, onSuccess?:()=>void, onError?:(err:string)=>void);

        /**
         * Finish transferring file with a specified fileId(only available to sender).
         *
         * @param fileId     The file identifier.
         * @param onSuccess  The function to call when success.The param is a string "Success!",
         * @param onError    The function to call when error, the param is a string. Or set to null.
         */
        sendFinish(fileId: string, onSuccess?:()=>void, onError?:(err:string)=>void);

        /**
         * Cancel transferring file with a specified fileId(only available to receiver).
         *
         * @param fileId     The file identifier.
         * @param onSuccess  The function to call when success.The param is a string "Success!",
         * @param onError    The function to call when error, the param is a string. Or set to null.
         */
        cancelTransfer(fileId: string, status: Int, reason: string, onSuccess?:()=>void, onError?:(err:string)=>void);

        /**
         * Pend transferring file with a specified fileId.
         *
         * @param fileId     The file identifier.
         * @param onSuccess  The function to call when success.The param is a string "Success!",
         * @param onError    The function to call when error, the param is a string. Or set to null.
         */
        pendTransfer(fileId: string, onSuccess?:()=>void, onError?:(err:string)=>void);

        /**
         * Resume transferring file with a specified fileId.
         *
         * @param fileId     The file identifier.
         * @param onSuccess  The function to call when success.The param is a string "Success!",
         * @param onError    The function to call when error, the param is a string. Or set to null.
         */
        resumeTransfer(fileId: string, onSuccess?:()=>void, onError?:(err:string)=>void);
    }

    /**
    * @description
    * Carrier node connection status to the carrier network.
    *
    * @enum {number}
    */
    const enum ConnectionStatus {
        /** Carrier node connected to the carrier network. */
        CONNECTED=0,
        /** There is no connection to the carrier network. */
        DISCONNECTED=1
    }

    /**
    * @description
    * Carrier node presence status.
    *
    * @enum {number}
    */
    const enum PresenceStatus {
        /** Carrier node is online and available. */
        NONE=0,
        /** Carrier node is being away. */
        AWAY=1,
        /** Carrier node is being busy. */
        BUSY=2
    }

    /**
    * @description
    * Carrier stream type. Reference: https://tools.ietf.org/html/rfc4566#section-5.14 https://tools.ietf.org/html/rfc4566#section-8
    *
    * @enum {number}
    */
   const enum StreamType {
        /** Audio stream. */
        AUDIO=0,
        /** Video stream. */
        VIDEO=1,
        /** Text stream. */
        TEXT=2,
        /** Application stream. */
        APPLICATION=3,
        /** Message stream. */
        MESSAGE=4
    }

    /**
    * @description
    * Carrier stream state The stream state will be changed according to the phase of the stream.
    *
    * @enum {number}
    */
    const enum StreamState {
        /** Raw stream. */
        RAW=0,
        /** Initialized stream. */
        INITIALIZED=1,
        /** The underlying transport is ready for the stream to start. */
        TRANSPORT_READY=2,
        /** The stream is trying to connect the remote. */
        CONNECTING=3,
        /** The stream connected with remove peer. */
        CONNECTED=4,
        /** The stream is deactived. */
        DEACTIVATED=5,
        /** The stream closed gracefully. */
        CLOSED=6,
        /** The stream is on error, cannot to continue. */
        ERROR=7
    }

    /**
    * @description
    * Carrier Stream's candidate type.
    *
    * @enum {number}
    */
    const enum CandidateType {
        /** Host candidate. */
        HOST=0,
        /** Server reflexive, only valid to ICE transport. */
        SERVER_REFLEXIVE=1,
        /** Peer reflexive, only valid to ICE transport. */
        PEER_REFLEXIVE=2,
        /** Relayed Candidate, only valid to ICE tranport. */
        RELAYED=3,
    }

    /**
    * @description
    * Carrier network topology for session peers related to each other.
    *
    * @enum {number}
    */
    const enum NetworkTopology {
        /** LAN network topology. */
        LAN=0,
        /** P2P network topology. */
        P2P=1,
        /** Relayed netowrk topology. */
        RELAYED=2
    }

    /**
    * @description
    * Port forwarding supported protocols.
    *
    * @enum {number}
    */
    const enum PortForwardingProtocol {
        /** TCP protocol. */
        TCP=1
    }

    /**
    * @description
    * Multiplexing channel close reason mode.
    *
    * @enum {number}
    */
    const enum CloseReason {
        /** Channel closed normaly. */
        NORMAL=0,
        /** Channel closed because of timeout. */
        TIMEOUT=1,
        /** Channel closed because error occured. */
        ERROR=2
    }

    /**
    * @description
    * Carrier stream mode.
    *
    * @enum {number}
    */
   const enum StreamMode {
        /**
        * Compress option, indicates data would be compressed before transmission.
        * For now, just reserved this bit option for future implement.
        */
        COMPRESS=1,
        /**
        * Encrypt option, indicates data would be transmitted with plain mode.
        * which means that transmitting data would be encrypted in default.
        */
        PLAIN=2,
        /**
        * Relaible option, indicates data transmission would be reliable, and be
        * guranteed to received by remote peer, which acts as TCP transmission
        * protocol. Without this option bitwised, the transmission would be
        * unreliable as UDP transmission protocol.
        */
        RELIABLE=4,
        /**
        * Multiplexing option, indicates multiplexing would be activated on
        * enstablished stream, and need to use multipexing APIs related with channel
        * instread of APIs related strema to send/receive data.
        */
        MULTIPLEXING=8,
        /**
        * PortForwarding option, indicates port forwarding would be activated
        * on established stream. This options should bitwise with 'Multiplexing'
        * option.
        */
        PORT_FORWARDING=16
    }

    interface CarrierManager {
        /**
        * Get current version of Carrier node.
        *
        * @param onSuccess  The function to call when success, the param is a string: The version of carrier node.
        * @param onError    The function to call when error, the param is a string. Or set to null.
        */
        getVersion(onSuccess:(version: string)=>void, onError?:(err: string)=>void);

        /**
        * Check if the ID is Carrier node ID.
        *
        * @param id         The carrier node ID to be checked.
        * @param onSuccess  The function to call when success, the param is a Boolean: True if ID is valid, otherwise false.
        * @param onError    The function to call when error, the param is a string. Or set to null.
        */
        isValidId(id: string, onSuccess:(isValid: Boolean)=>void, onError?:(err: string)=>void);

        /**
        * Check if the carrier node address is valid.
        *
        * @param address    The carrier node address to be checked.
        * @param onSuccess  The function to call when success, the param is a Boolean: True if key is valid, otherwise false.
        * @param onError    The function to call when error, the param is a string. Or set to null.
        */
        isValidAddress(address: string, onSuccess:(isValid: Boolean)=>void, onError?:(err: string)=>void);

        /**
        * Get carrier ID from carrier node address.
        *
        * @param onSuccess  The function to call when success, the param is a string: User ID if address is valid, otherwise null.
        * @param onError    The function to call when error, the param is a string. Or set to null.
        * @param address    The carrier node address.
        */
        getIdFromAddress(address: string, onSuccess:(userId: string)=>void, onError?:(err: string)=>void);

        /**
        * Create a carrier object instance. After initializing the instance,
        * it's ready to start and therefore connect to carrier network.
        *
        * @param callbacks The callbacks for carrier node.
        * @param [options]   The options to set for creating carrier node. If set to null, will use default.
        * @param [onSuccess]  The function to call when success, the param is a carrier object.
        * @param onError    The function to call when error, the param is a string. Or set to null.
        */
        createObject(callbacks: CarrierCallbacks, options?: any, onSuccess?:(carrier: Carrier)=>void, onError?:(err: string)=>void); // TODO: need a type for options
    }
}
