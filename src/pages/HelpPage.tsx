import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from '@/components/ui/input-otp';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import {
  Scale,
  CalendarIcon,
  ArrowLeft,
  ChevronRight,
  Send,
  Check,
  ShieldCheck,
  ExternalLink,
  Loader2,
  KeyRound,
} from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/integrations/api/client';
import { MarketingHeader } from '@/components/marketing/MarketingHeader';
import { NOT_CLINICAL_FAQ, REFUND_GUARANTEE, statementDescriptorNote, renewalTermsAll, AUTO_RENEW_NOTICE, INTRO_TERMS_LIST } from '@/content/legalCopy';

type Section = 'home' | 'subscription' | 'cancel-flow' | 'legal' | 'billing' | 'contact';

const CANCEL_REASONS: { value: string; label: string }[] = [
  { value: 'only_wanted_score', label: 'I only wanted my score' },
  { value: 'not_satisfied_with_report', label: "I'm not satisfied with the report" },
  { value: 'not_interested_in_improving', label: "I'm not interested in improving my results" },
  { value: 'unaware_of_subscription', label: "I wasn't aware of the subscription" },
];

const NO_ACTIVE_SUBSCRIPTION_MESSAGE =
  "We couldn't find an active subscription for this account. It may already be cancelled, or billing may still be updating. Please contact support if you need help.";

const SECTIONS = [
  { id: 'subscription' as const, label: 'Cancellations', description: 'Cancel your plan' },
  { id: 'billing' as const, label: 'Refunds and Payment Inquiries', description: 'Refunds, charges & payment info' },
  { id: 'legal' as const, label: 'Legal & Policies', description: 'Privacy, terms & cookie policies' },
  { id: 'contact' as const, label: 'Contact Support', description: 'Get in touch with our team' },
];

const FAQS: { q: string; a: string }[] = [
  {
    q: 'What do I get with each plan?',
    a: 'Insight includes all three tests in one category of your choice, with a full report and improvement dashboard for each. Guide adds a static coaching kit that helps you act on that plan. Focus stays on one category but adds a personalized AI coach trained on your results, available 24/7. Complete unlocks every live scale across every live category, a dashboard for each, and a personalized AI coach trained on your results and available 24/7 — new categories are included as they launch.',
  },
  {
    q: 'How does the trial work?',
    a: `You pick a short introductory offer when you sign up — ${INTRO_TERMS_LIST}. You get full access to your chosen tier for that term. ${renewalTermsAll().split('. ').slice(1).join('. ')}`,
  },
  {
    q: 'How do I cancel?',
    a: 'Go to Cancellations above and pick "Cancel My Plan". We\'ll verify your email with a one-time code, then process the cancel. You keep access until the end of your current billing period.',
  },
  {
    q: 'Can I switch plans later?',
    a: 'Yes. From your dashboard, click any locked scale and you\'ll be offered a straight upgrade to Complete (Focus and Complete both include the AI coach). Downgrades happen at the end of your current billing cycle — contact us to schedule one.',
  },
  {
    q: 'What does the AI Coach do?',
    a: 'The Coach reads your reports and answers questions in plain language — "why did I score low on spatial?", "how do I stick to my sleep goal?", "what should I focus on this week?". It\'s available on the Focus and Complete plans.',
  },
  {
    q: 'How long does each scale take?',
    a: '5–10 minutes for each scale. You can pause and come back — your progress saves automatically.',
  },
];


const HelpPage = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user, session } = useAuth();
  const [section, setSection] = useState<Section>(() => {
    const param = searchParams.get('section');
    if (param === 'cancel') return 'cancel-flow';
    if (param === 'contact') return 'contact';
    return 'home';
  });
  const [cancelStep, setCancelStep] = useState(0);
  const [contactForm, setContactForm] = useState(() => ({
    name: '',
    email: '',
    subject: searchParams.get('subject')?.toLowerCase() === 'refund' ? 'Refund' : '',
    message: '',
    billingAmount: '',
    billingDate: undefined as Date | undefined,
  }));
  // Refund identity verification (email OTP)
  const [refundOtpSent, setRefundOtpSent] = useState(false);
  const [refundOtpCode, setRefundOtpCode] = useState('');
  const [refundOtpLoading, setRefundOtpLoading] = useState(false);
  const [refundVerifiedEmail, setRefundVerifiedEmail] = useState<string | null>(null);

  const [sending, setSending] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // OTP state
  const [otpEmail, setOtpEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [cancelReason, setCancelReason] = useState<string | null>(null);

  // Pre-fill email from logged-in user
  useEffect(() => {
    if (!user?.email) return;
    setOtpEmail(user.email);
    setContactForm((f) => (f.email ? f : { ...f, email: user.email as string }));
  }, [user]);


  // Deep-link: /help?section=cancel|contact (&subject=Refund)
  useEffect(() => {
    const param = searchParams.get('section');
    if (param === 'cancel') {
      setSection('cancel-flow');
      setCancelStep(0);
    } else if (param === 'contact') {
      setSection('contact');
    }
    if (searchParams.get('subject')?.toLowerCase() === 'refund') {
      setContactForm((f) => ({ ...f, subject: 'Refund' }));
    }
  }, [searchParams]);

  // Page title
  useEffect(() => {
    const prev = document.title;
    document.title = 'Help — Life Scale';
    return () => { document.title = prev; };
  }, []);

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
    return () => clearTimeout(t);
  }, [resendCooldown]);

  const resolveSubscriptionId = async (): Promise<string | null> => {
    const purchases = await api.get<
      Array<{
        ffSubscriptionId?: string | null;
        ff_subscription_id?: string | null;
        productKey?: string;
        product_key?: string;
        status?: string;
      }>
    >('/dashboard/purchases');
    const active = purchases.find((p) => {
      const key = p.productKey ?? p.product_key;
      const subId = p.ffSubscriptionId ?? p.ff_subscription_id;
      const status = (p.status || '').toLowerCase();
      return Boolean(subId) && key === 'iq_subscription' && status !== 'cancelled' && status !== 'refunded';
    });
    const anySub = purchases.find(
      (p) => p.ffSubscriptionId ?? p.ff_subscription_id,
    );
    return (
      active?.ffSubscriptionId ??
      active?.ff_subscription_id ??
      anySub?.ffSubscriptionId ??
      anySub?.ff_subscription_id ??
      null
    );
  };

  const handleSendOtp = async () => {
    if (!otpEmail) return;
    if (!session) {
      toast.error('Please sign in to verify your account.');
      return;
    }
    setOtpLoading(true);
    try {
      await api.post('/billing/send-cancel-otp', { email: otpEmail });
      setOtpSent(true);
      setResendCooldown(60);
      toast.success('Verification code sent to your email');
    } catch (err: any) {
      toast.error(err.message || 'Failed to send verification code');
    } finally {
      setOtpLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (otpCode.length !== 6) return;
    setOtpLoading(true);
    try {
      const data = await api.post<{ ok?: boolean; valid?: boolean }>(
        '/billing/verify-cancel-otp',
        { email: otpEmail, otp: otpCode },
      );
      if (data?.ok || data?.valid) {
        setOtpVerified(true);
        toast.success('Identity verified');
        setCancelStep(1); // reason selection (downsells temporarily disabled)
      } else {
        toast.error('Invalid or expired code');
      }
    } catch (err: any) {
      toast.error(err.message || 'Verification failed');
    } finally {
      setOtpLoading(false);
    }
  };

  const handleCancelSubscription = async () => {
    if (!otpEmail || !otpCode) {
      toast.error('Verification is required to cancel your subscription.');
      return;
    }
    if (!cancelReason) {
      toast.error('Please select a reason for cancelling.');
      return;
    }
    setActionLoading(true);
    try {
      const subscriptionId = await resolveSubscriptionId();
      if (!subscriptionId) {
        throw new Error(NO_ACTIVE_SUBSCRIPTION_MESSAGE);
      }
      await api.post('/billing/cancel-subscription', {
        subscriptionId,
        email: otpEmail,
        otp: otpCode,
        reason: cancelReason,
        comment: 'Cancelled via Help Center',
      });
      toast.success('Your cancellation has been processed. You\'ll retain access until the end of your billing period.');
      setCancelStep(0);
      setOtpSent(false);
      setOtpVerified(false);
      setOtpCode('');
      setCancelReason(null);
      setSection('home');
    } catch (err: any) {
      const msg = typeof err?.message === 'string' ? err.message : '';
      const noActiveSub =
        err?.status === 404 || /no active subscription/i.test(msg);
      toast.error(
        noActiveSub
          ? NO_ACTIVE_SUBSCRIPTION_MESSAGE
          : msg || 'Cancellation failed. Please try again or contact support.',
      );
    } finally {
      setActionLoading(false);
    }
  };

  const goBack = () => {
    if (section === 'cancel-flow') {
      setCancelStep(0);
      setOtpSent(false);
      setOtpVerified(false);
      setOtpCode('');
      setCancelReason(null);
      setSection('subscription');
    } else if (section === 'home') {
      navigate(user ? '/main-dashboard' : '/');
    } else {
      setSection('home');
    }
  };


  const startRefundRequest = () => {
    setContactForm((f) => ({ ...f, subject: 'Refund' }));
    setSection('contact');
    setSearchParams({ section: 'contact', subject: 'Refund' }, { replace: true });
    requestAnimationFrame(() => window.scrollTo({ top: 0, behavior: 'smooth' }));
  };

  const refundVerified =
    !!refundVerifiedEmail &&
    refundVerifiedEmail.toLowerCase() === contactForm.email.trim().toLowerCase();

  const handleSendRefundOtp = async () => {
    const email = contactForm.email.trim();
    if (!email) { toast.error('Enter the email on your account first.'); return; }
    setRefundOtpLoading(true);
    try {
      await api.post('/billing/send-cancel-otp', { email });
      setRefundOtpSent(true);
      toast.success('Verification code sent to your email');
    } catch (err: any) {
      toast.error(err.message || 'Failed to send verification code');
    } finally {
      setRefundOtpLoading(false);
    }
  };

  const handleVerifyRefundOtp = async () => {
    const email = contactForm.email.trim();
    if (refundOtpCode.length !== 6) { toast.error('Enter the 6-digit code.'); return; }
    setRefundOtpLoading(true);
    try {
      const data = await api.post<{ ok?: boolean; valid?: boolean }>(
        '/billing/verify-cancel-otp',
        { email, otp: refundOtpCode },
      );
      if (data?.ok || data?.valid) {
        setRefundVerifiedEmail(email);
        toast.success('Identity verified');
      } else {
        toast.error('Invalid or expired code');
      }
    } catch (err: any) {
      toast.error(err.message || 'Verification failed');
    } finally {
      setRefundOtpLoading(false);
    }
  };

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactForm.name || !contactForm.email || !contactForm.subject || !contactForm.message) {
      if (!contactForm.name) toast.error('Please enter your name.');
      else if (!contactForm.subject) toast.error('Please select a subject.');
      return;
    }
    if (contactForm.subject === 'Refund') {
      if (!contactForm.billingAmount) { toast.error('Please select the transaction total.'); return; }
      if (!contactForm.billingDate) { toast.error('Please select the date you were charged.'); return; }
      if (!refundVerified) { toast.error('Please verify your email with the 6-digit code before submitting.'); return; }
    }

    setSending(true);
    try {
      await api.post('/support/tickets', {
        name: contactForm.name,
        email: contactForm.email,
        subject: contactForm.subject,
        message: contactForm.message,
        billingAmount: contactForm.billingAmount || undefined,
        billingDate: contactForm.billingDate
          ? contactForm.billingDate.toISOString().split('T')[0]
          : undefined,
      });
      setSubmitted(true);
    } catch (err) {
      console.error('Support ticket error:', err);
      toast.error('Something went wrong. Please try again or email us directly.');
    } finally {
      setSending(false);
    }
  };

  return (
    <>
    <div className="lifescale-root min-h-screen bg-[hsl(var(--iq-surface))]">
      <MarketingHeader />
      <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-8 pb-20">
        {/* Section title */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 mb-8"
        >
          {(section !== 'home' || !!user) && (
            <Button variant="ghost" size="icon" onClick={goBack} className="shrink-0 text-[hsl(var(--iq-ink))]" aria-label="Back">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          )}

          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[hsl(var(--iq-ink))]">
              {section === 'home' && 'How can we help?'}
              {section === 'subscription' && 'Manage your plan'}
              {section === 'cancel-flow' && 'Cancel your plan'}
              {section === 'legal' && 'Legal & policies'}
              {section === 'billing' && 'Billing & payments'}
              {section === 'contact' && 'Contact support'}
            </h1>
            {section === 'home' && (
              <p className="text-sm text-[hsl(var(--iq-muted))] mt-1">Pick a topic to get started.</p>
            )}
          </div>
        </motion.div>


        <AnimatePresence mode="wait">
          {/* HOME */}
          {section === 'home' && (
            <motion.div
              key="home"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-3"
            >
              {SECTIONS.map((s) => (
                <Card
                  key={s.id}
                  className="cursor-pointer border border-[hsl(var(--iq-border))] bg-[hsl(var(--iq-surface))] rounded-2xl shadow-[0_1px_2px_rgba(15,23,42,0.04)] hover:shadow-[0_10px_30px_-10px_rgba(15,23,42,0.15)] hover:border-[hsl(var(--iq-cobalt))]/40 transition-all"
                  onClick={() => setSection(s.id)}
                >
                  <CardContent className="flex items-center gap-4 p-4">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-[hsl(var(--iq-ink))]">{s.label}</p>
                      <p className="text-xs text-[hsl(var(--iq-muted))]">{s.description}</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-[hsl(var(--iq-muted))] shrink-0" />
                  </CardContent>
                </Card>
              ))}

              <div className="pt-8">
                <h2 className="text-lg font-bold text-[hsl(var(--iq-ink))] mb-3">Frequently asked</h2>
                <Accordion type="single" collapsible className="rounded-2xl border border-[hsl(var(--iq-border))] bg-[hsl(var(--iq-surface))] px-4">
                  {[
                    ...FAQS,
                    {
                      q: 'Is this a medical or school assessment?',
                      a: NOT_CLINICAL_FAQ,
                    }
                  ].map((f, i) => (
                    <AccordionItem key={i} value={`faq-${i}`} className="border-b border-[hsl(var(--iq-border))] last:border-b-0">
                      <AccordionTrigger className="py-4 text-left text-sm font-semibold text-[hsl(var(--iq-ink))] hover:no-underline">
                        {f.q}
                      </AccordionTrigger>
                      <AccordionContent className="pb-4 text-sm leading-relaxed text-[hsl(var(--iq-muted))]">
                        {f.a}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </div>
            </motion.div>
          )}

          {/* SUBSCRIPTION MANAGEMENT */}
          {section === 'subscription' && (
            <motion.div
              key="subscription"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              {/* Cancel */}
              <Card className="border border-border">
                <CardContent className="p-5 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-destructive/10 flex items-center justify-center">
                      <ShieldCheck className="w-5 h-5 text-destructive" />
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">Cancel My Plan</p>
                      <p className="text-xs text-muted-foreground">We'd hate to see you go</p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    className="w-full rounded-xl"
                    onClick={() => { setSection('cancel-flow'); setCancelStep(0); }}
                  >
                    Start Cancellation
                  </Button>
                </CardContent>
              </Card>

            </motion.div>
          )}

          {/* CANCEL FLOW */}
          {section === 'cancel-flow' && (
            <motion.div
              key="cancel-flow"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              {/* Step indicators: OTP → reason → confirm */}
              <div className="flex items-center justify-center gap-2 mb-2">
                {[0, 1, 2].map((s) => (
                  <div
                    key={s}
                    className={`h-1.5 rounded-full transition-all ${
                      s <= cancelStep ? 'w-8 bg-primary' : 'w-4 bg-muted'
                    }`}
                  />
                ))}
              </div>

              <AnimatePresence mode="wait">
                {/* Step 0: OTP Email Verification */}
                {cancelStep === 0 && (
                  <motion.div
                    key="otp"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                  >
                    <Card className="border border-border overflow-hidden">
                      <CardContent className="p-6 space-y-4 text-center">
                        <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
                          <KeyRound className="w-7 h-7 text-primary" />
                        </div>
                        <div>
                          <h2 className="text-xl font-bold text-foreground">Verify your identity</h2>
                          <p className="text-sm text-muted-foreground mt-2">
                            For your security, we need to verify your email address before processing the cancellation.
                          </p>
                        </div>

                        {!otpSent ? (
                          <div className="space-y-3">
                            <Input
                              type="email"
                              placeholder="Enter your email address"
                              value={otpEmail}
                              onChange={(e) => setOtpEmail(e.target.value)}
                              className="rounded-xl text-center"
                            />
                            <Button
                              className="w-full h-12 rounded-xl font-semibold"
                              style={{ background: 'var(--gradient-primary)' }}
                              onClick={handleSendOtp}
                              disabled={otpLoading || !otpEmail}
                            >
                              {otpLoading ? (
                                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Sending...</>
                              ) : (
                                <>Send Verification Code</>
                              )}
                            </Button>
                          </div>
                        ) : (
                          <div className="space-y-4">
                            <p className="text-sm text-muted-foreground">
                              Enter the 6-digit code sent to <span className="font-semibold text-foreground">{otpEmail}</span>
                            </p>
                            <div className="flex justify-center">
                              <InputOTP maxLength={6} value={otpCode} onChange={setOtpCode}>
                                <InputOTPGroup>
                                  <InputOTPSlot index={0} />
                                  <InputOTPSlot index={1} />
                                  <InputOTPSlot index={2} />
                                  <InputOTPSlot index={3} />
                                  <InputOTPSlot index={4} />
                                  <InputOTPSlot index={5} />
                                </InputOTPGroup>
                              </InputOTP>
                            </div>
                            <Button
                              className="w-full h-12 rounded-xl font-semibold"
                              style={{ background: 'var(--gradient-primary)' }}
                              onClick={handleVerifyOtp}
                              disabled={otpLoading || otpCode.length !== 6}
                            >
                              {otpLoading ? (
                                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Verifying...</>
                              ) : (
                                <>Verify Code</>
                              )}
                            </Button>
                            <Button
                              variant="ghost"
                              className="w-full text-muted-foreground text-sm"
                              onClick={handleSendOtp}
                              disabled={resendCooldown > 0 || otpLoading}
                            >
                              {resendCooldown > 0
                                ? `Resend code in ${resendCooldown}s`
                                : 'Resend code'}
                            </Button>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>
                )}

                {/* Step 1: cancellation reason */}
                {cancelStep === 1 && (
                  <motion.div
                    key="reason"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                  >
                    <Card className="border border-border overflow-hidden">
                      <CardContent className="p-6 space-y-4">
                        <div className="text-center space-y-2">
                          <h2 className="text-xl font-bold text-foreground">Why are you canceling today?</h2>
                          <p className="text-sm text-muted-foreground">
                            Your feedback helps us improve. Pick the option that fits best.
                          </p>
                        </div>
                        <div className="space-y-2">
                          {CANCEL_REASONS.map((r) => {
                            const selected = cancelReason === r.value;
                            return (
                              <button
                                key={r.value}
                                type="button"
                                onClick={() => setCancelReason(r.value)}
                                className={cn(
                                  'w-full text-left rounded-xl border p-4 text-sm transition-all',
                                  selected
                                    ? 'border-primary bg-primary/5 text-foreground'
                                    : 'border-border hover:border-primary/40 text-muted-foreground'
                                )}
                              >
                                <div className="flex items-center justify-between gap-3">
                                  <span className="font-medium">{r.label}</span>
                                  {selected && <Check className="w-4 h-4 text-primary shrink-0" />}
                                </div>
                              </button>
                            );
                          })}
                        </div>
                        <div className="space-y-2 pt-2">
                          <Button
                            className="w-full h-12 rounded-xl font-semibold"
                            style={{ background: 'var(--gradient-primary)' }}
                            onClick={() => setCancelStep(2)}
                            disabled={!cancelReason}
                          >
                            Continue
                          </Button>
                          <Button
                            variant="outline"
                            className="w-full rounded-xl"
                            onClick={() => { setCancelStep(0); setOtpSent(false); setOtpVerified(false); setOtpCode(''); setCancelReason(null); setSection('subscription'); }}
                          >
                            Keep My Subscription
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                )}

                {/* Step 2: final confirmation */}
                {cancelStep === 2 && (
                  <motion.div
                    key="final"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                  >
                    <Card className="border border-border">
                      <CardContent className="p-6 space-y-4 text-center">
                        <h2 className="text-lg font-bold text-foreground">We're sorry to see you go</h2>
                        <p className="text-sm text-muted-foreground">
                          Your subscription will remain active until the end of your current billing period. After that, you'll lose access to premium features and your personalization data.
                        </p>
                        <div className="space-y-2 pt-2">
                          <Button
                            variant="destructive"
                            className="w-full h-12 rounded-xl font-semibold"
                            onClick={handleCancelSubscription}
                            disabled={actionLoading}
                          >
                            {actionLoading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Processing...</> : 'Confirm Cancellation'}
                          </Button>
                          <Button
                            variant="outline"
                            className="w-full rounded-xl"
                            onClick={() => { setCancelStep(0); setOtpSent(false); setOtpVerified(false); setOtpCode(''); setCancelReason(null); setSection('subscription'); }}
                          >
                            Keep My Subscription
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}

          {/* BILLING */}
          {section === 'billing' && (
            <motion.div
              key="billing"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <Accordion type="single" collapsible className="space-y-2">
                <AccordionItem value="refund" className="border border-border rounded-xl px-4">
                  <AccordionTrigger className="text-sm font-medium">Where is my refund?</AccordionTrigger>
                  <AccordionContent className="text-sm text-muted-foreground space-y-3">
                    <p>{REFUND_GUARANTEE}</p>
                    <p>Once approved, refund processing typically takes 3 business days from our side. Most refunds appear in your account within 1-2 business days after processing, though in some instances it might take up to 5-10 business days, depending on your bank's processing times.</p>
                    <p>For currency conversion cases, exchange rates are determined by your bank or card issuer. Any currency conversion fees from your bank are not refundable.</p>
                    <p>The refund will be returned to the original payment method. If your card is expired or blocked, your financial institution should still receive and credit money back to your account balance.</p>
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="addons" className="border border-border rounded-xl px-4">
                  <AccordionTrigger className="text-sm font-medium">Are add-ons refundable?</AccordionTrigger>
                  <AccordionContent className="text-sm text-muted-foreground space-y-3">
                    <p>Add-ons are one-time purchases between $1 and $8. They are not part of your subscription and never renew.</p>
                    <p>Because each add-on is generated from your own responses and delivered to your account immediately, add-ons are non-refundable once generated. Exceptions apply if a technical issue prevented delivery, you were charged twice for the same add-on, or the content was not delivered as described.</p>
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="unauthorized" className="border border-border rounded-xl px-4">
                  <AccordionTrigger className="text-sm font-medium">I didn't authorize a recurring charge</AccordionTrigger>
                  <AccordionContent className="text-sm text-muted-foreground space-y-3">
                    <p>At checkout, you picked a Life Scale plan (Insight, Guide, Focus, or Complete) and an introductory offer. Both the introductory price and the recurring monthly price were displayed on the same screen and required your confirmation before payment.</p>
                    <p>{renewalTermsAll()}</p>
                    <p>After sign-up we emailed a receipt with your plan name, introductory term, recurring price, and the exact renewal date. {statementDescriptorNote()}</p>
                    <p>{AUTO_RENEW_NOTICE} You can <button onClick={() => { setSection('cancel-flow'); setCancelStep(0); }} className="text-primary underline">cancel anytime through our cancellation flow</button>.</p>
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="unaware" className="border border-border rounded-xl px-4">
                  <AccordionTrigger className="text-sm font-medium">I was unaware of the charges</AccordionTrigger>
                  <AccordionContent className="text-sm text-muted-foreground space-y-3">
                    <p>Life Scale is a paid service. To reach your results you had to pick a plan (Insight, Guide, Focus, or Complete), choose an introductory offer, enter payment details, and agree to the terms shown on the checkout screen. The flow can't be completed without those steps.</p>
                    <p>Right after sign-up we sent a welcome email with your plan, introductory term, recurring monthly price, next billing date, and a link to manage or cancel your subscription in the Help Center.</p>
                    <p>Still need help? Email help@life-scale.com.</p>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>

              <div className="mt-6 text-center">
                <button
                  type="button"
                  onClick={startRefundRequest}
                  className="text-sm font-semibold text-primary underline underline-offset-4 hover:text-primary/80"
                >
                  Request a Refund
                </button>
              </div>



            </motion.div>
          )}

          {/* LEGAL */}
          {section === 'legal' && (
            <motion.div
              key="legal"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-3"
            >
              {[
                { label: 'Privacy Policy', href: '/privacy' },
                { label: 'Terms & Conditions', href: '/terms' },
                { label: 'Cookie Policy', href: '/cookies' },
                { label: 'Refund Policy', href: '/refund-policy' },
              ].map((item) => (
                <Card
                  key={item.label}
                  className="cursor-pointer hover:shadow-[var(--shadow-card)] transition-shadow border border-border"
                  onClick={() => navigate(item.href)}
                >
                  <CardContent className="flex items-center gap-4 p-4">
                    <Scale className="w-5 h-5 text-primary shrink-0" />
                    <span className="text-sm font-medium text-foreground flex-1">{item.label}</span>
                    <ExternalLink className="w-4 h-4 text-muted-foreground" />
                  </CardContent>
                </Card>
              ))}
            </motion.div>
          )}

          {/* CONTACT */}
          {section === 'contact' && (
            <motion.div
              key="contact"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <Card className="border border-border">
                <CardContent className="p-5">
                  {submitted ? (
                    <div className="flex items-center justify-center py-12 text-center">
                      <p className="text-muted-foreground">Your ticket has been submitted. We'll reach back out within 1–2 business days.</p>
                    </div>
                  ) : (
                  <form onSubmit={handleContactSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">Name <span className="text-destructive">*</span></label>
                      <Input
                        placeholder="Your name"
                        value={contactForm.name}
                        onChange={(e) => setContactForm(f => ({ ...f, name: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">Email <span className="text-destructive">*</span></label>
                      <Input
                        type="email"
                        required
                        placeholder="your@email.com"
                        value={contactForm.email}
                        onChange={(e) => setContactForm(f => ({ ...f, email: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">Subject <span className="text-destructive">*</span></label>
                      <div className="flex flex-wrap gap-2">
                        {["Cancellation", "Refund", "Technical Issues", "Other"].map((option) => (
                          <button
                            key={option}
                            type="button"
                            onClick={() => {
                              if (option === "Cancellation") {
                                setShowCancelDialog(true);
                              } else {
                                setContactForm(f => ({ ...f, subject: option }));
                              }
                            }}
                            className={`px-4 py-2 rounded-full text-sm font-medium border transition-colors ${
                              contactForm.subject === option
                                ? "bg-primary text-primary-foreground border-primary"
                                : "bg-muted text-foreground border-border hover:border-primary/50"
                            }`}
                          >
                            {option}
                          </button>
                        ))}
                      </div>
                    </div>
                    {contactForm.subject === 'Refund' && (
                      <>
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-foreground">Transaction Total <span className="text-destructive">*</span></label>
                          <div className="flex flex-wrap gap-2">
                            {['$7.99', '$13.99', '$28.99', '$38.99'].map((amount) => (
                              <button
                                key={amount}
                                type="button"
                                onClick={() => setContactForm(f => ({ ...f, billingAmount: amount }))}
                                className={`px-4 py-2 rounded-full text-sm font-medium border transition-colors ${
                                  contactForm.billingAmount === amount
                                    ? 'bg-primary text-primary-foreground border-primary'
                                    : 'bg-muted text-foreground border-border hover:border-primary/50'
                                }`}
                              >
                                {amount}
                              </button>
                            ))}
                          </div>
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-foreground">Date Charged <span className="text-destructive">*</span></label>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                className={cn(
                                  'w-full justify-start text-left font-normal',
                                  !contactForm.billingDate && 'text-muted-foreground'
                                )}
                              >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {contactForm.billingDate ? format(contactForm.billingDate, 'PPP') : <span>Select date</span>}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <Calendar
                                mode="single"
                                selected={contactForm.billingDate}
                                onSelect={(date) => setContactForm(f => ({ ...f, billingDate: date }))}
                                disabled={(date) => date > new Date()}
                                initialFocus
                                className={cn('p-3 pointer-events-auto')}
                              />
                            </PopoverContent>
                          </Popover>
                        </div>
                        <div className="space-y-2 rounded-xl border border-border p-4">
                          <label className="text-sm font-medium text-foreground">Verify your email <span className="text-destructive">*</span></label>
                          {refundVerified ? (
                            <p className="text-sm text-primary font-medium">Email verified. You can submit your refund request.</p>
                          ) : (
                            <>
                              <p className="text-xs text-muted-foreground">For your security, we send a 6-digit code to the email on your account before processing a refund request.</p>
                              {!refundOtpSent ? (
                                <Button type="button" variant="outline" className="w-full" disabled={refundOtpLoading} onClick={handleSendRefundOtp}>
                                  {refundOtpLoading ? 'Sending...' : 'Send verification code'}
                                </Button>
                              ) : (
                                <div className="space-y-2">
                                  <Input
                                    inputMode="numeric"
                                    maxLength={6}
                                    placeholder="6-digit code"
                                    value={refundOtpCode}
                                    onChange={(e) => setRefundOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                  />
                                  <div className="flex gap-2">
                                    <Button type="button" className="flex-1" disabled={refundOtpLoading} onClick={handleVerifyRefundOtp}>
                                      {refundOtpLoading ? 'Verifying...' : 'Verify'}
                                    </Button>
                                    <Button type="button" variant="ghost" disabled={refundOtpLoading} onClick={handleSendRefundOtp}>
                                      Resend
                                    </Button>
                                  </div>
                                </div>
                              )}
                            </>
                          )}
                        </div>
                      </>
                    )}

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">Message <span className="text-destructive">*</span></label>
                      <Textarea
                        required
                        placeholder="Tell us how we can help..."
                        rows={5}
                        value={contactForm.message}
                        onChange={(e) => setContactForm(f => ({ ...f, message: e.target.value }))}
                      />
                    </div>
                    <Button
                      type="submit"
                      className="w-full h-12 rounded-xl font-semibold"
                      style={{ background: 'var(--gradient-primary)' }}
                      disabled={sending || (contactForm.subject === 'Refund' && !refundVerified)}
                    >
                      {sending ? 'Sending...' : (<>Contact Support <Send className="w-4 h-4 ml-2" /></>)}
                    </Button>
                  </form>
                  )}
                </CardContent>
              </Card>

              <div className="text-center text-sm text-muted-foreground space-y-2">
                <p>We'll reach back out as soon as possible. It usually takes 1-2 business days.</p>
                
                
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>

      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Looking to cancel?</DialogTitle>
            <DialogDescription>
              You can manage your cancellation directly from the Cancellations section — no need to contact support.
            </DialogDescription>
          </DialogHeader>
          <Button
            className="w-full rounded-xl font-semibold"
            onClick={() => {
              setShowCancelDialog(false);
              setSection('cancel-flow');
              setCancelStep(0);
            }}
          >
            Go to Cancellation
          </Button>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default HelpPage;
