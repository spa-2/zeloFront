import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { chooseBudgetOption, chooseSubstitute, getRooms, getMessages, sendMessage, startChat, updateQuoteItem, retryMessage } from '../api/chat';
import { errorMessage } from '../api/client';
import QuoteCard from '../components/chat/QuoteCard';
import { mergeMessages, messageText } from '../components/chat/messageState';
import '../styles/chat.css';

export default function ChatPage() {
  const { roomId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [text, setText] = useState(location.state?.initialMessage || '');
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [reload, setReload] = useState(0);
  const [cursor, setCursor] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [roomsError, setRoomsError] = useState('');
  const [outgoing, setOutgoing] = useState(null);
  const [operation, setOperation] = useState('');
  const [changeNotice, setChangeNotice] = useState('');
  const drafts = useRef({});
  const olderAnchor = useRef(null);
  const listRef = useRef(null);
  const pending = useRef(null);
  const initialRequest = useRef(null);
  const busy = useRef(false);
  const loadedRoom = useRef(null);
  const conversationEnd = useRef(null);
  const lastScrolledMessage = useRef(null);
  const latestMessageId = messages.at(-1)?.messageId;

  useLayoutEffect(() => {
    if (olderAnchor.current && !loading) {
      const { element, top } = olderAnchor.current;
      window.scrollBy(0, element.getBoundingClientRect().top - top);
      olderAnchor.current = null;
      return;
    }
    if (loading || !latestMessageId) return;
    const key = `${roomId}:${latestMessageId}`;
    if (lastScrolledMessage.current === key) return;
    lastScrolledMessage.current = key;
    conversationEnd.current?.scrollIntoView({ block: 'end', behavior: 'instant' });
  }, [roomId, latestMessageId, loading]);

  useLayoutEffect(() => {
    if (outgoing) conversationEnd.current?.scrollIntoView({ block: 'end', behavior: 'instant' });
  }, [outgoing]);



  useEffect(() => {
    if (roomId || !location.state?.initialMessage) return;
    let ignore = false;
    const initialText = location.state.initialMessage.trim();
    // StrictMode의 effect 재실행에서도 최초 요청을 공유한다.
    if (!initialRequest.current) {
      const key = location.state.idempotencyKey || crypto.randomUUID();
      pending.current = { text: initialText, key };
      initialRequest.current = startChat(initialText, key);
    }
    busy.current = true;
    setOutgoing(initialText);
    setSending(true);
    initialRequest.current.then((data) => {
      if (!ignore) navigate(`/chat/${data.roomId}`, { replace: true });
    }).catch((e) => {
      if (ignore) return;
      const data = e.response?.data?.data;
      if (data?.roomId) {
        navigate(`/chat/${data.roomId}`, { replace: true, state: { chatError: errorMessage(e) } });
      } else {
        setError(errorMessage(e, '채팅방을 만들지 못했어요. 다시 보내 주세요.'));
      }
    }).finally(() => {
      if (!ignore) {
        busy.current = false;
        setSending(false);
        setOutgoing(null);
      }
    });
    return () => { ignore = true; };
  }, [roomId, location.state, navigate]);

  useEffect(() => {
    if (!roomId) return;
    let ignore = false;
    busy.current = false;
    setSending(false);
    // 같은 방을 갱신할 때 목록을 비우면 페이지 높이가 줄어 스크롤이 위로 튄다.
    if (loadedRoom.current !== roomId) {
      loadedRoom.current = roomId;
      lastScrolledMessage.current = null;
      pending.current = null;
      setOutgoing(null);
      setChangeNotice('');
      setText(drafts.current[roomId] || '');
      setMessages([]);
      setCursor(null);
    }
    setLoading(true);
    setError(location.state?.chatError || '');
    getMessages(roomId).then((data) => {
      if (ignore) return;
      setMessages((current) => mergeMessages(current, data.messages));
      setCursor((current) => current ?? (data.hasNext ? data.nextCursor : null));
    }).catch((e) => {
      if (!ignore) setError(errorMessage(e, '대화를 불러오지 못했어요.'));
    }).finally(() => {
      if (!ignore) setLoading(false);
    });
    return () => { ignore = true; };
  }, [roomId, reload, location.state]);

  useEffect(() => {
    let ignore = false;
    setRoomsError('');
    getRooms().then((data) => { if (!ignore) setRooms(data); }).catch((e) => {
      if (!ignore) setRoomsError(errorMessage(e, '최근 채팅을 불러오지 못했어요.'));
    });
    return () => { ignore = true; };
  }, [roomId, reload]);

  function newChat() {
    loadedRoom.current = null;
    lastScrolledMessage.current = null;
    initialRequest.current = null;
    pending.current = null;
    setOutgoing(null);
    setChangeNotice('');
    setMessages([]);
    setText('');
    setError('');
    setCursor(null);
    navigate('/chat', { state: null });
  }

  async function changeQuote(action, notice = '견적 변경 결과를 확인해 주세요.') {
    if (busy.current) return;
    busy.current = true;
    setSending(true);
    setError('');
    setOperation('요청을 처리하고 있어요…');
    try {
      const response = await action();
      setMessages((current) => mergeMessages(current, [response]));
      setChangeNotice(notice);
      setReload((count) => count + 1);
    } catch (e) {
      const saved = e.response?.data?.data;
      if (saved?.messageId) setMessages((current) => mergeMessages(current, [saved]));
      setError(errorMessage(e, '요청을 처리하지 못했어요. 다시 시도해 주세요.'));
    } finally {
      busy.current = false;
      setSending(false);
      setOutgoing(null);
    }
  }

  async function submit(event) {
    event.preventDefault();
    const value = text.trim();
    if (!value || value.length > 1000 || busy.current) return;
    busy.current = true;
    setSending(true);
    setError('');
    setOutgoing(value);
    setOperation('답변을 준비하고 있어요…');
    if (pending.current?.text !== value) pending.current = { text: value, key: crypto.randomUUID() };
    try {
      if (!roomId) {
        const data = await startChat(value, pending.current.key);
        navigate(`/chat/${data.roomId}`, { replace: true });
      } else {
        const response = await sendMessage(roomId, value, pending.current.key);
        setMessages((current) => mergeMessages(current, [response]));
        setReload((count) => count + 1);
      }
      pending.current = null;
      drafts.current[roomId || 'new'] = '';
      setText('');
    } catch (e) {
      const data = e.response?.data?.data;
      if (!roomId && data?.roomId) {
        navigate(`/chat/${data.roomId}`, { replace: true, state: { chatError: errorMessage(e) } });
      } else {
        if (data?.messageId) {
          setMessages((current) => mergeMessages(current, [data]));
          setReload((count) => count + 1);
        }
        setError(errorMessage(e, '메시지를 보내지 못했어요. 다시 시도해 주세요.'));
      }
    } finally {
      busy.current = false;
      setSending(false);
      setOutgoing(null);
    }
  }

  async function loadOlder() {
    setLoading(true);
    try {
      const data = await getMessages(roomId, { before: cursor });
      const element = listRef.current?.firstElementChild;
      if (element) olderAnchor.current = { element, top: element.getBoundingClientRect().top };
      setMessages((current) => mergeMessages(current, data.messages));
      setCursor(data.hasNext ? data.nextCursor : null);
    } catch (e) {
      setError(errorMessage(e, '이전 대화를 불러오지 못했어요.'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="chat-workspace">
      <aside className="chat-sidebar" aria-label="최근 채팅">
        <button className="chat-new" disabled={sending || loading} onClick={newChat}>＋ 새 장보기</button>
        <h2>RECENT</h2>
        {roomsError && <p role="alert">{roomsError}</p>}
        {!rooms.length && !roomsError && <p className="chat-sidebar-empty">새 장보기를 시작해 보세요.</p>}
        {rooms.map((room) => <button key={room.roomId} disabled={sending || loading} className={`chat-room ${String(room.roomId) === roomId ? 'active' : ''}`} onClick={() => navigate(`/chat/${room.roomId}`)}><strong>{room.title || '새 장보기'}</strong><small><span className="chat-room-badge">{String(room.roomId) === roomId ? '진행 중' : '이전 대화'}</span>{new Date(room.lastMessageAt || room.createdAt).toLocaleDateString('ko-KR')}</small></button>)}
      </aside>
      <section className="chat-conversation" aria-label="장보기 채팅">
        {error && <div role="alert" className="chat-error">{error}<button disabled={sending || loading} onClick={() => setReload((count) => count + 1)}>새로고침</button></div>}
        {cursor && <button className="chat-history" disabled={loading || sending} onClick={loadOlder}>이전 대화 보기 ↑</button>}
        <div ref={listRef} role="log" aria-label="대화 내용" className="chat-messages">
          {messages.map((message) => (
            <article key={message.messageId} className={`chat-message ${message.sender === 'USER' ? 'user' : 'assistant'}`}>
              {message.sender !== 'USER' && <span className="chat-avatar" aria-label="ZELO">Z</span>}
              <div className="chat-message-body">
                {messageText(message) && <p className="chat-bubble">{messageText(message)}</p>}
                {message.retryable && message.messageId === latestMessageId && <button className="chat-retry" disabled={sending || loading} onClick={() => changeQuote(() => retryMessage(roomId, message.messageId), '답변 재시도 결과를 확인해 주세요.')}>답변 다시 시도</button>}
                {message.payload?.type === 'QUOTE_CARD' && <QuoteCard message={message} disabled={sending || loading} onUpdateItem={(quoteId, productId, quantity) => changeQuote(() => updateQuoteItem(roomId, { quoteId, productId, quantity }), '상품 수량·삭제 요청 결과를 확인해 주세요.')} onSubstitute={(quoteId, ingredientName, accept) => changeQuote(() => chooseSubstitute(roomId, { quoteId, ingredientName, accept }))} onBudgetOption={(quoteId, productId) => changeQuote(() => chooseBudgetOption(roomId, { quoteId, productId }))} />}
              </div>
            </article>
          ))}
        </div>
        {outgoing && <article className="chat-message user"><div className="chat-message-body"><p className="chat-bubble">{outgoing}</p><small className="chat-status">전송 중…</small></div></article>}
        {changeNotice && <p role="status" className="chat-change-notice">{changeNotice}</p>}
        {loading && <p role="status" className="chat-status">대화를 불러오는 중이에요…</p>}
        {!loading && !sending && !messages.length && !error && <div className="chat-welcome"><span className="chat-avatar">Z</span><h1>오늘은 무엇을 먹을까요?</h1><p>메뉴와 인원, 예산을 알려 주세요.<br />필요한 재료를 ZELO가 골라 담을게요.</p></div>}
        {sending && <p role="status" className="chat-status">{roomId ? operation || '답변을 준비하고 있어요…' : '채팅방을 만들고 답변을 준비하고 있어요…'}</p>}
        <form onSubmit={submit} className="chat-composer">
          <input aria-label="메시지" value={text} onChange={(event) => { setText(event.target.value); drafts.current[roomId || 'new'] = event.target.value; }} maxLength={1000} disabled={sending || loading} placeholder="먹고 싶은 메뉴를 말해 주세요" />
          <button type="submit" aria-label="메시지 보내기" disabled={sending || loading || !text.trim()}>↑</button>
        </form>
        <div ref={conversationEnd} aria-hidden="true" />
      </section>
    </div>
  );
}
