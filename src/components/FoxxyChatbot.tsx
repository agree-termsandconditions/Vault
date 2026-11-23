import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  X,
  Send,
  RotateCcw,
  Minimize2,
  Maximize2,
  Copy,
  Check,
  ShieldCheck,
  Lock,
  LogIn,
  Compass,
  BookOpen,
  ShieldAlert,
  Bot
} from 'lucide-react';

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: string;
}

interface FoxxyChatbotProps {
  currentUser?: string;
  userRole?: string;
  isLoggedIn?: boolean;
  mascotOverride?: string;
  onLogin?: () => void;
  onOpenUploadWizard?: () => void;
}

// Client-side Vulnerability & Exploitation Input Validator (Text-Only Guardrail)
const validateClientInputSecurity = (rawText: string): { valid: boolean; reason?: string } => {
  const text = rawText.trim();

  if (text.length > 2000) {
    return {
      valid: false,
      reason: 'Input exceeds the 2,000-character limit. Please shorten your query.',
    };
  }

  if (/data:(image|application|audio|video|text)\/[a-zA-Z0-9.+-]+;base64,/i.test(text)) {
    return {
      valid: false,
      reason: 'Attachments & base64 data URIs are disabled. Foxxy accepts plain text only.',
    };
  }

  // XSS / Script Injection
  if (
    /<script[\s>]|<\/script>|javascript\s*:|vbscript\s*:|on(error|load|click|mouseover|focus)\s*=|<iframe[\s>]|<object[\s>]|<svg[\s>].*onload|document\.(cookie|domain|write)|\beval\s*\(/i.test(
      text
    )
  ) {
    return {
      valid: false,
      reason: 'HTML script tags and executable payloads are blocked for security.',
    };
  }

  // SQL Injection
  if (
    /\bunion\s+(all\s+)?select\b|\bdrop\s+(table|database|user)\b|\balter\s+table\b|\btruncate\s+table\b|\binsert\s+into\b.*\bvalues\b|\bdelete\s+from\b|('\s*or\s*'1'\s*=\s*'1|"\s*or\s*"1"\s*=\s*"1|\bor\s+1\s*=\s*1\b)|;\s*--|\bxp_cmdshell\b|\binformation_schema\b/i.test(
      text
    )
  ) {
    return {
      valid: false,
      reason: 'Database exploitation queries are strictly prohibited on this repository.',
    };
  }

  // Command Injection & Path Traversal
  if (
    /\.\.\/|\.\.\\|\/etc\/(passwd|shadow|hosts)|\b(cmd\.exe|powershell\.exe|\/bin\/sh|\/bin\/bash)\b|\brm\s+-rf\b|\b(wget|curl)\s+https?:\/\/.*\|\s*(sh|bash)\b|\$\([^)]+\)|\bnc\s+-e\b/i.test(
      text
    )
  ) {
    return {
      valid: false,
      reason: 'Command injection and directory traversal patterns are blocked.',
    };
  }

  // Exploitation / Prompt Injection / Secret Extraction
  if (
    /ignore\s+(all\s+)?(previous|prior|above)\s+(instructions|prompts|rules)|\b(reveal|show|print|dump|leak|extract)\s+(the\s+)?(api\s*key|secret\s*key|system\s*prompt|gemini_api_key|process\.env|password\s*hash|encryption\s*salt)\b|\b(write|generate|create|give\s+me)\s+(a\s+|an\s+)?(reverse\s+shell|ransomware|keylogger|trojan|rootkit|zero-day\s+exploit|sql\s+injection\s+payload|xss\s+payload|buffer\s+overflow\s+exploit)\b|\b(bypass|crack|hack|exploit)\s+(the\s+)?(vault|authentication|admin\s+login|pin\s+protection|aes-256)\b/i.test(
      text
    )
  ) {
    return {
      valid: false,
      reason: 'Security bypass and system prompt extraction requests are blocked.',
    };
  }

  return { valid: true };
};

export const FoxxyChatbot: React.FC<FoxxyChatbotProps> = ({
  currentUser = 'Campus Member',
  userRole = 'Science Faculty',
  isLoggedIn = false,
  mascotOverride,
  onLogin,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [securityAlert, setSecurityAlert] = useState<string | null>(null);
  const [imgError, setImgError] = useState(false);

  // Foxxy Chatbot Option: Turned off for now as requested. Set to true to re-enable full chatbot.
  const CHATBOT_ENABLED = false;

  const mascotSrc =
    mascotOverride && !mascotOverride.includes('foxxy-christmas')
      ? mascotOverride
      : '/fox-idle.png';

  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    return [
      {
        id: 'welcome',
        role: 'model',
        text: `🦊 **Hi there! I'm Foxxy, your Campus Study Assistant.**\n\nI can help you search study notes, explain department shortcuts like \`s,6,a\`, or answer any academic subject questions. How can I help you today?`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ];
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const chatWindowRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen && CHATBOT_ENABLED) {
      scrollToBottom();
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen, messages]);

  // Click outside to dismiss message or chat window
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (chatWindowRef.current && !chatWindowRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Block file drag-and-drop into chat (text only)
  const handleDropPrevent = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setSecurityAlert('File attachments are disabled. Foxxy accepts plain text only.');
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    if (e.clipboardData.files && e.clipboardData.files.length > 0) {
      e.preventDefault();
      setSecurityAlert('Pasting file attachments is disabled. Please enter plain text only.');
      return;
    }
    const text = e.clipboardData.getData('text');
    if (text.length > 2000) {
      e.preventDefault();
      setSecurityAlert('Pasted text exceeds 2,000 characters limit.');
    }
  };

  const handleSendMessage = async (customPrompt?: string) => {
    const text = (customPrompt || inputMessage).trim();
    if (!text || isLoading) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    // Security validation
    const validation = validateClientInputSecurity(text);
    if (!validation.valid) {
      setInputMessage('');
      setSecurityAlert(validation.reason || 'Input blocked by vulnerability filter.');
      setMessages((prev) => [
        ...prev,
        userMsg,
        {
          id: `sec-${Date.now()}`,
          role: 'model',
          text: `🛡️ **Security Alert:** ${validation.reason}\n\nOnly safe academic and repository queries are permitted.`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
      return;
    }

    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInputMessage('');
    setIsLoading(true);

    try {
      const historyPayload = newMessages.slice(1, -1).map((m) => ({
        role: m.role,
        text: m.text,
      }));

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 24000);

      const response = await fetch('/api/foxxy/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          history: historyPayload,
          currentUser,
          userRole,
          isLoggedIn: true,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const rawText = await response.text();
      let data: any = null;
      try {
        data = JSON.parse(rawText);
      } catch {
        data = {
          success: true,
          reply: `🦊 **Hello ${currentUser || 'there'}!** I received your question: *"${text}"*. Ask me about study files in the Vault or search shortcuts like \`s,6,a\`.`,
        };
      }

      if (response.status === 401 || (!data.success && data.error?.includes('log in'))) {
        setMessages((prev) => [
          ...prev,
          {
            id: `err-${Date.now()}`,
            role: 'model',
            text: `🔒 **Sign-in Required:** Please sign in to chat with Foxxy.`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
        ]);
      } else if (data.success && data.reply) {
        if (data.blocked) {
          setSecurityAlert('Input filtered by Campus Safety Guardrail.');
        }
        setMessages((prev) => [
          ...prev,
          {
            id: `model-${Date.now()}`,
            role: 'model',
            text: data.reply,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            id: `model-${Date.now()}`,
            role: 'model',
            text: `🦊 Ask me about Vault study files (e.g., *"Science Grade 6 files"*), tag shortcuts (\`s,6,a\`), or any subject question!`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
        ]);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: `model-${Date.now()}`,
          role: 'model',
          text: `🦊 The connection took a moment—please try sending your question again.`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleCopyText = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleResetChat = () => {
    setSecurityAlert(null);
    setMessages([
      {
        id: `welcome-${Date.now()}`,
        role: 'model',
        text: `🦊 Chat reset! How can I help you today, **${currentUser}**?`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  };

  const renderFormattedText = (content: string) => {
    const lines = content.split('\n');
    return lines.map((line, idx) => {
      if (!line.trim()) {
        return <div key={idx} className="h-1.5" />;
      }

      if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
        const itemText = line.trim().slice(2);
        return (
          <div key={idx} className="flex items-start gap-2 my-0.5 ml-1">
            <span className="text-blue-500 mt-0.5 shrink-0 font-bold">•</span>
            <div className="flex-1">{formatInline(itemText)}</div>
          </div>
        );
      }

      const numMatch = line.trim().match(/^(\d+)\.\s+(.*)/);
      if (numMatch) {
        return (
          <div key={idx} className="flex items-start gap-2 my-0.5 ml-1">
            <span className="text-blue-600 font-mono text-xs mt-0.5 font-bold shrink-0">
              {numMatch[1]}.
            </span>
            <div className="flex-1">{formatInline(numMatch[2])}</div>
          </div>
        );
      }

      return (
        <p key={idx} className="my-0.5 leading-relaxed">
          {formatInline(line)}
        </p>
      );
    });
  };

  const formatInline = (text: string) => {
    const parts = text.split(/(\*\*.*?\*\*|`.*?`)/g);
    return parts.map((part, index) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <strong key={index} className="font-extrabold text-slate-900">
            {part.slice(2, -2)}
          </strong>
        );
      }
      if (part.startsWith('`') && part.endsWith('`')) {
        return (
          <code
            key={index}
            className="px-1.5 py-0.5 bg-blue-50 border border-blue-200/80 text-blue-800 rounded font-mono text-[11px] mx-0.5 font-bold"
          >
            {part.slice(1, -1)}
          </code>
        );
      }
      return part;
    });
  };

  return (
    <>
      {/* FLOATING LAUNCHER & COMING SOON MESSAGE */}
      <div className="fixed bottom-6 right-3 sm:bottom-8 sm:right-6 z-[80] select-none">
        {/* Friendly Message Bubble when chat is turned off for now */}
        {isOpen && !CHATBOT_ENABLED && (
          <div
            ref={chatWindowRef}
            className="absolute bottom-16 right-0 w-[280px] sm:w-[320px] bg-white/98 backdrop-blur-md border border-blue-200/90 rounded-2xl shadow-2xl p-3.5 animate-in fade-in zoom-in-95 duration-200 z-[95] text-left"
          >
            <div className="flex items-center justify-between gap-2 mb-2 pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full overflow-hidden bg-slate-50 border border-blue-400 p-0.5 shrink-0 shadow-2xs">
                  <img src={mascotSrc} alt="Foxxy" className="w-full h-full object-contain" />
                </div>
                <div>
                  <h4 className="text-xs font-extrabold text-slate-900 leading-none">Foxxy</h4>
                  <span className="text-[9.5px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded-full inline-block mt-0.5">
                    Learning AI Assistant
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsOpen(false);
                }}
                className="w-6 h-6 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 flex items-center justify-center transition cursor-pointer"
                aria-label="Close message"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <p className="text-xs text-slate-800 leading-relaxed font-semibold bg-gradient-to-br from-blue-50/90 to-indigo-50/60 rounded-xl p-3 border border-blue-100/90">
              &ldquo;hi, im foxxy, your learning ai assistant, will interact with you soon&rdquo;
            </p>

            {/* Speech bubble arrow pointing to the avatar */}
            <div className="absolute -bottom-1.5 right-5 w-3 h-3 bg-white border-r border-b border-blue-200/90 rotate-45 transform" />
          </div>
        )}

        {/* Circular Foxxy Avatar Button (always visible in bottom-right) */}
        {(!isOpen || !CHATBOT_ENABLED) && (
          <button
            type="button"
            onClick={() => setIsOpen((prev) => !prev)}
            className="group relative w-12 h-12 sm:w-14 sm:h-14 rounded-full p-0.5 bg-white border-2 border-blue-500/80 shadow-[0_4px_20px_-2px_rgba(59,130,246,0.35),0_2px_8px_-1px_rgba(15,23,42,0.1)] ring-2 ring-white/80 hover:ring-blue-400 hover:scale-110 active:scale-95 transition-all duration-200 cursor-pointer flex items-center justify-center backdrop-blur-md"
            aria-label="Foxxy Learning AI Assistant"
          >
            <div className="w-full h-full rounded-full overflow-hidden bg-slate-50 flex items-center justify-center p-0.5">
              {!imgError ? (
                <img
                  src={mascotSrc}
                  alt="Foxxy"
                  onError={() => setImgError(true)}
                  className="w-full h-full object-contain select-none pointer-events-none group-hover:scale-110 transition-transform duration-300"
                />
              ) : (
                <span className="text-2xl select-none">🦊</span>
              )}
            </div>
            {/* Online Pulse Indicator */}
            <span className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-emerald-400 border-2 border-white shadow-xs animate-pulse" />
          </button>
        )}
      </div>

      {/* FULL CHAT WINDOW (Preserved for when ready to introduce chatbot) */}
      {isOpen && CHATBOT_ENABLED && (
        <div
          ref={chatWindowRef}
          onDragOver={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
          onDrop={handleDropPrevent}
          className={`fixed bottom-4 right-3 sm:bottom-6 sm:right-6 z-[95] flex flex-col bg-white border border-slate-200/90 rounded-3xl shadow-2xl overflow-hidden transition-all duration-200 animate-in fade-in zoom-in-95 ${
            isExpanded
              ? 'w-[calc(100vw-1.5rem)] sm:w-[580px] h-[calc(100vh-3rem)] sm:h-[680px] max-h-[92vh]'
              : 'w-[calc(100vw-1.5rem)] sm:w-[410px] h-[520px] sm:h-[580px] max-h-[86vh]'
          }`}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-600 text-white px-4 py-3 shrink-0 shadow-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="relative w-9 h-9 rounded-2xl bg-white/15 border border-white/25 flex items-center justify-center text-xl shadow-inner shrink-0 overflow-hidden p-0.5">
                  {!imgError ? (
                    <img
                      src={mascotSrc}
                      alt="Foxxy"
                      onError={() => setImgError(true)}
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <span>🦊</span>
                  )}
                  <span
                    className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-blue-700 ${
                      isLoggedIn ? 'bg-emerald-400' : 'bg-amber-400'
                    }`}
                  />
                </div>

                <div>
                  <div className="flex items-center gap-1.5">
                    <h3 className="text-sm font-extrabold tracking-tight text-white leading-none">Foxxy</h3>
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold uppercase bg-white/20 text-white leading-none">
                      AI
                    </span>
                    {isLoggedIn && (
                      <span className="px-1.5 py-0.5 rounded-full text-[8.5px] bg-emerald-500/30 text-emerald-100 font-bold border border-emerald-400/30 leading-none">
                        Online
                      </span>
                    )}
                  </div>
                  <p className="text-[10.5px] text-blue-100 font-medium flex items-center gap-1 mt-0.5 leading-none">
                    {isLoggedIn ? (
                      <>
                        <ShieldCheck className="w-3 h-3 text-emerald-300 shrink-0" />
                        <span className="truncate max-w-[190px]">{currentUser} • Ready</span>
                      </>
                    ) : (
                      <>
                        <Lock className="w-3 h-3 text-amber-300 shrink-0" />
                        <span>Sign In to Chat</span>
                      </>
                    )}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1">
                {isLoggedIn && (
                  <button
                    type="button"
                    onClick={handleResetChat}
                    aria-label="Reset conversation"
                    className="p-1.5 text-blue-100 hover:text-white hover:bg-white/15 rounded-xl transition cursor-pointer"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setIsExpanded(!isExpanded)}
                  aria-label={isExpanded ? 'Standard view' : 'Expand view'}
                  className="hidden sm:flex p-1.5 text-blue-100 hover:text-white hover:bg-white/15 rounded-xl transition cursor-pointer"
                >
                  {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                </button>

                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  aria-label="Close Foxxy"
                  className="p-1.5 text-blue-100 hover:text-white hover:bg-white/20 rounded-xl transition cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Locked Visitor View */}
          {!isLoggedIn ? (
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-4 bg-gradient-to-b from-slate-50 to-white">
              <div className="w-16 h-16 rounded-3xl bg-blue-50 border border-blue-200 flex items-center justify-center text-3xl shadow-sm relative overflow-hidden p-1">
                {!imgError ? (
                  <img
                    src={mascotSrc}
                    alt="Foxxy"
                    onError={() => setImgError(true)}
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <span>🦊</span>
                )}
                <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-amber-500 text-white flex items-center justify-center shadow-xs">
                  <Lock className="w-3.5 h-3.5" />
                </div>
              </div>

              <div className="space-y-1.5 max-w-xs">
                <h4 className="text-base font-extrabold text-slate-900">Sign In to Use Foxxy</h4>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Foxxy AI Study Helper is available for authenticated campus teachers, faculty, and members.
                </p>
              </div>

              {onLogin && (
                <button
                  onClick={onLogin}
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-extrabold flex items-center gap-2 shadow-md transition-all active:scale-95 cursor-pointer"
                >
                  <LogIn className="w-4 h-4" />
                  <span>Sign In to Unlock</span>
                </button>
              )}
            </div>
          ) : (
            /* Conversation Feed */
            <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-slate-50/60">
              {messages.map((msg) => {
                const isUser = msg.role === 'user';
                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
                  >
                    <div className="flex items-start gap-2 max-w-[90%]">
                      {!isUser && (
                        <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white flex items-center justify-center shrink-0 mt-0.5 text-xs shadow-xs overflow-hidden p-0.5">
                          {!imgError ? (
                            <img
                              src={mascotSrc}
                              alt="Foxxy"
                              onError={() => setImgError(true)}
                              className="w-full h-full object-contain"
                            />
                          ) : (
                            '🦊'
                          )}
                        </div>
                      )}

                      <div
                        className={`relative px-4 py-3 rounded-2xl text-xs leading-relaxed shadow-xs ${
                          isUser
                            ? 'bg-gradient-to-br from-blue-600 to-indigo-600 text-white rounded-br-xs'
                            : 'bg-white text-slate-800 border border-slate-200/90 rounded-tl-xs'
                        }`}
                      >
                        <div className="space-y-1">{renderFormattedText(msg.text)}</div>

                        <div
                          className={`flex items-center justify-between gap-3 mt-2 pt-1.5 border-t text-[10px] font-mono ${
                            isUser
                              ? 'border-white/20 text-blue-100'
                              : 'border-slate-100 text-slate-400'
                          }`}
                        >
                          <span>{msg.timestamp}</span>

                          {!isUser && (
                            <button
                              onClick={() => handleCopyText(msg.id, msg.text)}
                              className="flex items-center gap-1 text-slate-400 hover:text-blue-600 transition cursor-pointer"
                              aria-label="Copy response"
                            >
                              {copiedId === msg.id ? (
                                <>
                                  <Check className="w-3 h-3 text-emerald-600" />
                                  <span className="text-emerald-600 font-bold">Copied</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3 h-3" />
                                  <span>Copy</span>
                                </>
                              )}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Typing / Thinking Indicator */}
              {isLoading && (
                <div className="flex items-start gap-2 max-w-[85%] animate-in fade-in duration-200">
                  <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white flex items-center justify-center shrink-0 text-xs shadow-xs overflow-hidden p-0.5">
                    {!imgError ? (
                      <img
                        src={mascotSrc}
                        alt="Foxxy"
                        onError={() => setImgError(true)}
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      '🦊'
                    )}
                  </div>
                  <div className="bg-white border border-slate-200/90 rounded-2xl rounded-tl-xs px-4 py-2.5 flex items-center gap-2.5 shadow-2xs">
                    <Sparkles className="w-3.5 h-3.5 text-blue-600 animate-spin" />
                    <span className="text-xs font-bold text-slate-700">Foxxy is thinking</span>
                    <span className="flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-bounce [animation-delay:0ms]" />
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-bounce [animation-delay:150ms]" />
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-bounce [animation-delay:300ms]" />
                    </span>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          )}

          {/* Composer */}
          {isLoggedIn && (
            <div className="p-3 bg-white border-t border-slate-200/90 space-y-2 shrink-0">
              {securityAlert && (
                <div className="px-3 py-1.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-[11px] font-bold flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <ShieldAlert className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                    <span>{securityAlert}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSecurityAlert(null)}
                    className="text-rose-400 hover:text-rose-700 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* Quick Suggestion Chips */}
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
                <button
                  type="button"
                  onClick={() => handleSendMessage('What files are currently in the Vault for Science Grade 6?')}
                  className="px-2.5 py-1 rounded-full text-[10.5px] font-medium bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200/60 transition shrink-0 flex items-center gap-1 cursor-pointer"
                >
                  <Compass className="w-3 h-3" />
                  <span>Science Grade 6</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleSendMessage('List all public study notes available right now')}
                  className="px-2.5 py-1 rounded-full text-[10.5px] font-medium bg-slate-100 hover:bg-slate-200/80 text-slate-700 border border-slate-200/60 transition shrink-0 flex items-center gap-1 cursor-pointer"
                >
                  <BookOpen className="w-3 h-3" />
                  <span>Public Notes</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleSendMessage('How do I use tag shortcuts like s,6,a?')}
                  className="px-2.5 py-1 rounded-full text-[10.5px] font-medium bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200/60 transition shrink-0 flex items-center gap-1 cursor-pointer"
                >
                  <Bot className="w-3 h-3" />
                  <span>Shortcuts</span>
                </button>
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendMessage();
                }}
                className="flex items-center gap-2 bg-slate-50 border border-slate-200 focus-within:border-blue-600 focus-within:bg-white focus-within:ring-2 focus-within:ring-blue-100 rounded-2xl p-1.5 transition-all"
              >
                <textarea
                  ref={inputRef}
                  value={inputMessage}
                  onChange={(e) => {
                    setInputMessage(e.target.value);
                    if (securityAlert) setSecurityAlert(null);
                  }}
                  onKeyDown={handleKeyDown}
                  onPaste={handlePaste}
                  placeholder="Ask Foxxy anything (text only)..."
                  rows={1}
                  maxLength={2000}
                  disabled={isLoading}
                  className="flex-1 bg-transparent text-slate-900 text-xs px-2.5 py-1.5 outline-none resize-none placeholder:text-slate-400 min-h-[34px] max-h-[80px]"
                />

                <button
                  type="submit"
                  disabled={!inputMessage.trim() || isLoading}
                  className="w-8.5 h-8.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:opacity-40 text-white flex items-center justify-center transition shadow-xs active:scale-95 shrink-0 cursor-pointer"
                  aria-label="Send message"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>

              <div className="flex items-center justify-between px-1 text-[10px] text-slate-400 font-medium">
                <span className="flex items-center gap-1 text-emerald-700 font-semibold">
                  <ShieldCheck className="w-3 h-3 text-emerald-600" />
                  Text-Only • Guardrail Active
                </span>
                <span className="font-mono">{inputMessage.length}/2000</span>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
};
