import { GameDatabase } from '../data/game.db';
import { ConnectionService } from './connection.logic';
import { UserIdMessage } from '../types/message';
import { logger } from '../logger';
import { SchedulableAction } from '../types/action';
import { onVote } from '../state-management/reducer/meeting/on_vote';

export type VoteMessage = UserIdMessage & { payload: { votedId: string } }

export class MeetingService {
    constructor(private db: GameDatabase, private connSvc: ConnectionService) {

    }

    startMeeting() {

    }

    registerVote() {
        this.connSvc.registerMessageReceiver('vote', (message: VoteMessage) => {
            logger.debug(`[MeetingService.registerVote] Received vote message ${JSON.stringify(message)}`);

            const [newState, messages, actions] = onVote(this.db.getGame(), message);

            this.db.updateGame(newState);
            messages.forEach(m => this.connSvc.emit(m));
            this.processActions(actions);
        })
    }

    processActions(actions: SchedulableAction[]) {
        actions.forEach(a => {
        })
    }
}