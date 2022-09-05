import { GameDatabase } from '../data/game.db';
import { ConnectionService } from './connection.logic';
import { UserIdMessage } from '../types/message';
import { logger } from '../logger';
import { onVote } from '../state-management/reducer/meeting/on_vote';
import { onScanned, ScannedMessage } from '../state-management/reducer/meeting/on_scanned';
import { onCallMeeting } from '../state-management/reducer/meeting/on_call_meeting';
import { SchedulingService } from './scheduling.logic';
import { StateLoggingService } from './state-logging.logic';
import { NewSchedulableAction } from '../types/action';

export type VoteMessage = UserIdMessage & { payload: { votedId: string } }

export class MeetingService {
    constructor(private db: GameDatabase, private connSvc: ConnectionService, private scheSvc: SchedulingService, private stateLoggingSvc: StateLoggingService) {
        this.registerCallMeeting();
        this.registerOnScanned();
        this.registerVote();
    }

    registerCallMeeting() {
        this.connSvc.registerMessageReceiver("callMeeting", ["user"], (message: UserIdMessage) => {
            logger.debug(`[GameService.registerCallMeeting] Received call meeting message ${JSON.stringify(message)}`);

            const [newState, messages, actions] = onCallMeeting(this.db.getGame(), message);

            this.stateLoggingSvc.log({
                message: {
                    ...message
                },
                newState: {
                    ...newState
                }
            });

            this.db.updateGame(newState);
            messages.forEach(m => this.connSvc.emit(m));
            this.processActions(actions);
        });
    }

    registerOnScanned() {
        this.connSvc.registerMessageReceiver('scanned', ["user"], (message: ScannedMessage) => {
            logger.debug(`[MeetingService.registerOnScanned] Received scanned message ${JSON.stringify(message)}`);

            const [newState, messages, actions] = onScanned(this.db.getGame(), message);

            if (newState == undefined) {
                return;
            }

            this.stateLoggingSvc.log({
                message: {
                    ...message
                },
                newState: {
                    ...newState
                }
            });

            this.db.updateGame(newState);
            messages.forEach(m => this.connSvc.emit(m));
            this.processActions(actions);
        })
    }


    registerVote() {
        this.connSvc.registerMessageReceiver('vote', ["user"], (message: VoteMessage) => {
            logger.debug(`[MeetingService.registerVote] Received vote message ${JSON.stringify(message)}`);

            const [newState, messages, actions] = onVote(this.db.getGame(), message);

            this.stateLoggingSvc.log({
                message: {
                    ...message
                },
                newState: {
                    ...newState
                }
            });

            this.db.updateGame(newState);
            messages.forEach(m => this.connSvc.emit(m));
            this.processActions(actions);
        })
    }

    processActions(actions: NewSchedulableAction[]) {
        actions.forEach(a => {
            this.scheSvc.addSchedulableAction(a);
        })
    }
}