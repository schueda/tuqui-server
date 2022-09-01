import { io as Client } from "socket.io-client";
import { SchedulableAction, SchedulableActionCategory, NewSchedulableAction } from '../types/action';
import { SchedulingDatabase } from '../data/scheduling.db';
import { globalVariables } from "../types/global_variables";
import { logger } from '../logger';

export class SchedulingService {

    private schedulableActions: SchedulableAction[] = [];
    private socketToServer: any;

    constructor(private db: SchedulingDatabase) {
        // Create a socket pointing to self
        this.socketToServer = Client(`http://localhost:${globalVariables.port}`, {
            query: {
                serviceId: '1'
            }
        });
    }

    addSchedulableAction(schedulableAction: NewSchedulableAction) {

        if (schedulableAction.delay === 0) {
            logger.debug(`[SchedulingService.addSchedulableAction] Executing action immediately`);
            logger.debug(`[SchedulingService.addSchedulableAction] Action: ${JSON.stringify(schedulableAction)}`);
            logger.debug(`[SchedulingService.addSchedulableAction] Socket.connected: ${JSON.stringify(this.socketToServer.connected)}`);
            this.socketToServer.emit(schedulableAction.message.type, schedulableAction.message);
            return;
        }

        // Create setTimeout
        const cancellable = setTimeout(() => {
            // Remove from list
            this.schedulableActions = this.schedulableActions.filter(a => a.id !== identifiableAction.id);

            // Process the action
            this.socketToServer.emit(identifiableAction.message.type, identifiableAction.message.payload);
        }, schedulableAction.delay);

        // Assign ID
        const identifiableAction = <SchedulableAction>{
            ...schedulableAction,
            id: Math.random().toString(36).substring(7),
            cancellable
        };

        // Add to list 
        this.schedulableActions.push(identifiableAction);
    }

    getScheduledActionsWithCategory(category: SchedulableActionCategory) {
        return this.schedulableActions.filter(a => a.category === category);
    }

    cancelAllActionsWithCategory(category: SchedulableActionCategory) {
        this.getScheduledActionsWithCategory(category).forEach(a => {
            clearTimeout(a.cancellable);
            this.schedulableActions = this.schedulableActions.filter(sa => sa.id !== a.id);
        });
    }

    cancelAllActions() {
        this.schedulableActions.forEach(a => clearTimeout(a.cancellable));
        this.schedulableActions = [];
    }
}
