import { useState, useRef, useEffect, useCallback } from 'react';
import { Check, Send, MessageSquare, Bot, User } from 'lucide-react';

type Step = 1 | 2 | 3 | 4;

interface ProfileAnswers {
  filingStatus: string | null;
  category: string | null;
  residency: string | null;
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

const STEPS = [
  { num: 1 as Step, label: 'Profile' },
  { num: 2 as Step, label: 'Documents' },
  { num: 3 as Step, label: 'Review' },
  { num: 4 as Step, label: 'IRIS Guide' },
];

const QUESTIONS = [
  {
    key: 'filingStatus' as const,
    text: 'Are you filing for the first time, or have you filed before?',
    options: ['First time filer', 'Filed before'],
  },
  {
    key: 'category' as const,
    text: 'What best describes you?',
    options: ['Salaried employee', 'Business owner', 'Both'],
  },
  {
    key: 'residency' as const,
    text: 'Are you a resident of Pakistan?',
    options: ['Yes, resident', 'No, overseas Pakistani'],
  },
];

function ProgressBar({ currentStep }: { currentStep: Step }) {
  return (
    <div className="bg-emerald-50 border-b-2 border-emerald-200 px-4 py-2.5 flex-shrink-0">
      <div className="flex items-center justify-between max-w-2xl mx-auto">
        {STEPS.map((step, i) => {
          const isCompleted = currentStep > step.num;
          const isCurrent = currentStep === step.num;

          return (
            <div key={step.num} className="flex items-center flex-1 last:flex-none">
              <div className="flex items-center gap-2">
                <span
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 transition-colors duration-200 ${
                    isCompleted
                      ? 'bg-emerald-600 text-white'
                      : isCurrent
                        ? 'bg-emerald-600 text-white ring-[3px] ring-emerald-200'
                        : 'bg-gray-300 text-gray-500'
                  }`}
                >
                  {isCompleted ? <Check size={14} strokeWidth={3} /> : step.num}
                </span>
                <span
                  className={`text-xs font-semibold whitespace-nowrap transition-colors duration-200 ${
                    isCompleted || isCurrent ? 'text-emerald-700' : 'text-gray-400'
                  }`}
                >
                  {step.label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div
                  className={`flex-1 h-px mx-3 transition-colors duration-300 ${
                    isCompleted ? 'bg-emerald-400' : 'bg-gray-300'
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function QuestionFlow({
  onSelect,
  questionIndex,
}: {
  onSelect: (key: keyof ProfileAnswers, value: string) => void;
  questionIndex: number;
}) {
  const question = QUESTIONS[questionIndex];
  if (!question) return null;

  return (
    <div className="px-4 pb-3">
      <div className="max-w-2xl mx-auto">
        <p className="text-sm font-semibold text-gray-800 mb-3">{question.text}</p>
        <div className="flex flex-wrap gap-2">
          {question.options.map((opt) => (
            <button
              key={opt}
              onClick={() => onSelect(question.key, opt)}
              className="px-5 py-2.5 rounded-full text-sm font-medium border-2 border-emerald-200 text-emerald-800 bg-emerald-50 hover:bg-emerald-100 hover:border-emerald-400 hover:shadow-sm active:scale-95 transition-all duration-150"
            >
              {opt}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function ProfileConfirmation({ profile, onConfirm }: { profile: ProfileAnswers; onConfirm: () => void }) {
  return (
    <div className="px-4 pb-3">
      <div className="max-w-2xl mx-auto bg-emerald-50 border border-emerald-200 rounded-xl p-4">
        <p className="text-sm font-semibold text-emerald-800 mb-2">Your profile summary:</p>
        <ul className="text-sm text-emerald-900 space-y-1">
          <li><span className="font-medium">Filing status:</span> {profile.filingStatus}</li>
          <li><span className="font-medium">Category:</span> {profile.category}</li>
          <li><span className="font-medium">Residency:</span> {profile.residency}</li>
        </ul>
        <button
          onClick={onConfirm}
          className="mt-3 w-full py-2.5 rounded-lg text-sm font-semibold bg-emerald-600 text-white hover:bg-emerald-700 active:scale-[0.98] transition-all duration-150"
        >
          Looks good — let's continue
        </button>
      </div>
    </div>
  );
}

function ChatBubble({ role, content }: ChatMessage) {
  const isBot = role === 'assistant';

  const formatText = (text: string) => {
    let html = text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
    html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');

    const lines = html.split('\n');
    const result: string[] = [];
    let inList: 'ul' | 'ol' | false = false;

    for (const line of lines) {
      const bullet = line.match(/^[\s]*[-*•]\s+(.+)/);
      const numbered = line.match(/^[\s]*(\d+)\.\s+(.+)/);

      if (bullet) {
        if (!inList) { result.push('<ul>'); inList = 'ul'; }
        if (inList === 'ol') { result.push('</ol>'); result.push('<ul>'); inList = 'ul'; }
        result.push(`<li>${bullet[1]}</li>`);
      } else if (numbered) {
        if (!inList) { result.push('<ol>'); inList = 'ol'; }
        if (inList === 'ul') { result.push('</ul>'); result.push('<ol>'); inList = 'ol'; }
        result.push(`<li>${numbered[2]}</li>`);
      } else {
        if (inList === 'ul') { result.push('</ul>'); inList = false; }
        if (inList === 'ol') { result.push('</ol>'); inList = false; }
        if (line.trim() !== '') result.push(`<p>${line}</p>`);
      }
    }
    if (inList === 'ul') result.push('</ul>');
    if (inList === 'ol') result.push('</ol>');
    return result.join('');
  };

  return (
    <div className={`flex gap-2.5 max-w-[88%] ${isBot ? '' : 'ml-auto flex-row-reverse'}`}>
      <div
        className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold ${
          isBot
            ? 'bg-gradient-to-br from-emerald-700 to-emerald-500 text-white'
            : 'bg-gray-200 text-gray-600'
        }`}
      >
        {isBot ? <Bot size={14} /> : <User size={14} />}
      </div>
      <div
        className={`px-4 py-3 text-sm leading-relaxed shadow-sm rounded-xl ${
          isBot
            ? 'bg-white border border-gray-200 rounded-bl-sm text-gray-900'
            : 'bg-gradient-to-br from-emerald-700 to-emerald-600 text-white rounded-br-sm'
        }`}
        dangerouslySetInnerHTML={{ __html: formatText(content) }}
      />
    </div>
  );
}

function TypingIndicator() {
  return (
    <div className="flex gap-2.5 max-w-[88%]">
      <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 bg-gradient-to-br from-emerald-700 to-emerald-500 text-white">
        <Bot size={14} />
      </div>
      <div className="px-4 py-3.5 bg-white border border-gray-200 rounded-xl rounded-bl-sm shadow-sm">
        <div className="flex gap-1.5 items-center">
          <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
          <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:0.15s]" />
          <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:0.3s]" />
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [profile, setProfile] = useState<ProfileAnswers>({
    filingStatus: null,
    category: null,
    residency: null,
  });
  const [questionIndex, setQuestionIndex] = useState(0);
  const [profileConfirmed, setProfileConfirmed] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState<Step>(1);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const allProfileAnswers = profile.filingStatus && profile.category && profile.residency;
  const showQuestionFlow = !allProfileAnswers && !profileConfirmed;

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading, scrollToBottom]);

  const handleProfileSelect = (key: keyof ProfileAnswers, value: string) => {
    setProfile((prev) => ({ ...prev, [key]: value }));
    setMessages((prev) => [...prev, { role: 'user' as const, content: value }]);

    const nextIndex = questionIndex + 1;
    if (nextIndex < QUESTIONS.length) {
      setQuestionIndex(nextIndex);
    }
  };

  const handleProfileConfirm = async () => {
    setProfileConfirmed(true);
    setCurrentStep(2);
    const profileSummary = `I'm a ${profile.residency?.toLowerCase()}, ${profile.filingStatus?.toLowerCase()}, ${profile.category?.toLowerCase()}.`;
    setMessages((prev) => [...prev, { role: 'assistant' as const, content: `Profile confirmed! Now let's gather your documents. ${profileSummary}\n\nI'll guide you step by step. What documents do you currently have available?` }]);
  };

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || isLoading) return;

    setInput('');
    setMessages((prev) => [...prev, { role: 'user', content: text }]);
    setIsLoading(true);

    try {
      const history = messages.map((m) => ({ role: m.role, content: m.content }));
      history.push({ role: 'user', content: text });

      const res = await fetch('/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, history: messages }),
      });

      const data = await res.json();

      if (!res.ok) {
        setMessages((prev) => [
          ...prev,
          { role: 'assistant', content: `Error: ${data.error || 'Something went wrong.'}` },
        ]);
      } else {
        setMessages((prev) => [...prev, { role: 'assistant', content: data.reply }]);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'Unable to reach the server. Please check your connection.' },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleTextareaInput = () => {
    const ta = textareaRef.current;
    if (ta) {
      ta.style.height = 'auto';
      ta.style.height = Math.min(ta.scrollHeight, 120) + 'px';
    }
  };

  return (
    <div className="flex flex-col h-screen max-w-[820px] mx-auto bg-white shadow-xl">
      {/* Header */}
      <header className="bg-gradient-to-br from-emerald-900 to-emerald-700 px-5 py-4 flex items-center gap-3.5 flex-shrink-0">
        <div className="w-11 h-11 bg-white/15 rounded-full flex items-center justify-center flex-shrink-0">
          <MessageSquare size={22} className="text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-lg font-bold text-white leading-tight">FBR Tax Filing Assistant</h1>
          <p className="text-xs text-white/70 mt-0.5">Powered by AI — Pakistan Tax Guidance</p>
        </div>
        <span className="bg-white/15 border border-white/25 text-white/90 text-[0.65rem] font-semibold tracking-wide px-2.5 py-1 rounded-full whitespace-nowrap">
          FBR &bull; IRIS
        </span>
      </header>

      {/* Progress Bar */}
      <ProgressBar currentStep={currentStep} />

      {/* Question Flow / Profile Confirmation */}
      {showQuestionFlow && !allProfileAnswers && (
        <QuestionFlow onSelect={handleProfileSelect} questionIndex={questionIndex} />
      )}
      {allProfileAnswers && !profileConfirmed && (
        <ProfileConfirmation profile={profile} onConfirm={handleProfileConfirm} />
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-5 flex flex-col gap-4 scroll-smooth">
        {messages.length === 0 && !profileConfirmed && (
          <div className="flex gap-2.5 max-w-[88%]">
            <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 bg-gradient-to-br from-emerald-700 to-emerald-500 text-white">
              <Bot size={14} />
            </div>
            <div className="px-4 py-3 text-sm leading-relaxed bg-white border border-gray-200 rounded-xl rounded-bl-sm shadow-sm text-gray-900">
              <p>Assalam-o-Alaikum! I am your FBR tax filing assistant.</p>
              <p className="mt-2">Let me get to know you first so I can guide you better. Please answer the questions below.</p>
            </div>
          </div>
        )}
        {messages.map((msg, i) => (
          <ChatBubble key={i} role={msg.role} content={msg.content} />
        ))}
        {isLoading && <TypingIndicator />}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Bar */}
      <div className="border-t border-gray-200 px-4 py-3 flex gap-2.5 items-end bg-white flex-shrink-0">
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onInput={handleTextareaInput}
          onKeyDown={handleKeyDown}
          placeholder={profileConfirmed ? 'Ask your tax question...' : 'Answer the questions above to get started...'}
          rows={1}
          disabled={isLoading || !profileConfirmed}
          className="flex-1 border-[1.5px] border-gray-300 rounded-lg px-3.5 py-2.5 text-sm text-gray-900 bg-gray-50 resize-none max-h-[120px] min-h-[44px] leading-relaxed outline-none transition-all duration-150 focus:border-emerald-600 focus:shadow-[0_0_0_3px_rgba(5,150,105,0.12)] focus:bg-white disabled:opacity-50 disabled:cursor-not-allowed"
        />
        <button
          onClick={sendMessage}
          disabled={isLoading || !input.trim() || !profileConfirmed}
          className="w-11 h-11 bg-gradient-to-br from-emerald-700 to-emerald-600 rounded-lg flex items-center justify-center flex-shrink-0 transition-all duration-150 hover:from-emerald-800 hover:to-emerald-700 hover:-translate-y-0.5 hover:shadow-[0_4px_12px_rgba(5,150,105,0.35)] active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-none"
        >
          <Send size={16} className="text-white" />
        </button>
      </div>

      {/* Disclaimer */}
      <p className="text-center text-[0.65rem] text-gray-400 px-4 py-1.5 flex-shrink-0">
        For general guidance only. Consult a qualified tax advisor or FBR for official rulings.
      </p>
    </div>
  );
}
