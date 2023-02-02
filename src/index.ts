
const dateFormatRegexpsMappings = new Map<string, RegExp>();
(() => {
    for (const dateFormat of ['yyyy-MM-dd', 'yyyy-MM-dd EEEE', 'yyyy/MM/dd', 'yyyy_MM_dd']) {
        dateFormatRegexpsMappings.set(dateFormat,
            /(?<year>\d{4})[/\-_]?(?<month>\d{1,2})[/\-_]?(?<day>\d{1,2})/);
    }
})();

async function main () {
    const preferredDateFormat = (await logseq.App.getUserConfigs()).preferredDateFormat; // how to parse from this?
    if (!dateFormatRegexpsMappings.has(preferredDateFormat)) {
        return;
    }

    const dateFormatRegex = dateFormatRegexpsMappings.get(preferredDateFormat)!;

    function buildDate(yearString: string, monthString: string, dayString: string) {
        const date = new Date(`${yearString}-${monthString}-${dayString}`);
        if (date.toString() === 'Invalid Date') {
            return null;
        }
        return date;
    }

    function parseDate(content: string) {

        const match = content.match(dateFormatRegex);
        if (match?.groups) {
            return buildDate(
                match.groups.year,
                match.groups.month,
                match.groups.day
            )
        }

        return null;
    }

    function getBetweenString(date: Date) {
        const today = new Date();
        if (today > date) {
            const days = (today.getTime() - date.getTime()) / 1000 / 3600 / 24;
            const years = today.getFullYear() - date.getFullYear();
            const months = years * 12 + today.getMonth() - date.getMonth();

            if (days > 365) {
                return `${Math.max(years, 1)} years ago`;

            } else if (days > 30) {
                return `${Math.max(months, 1)} months ago`;

            } else if (days < 1) {
                return "today";

            } else {
                return `${days.toFixed(0)} days ago`;
            }
        } else {
            const days = ((date.getTime() - today.getTime()) / 1000 / 3600 / 24);
            if (days < 1) {
                return "today";
            } else {
                return `after ${days.toFixed(0)} days`;
            }
        }
    }

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
                    const date = parseDate(block.content);
                    if (date) {
                        const disposer: any = logseq.App.onBlockRendererSlotted(block.uuid, ({ slot }) => {
                            let between = getBetweenString(date);
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
                const date = parseDate(block.content);
                if (date) {
                    let between = getBetweenString(date);
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
logseq.ready(main).catch(console.error);
