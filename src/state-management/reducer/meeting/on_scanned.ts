import { SchedulableAction } from '../../../types/action';
import { GameState, GameReducerReturn, Player } from '../../../types/state/game.state';
import { UserIdMessage, SendableMessage } from '../../../types/message';
import { defaultTags } from '../../../types/tags';
import { defaultGameRules, GameRules } from '../../../types/game_rules';
import { GameTask } from '../../../types/task';

export type ScannedMessage = UserIdMessage & { payload: { scanResult: string } };
export type ErrorMessage = SendableMessage & { payload: { imageId: string, text: string }}

export const internalStartMeetingActionType = 'startMeeting';

export const onScanned = (state: GameState, message: ScannedMessage): GameReducerReturn => {
    var originPlayer = state.players.find(p => p.id === message.payload.userId);
    if (!originPlayer) {
        return [state, [], []];
    }

    if (originPlayer.isAlive) {
        if (state.mode === "meetingCalled") {
            if (defaultTags.campfireTag == message.payload.scanResult) {
                return onPlayerAttendedToMeeting(state, originPlayer);
            };
            return [state, [buildGoToCampfireMessage(originPlayer)], []];
        };
    } else {
        return [state, [buildYoureDeadMessage(originPlayer)], []];
    };
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

    if (newState.getOnMeetingPlayers().length === newState.getAlivePlayers().length) {
        newState.players = newState.players.map(p => { 
            p.attendedToMeeting = false;
            return p;
        });
        newState.mode = "meetingHappening";
        return [newState, [buildStartMeetingMessage()], []];
    }

    return [newState, [buildAttendedToMeetingMessage(newState, player)], []];
}

const buildAttendedToMeetingMessage = (state: GameState, player: Player): SendableMessage => {
    return <SendableMessage>{
        type: "attendedToMeeting",
        payload: {
            onMeetingPlayers: state.getOnMeetingPlayers()
        },
        receivers: player.id
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
        type: "youreDead",
        payload: {
            nickname: player.nickname
        },
        receivers: player.id
    }
}

const buildStartMeetingMessage = (): SendableMessage => {
    return <SendableMessage>{
        type: "startMeeting",
        receivers: "all"
    }
}