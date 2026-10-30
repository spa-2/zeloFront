import assert from 'node:assert/strict';
import test from 'node:test';
import { mergeMessages, messageText } from '../src/components/chat/messageState.js';

test('안내 문구는 중복 없이 표시하고 text 응답도 보존한다', () => {
  assert.equal(messageText({ content: '안내', text: '안내', payload: { text: '예산 초과' } }), '안내\n\n예산 초과');
  assert.equal(messageText({ text: '예산 20,000원 초과' }), '예산 20,000원 초과');
  assert.equal(messageText({ payload: { text: {} } }), '');
});

test('갱신 시 과거 대화를 유지하고 같은 메시지는 서버 값으로 갱신한다', () => {
  const merged = mergeMessages([{ messageId: 1, content: '과거' }, { messageId: 2, content: '이전' }], [{ messageId: 2, content: '갱신' }, { messageId: 3, content: '최신' }]);
  assert.deepEqual(merged.map(({ messageId, content }) => [messageId, content]), [[1, '과거'], [2, '갱신'], [3, '최신']]);
});

test('새 견적 이후 이전 견적과 이전 실패 메시지는 조작할 수 없다', () => {
  const merged = mergeMessages([
    { messageId: 1, payload: { type: 'QUOTE_CARD', quoteId: 'old' }, quoteCardStatus: 'ACTIVE' },
    { messageId: 2, retryable: true },
  ], [{ messageId: 3, payload: { type: 'QUOTE_CARD', quoteId: 'new' }, quoteCardStatus: 'ACTIVE' }]);
  assert.equal(merged[0].quoteCardStatus, 'SUPERSEDED');
  assert.equal(merged[1].retryable, false);
  assert.equal(merged[2].quoteCardStatus, 'ACTIVE');
});

test('이전 대화를 추가해도 최신 실패 메시지의 재시도는 유지한다', () => {
  const merged = mergeMessages([{ messageId: 5, retryable: true }], [{ messageId: 1, retryable: true }]);
  assert.deepEqual(merged.map(({ messageId, retryable }) => [messageId, retryable]), [[1, false], [5, true]]);
});
