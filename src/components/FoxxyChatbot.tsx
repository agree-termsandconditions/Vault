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
  MessageSquare,
  Compass,
  BookOpen,
  ShieldAlert
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
  onLogin?: () => void;
  onOpenUploadWizard?: () => void;
}

// Client-side Vulnerability & Exploitation Input Validator (Text-Only Guardrail)
const validateClientInputSecurity = (rawText: string): { valid: boolean; reason?: string } => {
  const text = rawText.trim();

  if (text.length > 2000) {
    return {
      valid: false,
      reason: 'Input exceeds the 2,000-character security limit. Please shorten your text query.',
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
      reason: 'XSS / Script Injection pattern detected. HTML script tags and executable payloads are blocked.',
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
      reason: 'SQL Injection (SQLi) syntax detected. Database exploitation queries are strictly prohibited.',
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
      reason: 'Command Injection / Path Traversal pattern detected. Shell commands and directory traversal are blocked.',
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
      reason: 'Exploitation / Prompt Injection attempt detected. Security bypass and exploit generation requests are blocked.',
    };
  }

  // Campus Student Safety Policy — Anti-Pornography & Sex-Related Content Guardrail
  if (
    /\b(porn|pornography|pornhub|xvideos|xnxx|xhamster|redtube|youporn|brazzers|onlyfans|chaturbate|stripchat|camgirl|nsfw|xxx|hentai|rule34|erotic|erotica|nude|nudes|nudity|sex\s*tape|sex\s*video|sex\s*story|sex\s*stories|sex\s*position|sex\s*positions|sexual\s*intercourse|how\s+to\s+have\s+sex|casual\s*sex|hookup|blowjob|handjob|orgasm|masturbat|fetish|bdsm|incest|rape|molest|escort\s*service|adult\s*video|hardcore\s*sex|prostitut|brothel|horny|slut|whore|dick|cock|pussy|boobs|tits|anal\s*sex|oral\s*sex)\b/i.test(
      text
    )
  ) {
    return {
      valid: false,
      reason:
        'Campus Student Safety Policy: Pornography, adult content, and inappropriate sex-related questions are strictly restricted on this student and faculty platform.',
    };
  }

  return { valid: true };
};

export const FoxxyChatbot: React.FC<FoxxyChatbotProps> = ({
  currentUser = 'Faculty Member',
  userRole = 'Science Faculty',
  isLoggedIn = false,
  onLogin,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [securityAlert, setSecurityAlert] = useState<string | null>(null);

  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    {
      id: 'welcome-1',
      role: 'model',
      text: `🦊 **Hello ${currentUser || 'there'}! I'm Foxxy**, your academic & repository assistant.\n\nAsk me anything about your subjects, software engineering, equations, or shortcut searches like \`s,6,a\`! *(Text-only • Protected by Input Vulnerability Guardrails)*`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isLoading, isOpen]);

  useEffect(() => {
    if (isOpen && isLoggedIn) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 150);
    }
  }, [isOpen, isLoggedIn]);

  // Block pasting files or images into the chatbot (Text-only enforcement)
  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    if (e.clipboardData && e.clipboardData.files && e.clipboardData.files.length > 0) {
      e.preventDefault();
      setSecurityAlert('Attachments Disabled: Foxxy accepts plain text only. File and image pasting is blocked.');
      setTimeout(() => setSecurityAlert(null), 5000);
    }
  };

  // Block dropping files into the chatbot window
  const handleDropPrevent = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setSecurityAlert('Attachments Disabled: File drag-and-drop is blocked in Foxxy. Please type plain text only.');
      setTimeout(() => setSecurityAlert(null), 5000);
    }
  };

  const handleSendMessage = async (textToSend?: string) => {
    if (!isLoggedIn) return;

    const text = (textToSend || inputMessage).trim();
    if (!text || isLoading) return;

    setSecurityAlert(null);

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    // Validate input for vulnerabilities and exploitation before sending
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
          text: `🛡️ **Security Guardrail Triggered:** ${validation.reason}\n\nOnly safe, plain-text academic and repository queries are permitted.`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
      // Also notify server audit log asynchronously
      fetch('/api/foxxy/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          history: [],
          currentUser,
          userRole,
          isLoggedIn: true,
        }),
      }).catch(() => {});
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
          reply: `🦊 **Hello ${currentUser || 'there'}!** I received your query: *"${text}"*. Please ask me any academic question or search the Vault using shortcuts like \`s,6,a\`.`,
        };
      }

      if (response.status === 401 || (!data.success && data.error?.includes('log in'))) {
        setMessages((prev) => [
          ...prev,
          {
            id: `err-${Date.now()}`,
            role: 'model',
            text: `🔒 **Authentication Required:** Please sign in to chat with Foxxy.`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
        ]);
      } else if (data.success && data.reply) {
        if (data.blocked) {
          setSecurityAlert('Input blocked by Campus Vulnerability & Exploitation Guardrail.');
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
            text: `🦊 **Hello ${currentUser || 'there'}!** Ask me about Vault study files (e.g., *"Science Grade 6 files"*), tag shortcuts (\`s,6,a\`), or any subject question!`,
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
          text: `🦊 **Hello ${currentUser || 'there'}!** The connection took longer than expected—please try sending your question again.`,
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
        text: `🦊 Conversation cleared! How can I help you today, **${currentUser}**?`,
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
          <div key={idx} className="flex items-start gap-2 my-0.5 ml-1.5">
            <span className="text-blue-500 mt-0.5 shrink-0 font-bold">•</span>
            <div className="flex-1">{formatInline(itemText)}</div>
          </div>
        );
      }

      const numMatch = line.trim().match(/^(\d+)\.\s+(.*)/);
      if (numMatch) {
        return (
          <div key={idx} className="flex items-start gap-2 my-0.5 ml-1.5">
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
          <strong key={index} className="font-extrabold">
            {part.slice(2, -2)}
          </strong>
        );
      }
      if (part.startsWith('`') && part.endsWith('`')) {
        return (
          <code
            key={index}
            className="px-1.5 py-0.5 bg-blue-50 border border-blue-200 text-blue-800 rounded-md font-mono text-[11px] mx-0.5 font-bold"
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
      {/* FLOATING LAUNCHER (Redesigned) */}
      {!isOpen && (
        <div className="fixed bottom-12 right-4 sm:bottom-14 sm:right-6 z-[90] select-none">
          <button
            type="button"
            onClick={() => setIsOpen(true)}
            className="group relative flex items-center gap-2.5 bg-gradient-to-r from-[#0d36af] via-[#1d4ed8] to-[#2563eb] hover:from-[#0b2d91] hover:via-[#1e40af] hover:to-[#1d4ed8] text-white pl-2.5 pr-4 py-2 rounded-2xl shadow-xl hover:shadow-2xl hover:shadow-blue-600/30 backdrop-blur-md transition-all duration-200 hover:-translate-y-0.5 active:scale-95 cursor-pointer border border-blue-300/30"
            aria-label="Open Foxxy Assistant"
          >
            <div className="relative w-9 h-9 rounded-xl bg-white/15 border border-white/30 flex items-center justify-center text-lg shadow-inner shrink-0">
              <span>🦊</span>
              <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-[#0d36af] shadow-sm animate-pulse" />
            </div>

            <div className="text-left">
              <div className="font-extrabold text-[13px] text-white tracking-tight flex items-center gap-1.5 leading-tight">
                <span>Foxxy</span>
                <span className="px-1.5 py-0.5 rounded-md text-[9px] font-extrabold uppercase bg-white/20 text-white tracking-wider leading-none">
                  AI
                </span>
              </div>
              <div className="text-[10px] text-blue-100 font-medium mt-0.5 leading-tight">
                Study Helper
              </div>
            </div>
          </button>
        </div>
      )}

      {/* CHAT WINDOW (Redesigned) */}
      {isOpen && (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
          onDrop={handleDropPrevent}
          className={`fixed bottom-12 right-4 sm:bottom-14 sm:right-6 z-[95] flex flex-col bg-white border border-slate-200/90 rounded-3xl shadow-2xl overflow-hidden transition-all duration-200 ${
            isExpanded
              ? 'w-[calc(100vw-2rem)] sm:w-[580px] h-[calc(100vh-4rem)] sm:h-[700px] max-h-[92vh]'
              : 'w-[calc(100vw-2rem)] sm:w-[410px] h-[540px] sm:h-[590px] max-h-[88vh]'
          }`}
        >
          {/* Vibrant Royal Blue Campus Header */}
          <div className="bg-gradient-to-r from-[#0d36af] via-[#1d4ed8] to-[#2563eb] text-white px-4 py-3.5 border-b border-blue-400/25 shrink-0 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="relative w-10 h-10 rounded-2xl bg-white/15 border border-white/30 flex items-center justify-center text-xl shadow-inner shrink-0">
                  <span>🦊</span>
                  <span
                    className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-[#0d36af] ${
                      isLoggedIn ? 'bg-emerald-400 shadow-xs' : 'bg-amber-400'
                    }`}
                  />
                </div>

                <div>
                  <div className="flex items-center gap-1.5">
                    <h3 className="text-sm font-extrabold tracking-tight text-white">Foxxy</h3>
                    <span className="px-1.5 py-0.5 rounded-md text-[9px] font-extrabold uppercase bg-white/20 text-white tracking-wider leading-none">
                      AI
                    </span>
                    {isLoggedIn && (
                      <span className="px-2 py-0.5 rounded-full text-[9px] bg-white/20 text-white font-bold tracking-wider font-mono border border-white/25">
                        ACTIVE
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-blue-100 flex items-center gap-1.5 mt-0.5">
                    {isLoggedIn ? (
                      <>
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-300 shrink-0" />
                        <span className="truncate max-w-[200px] font-medium text-blue-100">
                          {currentUser} • Online
                        </span>
                      </>
                    ) : (
                      <>
                        <Lock className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                        <span className="truncate max-w-[200px] font-medium text-amber-200">
                          Sign In Required
                        </span>
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
                    title="Clear conversation"
                    className="p-1.5 text-blue-100 hover:text-white hover:bg-white/15 rounded-xl transition cursor-pointer"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setIsExpanded(!isExpanded)}
                  title={isExpanded ? 'Compact view' : 'Expand view'}
                  className="hidden sm:flex p-1.5 text-blue-100 hover:text-white hover:bg-white/15 rounded-xl transition cursor-pointer"
                >
                  {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                </button>

                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  title="Close Foxxy"
                  className="p-1.5 text-blue-100 hover:text-white hover:bg-white/20 rounded-xl transition cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* UNAUTHENTICATED LOCKED STATE */}
          {!isLoggedIn ? (
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-4 bg-gradient-to-b from-slate-50 to-white">
              <div className="w-16 h-16 rounded-3xl bg-blue-50 border border-blue-200 flex items-center justify-center text-3xl shadow-sm relative">
                <span>🦊</span>
                <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-amber-500 text-white flex items-center justify-center shadow-xs">
                  <Lock className="w-3.5 h-3.5" />
                </div>
              </div>

              <div className="space-y-1.5 max-w-xs">
                <h4 className="text-base font-extrabold text-slate-900">Campus Sign-In Required</h4>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Foxxy is available exclusively for authenticated campus faculty, teachers, and administrators.
                </p>
              </div>

              {onLogin && (
                <button
                  onClick={onLogin}
                  className="px-5 py-2.5 rounded-xl bg-[#0e3ec7] hover:bg-blue-700 text-white text-xs font-extrabold flex items-center gap-2 shadow-md transition-all active:scale-95 cursor-pointer"
                >
                  <LogIn className="w-4 h-4" />
                  <span>Sign In to Unlock Foxxy</span>
                </button>
              )}
            </div>
          ) : (
            /* AUTHENTICATED CONVERSATION FEED */
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#f8f9fe]">
              {messages.map((msg) => {
                const isUser = msg.role === 'user';
                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
                  >
                    <div className="flex items-start gap-2.5 max-w-[90%]">
                      {!isUser && (
                        <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white flex items-center justify-center shrink-0 mt-0.5 text-xs shadow-xs">
                          🦊
                        </div>
                      )}

                      <div
                        className={`relative px-4 py-3 rounded-2xl text-xs leading-relaxed shadow-xs ${
                          isUser
                            ? 'bg-gradient-to-br from-[#0e3ec7] to-[#2563eb] text-white rounded-br-xs'
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

              {isLoading && (
                <div className="flex items-start gap-2.5 max-w-[85%]">
                  <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white flex items-center justify-center shrink-0 text-xs shadow-xs">
                    🦊
                  </div>
                  <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-xs px-4 py-3 flex items-center gap-2.5 shadow-xs">
                    <Sparkles className="w-3.5 h-3.5 text-blue-600 animate-spin" />
                    <span className="text-xs font-bold text-slate-700">Foxxy is thinking...</span>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          )}

          {/* TEXT-ONLY COMPOSER & SECURITY GUARDRAIL BAR */}
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

              {/* Quick Academic Chips */}
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
                <button
                  type="button"
                  onClick={() => handleSendMessage('What files are currently in the Vault for Science Grade 6?')}
                  className="px-3 py-1.5 rounded-full text-[11px] font-medium bg-blue-50 hover:bg-blue-100/80 text-blue-700 border border-blue-200/60 transition shrink-0 flex items-center gap-1.5 cursor-pointer shadow-2xs"
                >
                  <Compass className="w-3.5 h-3.5" />
                  <span>Science Grade 6 files</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleSendMessage('List all public study notes available right now')}
                  className="px-3 py-1.5 rounded-full text-[11px] font-medium bg-slate-100 hover:bg-slate-200/80 text-slate-700 border border-slate-200/60 transition shrink-0 flex items-center gap-1.5 cursor-pointer shadow-2xs"
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>Public study notes</span>
                </button>
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendMessage();
                }}
                className="flex items-center gap-2 bg-slate-50/80 border border-slate-200 focus-within:border-indigo-600 focus-within:bg-white focus-within:ring-2 focus-within:ring-indigo-100 rounded-2xl p-1.5 transition-all"
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
                  placeholder="Ask Foxxy (text only — no attachments)..."
                  rows={1}
                  maxLength={2000}
                  disabled={isLoading}
                  className="flex-1 bg-transparent text-slate-900 text-xs px-2.5 py-1.5 outline-none resize-none placeholder:text-slate-400 min-h-[34px] max-h-[80px]"
                />

                <button
                  type="submit"
                  disabled={!inputMessage.trim() || isLoading}
                  className="w-9 h-9 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 disabled:opacity-40 text-white flex items-center justify-center transition shadow-md shadow-blue-500/20 active:scale-95 shrink-0 cursor-pointer"
                  aria-label="Send message"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>

              <div className="flex items-center justify-between px-1 text-[10px] text-slate-400 font-medium">
                <span className="flex items-center gap-1 text-emerald-700 font-semibold">
                  <ShieldCheck className="w-3 h-3 text-emerald-600" />
                  Text-Only • Vulnerability & Exploit Guard Active
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
