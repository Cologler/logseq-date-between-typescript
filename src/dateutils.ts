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

const DateFormatConfigsMappings = new Map<string, {
    Regex: RegExp
}>();
(() => {
    for (const dateFormat of ['yyyy-MM-dd', 'yyyy-MM-dd EEEE', 'yyyy/MM/dd', 'yyyy_MM_dd']) {
        const lookupRegex = new RegExp(dateFormat
            .replace('yyyy', '(?<year>\\d{4})')
            .replace('MM', '(?<month>\\d{1,2})')
            .replace('dd', '(?<day>\\d{1,2})'))
        DateFormatConfigsMappings.set(dateFormat,
            {
                Regex: lookupRegex
            });
    }
})();

function parseDateFromDateFormat(content: string, preferredDateFormat: string) {
    const formatConfig = DateFormatConfigsMappings.get(preferredDateFormat);
    if (formatConfig) {
        const datePartMatch = content.match(formatConfig.Regex);
        if (datePartMatch) {
            content = datePartMatch[0];
        }
    }

    const parseFromDayjs = dayjs(content, preferredDateFormat);
    if (parseFromDayjs.isValid()) {
        return parseFromDayjs.toDate();
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
