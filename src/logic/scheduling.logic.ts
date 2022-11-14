import { io as Client } from "socket.io-client";
import { SchedulableAction, SchedulableActionCategory, NewSchedulableAction } from '../types/action';
import { SchedulingDatabase } from '../data/scheduling.db';
import { globalVariables } from "../types/global_variables";
import { logger } from '../logger';

export class SchedulingService {

    private schedulableActions: SchedulableAction[] = [];
    private pausedActions: NewSchedulableAction[] = [];
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
            logger.debug(`[SchedulingService.addSchedulableAction] Executing action ${JSON.stringify(identifiableAction)}`);
            // Remove from list
            this.schedulableActions = this.schedulableActions.filter(a => a.id !== identifiableAction.id);

            // Process the action
            this.socketToServer.emit(identifiableAction.message.type, identifiableAction.message);
            logger.debug(`[SchedulingService.addSchedulableAction] Message sent ${JSON.stringify(identifiableAction.message)}`);
        }, schedulableAction.delay);

        // Assign ID
        const identifiableAction = <SchedulableAction>{
            ...schedulableAction,
            id: Math.random().toString(36).substring(7),
            creationTime: Date.now(),
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

    pauseAllActions() {
        this.schedulableActions.forEach(a => {
            clearTimeout(a.cancellable);
            a.id = null;
            a.delay -= Date.now() - a.creationTime + 5000;

            const newAction = <NewSchedulableAction>{
                ...a
            }

            this.pausedActions.push(newAction);
        });
    }

    resumeAllActions() {
        this.pausedActions.forEach(pa => this.addSchedulableAction(pa));
    }

}
