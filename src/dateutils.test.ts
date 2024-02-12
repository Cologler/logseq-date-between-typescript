
import { assert, describe, expect, it } from 'vitest';

import { parseDate, getDateBetweenString } from './dateutils';

describe('parseDate', () => {
    it('can parse yyyy/MM/dd', () => {
        expect(parseDate('1997/1/1', 'yyyy/MM/dd')).toStrictEqual(new Date(1997, 0, 1));
        expect(parseDate('1997/01/01', 'yyyy/MM/dd')).toStrictEqual(new Date(1997, 0, 1));
    });

    it('can parse yyyy-MM-dd', () => {
        expect(parseDate('1997-1-1', 'yyyy-MM-dd')).toStrictEqual(new Date(1997, 0, 1));
        expect(parseDate('1997-01-01', 'yyyy-MM-dd')).toStrictEqual(new Date(1997, 0, 1));
    });
});

describe('getDateBetweenString', () => {
    const today = new Date('2023/2/7');

    it('can show in * days', () => {
        expect(getDateBetweenString(new Date('2023/2/9'), today)).toStrictEqual('in 2 days');
        expect(getDateBetweenString(new Date('2023/2/8'), today)).toStrictEqual('in a day');
    });

    it('can show today', () => {
        expect(getDateBetweenString(new Date('2023/2/7'), today)).toStrictEqual('today');
    });

    it('can show * days ago', () => {
        expect(getDateBetweenString(new Date('2023/2/6'), today)).toStrictEqual('a day ago');
        expect(getDateBetweenString(new Date('2023/2/5'), today)).toStrictEqual('2 days ago');
        expect(getDateBetweenString(new Date('2023/2/1'), today)).toStrictEqual('6 days ago');
        expect(getDateBetweenString(new Date('2023/1/13'), today)).toStrictEqual('25 days ago');
    });

    it('can show months ago', () => {
        expect(getDateBetweenString(new Date('2023/1/11'), today)).toStrictEqual('a month ago');
        expect(getDateBetweenString(new Date('2023/1/10'), today)).toStrictEqual('a month ago');
        expect(getDateBetweenString(new Date('2023/1/1'), today)).toStrictEqual('a month ago');
    });

    it('can show years ago', () => {
        expect(getDateBetweenString(new Date('2022/2/10'), today)).toStrictEqual('a year ago');
        expect(getDateBetweenString(new Date('2022/1/1'), today)).toStrictEqual('a year ago');
        expect(getDateBetweenString(new Date('2011/12/8'), today)).toStrictEqual('11 years ago');
        expect(getDateBetweenString(new Date('2011/1/8'), today)).toStrictEqual('12 years ago');
    });
});
