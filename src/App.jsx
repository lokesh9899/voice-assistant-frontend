import React, { useState, useRef, useEffect } from 'react';

export default function App() {
  const [recording, setRecording]         = useState(false);
  const [userText, setUserText]           = useState('');
  const [assistantText, setAssistantText] = useState('');
  const [language, setLanguage]           = useState('english');

  const mediaRecorderRef = useRef(null);
  const socketRef        = useRef(null);
  const sendQueueRef     = useRef([]);      // for WebSocket sends
  const audioChunksRef   = useRef([]);

  // MediaSource & SourceBuffer
  const audioRef        = useRef(null);
  const mediaSourceRef  = useRef(null);
  const sourceBufferRef = useRef(null);
  // queue for incoming audio chunks
  const chunkQueueRef   = useRef([]);

  useEffect(() => {
    const audioEl     = audioRef.current;
    const mediaSource = new MediaSource();
    mediaSourceRef.current = mediaSource;
    audioEl.src            = URL.createObjectURL(mediaSource);

    const onSourceOpen = () => {
      const mime = 'audio/mpeg';
      if (!MediaSource.isTypeSupported(mime)) {
        console.error('MIME type not supported:', mime);
        return;
      }
      const sb = mediaSource.addSourceBuffer(mime);
      sourceBufferRef.current = sb;

      // When buffer finishes, flush next chunk
      sb.addEventListener('updateend', () => {
        const queue = chunkQueueRef.current;
        if (queue.length > 0 && !sb.updating) {
          sb.appendBuffer(queue.shift());
        }
      });
    };

    mediaSource.addEventListener('sourceopen', onSourceOpen);
    return () => mediaSource.removeEventListener('sourceopen', onSourceOpen);
  }, []);

  // handle incoming WS messages
  useEffect(() => {
    const socket = socketRef.current;
    if (!socket) return;

    const onMessage = async event => {
      if (event.data instanceof Blob) {
        const sb   = sourceBufferRef.current;
        const buf  = await event.data.arrayBuffer();
        const q    = chunkQueueRef.current;

        if (sb && !sb.updating && q.length === 0) {
          sb.appendBuffer(buf);
        } else {
          q.push(buf);
        }
        return;
      }

      try {
        const msg = JSON.parse(event.data);
        if (msg.type === 'user_transcript')    setUserText(msg.text);
        else if (msg.type === 'assistant_text') setAssistantText(msg.text);
      } catch (err) {
        console.error('❌ JSON parse error:', err);
      }
    };

    socket.addEventListener('message', onMessage);
    return () => socket.removeEventListener('message', onMessage);
  }, [socketRef.current]);

  // helper to safely send or queue WS messages
  function safeSend(data) {
    const socket = socketRef.current;
    if (socket?.readyState === WebSocket.OPEN) {
      socket.send(data);
    } else {
      sendQueueRef.current.push(data);
    }
  }

  const startRecording = async () => {
    setUserText('');
    setAssistantText('');
    setRecording(true);

    // 1) get mic
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const mr     = new MediaRecorder(stream);
    mediaRecorderRef.current = mr;
    audioChunksRef.current   = [];

    // 2) open WS
    const rawBase = import.meta.env.VITE_BACKEND_URL;
    if (!rawBase) return console.error('VITE_BACKEND_URL not defined');
    const base   = rawBase.replace(/\/+$/, '');
    const wsBase = base.replace(/^http/, 'ws');
    const socket = new WebSocket(`${wsBase}/ws/converse?lang=${language}`);
    socketRef.current = socket;

    socket.addEventListener('open', () => {
      console.log('🎧 WS open — flushing send queue');
      sendQueueRef.current.forEach(item => socket.send(item));
      sendQueueRef.current = [];
    });
    socket.addEventListener('error', e => console.error('WS error', e));
    socket.addEventListener('close', e => console.log('WS closed', e.code, e.reason));

    // 3) collect chunks locally
    mr.ondataavailable = e => {
      if (e.data.size > 0) audioChunksRef.current.push(e.data);
    };

    // 4) on stop, flush audio + end marker
    mr.onstop = async () => {
      console.log('🛑 Recording stopped — sending to backend');
      const blob   = new Blob(audioChunksRef.current, { type: 'audio/webm' });
      const buffer = await blob.arrayBuffer();
      safeSend(buffer);
      safeSend(JSON.stringify({ type: 'end' }));
    };

    // 5) start recording
    mr.start();
    console.log('🔴 MediaRecorder started');
  };

  const stopRecording = () => {
    setRecording(false);
    mediaRecorderRef.current?.stop();
  };

  return (
    <div style={{ textAlign: 'center', padding: '60px' }}>
      <h1>🎤 Voice Assistant</h1>

      <div style={{ marginBottom: 20 }}>
        <label>
          <input type="radio" name="lang" value="english"
                 checked={language === 'english'}
                 onChange={() => setLanguage('english')} /> English
        </label>{' '}
        <label>
          <input type="radio" name="lang" value="japanese"
                 checked={language === 'japanese'}
                 onChange={() => setLanguage('japanese')} /> Japanese
        </label>
      </div>

      <button onClick={recording ? stopRecording : startRecording}>
        {recording ? '🛑 Stop Talking' : '🎙️ Start Talking'}
      </button>

      <audio ref={audioRef} autoPlay style={{ display: 'none' }} />

      <div style={{ marginTop: '30px' }}>
        <strong>🧠 You said:</strong>
        <p>{userText || '...'}</p>
      </div>
      <div style={{ marginTop: '30px' }}>
        <strong>🤖 Assistant:</strong>
        <p>{assistantText || '...'}</p>
      </div>
    </div>
  );
}
