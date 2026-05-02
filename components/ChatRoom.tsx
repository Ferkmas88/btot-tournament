'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { createSupabaseBrowserClient } from '@/lib/supabase-browser';

type Author = { display_name: string; avatar_url: string | null };

type Message = {
  id: string;
  channel_type: 'global' | 'team';
  team_id: string | null;
  user_id: string;
  content: string;
  created_at: string;
  author?: Author;
};

type Presence = { user_id: string; display_name: string; avatar_url: string | null };

export type Channel =
  | { key: 'global'; label: 'General'; type: 'global'; team_id: null }
  | { key: string; label: string; type: 'team'; team_id: string };

type Props = {
  currentUser: { id: string; email: string; display_name: string; avatar_url: string | null };
  channels: Channel[];
  initialChannelKey?: string;
};

export default function ChatRoom({ currentUser, channels, initialChannelKey }: Props) {
  const [activeKey, setActiveKey] = useState<string>(
    initialChannelKey && channels.find((c) => c.key === initialChannelKey)
      ? initialChannelKey
      : channels[0]?.key ?? 'global',
  );
  const [messages, setMessages] = useState<Message[]>([]);
  const [presence, setPresence] = useState<Presence[]>([]);
  const [loading, setLoading] = useState(true);
  const [showOnline, setShowOnline] = useState(false);
  const [showChannels, setShowChannels] = useState(false);

  const activeChannel = useMemo(
    () => channels.find((c) => c.key === activeKey) ?? channels[0],
    [activeKey, channels],
  );

  const supabase = useMemo(() => createSupabaseBrowserClient(), []);

  // Cargar history + suscribir realtime cuando cambia channel.
  useEffect(() => {
    if (!activeChannel) return;
    let cancelled = false;
    let channel: RealtimeChannel | null = null;

    async function load() {
      setLoading(true);
      try {
        const res = await fetch(`/api/chat/history?ch=${activeChannel.key}`, {
          cache: 'no-store',
        });
        const json = await res.json();
        if (!cancelled && Array.isArray(json.messages)) {
          setMessages(json.messages as Message[]);
        }
      } catch {
        /* ignore */
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();

    const channelName =
      activeChannel.type === 'global' ? 'chat:global' : `chat:team:${activeChannel.team_id}`;

    const filter =
      activeChannel.type === 'global'
        ? 'channel_type=eq.global'
        : `team_id=eq.${activeChannel.team_id}`;

    channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'chat_messages', filter },
        async (payload) => {
          if (cancelled) return;
          const m = payload.new as Message;
          // Fetch author info para el mensaje recién insertado.
          const { data: profile } = await supabase
            .from('profiles')
            .select('display_name, steam_persona, steam_avatar_url, email')
            .eq('id', m.user_id)
            .maybeSingle();
          const enriched: Message = {
            ...m,
            author: {
              display_name:
                profile?.steam_persona ?? profile?.display_name ?? profile?.email ?? 'anónimo',
              avatar_url: profile?.steam_avatar_url ?? null,
            },
          };
          setMessages((prev) => {
            // Evitar duplicado si ya está
            if (prev.some((x) => x.id === enriched.id)) return prev;
            return [...prev, enriched];
          });
        },
      )
      .on('presence', { event: 'sync' }, () => {
        if (cancelled || !channel) return;
        const state = channel.presenceState() as Record<string, Presence[]>;
        const flat = Object.values(state).flat();
        // dedupe por user_id
        const map = new Map<string, Presence>();
        flat.forEach((p) => map.set(p.user_id, p));
        setPresence(Array.from(map.values()));
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED' && channel) {
          await channel.track({
            user_id: currentUser.id,
            display_name: currentUser.display_name,
            avatar_url: currentUser.avatar_url,
          });
        }
      });

    return () => {
      cancelled = true;
      if (channel) supabase.removeChannel(channel);
    };
  }, [activeChannel, currentUser, supabase]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-[200px_1fr_200px] h-[calc(100vh-64px)] bg-ink-950 border-t border-white/10">
      {/* Channels sidebar */}
      <aside
        className={`${showChannels ? 'block' : 'hidden'} md:block border-r border-white/10 bg-black/40 p-3 space-y-1 overflow-y-auto`}
      >
        <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-amber-gold/70 mb-2">
          Canales
        </div>
        {channels.map((c) => (
          <button
            key={c.key}
            type="button"
            onClick={() => {
              setActiveKey(c.key);
              setShowChannels(false);
            }}
            className={`w-full text-left px-3 py-2 font-mono text-sm transition ${
              c.key === activeKey
                ? 'bg-amber-gold/15 text-amber-gold border-l-2 border-amber-gold'
                : 'text-white/65 hover:bg-white/5 border-l-2 border-transparent'
            }`}
          >
            # {c.label}
          </button>
        ))}
      </aside>

      {/* Center: messages + input */}
      <section className="flex flex-col min-w-0">
        <header className="flex items-center justify-between border-b border-white/10 bg-black/30 px-4 py-3">
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="md:hidden font-mono text-xs text-amber-gold border border-amber-gold/40 px-2 py-1"
              onClick={() => setShowChannels((v) => !v)}
            >
              ☰
            </button>
            <h1 className="font-display text-xl text-white">
              # {activeChannel?.label ?? 'Chat'}
            </h1>
          </div>
          <button
            type="button"
            onClick={() => setShowOnline((v) => !v)}
            className="md:hidden font-mono text-xs text-amber-gold border border-amber-gold/40 px-2 py-1"
          >
            👥 {presence.length}
          </button>
          <div className="hidden md:block font-mono text-[10px] uppercase tracking-wider text-emerald-400">
            ● {presence.length} online
          </div>
        </header>

        <ChatMessageList
          messages={messages}
          loading={loading}
          currentUserId={currentUser.id}
        />

        <ChatInput channel={activeChannel} />
      </section>

      {/* Online sidebar */}
      <aside
        className={`${showOnline ? 'block' : 'hidden'} md:block border-l border-white/10 bg-black/40 p-3 overflow-y-auto`}
      >
        <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-amber-gold/70 mb-3">
          Online ({presence.length})
        </div>
        <ul className="space-y-2">
          {presence.length === 0 && (
            <li className="font-mono text-[11px] text-white/30 italic">nadie online</li>
          )}
          {presence.map((p) => (
            <li key={p.user_id} className="flex items-center gap-2">
              {p.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={p.avatar_url}
                  alt={p.display_name}
                  className="w-6 h-6 rounded-sm border border-white/15"
                />
              ) : (
                <div className="w-6 h-6 rounded-sm border border-white/15 bg-ink-900 flex items-center justify-center font-display text-[10px] text-white/60">
                  {p.display_name[0]?.toUpperCase() ?? '?'}
                </div>
              )}
              <span className="font-mono text-xs text-white/85 truncate">{p.display_name}</span>
              <span className="ml-auto h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.9)]" />
            </li>
          ))}
        </ul>
      </aside>
    </div>
  );
}

function ChatMessageList({
  messages,
  loading,
  currentUserId,
}: {
  messages: Message[];
  loading: boolean;
  currentUserId: string;
}) {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (ref.current) ref.current.scrollTop = ref.current.scrollHeight;
  }, [messages.length]);

  return (
    <div
      ref={ref}
      className="flex-1 overflow-y-auto p-4 space-y-3 bg-ink-950"
      style={{ scrollBehavior: 'smooth' }}
    >
      {loading && messages.length === 0 && (
        <p className="font-mono text-xs text-white/30 text-center">cargando...</p>
      )}
      {!loading && messages.length === 0 && (
        <p className="font-mono text-xs text-white/30 text-center mt-8">
          Sin mensajes todavía. Tirá el primero.
        </p>
      )}
      {messages.map((m) => {
        const isMe = m.user_id === currentUserId;
        const time = new Date(m.created_at).toLocaleTimeString('es-CU', {
          hour: '2-digit',
          minute: '2-digit',
        });
        return (
          <div
            key={m.id}
            className={`flex gap-3 ${isMe ? 'border-l-2 border-amber-gold/50 pl-2' : ''}`}
          >
            {m.author?.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={m.author.avatar_url}
                alt={m.author.display_name}
                className="w-8 h-8 rounded-sm border border-white/15 flex-shrink-0"
              />
            ) : (
              <div className="w-8 h-8 rounded-sm border border-white/15 bg-ink-900 flex items-center justify-center font-display text-sm text-white/60 flex-shrink-0">
                {(m.author?.display_name ?? '?')[0]?.toUpperCase()}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline gap-2">
                <span className="font-display text-sm text-amber-gold truncate">
                  {m.author?.display_name ?? 'anónimo'}
                </span>
                <span className="font-mono text-[10px] text-white/30">{time}</span>
              </div>
              <p className="text-white/85 text-sm break-words whitespace-pre-wrap">{m.content}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function ChatInput({ channel }: { channel: Channel | undefined }) {
  const [value, setValue] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const lastSentRef = useRef(0);

  async function send() {
    const trimmed = value.trim();
    if (!trimmed || !channel) return;

    const now = Date.now();
    if (now - lastSentRef.current < 1500) {
      setError('Esperá un poco entre mensajes.');
      return;
    }

    setSending(true);
    setError(null);
    try {
      const res = await fetch('/api/chat/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channel_type: channel.type,
          team_id: channel.type === 'team' ? channel.team_id : null,
          content: trimmed,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? 'Error');
      setValue('');
      lastSentRef.current = now;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error');
    } finally {
      setSending(false);
    }
  }

  function onKey(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void send();
    }
  }

  return (
    <div className="border-t border-white/10 bg-black/30 p-3">
      {error && (
        <p className="font-mono text-[10px] text-blood-light mb-2 text-center">{error}</p>
      )}
      <div className="flex gap-2">
        <textarea
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={onKey}
          placeholder={channel ? `Escribí en #${channel.label}...` : ''}
          rows={1}
          maxLength={1000}
          className="flex-1 input-field resize-none min-h-[42px] max-h-32 text-sm"
        />
        <button
          type="button"
          onClick={() => void send()}
          disabled={sending || !value.trim()}
          className="btn-primary text-xs disabled:opacity-40"
        >
          {sending ? '...' : 'Enviar'}
        </button>
      </div>
    </div>
  );
}
