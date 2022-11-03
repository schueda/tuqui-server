import { GameState, GameReducerReturn, Player, getOnMeetingPlayers, getAlivePlayers } from '../../../types/state/game.state';
import { UserIdMessage, SendableMessage } from '../../../types/message';
import { defaultTags } from '../../../types/tags';
import { ErrorMessage, buildYoureDeadMessage } from '../game/on_scanned';

export type ScannedMessage = UserIdMessage & { payload: { scanResult: string } };

export const internalStartMeetingActionType = 'startMeeting';

export const onScanned = (state: GameState, message: ScannedMessage): GameReducerReturn => {
    var originPlayer = state.players.find(p => p.id === message.payload.userId);
    if (!originPlayer) {
        return [state, [], []];
    }

    if (state.mode === "meetingCalled") {
        if (originPlayer.alive) {
            if (defaultTags.campfireTag === message.payload.scanResult) {
                return onPlayerAttendedToMeeting(state, originPlayer);
            };
            return [state, [buildGoToCampfireMessage(originPlayer)], []];
        } else {
            return [state, [buildYoureDeadMessage(originPlayer)], []];
        };
    };

    return [undefined, [], []];
}

const onPlayerAttendedToMeeting = (state: GameState, player: Player): GameReducerReturn => {
    var newState = <GameState>{
        ...state,
        players: state.players.map(p => {
            if (p.id === player.id) {
                p.attendedToMeeting = true;
            }
            return p;
        })
    }

    if (getOnMeetingPlayers(newState).length === getAlivePlayers(newState).length) {
        newState.players = newState.players.map(p => {
            p.attendedToMeeting = false;
            return p;
        });
        newState.mode = "meetingHappening";
        //TODO: CONTAR O TEMPO
        return [newState, [buildMeetingStartedMessage(newState)], []];
    }

    return [newState, [buildYoureOnLobbyMessage(player), buildPlayerOnMeetingLobbyMessage(player)], []];
}

const buildYoureOnLobbyMessage = (player: Player): SendableMessage => {
    return <SendableMessage>{
        type: "attendedToMeeting",
        receivers: player.id
    }
}

const buildPlayerOnMeetingLobbyMessage = (player: Player): SendableMessage => {
    return <SendableMessage>{
        type: "playerOnMeetingLobby",
        payload: {
            userId: player.id
        },
        receivers: "all"
    }
}

const buildGoToCampfireMessage = (player: Player): ErrorMessage => {
    return <ErrorMessage>{
        type: "error",
        payload: {
            errorId: "goToCampfire",
        },
        receivers: player.id
    }
}

const buildMeetingStartedMessage = (state: GameState): SendableMessage => {
    return <SendableMessage>{
        type: "meetingStarted",
        payload: {
            players: getAlivePlayers(state).map(p => {
                return {
                    scanId: p.id,
                    nickname: p.nickname,
                    alive: p.alive,
                    attendedToMeeting: p.attendedToMeeting
                }
            })
        },
        receivers: "all"
    }
}