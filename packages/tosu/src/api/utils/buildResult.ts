import path from 'path';

import {
    ApiAnswer,
    LeaderboardPlayer,
    TourneyIpcClient,
    TourneyValues
} from '@/api/types/v1';
import { InstanceManager } from '@/instances/manager';
import { LeaderboardPlayer as MemoryLeaderboardPlayer } from '@/states/gameplay';
import { calculateAccuracy } from '@/utils/calculators';
import { fixDecimals } from '@/utils/converters';
import { getOsuModsString } from '@/utils/osuMods';

const defaultLBPlayer = {
    name: '',
    score: 0,
    combo: 0,
    maxCombo: 0,
    mods: '',
    h300: 0,
    h100: 0,
    h50: 0,
    h0: 0,
    team: 0,
    position: 0,
    isPassing: 0
} as LeaderboardPlayer;

const convertMemoryPlayerToResult = (
    memoryPlayer: MemoryLeaderboardPlayer
): LeaderboardPlayer => ({
    name: memoryPlayer.Name,
    score: memoryPlayer.Score,
    combo: memoryPlayer.Combo,
    maxCombo: memoryPlayer.MaxCombo,
    mods: getOsuModsString(memoryPlayer.Mods),
    h300: memoryPlayer.H300,
    h100: memoryPlayer.H100,
    h50: memoryPlayer.H50,
    h0: memoryPlayer.H0,
    team: memoryPlayer.Team,
    position: memoryPlayer.Position,
    isPassing: Number(memoryPlayer.IsPassing)
});

export const buildResult = (instanceManager: InstanceManager): ApiAnswer => {
    const osuInstance = instanceManager.getInstance();
    if (!osuInstance) {
        return { error: 'not_ready' };
    }

    const {
        bassDensity,
        global,
        menu,
        gameplay,
        resultScreen,
        beatmapPP,
        user
    } = osuInstance.getServices([
        'bassDensity',
        'global',
        'menu',
        'gameplay',
        'resultScreen',
        'beatmapPP',
        'user'
    ]);

    const currentMods =
        global.status === 2 || global.status === 7
            ? gameplay.mods
            : global.menuMods;

    const resultScreenHits = {
        300: resultScreen.hit300,
        geki: resultScreen.hitGeki,
        100: resultScreen.hit100,
        katu: resultScreen.hitKatu,
        50: resultScreen.hit50,
        0: resultScreen.hitMiss
    };

    return {
        settings: {
            showInterface: global.showInterface,
            folders: {
                game: global.gameFolder,
                skin: global.skinFolder,
                songs: global.songsFolder
            }
        },
        menu: {
            mainMenu: {
                bassDensity: bassDensity.density
            },
            // TODO: Make enum for osu in-game statuses
            state: global.status,
            // TODO: Make enum for osu in-game modes
            gameMode: menu.gamemode,
            isChatEnabled: Number(Boolean(global.chatStatus)),
            bm: {
                time: {
                    firstObj: beatmapPP.timings.firstObj,
                    current: global.playTime,
                    full: beatmapPP.timings.full,
                    mp3: menu.mp3Length
                },
                id: menu.mapID,
                set: menu.setID,
                md5: menu.checksum,
                // TODO: make ranked status enum
                rankedStatus: menu.rankedStatus,
                metadata: {
                    artist: menu.artist,
                    artistOriginal: menu.artistOriginal,
                    title: menu.title,
                    titleOriginal: menu.titleOriginal,
                    mapper: menu.creator,
                    difficulty: menu.difficulty
                },
                stats: {
                    AR: fixDecimals(beatmapPP.calculatedMapAttributes.ar),
                    CS: fixDecimals(beatmapPP.calculatedMapAttributes.cs),
                    OD: fixDecimals(beatmapPP.calculatedMapAttributes.od),
                    HP: fixDecimals(beatmapPP.calculatedMapAttributes.hp),
                    SR: fixDecimals(beatmapPP.currAttributes.stars),
                    BPM: {
                        common: fixDecimals(beatmapPP.commonBPM),
                        min: fixDecimals(beatmapPP.minBPM),
                        max: fixDecimals(beatmapPP.maxBPM)
                    },
                    circles: beatmapPP.calculatedMapAttributes.circles,
                    sliders: beatmapPP.calculatedMapAttributes.sliders,
                    spinners: beatmapPP.calculatedMapAttributes.spinners,
                    holds: beatmapPP.calculatedMapAttributes.holds,
                    maxCombo: beatmapPP.calculatedMapAttributes.maxCombo,
                    fullSR: fixDecimals(
                        beatmapPP.calculatedMapAttributes.fullStars
                    ),
                    memoryAR: fixDecimals(menu.ar),
                    memoryCS: fixDecimals(menu.cs),
                    memoryOD: fixDecimals(menu.od),
                    memoryHP: fixDecimals(menu.hp)
                },
                path: {
                    full: path.join(
                        menu.folder || '',
                        menu.backgroundFilename || ''
                    ),
                    folder: menu.folder,
                    file: menu.filename,
                    bg: menu.backgroundFilename,
                    audio: menu.audioFilename
                }
            },
            mods: {
                num: currentMods,
                str: getOsuModsString(currentMods)
            },
            pp: {
                ...beatmapPP.ppAcc,
                strains: beatmapPP.strains,
                strainsAll: beatmapPP.strainsAll
            }
        },
        gameplay: {
            gameMode: gameplay.mode,
            name: gameplay.playerName,
            score: gameplay.score,
            accuracy: gameplay.accuracy,
            combo: {
                current: gameplay.combo,
                max: gameplay.maxCombo
            },
            hp: {
                normal: gameplay.playerHP,
                smooth: gameplay.playerHPSmooth
            },
            hits: {
                300: gameplay.hit300,
                geki: gameplay.hitGeki,
                100: gameplay.hit100,
                katu: gameplay.hitKatu,
                50: gameplay.hit50,
                0: gameplay.hitMiss,
                sliderBreaks: gameplay.hitSB,
                grade: {
                    current: gameplay.gradeCurrent,
                    maxThisPlay: gameplay.gradeExpected
                },
                unstableRate: gameplay.unstableRate,
                hitErrorArray: gameplay.hitErrors
            },
            pp: {
                current: fixDecimals(beatmapPP.currAttributes.pp),
                fc: fixDecimals(beatmapPP.currAttributes.fcPP),
                maxThisPlay: fixDecimals(beatmapPP.currAttributes.maxThisPlayPP)
            },
            keyOverlay: {
                k1: {
                    isPressed: gameplay.keyOverlay.K1Pressed,
                    count: gameplay.keyOverlay.K1Count
                },
                k2: {
                    isPressed: gameplay.keyOverlay.K2Pressed,
                    count: gameplay.keyOverlay.K2Count
                },
                m1: {
                    isPressed: gameplay.keyOverlay.M1Pressed,
                    count: gameplay.keyOverlay.M1Count
                },
                m2: {
                    isPressed: gameplay.keyOverlay.M2Pressed,
                    count: gameplay.keyOverlay.M2Count
                }
            },
            leaderboard: {
                hasLeaderboard: Boolean(gameplay.leaderboard),
                isVisible: gameplay.leaderboard
                    ? gameplay.leaderboard.isScoreboardVisible
                    : false,
                ourplayer:
                    gameplay.leaderboard && gameplay.leaderboard.player
                        ? convertMemoryPlayerToResult(
                              gameplay.leaderboard.player
                          )
                        : defaultLBPlayer,
                slots: gameplay.leaderboard
                    ? gameplay.leaderboard.leaderBoard.map((slot) =>
                          convertMemoryPlayerToResult(slot)
                      )
                    : []
            },
            _isReplayUiHidden: gameplay.isReplayUiHidden
        },
        resultsScreen: {
            mode: gameplay.mode,
            name: resultScreen.playerName,
            score: resultScreen.score,
            accuracy: calculateAccuracy({
                hits: resultScreenHits,
                mode: gameplay.mode
            }),
            maxCombo: resultScreen.maxCombo,
            mods: {
                num: resultScreen.mods,
                str: getOsuModsString(resultScreen.mods)
            },
            300: resultScreen.hit300,
            geki: resultScreen.hitGeki,
            100: resultScreen.hit100,
            katu: resultScreen.hitKatu,
            50: resultScreen.hit50,
            0: resultScreen.hitMiss,
            grade: resultScreen.grade,
            createdAt: resultScreen.date
        },
        userProfile: {
            rawLoginStatus: user.rawLoginStatus,
            name: user.name,
            accuracy: user.accuracy,
            rankedScore: user.rankedScore,
            id: user.id,
            level: user.level,
            playCount: user.playCount,
            playMode: user.playMode,
            rank: user.rank,
            countryCode: user.countryCode,
            performancePoints: user.performancePoints,
            rawBanchoStatus: user.rawBanchoStatus,
            backgroundColour: user.backgroundColour?.toString(16)
        },
        tourney: buildTourneyData(instanceManager)
    };
};

const buildTourneyData = (
    instanceManager: InstanceManager
): TourneyValues | undefined => {
    const osuTourneyManager = Object.values(
        instanceManager.osuInstances
    ).filter((instance) => instance.isTourneyManager);
    if (osuTourneyManager.length < 1) {
        return undefined;
    }

    const osuTourneyClients = Object.values(
        instanceManager.osuInstances
    ).filter((instance) => instance.isTourneySpectator);

    const mappedOsuTourneyClients = osuTourneyClients
        .sort((a, b) => a.ipcId - b.ipcId)
        .map<TourneyIpcClient>((instance, iterator) => {
            const { global, gameplay, tourneyManager } = instance.getServices([
                'global',
                'gameplay',
                'tourneyManager'
            ]);

            const currentMods =
                global.status === 2 || global.status === 7
                    ? gameplay.mods
                    : global.menuMods;

            const spectatorTeam =
                iterator < osuTourneyClients.length / 2 ? 'left' : 'right';

            return {
                team: spectatorTeam,
                spectating: {
                    name: tourneyManager.userName,
                    country: tourneyManager.userCountry,
                    userID: tourneyManager.userID,
                    accuracy: tourneyManager.userAccuracy,
                    rankedScore: tourneyManager.userRankedScore,
                    playCount: tourneyManager.userPlayCount,
                    globalRank: tourneyManager.userGlobalRank,
                    totalPP: tourneyManager.userPP
                },
                gameplay: {
                    gameMode: gameplay.mode,
                    name: gameplay.playerName,
                    score: gameplay.score,
                    accuracy: gameplay.accuracy,
                    combo: {
                        current: gameplay.combo,
                        max: gameplay.maxCombo
                    },
                    hp: {
                        normal: gameplay.playerHP,
                        smooth: gameplay.playerHPSmooth
                    },
                    hits: {
                        300: gameplay.hit300,
                        geki: gameplay.hitGeki,
                        100: gameplay.hit100,
                        katu: gameplay.hitKatu,
                        50: gameplay.hit50,
                        0: gameplay.hitMiss,
                        sliderBreaks: gameplay.hitSB,
                        grade: {
                            current: gameplay.gradeCurrent,
                            maxThisPlay: gameplay.gradeExpected
                        },
                        unstableRate: gameplay.unstableRate,
                        hitErrorArray: gameplay.hitErrors
                    },
                    mods: {
                        num: currentMods,
                        str: getOsuModsString(currentMods)
                    }
                }
            };
        });

    const { tourneyManager } = osuTourneyManager[0].getServices([
        'tourneyManager'
    ]);

    const mappedChat = tourneyManager.messages.map((message) => {
        const ipcClient = mappedOsuTourneyClients.find(
            (client) => client.spectating.name === message.name
        );

        return {
            team: ipcClient
                ? ipcClient.team
                : message.name === 'BanchoBot'
                  ? 'bot'
                  : 'unknown',
            time: message.time,
            name: message.name,
            messageBody: message.content
        };
    });

    return {
        manager: {
            ipcState: tourneyManager.ipcState,
            bestOF: tourneyManager.bestOf,
            teamName: {
                left: tourneyManager.firstTeamName,
                right: tourneyManager.secondTeamName
            },
            stars: {
                left: tourneyManager.leftStars,
                right: tourneyManager.rightStars
            },
            bools: {
                scoreVisible: tourneyManager.scoreVisible,
                starsVisible: tourneyManager.starsVisible
            },
            chat: mappedChat,
            gameplay: {
                score: {
                    left: tourneyManager.firstTeamScore,
                    right: tourneyManager.secondTeamScore
                }
            }
        },
        ipcClients: [...mappedOsuTourneyClients]
    };
};
