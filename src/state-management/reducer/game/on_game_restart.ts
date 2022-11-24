import { GameState, GameReducerReturn } from '../../../types/state/game.state';
import { UserIdMessage, SendableMessage } from '../../../types/message';

export const onGameRestart = (state: GameState, message: UserIdMessage): GameReducerReturn => {
    const restartMessage = <SendableMessage>{
        type: "gameRestarted",
        receivers: "all"
    }

    return [state, [restartMessage], []];
}