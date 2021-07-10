import fs from 'fs';
import got from 'got';
import Decimal from 'decimal.js-light';

const APP_PACKAGE = require('../package.json');

const EMPTY_STRING = '';
const REGEX_LINEBREAK = RegExp('[\n\r]', 'g');

/*
* Init
*/
async function init() {
    console.log(`${APP_PACKAGE.name} ${APP_PACKAGE.version} by ${APP_PACKAGE.author}\n`);

    try {
        let DATA: any = {};

        let CHAR_TABLE = JSON.parse(
            (await got('https://raw.githubusercontent.com/Dimbreath/ArknightsData/master/en-US/gamedata/excel/character_table.json')).body
        )

        let SKILL_TABLE = JSON.parse(
            (await got('https://raw.githubusercontent.com/Dimbreath/ArknightsData/master/en-US/gamedata/excel/skill_table.json')).body
        )

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

                        ARRAY_LEVELS.push({
                            level: name,
                            description: getDescription(level.description, level.blackboard),
                            skillType: level.skillType,
                            duration: level.duration,
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

function getDescription(text: string, blackboard: Array<any>) {
    let result = text;

    if (blackboard) {
        result = result.replace(/<@ba.rem>/gi, EMPTY_STRING);
        result = result.replace(/<@ba.vdown>/gi, EMPTY_STRING);
        result = result.replace(/<@ba.vup>/gi, EMPTY_STRING);
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
            let value = data['value'];

            if (key.includes('%')) {
                value = `${new Decimal((value * 100)).toSignificantDigits(2)}%`;
            }

            result = result.replace(`{${key}}`, value);
            result = result.replace('--', '-');
        }
    }

    return result;
}


/*
 * Util
 */
function assert(object: any): boolean {
    return object != (null || undefined)
}


/*
* Entry
*/
init();
