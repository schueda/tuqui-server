import { MatchmakingDatabase } from '../data/matchmaking.db';
import { ConnectionService } from './connection.logic';
import { Message, ConnectionMessage } from '../types/message';
import { logger } from '../logger';
import { MatchmakingState } from '../state-management/state/matchmaking.state';
import { onUserConnected } from '../state-management/reducer/matchmaking/on_user_connected';

export class MatchmakingService {
    constructor(private db: MatchmakingDatabase, private connSvc: ConnectionService) {
        this.registerUserConnect();
    }

    state = <MatchmakingState>{};

    registerUserConnect() {
        this.connSvc.registerConnectionReceiver('MatchmakingService', (message: ConnectionMessage) => {
            logger.debug(`[MatchmakingService.registerUserConnect] Received connection message ${message.payload.userId}`);

            const [newState, messages] = onUserConnected(this.state, message);
            this.state = newState;

            messages.forEach(m => this.connSvc.emit(m));
        });
    }
}