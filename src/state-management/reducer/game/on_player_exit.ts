import { GameState, GameReducerReturn, getRobots, getWizards, getAlivePlayers } from '../../../types/state/game.state';
import { UserIdMessage, SendableMessage } from '../../../types/message';
import { NewSchedulableAction } from '../../../types/action';
import { PlayerDiedMessage, playerDiedMessageType } from './on_scanned';

export const internalPlayerExitActionType = 'internalPlayerExit';

export const onPlayerExit = (state: GameState, message: UserIdMessage): GameReducerReturn => {
    const player = state.players.find(p => p.id === message.payload.userId);
    if (!player) {
        return [state, [], []];
    }
    player.alive = false;
    player.diedRecently = true;

    state = <GameState>{
        ...state,
        players: state.players.map(p => {
            if (p.id === player.id) {
                return player;
            }
            return p;
        })
    }

    if (getRobots(state).filter(p => p.alive).length === 0) {
        const message = <SendableMessage>{
            type: "wizardsWon",
            payload: {
                wizards: getWizards(state).map(p => {
                    return {
                        scanId: p.id,
                        nickname: p.nickname,
                        alive: p.alive,
                        attendedToMeeting: p.attendedToMeeting
                    }
                }),
                robots: getRobots(state).map(p => {
                    return {
                        scanId: p.id,
                        nickname: p.nickname,
                        alive: p.alive,
                        attendedToMeeting: p.attendedToMeeting
                    }
                })
            },
            receivers: state.players.filter(p => p != player).map(p => p.id)
        }

        return [state, [message], []];
    }

    if (getWizards(state).filter(p => p.alive).length === 0) {
        const message = <SendableMessage>{
            type: "robotsWon",
            payload: {
                wizards: getWizards(state).map(p => {
                    return {
                        scanId: p.id,
                        nickname: p.nickname,
                        alive: p.alive,
                        attendedToMeeting: p.attendedToMeeting
                    }
                }),
                robots: getRobots(state).map(p => {
                    return {
                        scanId: p.id,
                        nickname: p.nickname,
                        alive: p.alive,
                        attendedToMeeting: p.attendedToMeeting
                    }
                })
            },
            receivers: state.players.filter(p => p != player).map(p => p.id)
        }

        return [state, [message], []];
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
                payload: {
                    deadCount: getWizards(state).length - getWizards(state).filter(p => !p.alive).length
                },
                receivers: p.id,
            });
        }
    })

    return [state, messages, []];
}