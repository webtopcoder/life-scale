import { FormEvent, useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { HelpCircle, MessageCircle, Send, X } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { Button } from '@/components/ui/button';
import { isFunnelPath } from '@/constants/supportChat';
import { setSupportChatOpenListener } from '@/lib/supportChat';
import { api } from '@/integrations/api/client';
import { cn } from '@/lib/utils';

type Msg = { role: 'user' | 'assistant'; content: string };

const WELCOME: Msg = {
  role: 'assistant',
  content:
    "Hi! I can help with questions about our **Refund Policy**, **Privacy Policy**, and **Terms & Conditions**. What would you like to know?",
};

export default function SupportChatWidget() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const hideOnFunnel = isFunnelPath(pathname);
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([WELCOME]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const conversationIdRef = useRef<string>(crypto.randomUUID());

  useEffect(() => {
    setSupportChatOpenListener(() => {
      if (isFunnelPath(window.location.pathname)) return;
      setOpen(true);
    });
    return () => setSupportChatOpenListener(null);
  }, []);

  useEffect(() => {
    if (hideOnFunnel) setOpen(false);
  }, [hideOnFunnel]);

  useEffect(() => {
    if (open) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
      inputRef.current?.focus();
    }
  }, [open, messages, isStreaming]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return;

    const trimmed = text.trim();
    const userMsg: Msg = { role: 'user', content: trimmed };
    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    setInput('');

    setIsLoading(true);
    setIsStreaming(true);

    try {
      const resp = await api.streamPost('/support/chat', {
        // Skip the canned welcome; only send real turns to the model.
        messages: nextMessages.slice(1),
        conversationId: conversationIdRef.current,
        pagePath: window.location.pathname,
      });

      if (!resp.ok) {
        const err = (await resp.json().catch(() => ({}))) as { error?: string };
        throw new Error(err.error || 'Failed to get response');
      }

      if (!resp.body) throw new Error('No response body');

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = '';
      let assistantSoFar = '';

      const upsertAssistant = (chunk: string) => {
        assistantSoFar += chunk;
        setMessages((prev) => {
          const last = prev[prev.length - 1];
          if (last?.role === 'assistant' && prev.length > nextMessages.length) {
            return prev.map((m, i) =>
              i === prev.length - 1 ? { ...m, content: assistantSoFar } : m,
            );
          }
          return [...prev, { role: 'assistant', content: assistantSoFar }];
        });
      };

      let streamDone = false;
      while (!streamDone) {
        const { done, value } = await reader.read();
        if (done) break;
        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf('\n')) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);
          if (line.endsWith('\r')) line = line.slice(0, -1);
          if (line.startsWith(':') || line.trim() === '') continue;
          if (!line.startsWith('data: ')) continue;
          const jsonStr = line.slice(6).trim();
          if (jsonStr === '[DONE]') {
            streamDone = true;
            break;
          }
          try {
            const parsed = JSON.parse(jsonStr) as {
              choices?: Array<{ delta?: { content?: string } }>;
            };
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) upsertAssistant(content);
          } catch {
            textBuffer = `${line}\n${textBuffer}`;
            break;
          }
        }
      }

      if (!assistantSoFar) {
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content: "Sorry, I couldn't generate a response. Please try again or visit /help.",
          },
        ]);
      }
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Something went wrong';
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: `Sorry, something went wrong: ${message}` },
      ]);
    } finally {
      setIsLoading(false);
      setIsStreaming(false);
    }
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    void sendMessage(input);
  };

  if (hideOnFunnel) return null;

  return (
    <div
      className={cn(
        'fixed flex flex-col',
        open
          ? 'inset-0 z-[100] md:inset-auto md:bottom-4 md:right-4 md:z-50 md:items-end md:gap-3'
          : 'bottom-4 right-4 z-50 items-end gap-3',
      )}
    >
      {open && (
        <div
          className={cn(
            'flex flex-col overflow-hidden border border-border bg-background shadow-xl',
            'h-full w-full rounded-none pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]',
            'md:h-[min(70vh,520px)] md:w-[min(100vw-2rem,380px)] md:rounded-2xl md:pt-0 md:pb-0',
          )}
          role="dialog"
          aria-label="Policy support chat"
        >
          <div className="flex items-center justify-between gap-2 border-b border-border bg-primary px-4 py-3 text-primary-foreground">
            <div className="flex items-center gap-2 min-w-0">
              <HelpCircle className="h-5 w-5 shrink-0" />
              <div className="min-w-0">
                <p className="text-sm font-semibold truncate">Policy Help</p>
                <p className="text-xs opacity-90 truncate">Refunds, privacy & terms</p>
              </div>
            </div>
            <button
              type="button"
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-md text-primary-foreground hover:bg-primary-foreground/15"
              onClick={() => setOpen(false)}
              aria-label="Close chat"
            >
              <X className="h-5 w-5" strokeWidth={2.5} />
            </button>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto px-3 py-3">
            {messages.map((msg, i) => (
              <div
                key={`${msg.role}-${i}`}
                className={cn('flex', msg.role === 'user' ? 'justify-end' : 'justify-start')}
              >
                <div
                  className={cn(
                    'max-w-[85%] rounded-2xl px-3 py-2 text-sm leading-relaxed',
                    msg.role === 'user'
                      ? 'bg-primary text-primary-foreground rounded-br-md'
                      : 'bg-muted text-foreground rounded-bl-md',
                  )}
                >
                  {msg.role === 'assistant' ? (
                    <div className="prose prose-sm dark:prose-invert max-w-none [&_p]:my-1 [&_ul]:my-1 [&_ol]:my-1 [&_a]:text-primary [&_a]:underline">
                      <ReactMarkdown
                        components={{
                          a: ({ href, children }) => {
                            const isInternal = href?.startsWith('/');
                            if (isInternal && href) {
                              return (
                                <a
                                  href={href}
                                  onClick={(e) => {
                                    e.preventDefault();
                                    setOpen(false);
                                    navigate(href);
                                  }}
                                >
                                  {children}
                                </a>
                              );
                            }
                            return (
                              <a href={href} target="_blank" rel="noopener noreferrer">
                                {children}
                              </a>
                            );
                          },
                        }}
                      >
                        {msg.content}
                      </ReactMarkdown>
                    </div>
                  ) : (
                    msg.content
                  )}
                </div>
              </div>
            ))}
            {isStreaming && messages[messages.length - 1]?.role !== 'assistant' && (
              <div className="flex justify-start">
                <div className="rounded-2xl rounded-bl-md bg-muted px-3 py-2 text-sm text-muted-foreground">
                  Thinking…
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          <form onSubmit={onSubmit} className="flex gap-2 border-t border-border p-3">
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about our policies…"
              disabled={isLoading}
              maxLength={2000}
              className="min-w-0 flex-1 rounded-xl border border-input bg-background px-3 py-2 text-sm outline-none ring-offset-background placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
            />
            <Button
              type="submit"
              size="icon"
              className="h-10 w-10 shrink-0 rounded-xl"
              disabled={isLoading || !input.trim()}
              aria-label="Send message"
            >
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      )}

      <Button
        type="button"
        size="icon"
        className={cn(
          'h-14 w-14 rounded-full shadow-lg',
          open && 'hidden md:inline-flex',
        )}
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? 'Close policy help chat' : 'Open policy help chat'}
        aria-expanded={open}
      >
        {open ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
      </Button>
    </div>
  );
}
