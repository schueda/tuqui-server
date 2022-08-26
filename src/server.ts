import { logger } from "./logger";
import { buildApp, di } from './di';

const app = buildApp();

const port = process.env.PORT || app.PORT;

app.server.listen(port, function () {
    logger.info(`[server] Server running in port ${port}`)
});

process.on('SIGINT', function () {
    di.eventBusSvc?.emit('shutdown', {});
    process.exit();
});
