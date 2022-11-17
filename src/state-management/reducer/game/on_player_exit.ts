import { GameState, GameReducerReturn } from '../../../types/state/game.state';
import { UserIdMessage, SendableMessage } from '../../../types/message';
import { NewSchedulableAction } from '../../../types/action';
import { PlayerDiedMessage, playerDiedMessageType } from './on_scanned';

export const internalPlayerExitActionType = 'internalPlayerExit';

export const onPlayerExit = (state: GameState, message: UserIdMessage): GameReducerReturn => {
    const player = state.players.find(p => p.id === message.payload.userId);
    if (!player) {
        return [state, [], []];
    }

    var messages: SendableMessage[] = [];
    state.players.forEach(p => {
        if (p.id === player.id) {
            messages.push({
                type: "youExit",
                receivers: p.id
            });
        } else {
            messages.push({
                type: "playerExit",
                receivers: p.id,
                payload: {
                    scanId: player.id,
                    nickname: player.nickname
                }
            });
        }
    })

    var actions: NewSchedulableAction[] = [];
    actions.push(<NewSchedulableAction>{
        type: internalPlayerExitActionType,
        message: <PlayerDiedMessage>{
            type: playerDiedMessageType,
            payload: {
                player: player,
            },
        },
        delay: 0,
    });

    return [state, messages, actions];
}