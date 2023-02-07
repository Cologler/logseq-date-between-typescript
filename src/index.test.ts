
import { assert, describe, expect, it } from 'vitest';

import { parseDate } from '.';

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
