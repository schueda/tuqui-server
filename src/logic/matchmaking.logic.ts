import { MatchmakingDatabase } from '../data/matchmaking.db';
import { ConnectionService } from './connection.logic';
import { Message, UserIdMessage } from '../types/message';
import { logger } from '../logger';
import { MatchmakingState } from '../state-management/state/matchmaking.state';
import { onUserConnected } from '../state-management/reducer/matchmaking/on_user_connected';
import { onConfirmedReady } from '../state-management/reducer/matchmaking/on_confirmed_ready';
import { onUserDisconnected } from '../state-management/reducer/matchmaking/on_user_disconnected';
import { onSendNickname, SendNicknameMessage } from '../state-management/reducer/matchmaking/on_send_nickname';

export class MatchmakingService {
    constructor(private db: MatchmakingDatabase, private connSvc: ConnectionService) {
        this.registerUserConnect();
        this.registerSendNickname();
        this.registerUserConfirmedReady();
        this.registerUserDisconnected();
    }

    state = <MatchmakingState>{
        users: []
    };

    registerUserConnect() {
        this.connSvc.registerConnectionReceiver('MatchmakingService', (message: UserIdMessage) => {
            logger.debug(`[MatchmakingService.registerUserConnect] Received connection message ${message.payload.userId}`);

            const [newState, messages] = onUserConnected(this.state, message);
            this.state = newState;

            messages.forEach(m => this.connSvc.emit(m));
        });
    }

    registerSendNickname() {
        this.connSvc.registerMessageReceiver('sendNickname', (message: SendNicknameMessage) => {
            logger.debug(`[MatchmakingService.registerSendNickname] Received sendNickname message ${JSON.stringify(message)}`);

            const [newState, messages] = onSendNickname(this.state, message);
            this.state = newState;

            logger.debug(`[MatchmakingService.registerSendNickname] New state: ${JSON.stringify(this.state)}, messages: ${JSON.stringify(messages)}`);

            messages.forEach(m => this.connSvc.emit(m));
        });
    }

    registerUserConfirmedReady() {
        this.connSvc.registerMessageReceiver('userConfirmedReady', (message: UserIdMessage) => {
            logger.debug(`[MatchmakingService.registerUserConfirmedReady] Received userConfirmedReady message ${JSON.stringify(message)}`);

            const [newState, messages] = onConfirmedReady(this.state, message);
            this.state = newState;

            messages.forEach(m => this.connSvc.emit(m));
        });
    }

    registerUserDisconnected() {
        this.connSvc.registerMessageReceiver('userDisconnected', (message: UserIdMessage) => {
            logger.debug(`[MatchmakingService.registerUserDisconnected] Received userDisconnected message ${JSON.stringify(message)}`);

            const [newState, messages] = onUserDisconnected(this.state, message);
            this.state = newState;

            messages.forEach(m => this.connSvc.emit(m));
        });
    }

}