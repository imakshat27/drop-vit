'use client';
import { useActionState, useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { ArrowRight, ArrowLeft, ArrowUpRight, Check } from 'lucide-react';
import { submitAction } from '@/app/actions';
import { submissionSchema, type SubmissionInput } from '@/lib/validation';
import { categories, categoryCopy } from '@/lib/constants';
import { Tag } from './cards';
const defaults: SubmissionInput = {
  title: '',
  tagline: '',
  description: '',
  category: 'Projects',
  website: '',
  github: '',
  demo: '',
  tech: '',
  openSource: false,
  startup: false,
  launched: false,
  problem: '',
  solution: '',
  language: '',
  license: '',
  difficulty: 'Beginner friendly',
  areas: '',
  setup: '',
  stage: '',
  traction: '',
  launchDate: '',
  whatsNew: '',
  media: '',
  team: '',
  recruiting: false,
  role: '',
  roleDescription: '',
  skills: '',
  commitment: '',
  compensation: '',
  location: '',
  applicationUrl: '',
};
const stepFields = [
  ['title', 'tagline', 'category'],
  ['description', 'problem', 'solution', 'tech', 'website', 'demo', 'media', 'team'],
  [
    'github',
    'language',
    'license',
    'difficulty',
    'areas',
    'setup',
    'stage',
    'traction',
    'launchDate',
    'whatsNew',
    'role',
    'roleDescription',
    'skills',
    'commitment',
    'compensation',
    'location',
    'applicationUrl',
  ],
];
const steps = ['The build', 'The story', 'The details', 'One last look'];
type FieldProps = {
  name: keyof SubmissionInput;
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  hint?: string;
  multiline?: boolean;
  type?: string;
  maxLength?: number;
  placeholder?: string;
  onBlur?: () => void;
};
function Field({
  name,
  label,
  value,
  onChange,
  error,
  hint,
  multiline = false,
  type = 'text',
  maxLength = 1000,
  placeholder,
  onBlur,
}: FieldProps) {
  return (
    <div className="field">
      <label htmlFor={name}>{label}</label>
      {multiline ? (
        <textarea
          id={name}
          value={value}
          onBlur={onBlur}
          onChange={(e) => onChange(e.target.value)}
          maxLength={maxLength}
          aria-invalid={!!error}
          aria-describedby={`${name}-help`}
          placeholder={placeholder}
        />
      ) : (
        <input
          id={name}
          type={type}
          value={value}
          onBlur={onBlur}
          onChange={(e) => onChange(e.target.value)}
          maxLength={maxLength}
          aria-invalid={!!error}
          aria-describedby={`${name}-help`}
          placeholder={placeholder}
        />
      )}
      <small id={`${name}-help`} className={error ? 'field-error' : ''}>
        {error || hint}
      </small>
    </div>
  );
}
export function SubmissionForm({
  initial,
  editId,
}: {
  initial?: Partial<SubmissionInput>;
  editId?: string;
}) {
  const [values, setValues] = useState<SubmissionInput>({ ...defaults, ...initial });
  const [step, setStep] = useState(0);
  const [clientErrors, setClientErrors] = useState<Record<string, string>>({});
  const [state, action, pending] = useActionState(submitAction, {});
  const summary = useRef<HTMLDivElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const errors = { ...state.errors, ...clientErrors };
  useEffect(() => {
    if (state.error) summary.current?.focus();
  }, [state]);
  function set<K extends keyof SubmissionInput>(key: K, value: SubmissionInput[K]) {
    setValues((v) => ({ ...v, [key]: value }));
    setClientErrors((e) => {
      const next = { ...e };
      delete next[key];
      return next;
    });
  }
  function field(
    name: keyof SubmissionInput,
    label: string,
    hint?: string,
    multiline = false,
    maxLength = 1000,
    type = 'text',
  ) {
    return (
      <Field
        name={name}
        label={label}
        onBlur={() => {
          const result = submissionSchema.safeParse(values);
          if (!result.success) {
            const issue = result.error.issues.find((i) => i.path[0] === name);
            if (issue && values[name]) setClientErrors((e) => ({ ...e, [name]: issue.message }));
          }
        }}
        value={String(values[name])}
        onChange={(v) => set(name, v as never)}
        error={errors[name]}
        hint={hint}
        multiline={multiline}
        maxLength={maxLength}
        type={type}
      />
    );
  }
  function move(next: number) {
    setStep(next);
    requestAnimationFrame(() => heading.current?.focus());
  }
  function advance() {
    const check = submissionSchema.safeParse(values);
    const errorMap: Record<string, string> = {};
    if (!check.success)
      for (const issue of check.error.issues) {
        const key = String(issue.path[0]);
        if (stepFields[step]?.includes(key)) errorMap[key] = issue.message;
      }
    setClientErrors(errorMap);
    if (Object.keys(errorMap).length) {
      requestAnimationFrame(() => summary.current?.focus());
      return;
    }
    move(step + 1);
  }
  function checkAll(event: React.FormEvent) {
    if (step !== 3) {
      event.preventDefault();
      advance();
      return;
    }
    const check = submissionSchema.safeParse(values);
    if (!check.success) {
      event.preventDefault();
      const map: Record<string, string> = {};
      for (const issue of check.error.issues) map[String(issue.path[0])] = issue.message;
      setClientErrors(map);
      requestAnimationFrame(() => summary.current?.focus());
    }
  }
  const showError = state.error || Object.keys(clientErrors).length > 0;
  return (
    <form action={action} onSubmit={checkAll} noValidate>
      <input type="hidden" name="editId" value={editId || ''} />
      {Object.entries(values).map(([key, value]) => (
        <input
          type="hidden"
          key={key}
          name={key}
          value={typeof value === 'boolean' ? (value ? 'on' : '') : value}
        />
      ))}
      <ol
        className="steps"
        aria-label="Submission progress"
        style={{ padding: 0, listStyle: 'none' }}
      >
        {steps.map((label, i) => (
          <li
            className={`step ${i === step ? 'current' : ''}`}
            aria-current={i === step ? 'step' : undefined}
            key={label}
          >
            <span>{i < step ? <Check size={13} aria-hidden /> : i + 1}</span>
            {label}
          </li>
        ))}
      </ol>
      <h2 tabIndex={-1} ref={heading} style={{ fontSize: 30, marginBottom: 14 }}>
        {
          [
            'What are you building?',
            'Tell the story behind it.',
            'Make it useful to discover.',
            'Looking good. Ready to Drop?',
          ][step]
        }
      </h2>
      <p style={{ fontSize: 15, marginBottom: 28 }}>
        {
          [
            'A weekend prototype or a big bet. Start with the idea.',
            'Help someone understand why this deserves to exist.',
            'One project can be open source, a startup, a launch, and a growing team.',
            'Your build goes to the curators first. After approval, it enters discovery and the next Weekly Drop.',
          ][step]
        }
      </p>
      {showError && (
        <div className="message error" role="alert" tabIndex={-1} ref={summary}>
          <b>{state.error || 'A few details need your attention.'}</b>
          <ul>
            {Object.entries(errors).map(([key, error]) => (
              <li key={key}>
                <button
                  type="button"
                  className="text-link"
                  onClick={() => {
                    const target = stepFields.findIndex((fields) => fields.includes(key));
                    move(target < 0 ? 2 : target);
                    setTimeout(() => document.getElementById(key)?.focus(), 0);
                  }}
                >
                  {key}: {error}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
      {step === 0 && (
        <>
          <div className="category-options">
            {categories.map((c) => (
              <label className="category-option" key={c}>
                <input
                  type="radio"
                  checked={values.category === c}
                  onChange={() => set('category', c)}
                  name="category-choice"
                />
                <span>
                  <b>{c}</b>
                  <small>{categoryCopy[c]}</small>
                </span>
              </label>
            ))}
          </div>
          {field('title', 'Name of your build', 'Short, memorable, and yours.', false, 80)}
          {field(
            'tagline',
            'The one-line pitch',
            '10–140 characters. What does it do, and who is it for?',
            false,
            140,
          )}
        </>
      )}
      {step === 1 && (
        <>
          {field(
            'description',
            'The story',
            'At least 50 characters. Tell us what you made and why.',
            true,
            10000,
          )}
          <div className="field-row">
            {field('problem', 'The problem (optional)', 'What needed fixing?', true, 2000)}
            {field(
              'solution',
              'Your approach (optional)',
              'What did you do differently?',
              true,
              2000,
            )}
          </div>
          {field(
            'tech',
            'The building blocks',
            'Technologies or tools, separated by commas.',
            false,
            300,
          )}
          <div className="field-row">
            {field('website', 'Website (optional)', 'A full https:// link.')}
            {field('demo', 'Live demo (optional)', 'Let people try what you made.')}
          </div>
          {field(
            'media',
            'Screenshot link (optional)',
            'A public https:// image URL. Opens at your source; uploads can be added later.',
          )}
          {field(
            'team',
            'Team members (optional)',
            'Registered Drop email addresses, separated by commas. Adding someone credits their collaboration.',
            false,
            500,
          )}
        </>
      )}
      {step === 2 && (
        <>
          <label className="checkbox">
            <input
              type="checkbox"
              checked={values.openSource || values.category === 'Open Source'}
              disabled={values.category === 'Open Source'}
              onChange={(e) => set('openSource', e.target.checked)}
            />
            <span>This project is open source.</span>
          </label>
          {(values.openSource || values.category === 'Open Source') && (
            <div className="form-panel">
              <h3 style={{ marginBottom: 22 }}>An open door for contributors.</h3>
              {field(
                'github',
                'Repository URL',
                'Required for open-source builds. Use a public https:// URL.',
              )}
              <div className="field-row">
                {field('language', 'Primary language (optional)', undefined, false, 80)}
                {field(
                  'license',
                  'License (optional)',
                  'For example, MIT or Apache-2.0.',
                  false,
                  80,
                )}
              </div>
              {field('difficulty', 'Contribution difficulty', undefined, false, 80)}
              {field(
                'areas',
                'Where help is welcome (optional)',
                'Accessibility, documentation, features…',
                false,
                500,
              )}
              {field(
                'setup',
                'Setup instructions (optional)',
                'Give someone a comfortable first step.',
                true,
                3000,
              )}
            </div>
          )}
          <label className="checkbox">
            <input
              type="checkbox"
              checked={values.startup || values.category === 'Startups'}
              disabled={values.category === 'Startups'}
              onChange={(e) => set('startup', e.target.checked)}
            />
            <span>We’re building this as a startup.</span>
          </label>
          {(values.startup || values.category === 'Startups') && (
            <div className="form-panel">
              <h3 style={{ marginBottom: 22 }}>Your next big bet.</h3>
              {field('stage', 'Stage (optional)', 'Idea, prototype, beta, or launched.', false, 80)}
              {field(
                'traction',
                'Early momentum (optional)',
                'Keep it honest. A small pilot is worth sharing.',
                false,
                500,
              )}
            </div>
          )}
          <label className="checkbox">
            <input
              type="checkbox"
              checked={values.launched || values.category === 'Launches'}
              disabled={values.category === 'Launches'}
              onChange={(e) => set('launched', e.target.checked)}
            />
            <span>There’s a public launch to celebrate.</span>
          </label>
          {(values.launched || values.category === 'Launches') && (
            <div className="form-panel">
              <h3 style={{ marginBottom: 22 }}>Freshly shipped.</h3>
              {field('launchDate', 'Launch date (optional)', undefined, false, 30, 'date')}
              {field(
                'whatsNew',
                'What’s new? (optional)',
                'What can people try in this version?',
                true,
                2000,
              )}
            </div>
          )}
          <label className="checkbox">
            <input
              type="checkbox"
              checked={values.recruiting}
              onChange={(e) => set('recruiting', e.target.checked)}
            />
            <span>
              We’re looking for a collaborator.
              <br />
              <small>Attached to your project. Never ranked.</small>
            </span>
          </label>
          {values.recruiting && (
            <div className="form-panel">
              <h3 style={{ marginBottom: 22 }}>A seat at your table.</h3>
              {field('role', 'Role title', undefined, false, 120)}
              {field('roleDescription', 'What will they help build?', undefined, true, 2000)}
              {field('skills', 'Useful skills (optional)', 'Separate with commas.', false, 300)}
              <div className="field-row">
                {field(
                  'commitment',
                  'Time commitment',
                  'For example, 4–6 hours / week.',
                  false,
                  120,
                )}
                {field(
                  'compensation',
                  'Compensation',
                  'Paid, unpaid, equity, or other. Be explicit.',
                  false,
                  120,
                )}
              </div>
              {field(
                'location',
                'Location (optional)',
                'VIT Vellore, Chennai, or remote.',
                false,
                160,
              )}
              {field(
                'applicationUrl',
                'How to apply',
                'A full https:// URL or mailto:you@example.com.',
              )}
            </div>
          )}
        </>
      )}
      {step === 3 && (
        <>
          <div className="preview-summary">
            <Tag color="lime">{values.category}</Tag>
            <h2>{values.title}</h2>
            <p>{values.tagline}</p>
            <p style={{ marginTop: 20, whiteSpace: 'pre-line', fontSize: 15 }}>
              {values.description}
            </p>
            <dl>
              <dt>Tech stack</dt>
              <dd>{values.tech || 'Not specified'}</dd>
              <dt>Links</dt>
              <dd>
                {[values.website, values.demo, values.github].filter(Boolean).join(' · ') ||
                  'No external links yet'}
              </dd>
              <dt>Team</dt>
              <dd>{values.team || 'Just you for now'}</dd>
              <dt>Also appears in</dt>
              <dd>
                {[
                  values.openSource || values.category === 'Open Source' ? 'Open Source' : '',
                  values.startup || values.category === 'Startups' ? 'Startups' : '',
                  values.launched || values.category === 'Launches' ? 'Launches' : '',
                  values.recruiting ? 'Recruitment' : '',
                ]
                  .filter(Boolean)
                  .join(' · ') || 'Project showcase'}
              </dd>
              {values.recruiting && (
                <>
                  <dt>Open role</dt>
                  <dd>
                    {values.role} · {values.commitment} · {values.compensation}
                  </dd>
                </>
              )}
            </dl>
          </div>
          <div className="message">
            <b>Curated, by design.</b>
            <p>
              Submission → curator review → approval → public discovery. A curator may ask for
              changes. You’ll see the status in your workshop.
            </p>
          </div>
        </>
      )}
      <div className="form-actions">
        {step > 0 ? (
          <button
            className="button secondary"
            type="button"
            onClick={() => move(step - 1)}
            disabled={pending}
          >
            <ArrowLeft size={16} aria-hidden />
            Back
          </button>
        ) : (
          <Link href="/me" className="text-link">
            Cancel
          </Link>
        )}
        {step < 3 ? (
          <button
            key="next-step"
            type="button"
            className="button"
            onClick={(event) => {
              event.preventDefault();
              advance();
            }}
          >
            Next <ArrowRight size={16} aria-hidden />
          </button>
        ) : (
          <button key="submit-review" className="button" type="submit" disabled={pending}>
            {pending
              ? 'Sending to the curators…'
              : editId
                ? 'Resubmit for review'
                : 'Submit for review'}
            <ArrowUpRight size={16} aria-hidden />
          </button>
        )}
      </div>
      <p className="understated" style={{ marginTop: 20 }}>
        Your draft stays here while you move between steps. Leaving this page discards unsent
        changes.
      </p>
    </form>
  );
}
