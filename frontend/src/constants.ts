    export const API_URL = "https://sinod.lexrunit.com/api/meeting"
    export const WS_ROUTE = "wss://sinod.lexrunit.com/api/meeting/ws"
    export const STATUS_CREATED  = 201;
    export const STATUS_OK  = 200;
    export const STATUS_NOT_FOUND  = 404;
    export const STATUS_INTERNAL_SERVER_ERROR  = 500;

    export const enum MESSAGETYPE {
        TYPE_PONG ="pong",
        TYPE_PING = "ping",
        TYPE_OFFER = "offer",
        TYPE_ANSWER = "answer",
        TYPE_CANDIDATE = "candidate",
        TYPE_RENEGOTIATE = "renegotiate",
        TYPE_CHAT = "chat",
        TYPE_PRESENCE = "presence",
        TYPE_SYSTEM = "system",
        TYPE_PEER_LEFT = "peer_left"
    }

    export interface WebsocketMessage {
        type:MESSAGETYPE,
        data?: any
    }
    export interface OfferMessage {
        sdp :string,
    }

    export interface CandidateMessage {
        candidate:string,
        sdpMid:string,
        sdpMlineIndex: number,
        usernameFragment:string,
    }
