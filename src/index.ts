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

function getDateBetweenTodayString(date: Date) {
    return getDateBetweenString(date, new Date());
}

async function main () {
    const userConfigs = await logseq.App.getUserConfigs();
    const preferredDateFormat = userConfigs.preferredDateFormat;
    dayjs.locale(userConfigs.preferredLanguage);

    const unloadPageDisposers: (() => void)[] = [];
    const unloadPluginDisposers: (() => void | undefined)[] = [];

    function disposeUnloadPageDisposers() {
        for (const disposer of unloadPageDisposers.reverse()) {
            disposer();
        }
        unloadPageDisposers.length = 0;
    }

    logseq.beforeunload(async () => {
        disposeUnloadPageDisposers();

        for (const disposer of unloadPluginDisposers.reverse()) {
            disposer?.();
        }
        unloadPluginDisposers.length = 0;
    });

    function getDateBetweenBlock(between: string) {
        return `
            <span class="date-between">${between}</span>
        `;
    }

    logseq.provideStyle(`
        .date-between {
            border: 1px solid var(--ls-active-secondary-color);
            border-radius: 12px;
            padding: 0 0.4em 0 0.4em;
            font-size: 0.9em;
            color: var(--ls-active-secondary-color);
        }
    `);

    function registerForRouteChanged() {
        // todo.
        unloadPluginDisposers.push(
            logseq.App.onRouteChanged(async () => {
                disposeUnloadPageDisposers();

                const blocks = await logseq.Editor.getCurrentPageBlocksTree();
                for (const block of blocks) {
                    const date = parseDate(block.content, preferredDateFormat);
                    if (date) {
                        const disposer: any = logseq.App.onBlockRendererSlotted(block.uuid, ({ slot }) => {
                            let between = getDateBetweenTodayString(date);
                            logseq.provideUI({
                                slot,
                                template: getDateBetweenBlock(between),
                            });
                        });
                        unloadPageDisposers.push(disposer);
                    }
                }
            })
        );
    }

    unloadPluginDisposers.push(
        logseq.App.onMacroRendererSlotted(async e => {
            if (e.payload.arguments.length !== 1 || e.payload.arguments[0] !== 'date-between-today') {
                return;
            }

            const block = await logseq.Editor.getBlock(e.payload.uuid);
            if (block) {
                const date = parseDate(block.content, preferredDateFormat);
                if (date) {
                    let between = getDateBetweenTodayString(date);
                    logseq.provideUI({
                        slot: e.slot,
                        key: `date-between-${block.uuid}`,
                        replace: true,
                        template: getDateBetweenBlock(between),
                    });
                }
            }
        }) as any
    );

    unloadPluginDisposers.push(
        logseq.Editor.registerSlashCommand('DateBetween: Date between today', async e => {
            await logseq.Editor.insertAtEditingCursor('{{renderer date-between-today}}');
        }) as any
    )
}

// bootstrap
if (typeof logseq !== 'undefined') {
    logseq.ready(main).catch(console.error);
}
