import { MatchmakingDatabase } from '../data/matchmaking.db';
import { ConnectionService } from './connection.logic';
import { UserIdMessage, SendableMessage } from '../types/message';
import { logger } from '../logger';
import { MatchmakingState } from '../types/state/matchmaking.state';
import { onUserConnected } from '../state-management/reducer/matchmaking/on_user_connected';
import { onConfirmedReady } from '../state-management/reducer/matchmaking/on_confirmed_ready';
import { onUserDisconnected } from '../state-management/reducer/matchmaking/on_user_disconnected';
import { onSendNickname, SendNicknameMessage } from '../state-management/reducer/matchmaking/on_send_nickname';
import { NewSchedulableAction } from '../types/action';
import { StateLoggingService } from './state-logging.logic';
import { SchedulingService } from './scheduling.logic';

export class MatchmakingService {
    constructor(private db: MatchmakingDatabase, private connSvc: ConnectionService, private scheSvc: SchedulingService, private stateLoggingSvc: StateLoggingService) {
        this.registerUserConnect();
        this.registerUserDisconnected();

        this.registerAskForLobbyData();

        this.registerSendNickname();
        this.registerConfirmReady();
    }

    state = <MatchmakingState>{
        users: []
    };

    registerUserConnect() {
        this.connSvc.registerConnectionReceiver('MatchmakingService', (message: UserIdMessage) => {
            logger.debug(`[MatchmakingService.registerUserConnect] Received connection message ${message.payload.userId}`);

            const [newState, messages, actions] = onUserConnected(this.state, message);
            this.state = newState;

            this.stateLoggingSvc.log({
                message: {
                    ...message
                },
                newState: {
                    ...this.state
                }
            });

            messages.forEach(m => this.connSvc.emit(m));
        });
    }

    registerSendNickname() {
        this.connSvc.registerMessageReceiver('sendNickname', ["user"], (message: SendNicknameMessage) => {
            logger.debug(`[MatchmakingService.registerSendNickname] Received sendNickname message ${JSON.stringify(message)}`);

            const [newState, messages, actions] = onSendNickname(this.state, message);
            this.state = newState;

            this.stateLoggingSvc.log({
                message: {
                    ...message
                },
                newState: {
                    ...this.state
                }
            });

            messages.forEach(m => this.connSvc.emit(m));
        });
    }

    registerConfirmReady() {
        this.connSvc.registerMessageReceiver('ConfirmReady', ["user"], (message: UserIdMessage) => {
            logger.debug(`[MatchmakingService.registerUserConfirmedReady] Received userConfirmedReady message ${JSON.stringify(message)}`);

            const [newState, messages, actions] = onConfirmedReady(this.state, message);
            this.state = newState;

            this.stateLoggingSvc.log({
                message: {
                    ...message
                },
                newState: {
                    ...this.state
                }
            });

            messages.forEach(m => this.connSvc.emit(m));
            this.processActions(actions);
        });
    }

    registerUserDisconnected() {
        this.connSvc.registerDisconnectionReceiver('userDisconnected', (message: UserIdMessage) => {
            logger.debug(`[MatchmakingService.registerUserDisconnected] Received userDisconnected message ${JSON.stringify(message)}`);

            const [newState, messages, actions] = onUserDisconnected(this.state, message);
            this.state = newState;

            this.stateLoggingSvc.log({
                message: {
                    ...message
                },
                newState: {
                    ...this.state
                }
            });

            messages.forEach(m => this.connSvc.emit(m));
        });
    }

    registerAskForLobbyData() {
        this.connSvc.registerMessageReceiver('askForLobbyData', ["user"], (message: UserIdMessage) => {
            logger.debug(`[MatchmakingService.registerAskForLobby] Received ask for lobby message ${JSON.stringify(message)}`);

            this.connSvc.emit(<SendableMessage>{
                type: "updateGameLobby",
                payload: {
                    users: this.state.users
                },
                receivers: message.payload.userId
            });
        });
    }

    processActions(actions: NewSchedulableAction[]) {
        actions.forEach(a => {
            logger.debug(`[MatchmakingService.processActions] Scheduling action ${JSON.stringify(a)}`);
            this.scheSvc.addSchedulableAction(a);
        })
    }

}