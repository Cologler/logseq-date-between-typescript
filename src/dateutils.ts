import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

// add any language here:
import 'dayjs/locale/ja'
import dayjsZhCn from 'dayjs/locale/zh-cn'
import 'dayjs/locale/zh-hk'
import 'dayjs/locale/zh-tw'
import dayjsZh from 'dayjs/locale/zh'

const today = 'today';

(dayjsZhCn as any)[today] = '今天';
(dayjsZh as any)[today] = '今天';

dayjs.extend(relativeTime);

// All formats (from https://github.com/logseq/logseq/blob/master/src/main/frontend/date.cljs):
const logseqDateFormats = [
    "do MMM yyyy",
    "do MMMM yyyy",
    "MMM do, yyyy",
    "MMMM do, yyyy",
    "E, dd-MM-yyyy",
    "E, dd.MM.yyyy",
    "E, MM/dd/yyyy",
    "E, yyyy/MM/dd",
    "EEE, dd-MM-yyyy",
    "EEE, dd.MM.yyyy",
    "EEE, MM/dd/yyyy",
    "EEE, yyyy/MM/dd",
    "EEEE, dd-MM-yyyy",
    "EEEE, dd.MM.yyyy",
    "EEEE, MM/dd/yyyy",
    "EEEE, yyyy/MM/dd",
    "dd-MM-yyyy",
    "MM/dd/yyyy",
    "MM-dd-yyyy",
    "MM_dd_yyyy",
    "yyyy/MM/dd",
    "yyyy-MM-dd",
    "yyyy-MM-dd EEEE",
    "yyyy_MM_dd",
    "yyyyMMdd",
    "yyyy年MM月dd日",
]

const DateFormatConfigsMappings = new Map<string, {
    contentRegex: RegExp
}>();
(() => {
    for (const originDateFormat of logseqDateFormats) {
        let dateFormat = originDateFormat;

        // remove day of week
        dateFormat = dateFormat.replace(/E/g, '');
        if (dateFormat[0] === ',') {
            dateFormat = dateFormat.substring(1);
        }
        dateFormat = dateFormat.trim();

        const contentLookupRegex = new RegExp(dateFormat
            .replace('yyyy', '(?<year>\\d{4})')
            .replace('dd', '(?<day>\\d{1,2})')
            .replace('do', '(?<day>\\d{1,2})(?:st|nd|rd|th)')
            .replace('MMMM', '(?<month>janary|february|march|april|may|june|july|august|september|october|november|december)')
            .replace('MMM', '(?<month>jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)')
            .replace('MM', '(?<month>\\d{1,2})')
            .replace('.', '\\.')
        , 'i');

        DateFormatConfigsMappings.set(originDateFormat,
            {
                contentRegex: contentLookupRegex
            });
    }
})();

const monthsMap: { [name: string]: number | undefined } = {
    janary: 1,
    february: 2,
    march: 3,
    april: 4,
    may: 5,
    june: 6,
    july: 7,
    august: 8,
    september: 9,
    october: 10,
    november: 11,
    december: 12,

    jan: 1,
    feb: 2,
    mar: 3,
    apr: 4,
    jun: 6,
    jul: 7,
    aug: 8,
    sep: 9,
    oct: 10,
    nov: 11,
    dec: 12,
}

function parseDateFromDateFormat(content: string, preferredDateFormat: string) {
    const formatConfig = DateFormatConfigsMappings.get(preferredDateFormat);

    if (formatConfig) {
        const datetimeMatch = content.match(formatConfig.contentRegex);
        if (datetimeMatch) {
            const monthStr = datetimeMatch.groups!.month.toLowerCase();
            const month = monthsMap[monthStr] ?? parseInt(monthStr);
            return new Date(parseInt(datetimeMatch.groups!.year), month - 1, parseInt(datetimeMatch.groups!.day))
        }
        else {
            console.debug(`Unable parse ${content} with ${preferredDateFormat}`);
        }
    }
    else {
        console.debug(`Not handled date format: ${preferredDateFormat}`);
    }
}

export function parseDate(content: string, preferredDateFormat?: string) {
    if (preferredDateFormat) {
        const dateFromFormat = parseDateFromDateFormat(content, preferredDateFormat);
        if (dateFromFormat) {
            return dateFromFormat;
        }
    }
}

export function getDateBetweenString(date: Date, other: Date) {
    const compared = dayjs(other).startOf('day');
    const day = dayjs(date).startOf('day');
    const locale = dayjs.Ls[dayjs.locale()] as any;

    if (day.isSame(compared)) {
        return locale[today] || today;
    }

    return day.from(compared);
}
