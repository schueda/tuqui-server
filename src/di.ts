import { App } from './app';
import { ConnectionDatabase } from './data/connection.db';
import { ConnectionService } from './logic/connection.logic';

export const buildApp = (() => {
    // DB
    const connectionDb = new ConnectionDatabase();

    // Logic
    const connectionSvc = new ConnectionService(connectionDb);

    // App
    const app = new App(connectionSvc);

    return app
})