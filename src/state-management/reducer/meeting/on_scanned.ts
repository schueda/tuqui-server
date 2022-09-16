import { GameState, GameReducerReturn, Player, getOnMeetingPlayers, getAlivePlayers } from '../../../types/state/game.state';
import { UserIdMessage, SendableMessage } from '../../../types/message';
import { defaultTags } from '../../../types/tags';
import { logger } from '../../../logger';

export type ScannedMessage = UserIdMessage & { payload: { scanResult: string } };
export type ErrorMessage = SendableMessage & { payload: { imageId: string, text: string } }

export const internalStartMeetingActionType = 'startMeeting';

export const onScanned = (state: GameState, message: ScannedMessage): GameReducerReturn => {
    var originPlayer = state.players.find(p => p.id === message.payload.userId);
    if (!originPlayer) {
        return [state, [], []];
    }

    if (state.mode === "meetingCalled") {
        if (originPlayer.isAlive) {
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
        return [newState, [buildMeetingStartedMessage()], []];
    }

    return [newState, [buildYoureOnLobbyMessage(player), buildPlayerOnMeetingLobbyMessage(newState)], []];
}

const buildYoureOnLobbyMessage = (player: Player): SendableMessage => {
    return <SendableMessage>{
        type: "onMeetingLobby",
        receivers: player.id
    }
}

const buildPlayerOnMeetingLobbyMessage = (state: GameState): SendableMessage => {
    return <SendableMessage>{
        type: "playerOnMeetingLobby",
        payload: {
            playersIds: getOnMeetingPlayers(state).map(p => p.id)
        },
        receivers: "all"
    }
}

const buildGoToCampfireMessage = (player: Player): ErrorMessage => {
    return <ErrorMessage>{
        type: "error",
        payload: {
            imageId: "goToCampfire",
            text: "Vá para a campfire."
        },
        receivers: player.id
    }
}

const buildYoureDeadMessage = (player: Player): SendableMessage => {
    return <SendableMessage>{
        type: "error",
        payload: {
            imageId: "youreDead",
            text: "Você está morto."
        },
        receivers: player.id
    }
}

const buildMeetingStartedMessage = (): SendableMessage => {
    return <SendableMessage>{
        type: "meetingStarted",
        receivers: "all"
    }
}