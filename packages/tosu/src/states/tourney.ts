import { wLogger } from '@tosu/common';

import { AbstractState } from '@/states';

export type ITourneyManagerChatItem = {
    time: string;
    name: string;
    content: string;
};

export class TourneyManager extends AbstractState {
    isDefaultState: boolean = true;

    ChatAreaAddr: number = 0;

    ipcState: number = 0;
    leftStars: number = 0;
    rightStars: number = 0;
    bestOf: number = 0;
    starsVisible: boolean = false;
    scoreVisible: boolean = false;
    firstTeamName: string = '';
    secondTeamName: string = '';
    firstTeamScore: number = 0;
    secondTeamScore: number = 0;

    messages: ITourneyManagerChatItem[] = [];

    userAccuracy: number = 0.0;
    userRankedScore: number = 0;
    userPlayCount: number = 0;
    userGlobalRank: number = 0;
    userPP: number = 0;
    userName: string = '';
    userCountry: string = '';
    userID: number = 0;

    reset() {
        if (this.isDefaultState) {
            return;
        }

        this.isDefaultState = true;
        this.userAccuracy = 0.0;
        this.userRankedScore = 0;
        this.userPlayCount = 0;
        this.userGlobalRank = 0;
        this.userPP = 0;
        this.userName = '';
        this.userCountry = '';
        this.userID = 0;
    }

    updateState() {
        try {
            wLogger.debug('TMD(updateState) Starting');

            const result = this.game.memory.tourney();
            if (result instanceof Error) throw result;
            if (typeof result === 'string') {
                wLogger.debug(`TMD(updateState) ${result}`);
                return 'not-ready';
            }

            this.ipcState = result.ipcState;
            this.leftStars = result.leftStars;
            this.rightStars = result.rightStars;
            this.bestOf = result.bestOf;
            this.starsVisible = result.starsVisible;
            this.scoreVisible = result.scoreVisible;
            this.firstTeamName = result.firstTeamName;
            this.secondTeamName = result.secondTeamName;
            this.firstTeamScore = result.firstTeamScore;
            this.secondTeamScore = result.secondTeamScore;

            const messages = this.game.memory.tourneyChat(this.messages);
            if (messages instanceof Error) throw Error;
            if (!Array.isArray(messages)) return;

            this.messages = messages;

            this.resetReportCount('TMD(updateState)');
        } catch (exc) {
            this.reportError(
                'TMD(updateState)',
                10,
                `TMD(updateState) ${(exc as any).message}`
            );
            wLogger.debug(exc);
        }
    }

    updateUser() {
        try {
            const gameplay = this.game.get('gameplay');
            if (gameplay === null) {
                return;
            }

            const result = this.game.memory.tourneyUser();
            if (result instanceof Error) throw result;
            if (typeof result === 'string') {
                wLogger.debug(`TUPD(updateState) ${result}`);
                this.reset();

                if (gameplay.isDefaultState === true) return;
                gameplay.init(undefined, 'tourney');
                return;
            }

            this.resetReportCount('TUPD(updateState) Slot');

            this.userAccuracy = result.accuracy;
            this.userRankedScore = result.rankedScore;
            this.userPlayCount = result.playcount;
            this.userPP = result.pp;
            this.userName = result.name;
            this.userCountry = result.country;
            this.userID = result.id;

            this.isDefaultState = false;

            this.resetReportCount('TUPD(updateState)');
        } catch (exc) {
            this.reportError(
                'TUPD(updateState)',
                10,
                `TUPD(updateState) ${(exc as any).message}`
            );
            wLogger.debug(exc);
        }
    }
}
