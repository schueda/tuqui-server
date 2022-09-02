import { StateLogEntry } from "../types/state-logging";
import * as fs from 'fs';
import { EventBusService } from './event-bus.logic';

export class StateLoggingService {

    constructor(private logType: string, eventBusSvc: EventBusService) {
        eventBusSvc.on(`shutdown`, () => {
            this.write();
        });
    }

    private logs: StateLogEntry[] = [];
    private dateSuffix = new Date().toISOString().replace(/[-:T]/g, '');

    log(entry: StateLogEntry, timestamp?: number) {
        entry.message.timestamp = timestamp || Date.now();
        this.logs.push(entry);

        this.write();
    }

    write() {
        // Write the logs to a file based on the date
        const dir = "./logs";
        const filename = `${dir}/${this.logType}-state-log-${this.dateSuffix}.json`;

        // Check if the logs folder exists. if not, create
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir);
        }

        fs.writeFileSync(filename, JSON.stringify(this.logs));
    }

    clear() {
        this.logs = [];
    }

}