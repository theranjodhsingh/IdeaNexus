import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Bot, SendHorizontal, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';
import Button from '../components/ui/Button';
import Navbar from '../components/layout/Navbar';
import LoadingSkeleton from '../components/ui/LoadingSkeleton';
import TypingIndicator from '../components/ui/TypingIndicator';
import Badge from '../components/ui/Badge';
import { api, getErrorMessage } from '../api/axios';
import { useStartup } from '../hooks/useStartups';
import { useActiveSessionId, useInterviewSession, useSendMessage, useSetActiveSessionId } from '../hooks/useInterview';
import { MODULE_META, moduleLabel } from '../constants/modules';

function Interview() {
  const { id } = useParams();
  const navigate = useNavigate();
  const activeSessionId = useActiveSessionId();
  const setActiveSessionId = useSetActiveSessionId();
  const { data: startup, isLoading: startupLoading, refetch: refetchStartup } = useStartup(id);
  const { data: sessionData, isLoading: sessionLoading, refetch } = useInterviewSession(activeSessionId);
  const sendMessage = useSendMessage(activeSessionId);
  const textareaRef = useRef(null);

  const [draft, setDraft] = useState('');
  const [session, setSession] = useState(null);
  const [claims, setClaims] = useState([]);
  const [moduleComplete, setModuleComplete] = useState(false);
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    if (sessionData) {
      setSession(sessionData);
    }
  }, [sessionData]);

  useEffect(() => {
    if (!activeSessionId && startup?._id && startup.interviewStatus !== 'completed') {
      const begin = async () => {
        try {
          const { data } = await api.post('/interview/start', { startupId: startup._id });
          const nextSession = data?.data?.session;
          if (nextSession?._id) {
            setActiveSessionId(nextSession._id);
            setSession(nextSession);
            setModuleComplete(false);
          }
        } catch (error) {
          toast.error(getErrorMessage(error, 'Unable to start the interview'));
        }
      };
      begin();
    }
  }, [activeSessionId, setActiveSessionId, startup]);

  useEffect(() => {
    if (!textareaRef.current) return;
    textareaRef.current.style.height = 'auto';
    textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 180)}px`;
  }, [draft]);

  useEffect(() => {
    const node = document.getElementById('interview-scroll-anchor');
    if (node) {
      node.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  }, [session?.messages?.length, isSending]);

  const currentModule = useMemo(() => {
    return session?.module || startup?.currentModule || 'problem_solution';
  }, [session, startup]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!draft.trim() || !activeSessionId || isSending) return;

    setIsSending(true);
    try {
      const result = await sendMessage.mutateAsync(draft.trim());
      setSession(result?.session || null);
      if (result?.extractedClaim) {
        setClaims((prev) => [result.extractedClaim, ...prev]);
      }
      if (result?.moduleComplete) {
        setModuleComplete(true);
        setActiveSessionId(null);
        setSession(result.session);
        await refetchStartup();
        toast.success('Module complete. Moving to the next module.');
        navigate(`/startups/${id}/interview`, { replace: true });
        return;
      }
      setDraft('');
    } catch (error) {
      toast.error(getErrorMessage(error, 'The interview could not continue'));
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSubmit(event);
    }
  };

  if (startupLoading || (activeSessionId && sessionLoading && !session)) {
    return (
      <div className="min-h-screen bg-[var(--color-bg)]">
        <Navbar />
        <main className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6">
          <LoadingSkeleton count={3} />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--color-bg)]">
      <Navbar />
      <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:py-10">
        <button
          type="button"
          onClick={() => navigate(`/startups/${id}`)}
          className="mb-6 inline-flex items-center gap-2 text-sm text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-text-primary)]"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to startup
        </button>

        <div className="mb-8 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="mb-3 flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-md bg-[var(--color-accent-soft)] text-[var(--color-accent)]">
                <Bot className="h-4 w-4" />
              </div>
              <Badge variant="accent">Interview</Badge>
            </div>
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              {startup?.name || 'Interview'}
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-[var(--color-text-muted)]">
              {MODULE_META[currentModule]?.description || 'Nexus asks the next hard question.'}
            </p>
          </div>
          <div className="nexus-card-sm px-4 py-3 text-sm text-[var(--color-text-muted)]">
            <div className="font-medium text-[var(--color-text-primary)]">
              {moduleLabel(currentModule)}
            </div>
            <div className="mt-1">{startup?.industry || 'Startup'}</div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.35fr_0.65fr]">
          <section className="nexus-card flex flex-col gap-4 p-4 sm:p-6">
            <div className="flex items-center gap-2 text-sm text-[var(--color-text-muted)]">
              <Sparkles className="h-4 w-4 text-[var(--color-accent)]" />
              {moduleLabel(currentModule)}
            </div>

            <div className="flex min-h-[360px] flex-col gap-3 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface-2)] p-3 sm:p-4">
              <div className="flex-1 space-y-3 overflow-y-auto pr-1">
                {(session?.messages || []).map((message, index) => {
                  const isFounder = message.role === 'founder';
                  return (
                    <div key={`${message.role}-${index}`} className={`flex ${isFounder ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[85%] rounded-[var(--radius-md)] border px-3 py-2.5 ${isFounder ? 'border-[var(--color-accent)] bg-[var(--color-accent-soft)]' : 'border-[var(--color-border)] bg-[var(--color-surface)]'}`}>
                        <div className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
                          {isFounder ? 'You' : 'Nexus'}
                        </div>
                        <p className="text-sm leading-6 text-[var(--color-text-primary)] whitespace-pre-wrap">
                          {message.content}
                        </p>
                      </div>
                    </div>
                  );
                })}
                {isSending && (
                  <div className="flex justify-start">
                    <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2.5">
                      <TypingIndicator label="Nexus is thinking" />
                    </div>
                  </div>
                )}
                <div id="interview-scroll-anchor" />
              </div>

              {moduleComplete && (
                <div className="rounded-[var(--radius-md)] border border-[var(--color-accent)] bg-[var(--color-accent-soft)] p-3 text-sm text-[var(--color-accent)]">
                  <div className="font-medium">Module complete</div>
                  <p className="mt-1 text-[var(--color-text-muted)]">
                    Nexus has advanced the interview. Continue to the next module when you are ready.
                  </p>
                  <Button className="mt-3" onClick={() => navigate(`/startups/${id}/interview`, { replace: true })}>
                    Continue to next module
                  </Button>
                </div>
              )}
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
              <textarea
                ref={textareaRef}
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Answer Nexus and press Enter to continue"
                disabled={isSending || Boolean(moduleComplete)}
                className="nexus-textarea rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-2)] px-3 py-2.5 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-subtle)] focus:border-[var(--color-accent)] focus:outline-none"
              />
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs text-[var(--color-text-muted)]">
                  Press Enter to send. Hold Shift for a new line.
                </p>
                <Button type="submit" isLoading={isSending} leftIcon={<SendHorizontal className="h-4 w-4" />}>
                  Send
                </Button>
              </div>
            </form>
          </section>

          <aside className="nexus-card flex flex-col gap-4 p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Extracted claims</h2>
              <Badge variant="outline">{claims.length}</Badge>
            </div>
            {claims.length === 0 ? (
              <div className="rounded-[var(--radius-md)] border border-dashed border-[var(--color-border)] bg-[var(--color-surface-2)] p-4 text-sm text-[var(--color-text-muted)]">
                Claims will appear here as Nexus extracts them from your answers.
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {claims.map((claim, index) => (
                  <div key={`${claim.rawStatement}-${index}`} className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-2)] p-3">
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <Badge variant="accent">{claim.category || 'Claim'}</Badge>
                      <Badge variant="outline">{claim.status || 'founder_claimed'}</Badge>
                    </div>
                    <p className="text-sm leading-6 text-[var(--color-text-primary)]">{claim.rawStatement}</p>
                  </div>
                ))}
              </div>
            )}
          </aside>
        </div>
      </main>
    </div>
  );
}

export default Interview;
