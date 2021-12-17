import fs from 'fs';
import got from 'got';
import Decimal from 'decimal.js-light';

// @ts-ignore
import APP_PACKAGE from '../package.json';

const EMPTY_STRING = '';

/*
* 1: Dimbreath
* 2: Kengxxiao
*/
var CURRENT_DATASET = 2;

/*
* Init
*/
async function init() {
    console.log(`${APP_PACKAGE.name} ${APP_PACKAGE.version} by ${APP_PACKAGE.author}\n`);

    try {
        let DATA: any = {};
        
        let CHAR_TABLE = JSON.parse((await got(getDataset('char'))).body);
        let SKILL_TABLE = JSON.parse((await got(getDataset('skill'))).body);

        for (const key in CHAR_TABLE) {
            console.log(`Retrieving ${key}...`);

            let ARRAY_SKILLS: Array<any> = [];

            let character = CHAR_TABLE[key];

            for (var i = 0; i < character['skills'].length; i++) {
                let id = character['skills'][i].skillId;
                let skill = SKILL_TABLE[id];

                if (assert(skill)) {
                    let iconId = skill.iconId;
                    let ENTRY: any = {};
                    let ARRAY_LEVELS: Array<any> = [];

                    let MASTERY = 1;

                    for (var j = 0; j < skill['levels'].length; j++) {
                        var name = `${j + 1}`;
                        let level = skill['levels'][j];

                        if (j == 0) {
                            (<any>ENTRY)['name'] = level['name'];
                        } else if (j > 6) {
                            name = `M${MASTERY}`;
                            MASTERY++;
                        }

                        let duration = getDuration(level.duration, level.blackboard);

                        ARRAY_LEVELS.push({
                            level: name,
                            description: getDescription(level.description, level.blackboard, duration),
                            skillType: level.skillType,
                            duration: duration,
                            rangeId: level.rangeId,
                            spType: level.spData.spType,
                            initSp: level.spData.initSp,
                            spCost: level.spData.spCost,
                            maxChargeTime: level.spData.maxChargeTime,
                            increment: level.spData.increment
                        });
                    }

                    if (!assert(iconId) || iconId.trim() === "") {
                        (<any>ENTRY)['icon'] = `https://raw.githubusercontent.com/Aceship/AN-EN-Tags/master/img/skills/skill_icon_${id}.png`;
                    } else {
                        (<any>ENTRY)['icon'] = `https://raw.githubusercontent.com/Aceship/AN-EN-Tags/master/img/skills/skill_icon_${iconId}.png`;
                    }
                    
                    (<any>ENTRY)['levels'] = ARRAY_LEVELS;

                    ARRAY_SKILLS.push(ENTRY);
                }
            }

            (<any>DATA)[key] = {
                name: character.name,
                skills: ARRAY_SKILLS
            }
        }

        if (!fs.existsSync('./output')) fs.mkdirSync('./output');

        fs.writeFileSync('./output/skills.json', JSON.stringify(DATA, null, 2));

        console.log(`All data retrieved! Please check the 'output' folder.`);
    } catch (e) {
        console.log(e);
    }

    return 0;
}

function getDescription(text: string, blackboard: Array<any>, duration: number) {
    let result = text;

    if (blackboard) {
        result = result.replace(/<@ba.rem>/gi, EMPTY_STRING);
        result = result.replace(/<@ba.vdown>/gi, EMPTY_STRING);
        result = result.replace(/<@ba.vup>/gi, EMPTY_STRING);
        result = result.replace(/<\$ba.buffres>/gi, EMPTY_STRING);
        result = result.replace(/<\$ba.camou>/gi, EMPTY_STRING);
        result = result.replace(/<\$ba.cold>/gi, EMPTY_STRING);
        result = result.replace(/<\$ba.inspire>/gi, EMPTY_STRING);
        result = result.replace(/<\$ba.invisible>/gi, EMPTY_STRING);
        result = result.replace(/<\$ba.protect>/gi, EMPTY_STRING);
        result = result.replace(/<\$ba.root>/gi, EMPTY_STRING);
        result = result.replace(/<\$ba.sleep>/gi, EMPTY_STRING);
        result = result.replace(/<\$ba.sluggish>/gi, EMPTY_STRING);
        result = result.replace(/<\$ba.stun>/gi, EMPTY_STRING);
        result = result.replace(/<\$ba.shield>/gi, EMPTY_STRING);
        result = result.replace(/<\$ba.binding>/gi, EMPTY_STRING);
        result = result.replace(/<\$ba.dt.neural>/gi, EMPTY_STRING);
        result = result.replace(/<\/>/gi, EMPTY_STRING);
        //result = result.replace(REGEX_LINEBREAK, '. ');

        const matches = result.matchAll(/(?<=\{).+?(?=\})/gi);

        for (const match of matches) {
            let key = match[0];
            let matcherKey = key.toLowerCase();

            if (matcherKey.includes(':')) {
                matcherKey = matcherKey.substring(0, matcherKey.indexOf(':'));
            }

            if (matcherKey.includes('-')) {
                matcherKey = matcherKey.replace('-', EMPTY_STRING);
            }

            let data = blackboard.find(o => o.key.toLowerCase() == matcherKey);

            if (!data && matcherKey == 'duration') {
                result.replace(`{duration}`, duration.toString());
            } else {
                let value = data['value'];

                if (key.includes('%')) {
                    value = `${new Decimal((value * 100)).toSignificantDigits(2)}%`;
                }

                result = result.replace(`{${key}}`, value);
            }

            result = result.replace('--', '-');
        }
    }

    return result.trim();
}

function getDuration(duration: any, blackboard: Array<any>) {
    if (blackboard) {
        let data = blackboard.find(o => o.key.toLowerCase() == 'duration');

        if (data) {
            let value = data['value'];

            if (value) return value;
        }
    }

    return duration;
}


/*
 * Util
 */
function getDataset(type: string): string {
    switch (type) {
        case 'char':
            switch (CURRENT_DATASET) {
                // Dimbreath
                case 1: return 'https://raw.githubusercontent.com/Dimbreath/ArknightsData/master/en-US/gamedata/excel/character_table.json';

                // Kengxxiao
                case 2: return 'https://raw.githubusercontent.com/Kengxxiao/ArknightsGameData/master/en_US/gamedata/excel/character_table.json'
            }
        break;

        case 'skill':
            switch (CURRENT_DATASET) {
                // Dimbreath
                case 1: return 'https://raw.githubusercontent.com/Kengxxiao/ArknightsGameData/master/en_US/gamedata/excel/character_table.json';

                // Kengxxiao
                case 2: return 'https://raw.githubusercontent.com/Kengxxiao/ArknightsGameData/master/en_US/gamedata/excel/skill_table.json'
            }
        break;
    }

    return '';
}

function assert(object: any): boolean {
    return object != (null || undefined)
}


/*
* Entry
*/
init();
