import { test } from 'node:test';
import assert from 'node:assert/strict';

import { rooms } from '../../data/house.ts';

const wordCount = (text: string) => text.trim().split(/\s+/).length;

test('there are exactly six rooms', () => {
  assert.equal(rooms.length, 6);
});

test('indices are contiguous and in chronological order', () => {
  rooms.forEach((room, i) => assert.equal(room.index, i));
});

test('room ids are unique', () => {
  assert.equal(new Set(rooms.map((r) => r.id)).size, rooms.length);
});

test('every entry text stays inside the 40 word cap', () => {
  for (const room of rooms) {
    const count = wordCount(room.entry);
    assert.ok(count <= 40, `${room.id} entry is ${count} words, cap is 40`);
  }
});

test('entry text uses no em dashes', () => {
  for (const room of rooms) {
    assert.ok(!room.entry.includes('—'), `${room.id} entry contains an em dash`);
  }
});
