import { useEffect, useMemo, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { LogOut, MessageCircle, Send, ShieldCheck, Sparkles, UsersRound } from 'lucide-react';

const TOKEN_KEY = 'nodetalk-token';
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

function AuthView({ onAuthenticated }) {
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const isSignup = mode === 'signup';

  const updateField = (event) => {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  };

  const submit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const payload = {
        email: form.email.trim(),
        password: form.password,
      };

      if (isSignup) payload.name = form.name.trim();

      const response = await fetch(`${API_URL}/api/auth/${mode}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await response.json();

      if (!response.ok) throw new Error(data.message || 'Authentication failed');

      localStorage.setItem(TOKEN_KEY, data.token);
      onAuthenticated(data.user);
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="grid min-h-screen place-items-center px-4 py-8">
      <section className="grid w-full max-w-6xl gap-6 lg:grid-cols-[1fr_430px]">
        <div className="relative overflow-hidden rounded-lg border border-white/10 bg-zinc-950/70 p-8 shadow-2xl backdrop-blur xl:p-12">
          <div className="absolute inset-0 bg-[url('/bgimage.jpg')] bg-cover bg-center opacity-20" />
          <div className="relative flex min-h-[440px] flex-col justify-between">
            <img src="/chat.png" alt="NodeTalk" className="h-20 w-20 rounded-lg object-cover shadow-xl shadow-emerald-500/20" />

            <div className="max-w-2xl">
              <p className="mb-3 text-xs font-black uppercase tracking-normal text-emerald-300">Real-time chat with MongoDB auth</p>
              <h1 className="text-5xl font-black leading-none text-white sm:text-7xl">NodeTalk</h1>
              <p className="mt-5 max-w-xl text-lg leading-8 text-zinc-300">
                A cleaner chat experience with account signup, login, online presence, and stored conversation history.
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={submit} className="rounded-lg border border-white/10 bg-zinc-950/85 p-6 shadow-2xl backdrop-blur">
          <div className="mb-6 grid grid-cols-2 gap-2 rounded-lg border border-white/10 bg-white/5 p-1">
            {['login', 'signup'].map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => {
                  setMode(item);
                  setMessage('');
                }}
                className={`rounded-md px-4 py-3 text-sm font-black capitalize transition ${
                  mode === item ? 'bg-emerald-300 text-zinc-950' : 'text-zinc-400 hover:bg-white/10 hover:text-white'
                }`}
              >
                {item === 'signup' ? 'Sign up' : 'Login'}
              </button>
            ))}
          </div>

          <div className="mb-6 flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-lg bg-coral-400/15 text-coral-200">
              <ShieldCheck size={22} />
            </div>
            <div>
              <h2 className="text-2xl font-black text-white">{isSignup ? 'Create account' : 'Welcome back'}</h2>
              <p className="text-sm text-zinc-400">{isSignup ? 'Your details save to MongoDB.' : 'Continue your NodeTalk session.'}</p>
            </div>
          </div>

          <div className="grid gap-4">
            {isSignup && (
              <label className="grid gap-2 text-sm font-bold text-zinc-300">
                Display name
                <input
                  name="name"
                  value={form.name}
                  onChange={updateField}
                  required
                  autoComplete="name"
                  placeholder="Mayank"
                  className="h-12 rounded-lg border border-white/10 bg-white/5 px-4 text-white outline-none transition placeholder:text-zinc-600 focus:border-emerald-300 focus:ring-4 focus:ring-emerald-300/10"
                />
              </label>
            )}

            <label className="grid gap-2 text-sm font-bold text-zinc-300">
              Email
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={updateField}
                required
                autoComplete="email"
                placeholder="you@example.com"
                className="h-12 rounded-lg border border-white/10 bg-white/5 px-4 text-white outline-none transition placeholder:text-zinc-600 focus:border-emerald-300 focus:ring-4 focus:ring-emerald-300/10"
              />
            </label>

            <label className="grid gap-2 text-sm font-bold text-zinc-300">
              Password
              <input
                type="password"
                name="password"
                value={form.password}
                onChange={updateField}
                required
                minLength={6}
                autoComplete={isSignup ? 'new-password' : 'current-password'}
                placeholder="Minimum 6 characters"
                className="h-12 rounded-lg border border-white/10 bg-white/5 px-4 text-white outline-none transition placeholder:text-zinc-600 focus:border-emerald-300 focus:ring-4 focus:ring-emerald-300/10"
              />
            </label>
          </div>

          <p className="min-h-8 pt-3 text-sm font-semibold text-red-300">{message}</p>

          <button
            type="submit"
            disabled={loading}
            className="mt-2 flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-emerald-300 px-4 font-black text-zinc-950 transition hover:bg-emerald-200 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Sparkles size={18} />
            {loading ? 'Please wait...' : isSignup ? 'Create account' : 'Login'}
          </button>
        </form>
      </section>
    </main>
  );
}

function ChatView({ user, onLogout }) {
  const [messages, setMessages] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [draft, setDraft] = useState('');
  const socketRef = useRef(null);
  const scrollerRef = useRef(null);
  const audioRef = useRef(null);

  const onlineLabel = useMemo(() => {
    const count = onlineUsers.length;
    return `${count} online`;
  }, [onlineUsers]);

  useEffect(() => {
    audioRef.current = new Audio('/ting.mp3');
  }, []);

  useEffect(() => {
    const socket = io(API_URL, {
      auth: { token: localStorage.getItem(TOKEN_KEY) },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 3000,
    });

    socketRef.current = socket;

    socket.on('chat-history', (history) => setMessages(history));
    socket.on('online-users', setOnlineUsers);
    socket.on('user-joined', (name) => {
      setMessages((current) => [...current, { id: crypto.randomUUID(), type: 'system', message: `${name} joined the chat` }]);
    });
    socket.on('receive', (data) => {
      setMessages((current) => [...current, data]);
      audioRef.current?.play().catch(() => {});
    });
    socket.on('left', (name) => {
      setMessages((current) => [...current, { id: crypto.randomUUID(), type: 'system', message: `${name} left the chat` }]);
    });
    socket.on('connect_error', (error) => {
      setMessages((current) => [...current, { id: crypto.randomUUID(), type: 'system', message: error.message || 'Connection failed' }]);
    });

    return () => socket.disconnect();
  }, []);

  useEffect(() => {
    scrollerRef.current?.scrollTo({ top: scrollerRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  const sendMessage = (event) => {
    event.preventDefault();
    const message = draft.trim();

    if (!message || !socketRef.current?.connected) return;

    const optimistic = {
      id: crypto.randomUUID(),
      userId: user.id,
      name: user.name,
      message,
      createdAt: new Date().toISOString(),
    };

    setMessages((current) => [...current, optimistic]);
    socketRef.current.emit('send', message);
    setDraft('');
  };

  return (
    <main className="grid min-h-screen place-items-center px-4 py-6">
      <section className="flex h-[calc(100vh-48px)] w-full max-w-7xl overflow-hidden rounded-lg border border-white/10 bg-zinc-950/85 shadow-2xl backdrop-blur">
        <aside className="hidden w-72 border-r border-white/10 bg-white/[0.03] p-5 md:block">
          <div className="mb-8 flex items-center gap-3">
            <img src="/chat.png" alt="" className="h-12 w-12 rounded-lg object-cover" />
            <div>
              <p className="text-xs font-black uppercase tracking-normal text-emerald-300">NodeTalk</p>
              <h1 className="text-xl font-black text-white">Chat room</h1>
            </div>
          </div>

          <div className="mb-4 flex items-center justify-between">
            <p className="flex items-center gap-2 text-sm font-black text-white">
              <UsersRound size={17} />
              Online
            </p>
            <span className="rounded-md bg-emerald-300/15 px-2 py-1 text-xs font-black text-emerald-200">{onlineLabel}</span>
          </div>

          <ul className="grid gap-2">
            {onlineUsers.map((person) => (
              <li key={person.id} className="rounded-lg border border-white/10 bg-white/5 px-3 py-3 text-sm font-bold text-zinc-200">
                {person.name}
              </li>
            ))}
          </ul>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 bg-zinc-950/70 px-5 py-4">
            <div className="flex items-center gap-3">
              <div className="grid h-11 w-11 place-items-center rounded-lg bg-emerald-300 text-zinc-950">
                <MessageCircle size={22} />
              </div>
              <div>
                <p className="text-xs font-black uppercase tracking-normal text-emerald-300">Live conversation</p>
                <h2 className="text-xl font-black text-white">Welcome, {user.name}</h2>
              </div>
            </div>
            <button
              type="button"
              onClick={onLogout}
              className="flex h-11 items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-4 text-sm font-black text-white transition hover:bg-white/10"
            >
              <LogOut size={17} />
              Logout
            </button>
          </header>

          <div ref={scrollerRef} className="min-h-0 flex-1 overflow-y-auto bg-[url('/bgimage.jpg')] bg-cover bg-fixed bg-center p-4">
            <div className="mx-auto flex max-w-4xl flex-col gap-3">
              {messages.map((item, index) => {
                if (item.type === 'system') {
                  return (
                    <div key={item.id || index} className="mx-auto rounded-lg border border-coral-300/20 bg-coral-400/15 px-3 py-2 text-center text-sm font-bold text-coral-100">
                      {item.message}
                    </div>
                  );
                }

                const isMine = item.userId === user.id;
                return (
                  <article key={item.id || index} className={`max-w-[82%] rounded-lg px-4 py-3 shadow-xl ${isMine ? 'self-end bg-emerald-300 text-zinc-950' : 'self-start border border-white/10 bg-zinc-900 text-white'}`}>
                    <p className={`mb-1 text-xs font-black ${isMine ? 'text-zinc-700' : 'text-zinc-400'}`}>{isMine ? 'You' : item.name}</p>
                    <p className="break-words leading-7">{item.message}</p>
                  </article>
                );
              })}
            </div>
          </div>

          <form onSubmit={sendMessage} className="grid gap-3 border-t border-white/10 bg-zinc-950/80 p-4 sm:grid-cols-[1fr_116px]">
            <input
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder="Write a message..."
              className="h-12 rounded-lg border border-white/10 bg-white/5 px-4 text-white outline-none placeholder:text-zinc-500 focus:border-emerald-300 focus:ring-4 focus:ring-emerald-300/10"
            />
            <button type="submit" className="flex h-12 items-center justify-center gap-2 rounded-lg bg-emerald-300 px-4 font-black text-zinc-950 transition hover:bg-emerald-200">
              <Send size={17} />
              Send
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}

export default function App() {
  const [user, setUser] = useState(null);
  const [booting, setBooting] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) {
      setBooting(false);
      return;
    }

    fetch(`${API_URL}/api/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.message);
        setUser(data.user);
      })
      .catch(() => localStorage.removeItem(TOKEN_KEY))
      .finally(() => setBooting(false));
  }, []);

  const logout = async () => {
    const token = localStorage.getItem(TOKEN_KEY);
    localStorage.removeItem(TOKEN_KEY);
    setUser(null);

    if (token) {
      await fetch(`${API_URL}/api/auth/logout`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: '{}',
      }).catch(() => {});
    }
  };

  if (booting) {
    return (
      <main className="grid min-h-screen place-items-center text-white">
        <div className="rounded-lg border border-white/10 bg-zinc-950/80 px-5 py-4 font-black shadow-2xl">Loading NodeTalk...</div>
      </main>
    );
  }

  return user ? <ChatView user={user} onLogout={logout} /> : <AuthView onAuthenticated={setUser} />;
}
