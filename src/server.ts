import { logger } from "./logger";
import { buildApp } from './di';

const app = buildApp();

const port = app.PORT;

app.server.listen(port, function () {
    logger.info(`[server] Server running in port ${port}`)
});
