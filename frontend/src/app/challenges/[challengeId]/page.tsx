'use client';

import { ArrowLeft, ArrowRight, BookOpen, Building2, CheckCircle2, Copy, CreditCard, ExternalLink, KeyRound, Lock as LockIcon, Mail, Megaphone, Play, Share2, ShieldAlert, ShieldCheck, Target, UserCheck, X } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { AppShell } from '@/components/app-shell';
import { EmailLabLauncher } from '@/components/phone-challenge-launcher';
import type { AuthUser } from '@/lib/api';
import { recordRecentChallenge } from '@/lib/challenge-activity';
import { getSolvedChallengeIds, saveSolvedChallengeId } from '@/lib/challenge-progress';
import { getStoredUser } from '@/lib/auth';

type ChallengeApp = 'email';
type SolveQuestion = {
  id: string;
  prompt: string;
  options: { id: string; label: string }[];
  correctId: string;
  explanation: string;
};

type Challenge = {
  id: string;
  title: string;
  description: string;
  level: string;
  duration: string;
  app: ChallengeApp;
  messageId: string;
  icon: typeof Mail;
  state: 'done' | 'open' | 'locked';
  sender: string;
  redFlags: string[];
  vulnerability: string;
  identification: string[];
  urlChecks: string[];
  mitigation: string[];
  classification: 'Legitimate' | 'Suspicious' | 'Malicious';
  visual: {
    imageUrl: string;
    accent: string;
    soft: string;
    label: string;
  };
  reviewSlides: { title: string; body: string }[];
  infographic: {
    icon: typeof Mail;
    title: string;
    steps: { label: string; detail: string }[];
  };
  solveCheck: {
    questions: SolveQuestion[];
  };
};

function levelProfile(level: string) {
  if (level === 'Hard') {
    return {
      label: 'Advanced',
      detail: 'More evidence, similar-looking URL choices, and stricter pattern recognition.',
      tone: 'bg-secondary text-black',
    };
  }

  if (level === 'Medium') {
    return {
      label: 'Applied',
      detail: 'Requires connecting message pressure, sender identity, and safe response.',
      tone: 'bg-primary text-black',
    };
  }

  return {
    label: 'Starter',
    detail: 'Focuses on one or two clear warning signs and a safe next action.',
    tone: 'bg-white text-black',
  };
}

function orderedOptions(question: SolveQuestion) {
  const seed = question.id.split('').reduce((total, char) => total + char.charCodeAt(0), 0);
  return [...question.options].sort((first, second) => ((first.id.charCodeAt(0) + seed) % 7) - ((second.id.charCodeAt(0) + seed) % 7));
}

const celebrationPieces = [
  { left: '8%', delay: '0s', color: '#F59E0B', size: '10px' },
  { left: '14%', delay: '0.12s', color: '#ffffff', size: '7px' },
  { left: '21%', delay: '0.24s', color: '#2563EB', size: '9px' },
  { left: '28%', delay: '0.05s', color: '#000000', size: '8px' },
  { left: '35%', delay: '0.32s', color: '#F59E0B', size: '11px' },
  { left: '43%', delay: '0.18s', color: '#ffffff', size: '7px' },
  { left: '50%', delay: '0.28s', color: '#2563EB', size: '10px' },
  { left: '58%', delay: '0.08s', color: '#000000', size: '8px' },
  { left: '66%', delay: '0.2s', color: '#F59E0B', size: '10px' },
  { left: '73%', delay: '0.34s', color: '#ffffff', size: '7px' },
  { left: '81%', delay: '0.14s', color: '#2563EB', size: '9px' },
  { left: '89%', delay: '0.26s', color: '#000000', size: '8px' },
];

const challenges: Challenge[] = [
  {
    id: 'student-aid-confirmation',
    title: 'Scholarship Confirmation',
    description: 'A fake financial-aid email pressures the learner to verify school login details before a deadline.',
    level: 'Easy',
    duration: '8 mins',
    app: 'email',
    messageId: 'student-aid',
    icon: Mail,
    state: 'open',
    sender: 'Student Aid Office',
    redFlags: ['Lookalike sender domain: grant-verify.example', 'Urgent deadline designed to reduce careful review', 'Login verification requested from a message link'],
    vulnerability: 'The message can steal school credentials because the link leads to a cloned verification page controlled by the attacker.',
    identification: ['Compare the sender domain with the real school domain.', 'Do not trust urgency as proof of legitimacy.', 'Avoid entering passwords after following links from email.'],
    urlChecks: ['grant-verify.example is not the real school domain.', 'The page asks for a school password after arriving from an email link.', 'The page title says Student Portal, but the domain does not match the institution.'],
    mitigation: ['Change the submitted password from the real school portal immediately.', 'Report the email to school IT or security staff.', 'Enable multi-factor authentication and review recent account activity.'],
    classification: 'Malicious',
    visual: {
      imageUrl: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=1200&q=80',
      accent: '#2563EB',
      soft: 'rgba(37, 99, 235, 0.16)',
      label: 'Fake student portal',
    },
    reviewSlides: [
      { title: 'What happened', body: 'The message used a scholarship deadline to push the learner toward a credential form.' },
      { title: 'Why it matters', body: 'Credential forms reached from unexpected message links can be cloned pages controlled by an attacker.' },
      { title: 'Safer habit', body: 'Navigate to the school portal directly or confirm with the official financial-aid office before signing in.' },
    ],
    infographic: {
      icon: KeyRound,
      title: 'Credential harvest chain',
      steps: [
        { label: 'Message', detail: 'Scholarship deadline creates urgency' },
        { label: 'Link', detail: 'grant-verify.example imitates authority' },
        { label: 'Form', detail: 'Password capture completes takeover' },
      ],
    },
    solveCheck: {
      questions: [
        {
          id: 'url-pattern',
          prompt: 'What is the strongest evidence that this school portal is malicious?',
          options: [
            { id: 'domain-password', label: 'The link opens grant-verify.example and asks for a school password.' },
            { id: 'deadline-only', label: 'The email mentions a deadline.' },
            { id: 'portal-icon', label: 'The page uses a portal-style icon.' },
            { id: 'formal-title', label: 'The page title says Student Portal.' },
          ],
          correctId: 'domain-password',
          explanation: 'A copied portal design is not proof of safety. Domain mismatch plus password request is the key credential-harvesting pattern.',
        },
        {
          id: 'mitigation-step',
          prompt: 'If credentials were entered, what should happen first?',
          options: [
            { id: 'ignore', label: 'Ignore it because the page looked professional.' },
            { id: 'password-reset', label: 'Change the password from the real school portal and enable MFA.' },
            { id: 'reply', label: 'Reply to the email asking if it is real.' },
            { id: 'try-again', label: 'Submit the form again to confirm it worked.' },
          ],
          correctId: 'password-reset',
          explanation: 'Mitigation starts by controlling the real account: change the password, enable MFA, and report the message.',
        },
      ],
    },
  },
  {
    id: 'delivery-fee-email',
    title: 'Delivery Fee Email',
    description: 'A delivery-themed email claims a package is held and asks for a small redelivery payment.',
    level: 'Medium',
    duration: '10 mins',
    app: 'email',
    messageId: 'delivery',
    icon: Mail,
    state: 'open',
    sender: 'Delivery Notice',
    redFlags: ['Unexpected fee request', 'Generic sender instead of a known courier address', 'Short urgent payment path on parcel-update.example'],
    vulnerability: 'The attacker can collect payment details or redirect the learner into a credential or card-harvesting page.',
    identification: ['Verify deliveries in the official courier app or website.', 'Treat tiny fees and urgent payment links as high risk.', 'Check whether the domain actually belongs to the company.'],
    urlChecks: ['parcel-update.example is generic and does not identify a real courier.', 'The page asks for card data for a tiny fee, which is common phishing bait.', 'The sender domain is not a known courier domain.'],
    mitigation: ['Do not continue paying from the email link.', 'Check shipment status from the official courier app or typed website.', 'If card data was entered, contact the bank and monitor transactions.'],
    classification: 'Suspicious',
    visual: {
      imageUrl: 'https://images.unsplash.com/photo-1586880244386-8b3e34c8382c?auto=format&fit=crop&w=1200&q=80',
      accent: '#F59E0B',
      soft: 'rgba(245, 158, 11, 0.18)',
      label: 'Payment capture',
    },
    reviewSlides: [
      { title: 'What happened', body: 'The message introduced a small fee and sent the learner to a separate payment page.' },
      { title: 'Why it matters', body: 'Small unexpected charges are often used to make risky payment forms feel harmless.' },
      { title: 'Safer habit', body: 'Open the official courier app or known website yourself instead of following the email path.' },
    ],
    infographic: {
      icon: CreditCard,
      title: 'Delivery phishing payment funnel',
      steps: [
        { label: 'Email', detail: 'Package held message creates concern' },
        { label: 'Fee', detail: '$1.80 lowers resistance' },
        { label: 'Card', detail: 'Full card fields expose payment data' },
      ],
    },
    solveCheck: {
      questions: [
        {
          id: 'payment-pattern',
          prompt: 'Which single choice best explains the delivery email scam pattern?',
          options: [
            { id: 'email-card', label: 'An email link on a generic domain asks for full card details for a tiny fee.' },
            { id: 'low-price', label: 'The fee is low, so it is not important.' },
            { id: 'short-message', label: 'Short emails are automatically safer than long emails.' },
            { id: 'delivery-topic', label: 'Any delivery message is automatically malicious.' },
          ],
          correctId: 'email-card',
          explanation: 'The risk is the chain: email pressure, unrelated domain, and full payment data capture.',
        },
        {
          id: 'domain-transfer',
          prompt: 'Which URL is most similar to the risky pattern?',
          options: [
            { id: 'official', label: 'https://www.fedex.com/tracking' },
            { id: 'generic', label: 'https://parcel-redelivery-fee.example/pay' },
            { id: 'typed', label: 'A manually typed official courier website' },
            { id: 'app', label: 'The official courier website opened directly from the browser' },
          ],
          correctId: 'generic',
          explanation: 'Generic delivery-themed domains are easy to create and should not receive payment details.',
        },
        {
          id: 'emotion',
          prompt: 'What emotion is this email trying to trigger?',
          options: [
            { id: 'curiosity', label: 'Curiosity about news' },
            { id: 'delivery-anxiety', label: 'Anxiety about losing or delaying a package' },
            { id: 'pride', label: 'Pride after winning a prize' },
            { id: 'boredom', label: 'Boredom from a long message' },
          ],
          correctId: 'delivery-anxiety',
          explanation: 'Delivery phishing often uses delivery anxiety because people expect packages and react quickly.',
        },
      ],
    },
  },
  {
    id: 'recruiter-verification-email',
    title: 'Recruiter Verification Email',
    description: 'A recruiter-themed email impersonates a campus hiring workflow and asks for sensitive verification details.',
    level: 'Medium',
    duration: '12 mins',
    app: 'email',
    messageId: 'careers',
    icon: Mail,
    state: 'done',
    sender: 'Campus Careers',
    redFlags: ['Password request through a recruiter email flow', 'Unverified help-style sender domain', 'Recruiting offer used as bait'],
    vulnerability: 'The attacker is attempting account takeover by convincing the learner to share a password or use a fake verification page.',
    identification: ['Legitimate staff should never ask for passwords.', 'Confirm recruiter identity through official campus channels.', 'Be cautious when opportunity pressure is paired with credential requests.'],
    urlChecks: ['campus-careers-help.example is a help-style lookalike domain, not a verified campus system.', 'The web page asks for an account password to verify a recruiter email.', 'The sender and page domain do not provide a trusted organizational identity.'],
    mitigation: ['Change any submitted password and revoke active sessions.', 'Contact the real campus careers office using an official website or phone number.', 'Report the email and avoid sending OTPs, passwords, or recovery codes in replies.'],
    classification: 'Malicious',
    visual: {
      imageUrl: 'https://images.unsplash.com/photo-1521791136064-7986c2920216?auto=format&fit=crop&w=1200&q=80',
      accent: '#2563EB',
      soft: 'rgba(37, 99, 235, 0.16)',
      label: 'Trust manipulation',
    },
    reviewSlides: [
      { title: 'What happened', body: 'The email used an opportunity to request private credentials.' },
      { title: 'Why it matters', body: 'Real recruiters and support staff do not need a user password to verify eligibility.' },
      { title: 'Safer habit', body: 'Confirm the recruiter through official channels and never share passwords by email.' },
    ],
    infographic: {
      icon: UserCheck,
      title: 'Trust manipulation loop',
      steps: [
        { label: 'Bait', detail: 'Paid internship builds interest' },
        { label: 'Trust', detail: 'Recruiter identity feels helpful' },
        { label: 'Secret', detail: 'Password request enables takeover' },
      ],
    },
    solveCheck: {
      questions: [
        {
          id: 'secret-request',
          prompt: 'What is the clearest sign that this recruiter email is social engineering?',
          options: [
            { id: 'password-chat', label: 'The recruiter asks for an account password through email or a verification page.' },
            { id: 'friendly-tone', label: 'The recruiter sounds friendly.' },
            { id: 'job-offer', label: 'The conversation mentions an internship.' },
            { id: 'short-handle', label: 'The account handle is short.' },
          ],
          correctId: 'password-chat',
          explanation: 'The decisive warning sign is the request for a password. Real recruiters never need account secrets.',
        },
        {
          id: 'sentiment',
          prompt: 'Which human trigger is being used here?',
          options: [
            { id: 'opportunity', label: 'Opportunity and excitement about a paid role' },
            { id: 'weather', label: 'Concern about weather' },
            { id: 'routine', label: 'Routine system maintenance' },
            { id: 'friendship', label: 'A casual friend asking to meet' },
          ],
          correctId: 'opportunity',
          explanation: 'The lure uses positive pressure: a valuable opportunity can make the user ignore credential safety.',
        },
        {
          id: 'verification',
          prompt: 'What is the safest way to verify this recruiter?',
          options: [
            { id: 'chat', label: 'Reply to the same email asking if they are real.' },
            { id: 'official-office', label: 'Contact the official campus careers office through its known website.' },
            { id: 'password', label: 'Send a password to prove student status.' },
            { id: 'link', label: 'Use the provided verification link because it is faster.' },
          ],
          correctId: 'official-office',
          explanation: 'Out-of-band verification with the real organization breaks the attacker-controlled conversation.',
        },
      ],
    },
  },
  {
    id: 'homograph-account-alert',
    title: 'Homograph Account Alert',
    description: 'An account alert uses a visually confusing domain to imitate a trusted brand.',
    level: 'Hard',
    duration: '12 mins',
    app: 'email',
    messageId: 'account-protection',
    icon: LockIcon,
    state: 'open',
    sender: 'Account Protection',
    redFlags: ['Homograph domain uses paypaI with a capital I instead of paypal', 'The alert claims account access is limited to create loss aversion', 'The page asks for credentials after a message link', 'The brand name appears in a domain controlled by the sender, not the official registered domain', 'The message relies on the user reading quickly instead of inspecting characters'],
    vulnerability: 'The lure depends on visual confusion. A lookalike character can make an attacker domain appear familiar long enough to capture credentials, especially when the message adds account restriction pressure.',
    identification: ['Read domains character by character, especially brand names.', 'Use a password manager because it will not autofill on the wrong domain.', 'Navigate from a saved bookmark or typed official address for account alerts.', 'Compare the registered domain, not only the words in the subdomain or path.', 'Watch for Unicode or mixed-character lookalikes such as l/I, o/0, rn/m, and accented characters.'],
    urlChecks: ['paypaI-alerts.example is not the real brand domain because the final character is an uppercase I.', 'paypal.com.security-check.example would still belong to security-check.example, not paypal.com.', 'paypa1.com replaces the letter l with the number 1.', 'xn-- style domains can be punycode representations of internationalized domains and deserve extra inspection.', 'The page asks for credentials after an unsolicited alert.'],
    mitigation: ['Close the link and sign in from the official website or app.', 'Change the password if it was entered on the lookalike page.', 'Report the message and review recent sign-in activity.', 'Use a password manager to reduce reliance on visual URL inspection.', 'Enable MFA and revoke unknown active sessions after possible credential exposure.'],
    classification: 'Malicious',
    visual: {
      imageUrl: 'https://images.unsplash.com/photo-1563986768494-4dee2763ff3f?auto=format&fit=crop&w=1200&q=80',
      accent: '#2563EB',
      soft: 'rgba(37, 99, 235, 0.16)',
      label: 'Homograph domain',
    },
    reviewSlides: [
      { title: 'What happened', body: 'The email used a brand-like sender and a visually deceptive domain to make a credential page feel familiar while account pressure pushed fast action.' },
      { title: 'Why it matters', body: 'Homograph attacks abuse similar-looking characters and brand placement. A user may see the expected word while the registered domain is controlled by someone else.' },
      { title: 'Safer habit', body: 'Slow down on domains, inspect the registered domain, use saved bookmarks, and let the password manager reveal when a site is not the real one.' },
    ],
    infographic: {
      icon: LockIcon,
      title: 'Homograph credential trap',
      steps: [
        { label: 'Lookalike', detail: 'paypaI uses I instead of l' },
        { label: 'Pressure', detail: 'Account access limited' },
        { label: 'Capture', detail: 'Credentials entered on wrong domain' },
      ],
    },
    solveCheck: {
      questions: [
        {
          id: 'homograph-clue',
          prompt: 'Which URL is the exact risky destination from the message?',
          options: [
            { id: 'capital-i', label: 'https://paypaI-alerts.example/secure - uses capital I instead of lowercase l.' },
            { id: 'paypal-official', label: 'https://www.paypal.com/security - official registered domain.' },
            { id: 'subdomain-trick', label: 'https://paypal.com.security-check.example - paypal.com appears before the real domain.' },
            { id: 'number-one', label: 'https://paypa1.com/secure - uses the number 1 instead of l.' },
          ],
          correctId: 'capital-i',
          explanation: 'All lookalike choices are suspicious except the official domain, but the message specifically used paypaI-alerts.example with a capital I.',
        },
        {
          id: 'best-tool',
          prompt: 'Which habit helps detect this type of attack?',
          options: [
            { id: 'password-manager', label: 'Use a password manager or saved bookmark for important accounts.' },
            { id: 'reply-confirm', label: 'Reply to the email asking if the link is safe.' },
            { id: 'rush-login', label: 'Sign in quickly before the alert expires.' },
            { id: 'trust-logo', label: 'Trust the page if the logo looks correct.' },
          ],
          correctId: 'password-manager',
          explanation: 'Password managers usually refuse to autofill on the wrong domain, which exposes lookalike sites.',
        },
        {
          id: 'registered-domain',
          prompt: 'For https://paypal.com.security-check.example/login, who controls the registered domain?',
          options: [
            { id: 'security-check', label: 'security-check.example controls it; paypal.com is only a subdomain label.' },
            { id: 'paypal', label: 'paypal.com controls it because paypal appears first.' },
            { id: 'browser', label: 'The browser controls it because HTTPS is present.' },
            { id: 'login', label: 'The /login path controls the website owner.' },
          ],
          correctId: 'security-check',
          explanation: 'Read domains from right to left around the public suffix. The registered domain here is security-check.example.',
        },
        {
          id: 'punycode',
          prompt: 'Which URL needs extra inspection because it may represent an internationalized lookalike domain?',
          options: [
            { id: 'punycode-url', label: 'https://xn--paypl-3ve.example/login' },
            { id: 'official-help', label: 'https://www.paypal.com/help' },
            { id: 'plain-school', label: 'https://library.school.example/holds' },
            { id: 'typed-official', label: 'A saved bookmark to the official account site' },
          ],
          correctId: 'punycode-url',
          explanation: 'xn-- prefixes are punycode. They are not automatically malicious, but they should be inspected carefully in account-login contexts.',
        },
        {
          id: 'risk',
          prompt: 'Why is this scenario high risk?',
          options: [
            { id: 'credential-theft', label: 'It can collect account credentials on a domain that only looks familiar.' },
            { id: 'long-email', label: 'The email has more than one sentence.' },
            { id: 'morning-time', label: 'The message arrived in the morning.' },
            { id: 'button-text', label: 'The page has a button.' },
          ],
          correctId: 'credential-theft',
          explanation: 'The risk is credential theft through visual deception and urgency.',
        },
      ],
    },
  },
  {
    id: 'mfa-code-pressure-email',
    title: 'MFA Code Pressure Email',
    description: 'An email pressures the learner to reply with a one-time verification code.',
    level: 'Medium',
    duration: '9 mins',
    app: 'email',
    messageId: 'mfa-code',
    icon: Mail,
    state: 'open',
    sender: 'IT Desk',
    redFlags: ['Requests a one-time code by email reply', 'Claims immediate lockout to create panic', 'Sender domain is not the official help desk domain'],
    vulnerability: 'Attackers can use a shared OTP or MFA code to complete a login or account recovery attempt in real time.',
    identification: ['Never share OTP, MFA, or recovery codes with anyone.', 'Official support does not need your one-time code.', 'Verify lockout notices through the official app or help desk number.'],
    urlChecks: ['There may be no link; the requested code itself is the target.', 'The sender identity does not prove it is the real IT team.', 'The timing may match a login attempt started by the attacker.'],
    mitigation: ['Do not reply with the code.', 'Deny unexpected MFA prompts and change the account password if prompts continue.', 'Contact the official help desk through a known channel.'],
    classification: 'Malicious',
    visual: {
      imageUrl: 'https://images.unsplash.com/photo-1614064641938-3bbee52942c7?auto=format&fit=crop&w=1200&q=80',
      accent: '#F59E0B',
      soft: 'rgba(245, 158, 11, 0.18)',
      label: 'OTP theft',
    },
    reviewSlides: [
      { title: 'What happened', body: 'The email tried to convert panic into a quick reply containing a one-time security code.' },
      { title: 'Why it matters', body: 'A one-time code can be enough for an attacker to finish a login, reset, or account recovery flow.' },
      { title: 'Safer habit', body: 'Treat every code as a password. Do not share it by email reply, form submission, or a phone call.' },
    ],
    infographic: {
      icon: KeyRound,
      title: 'OTP interception pattern',
      steps: [
        { label: 'Attempt', detail: 'Attacker starts login or reset' },
        { label: 'Pressure', detail: 'Victim receives panic text' },
        { label: 'Code', detail: 'Shared OTP completes takeover' },
      ],
    },
    solveCheck: {
      questions: [
        {
          id: 'otp-rule',
          prompt: 'What should you do with a one-time code requested by email?',
          options: [
            { id: 'never-share', label: 'Do not share it; verify through the official support channel.' },
            { id: 'send-fast', label: 'Send it quickly if the message says lockout.' },
            { id: 'partial', label: 'Send only the first three digits.' },
            { id: 'ask-sender', label: 'Reply to the same sender asking if they are really IT.' },
          ],
          correctId: 'never-share',
          explanation: 'OTP and MFA codes are secrets. Real support teams should not ask you to disclose them.',
        },
        {
          id: 'no-link',
          prompt: 'Why can this still be malicious even without a link?',
          options: [
            { id: 'code-is-target', label: 'The code is the target because it can authorize account access.' },
            { id: 'texts-bad', label: 'All text messages are malicious.' },
            { id: 'short', label: 'Short messages are always unsafe.' },
            { id: 'number', label: 'Any phone number with digits is safe.' },
          ],
          correctId: 'code-is-target',
          explanation: 'Some social engineering does not need a link. The attacker only needs the secret code.',
        },
        {
          id: 'mitigation',
          prompt: 'If repeated MFA prompts appear, what is the best next step?',
          options: [
            { id: 'secure-account', label: 'Deny prompts, change password, and contact official support.' },
            { id: 'approve-once', label: 'Approve once to make the prompts stop.' },
            { id: 'ignore-forever', label: 'Ignore all account alerts forever.' },
            { id: 'share-code', label: 'Send the code to the sender.' },
          ],
          correctId: 'secure-account',
          explanation: 'Repeated prompts can mean someone has your password. Deny, reset, and report.',
        },
      ],
    },
  },
  {
    id: 'gift-card-emergency-email',
    title: 'Gift Card Emergency Email',
    description: 'An email impersonates a trusted person and uses urgency, secrecy, and reimbursement promises.',
    level: 'Medium',
    duration: '11 mins',
    app: 'email',
    messageId: 'gift-card',
    icon: Mail,
    state: 'open',
    sender: 'Professor Hale',
    redFlags: ['Urgent favor with no call allowed', 'Gift card codes requested through email', 'Promise of reimbursement after the action'],
    vulnerability: 'Gift card codes are cash-like. Once sent, the attacker can redeem them quickly and recovery is unlikely.',
    identification: ['Verify unusual money requests through a known phone number or in person.', 'Treat secrecy and urgency as manipulation signals.', 'Never send gift card codes, payment screenshots, or recovery codes by email.'],
    urlChecks: ['No URL is required; the requested gift card code is the asset.', 'A real identity can be impersonated through display name and sender text.', 'Payment instructions in email should be verified out of band.'],
    mitigation: ['Do not buy or send codes.', 'Call the person using a known number, not the email thread.', 'Report the email and preserve screenshots for support or security staff.'],
    classification: 'Malicious',
    visual: {
      imageUrl: 'https://images.unsplash.com/photo-1607083206968-13611e3d76db?auto=format&fit=crop&w=1200&q=80',
      accent: '#F59E0B',
      soft: 'rgba(245, 158, 11, 0.18)',
      label: 'Urgency and secrecy',
    },
    reviewSlides: [
      { title: 'What happened', body: 'The email used a trusted identity, urgency, and a no-call excuse to push a financial action.' },
      { title: 'Why it matters', body: 'Gift card codes are transferable value. Attackers ask for them because they are fast to redeem and hard to recover.' },
      { title: 'Safer habit', body: 'Any unusual money request should be verified outside the same conversation before action.' },
    ],
    infographic: {
      icon: UserCheck,
      title: 'Emotional pressure loop',
      steps: [
        { label: 'Identity', detail: 'Trusted person appears to ask' },
        { label: 'Secrecy', detail: 'Cannot call, act now' },
        { label: 'Value', detail: 'Codes transfer money instantly' },
      ],
    },
    solveCheck: {
      questions: [
        {
          id: 'gift-card-risk',
          prompt: 'What makes this request high risk?',
          options: [
            { id: 'codes', label: 'Gift card codes are requested through email under urgency.' },
            { id: 'short-chat', label: 'The email is short.' },
            { id: 'professor', label: 'A professor can never message a student.' },
            { id: 'reimburse', label: 'The word reimburse always means safe.' },
          ],
          correctId: 'codes',
          explanation: 'The key pattern is urgent transfer of cash-like codes through an unverifiable email thread.',
        },
        {
          id: 'verify',
          prompt: 'How should the identity be verified?',
          options: [
            { id: 'known-channel', label: 'Call or contact the person through a known, separate channel.' },
            { id: 'same-chat', label: 'Reply to the same email asking if it is real.' },
            { id: 'send-small', label: 'Send one card first as a test.' },
            { id: 'trust-name', label: 'Trust the display name.' },
          ],
          correctId: 'known-channel',
          explanation: 'Out-of-band verification prevents the attacker from answering their own trust check.',
        },
        {
          id: 'manipulation',
          prompt: 'Which manipulation technique is strongest here?',
          options: [
            { id: 'urgency-secrecy', label: 'Urgency plus secrecy to stop verification.' },
            { id: 'technical-jargon', label: 'Technical jargon.' },
            { id: 'public-proof', label: 'Public proof from many sources.' },
            { id: 'slow-process', label: 'A slow formal approval process.' },
          ],
          correctId: 'urgency-secrecy',
          explanation: 'The attacker tries to isolate the target from normal verification.',
        },
      ],
    },
  },
  {
    id: 'cloud-document-share',
    title: 'Cloud Document Share',
    description: 'A document-sharing email uses curiosity and confidentiality to lure a sign-in.',
    level: 'Medium',
    duration: '10 mins',
    app: 'email',
    messageId: 'shared-document',
    icon: Share2,
    state: 'open',
    sender: 'Shared Documents',
    redFlags: ['Unexpected sensitive file name', 'Generic document domain', 'Sign-in required from a message link'],
    vulnerability: 'The page can collect credentials by imitating a document viewer and exploiting curiosity about a sensitive file.',
    identification: ['Confirm unexpected file shares with the sender outside the email.', 'Check whether the domain is the real document platform.', 'Be cautious when a confidential filename creates curiosity or fear.'],
    urlChecks: ['docs-access.example is not an official document platform domain.', 'The file name is used as bait to drive sign-in.', 'The page asks for credentials before proving the file exists.'],
    mitigation: ['Do not sign in through the message link.', 'Open the real document app directly and check shared files.', 'Report the message if the share is not expected.'],
    classification: 'Malicious',
    visual: {
      imageUrl: 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?auto=format&fit=crop&w=1200&q=80',
      accent: '#2563EB',
      soft: 'rgba(37, 99, 235, 0.16)',
      label: 'Document lure',
    },
    reviewSlides: [
      { title: 'What happened', body: 'The email used a sensitive file name to create curiosity and push a login through a third-party-looking page.' },
      { title: 'Why it matters', body: 'Document lures are common because people expect shared files at school and work.' },
      { title: 'Safer habit', body: 'Open the official document platform directly and verify the sender before signing in.' },
    ],
    infographic: {
      icon: Share2,
      title: 'Curiosity-to-login funnel',
      steps: [
        { label: 'Filename', detail: 'Sensitive title grabs attention' },
        { label: 'Viewer', detail: 'Fake document page asks login' },
        { label: 'Account', detail: 'Credentials captured before file opens' },
      ],
    },
    solveCheck: {
      questions: [
        {
          id: 'document-clue',
          prompt: 'What is the strongest warning sign?',
          options: [
            { id: 'generic-domain', label: 'The document link uses docs-access.example and asks for credentials.' },
            { id: 'pdf-name', label: 'The file ends with .pdf.' },
            { id: 'shared-word', label: 'The email says shared.' },
            { id: 'morning', label: 'The email arrived before lunch.' },
          ],
          correctId: 'generic-domain',
          explanation: 'Unexpected sign-in on a non-official document domain is the strongest credential-harvesting clue.',
        },
        {
          id: 'curiosity',
          prompt: 'Which psychological trigger is used?',
          options: [
            { id: 'curiosity-fear', label: 'Curiosity and anxiety about a sensitive file.' },
            { id: 'gratitude', label: 'Gratitude after receiving a thank-you note.' },
            { id: 'boredom', label: 'Boredom from a routine message.' },
            { id: 'celebration', label: 'Celebration from winning a contest.' },
          ],
          correctId: 'curiosity-fear',
          explanation: 'Sensitive file names can make people click before checking the sender and domain.',
        },
        {
          id: 'safe-path',
          prompt: 'What is the safest way to check the file?',
          options: [
            { id: 'official-app', label: 'Open the real document app directly and check shared files.' },
            { id: 'email-link', label: 'Use the email link because it is fastest.' },
            { id: 'reply-password', label: 'Reply with your password to request access.' },
            { id: 'ignore-domain', label: 'Ignore the domain if the page looks polished.' },
          ],
          correctId: 'official-app',
          explanation: 'Direct navigation avoids attacker-controlled links.',
        },
      ],
    },
  },
  {
    id: 'ceo-fraud',
    title: 'CEO Fraud',
    description: 'Business email compromise scenario involving executive impersonation and payment pressure.',
    level: 'Hard',
    duration: '15 mins',
    app: 'email',
    messageId: 'ceo-payment',
    icon: Megaphone,
    state: 'open',
    sender: 'Executive Office',
    redFlags: ['Authority pressure from a senior identity', 'Payment urgency before noon', 'External reply or payment path', 'Secrecy language that discourages normal verification', 'A one-time vendor change that bypasses procurement controls'],
    vulnerability: 'Executive impersonation can bypass normal approval behavior and cause payment fraud by combining hierarchy, urgency, confidentiality, and a destination controlled outside the normal finance workflow.',
    identification: ['Verify payment requests out of band.', 'Check reply-to addresses carefully.', 'Follow approval workflow even when the message claims urgency.', 'Treat secrecy and “do not call” language as manipulation, not as authorization.', 'Compare the sender display name, email domain, linked domain, invoice details, and payment beneficiary together.'],
    urlChecks: ['company-payments.example is external and should not be trusted as an internal vendor portal.', 'company.com.payments.example would belong to payments.example, not company.com.', 'cornpany.com can visually imitate company.com by replacing m with rn.', 'A legitimate request should use known finance systems and approved vendor records.', 'Bank-detail changes should not be accepted from a link in a message thread.'],
    mitigation: ['Pause the request and verify it through a known internal channel.', 'Follow payment approval workflow even if the message says it is urgent.', 'Report the message to security or finance operations.', 'Contact the vendor using existing records, not contact details from the message.', 'Require dual approval for vendor bank-detail changes.'],
    classification: 'Suspicious',
    visual: {
      imageUrl: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=1200&q=80',
      accent: '#F59E0B',
      soft: 'rgba(245, 158, 11, 0.18)',
      label: 'Authority pressure',
    },
    reviewSlides: [
      { title: 'What happened', body: 'The message used executive authority, secrecy, and a same-day deadline to pressure a vendor-payment action outside normal workflow.' },
      { title: 'Why it matters', body: 'Business email compromise works when multiple small inconsistencies are ignored because hierarchy and urgency feel more important than verification.' },
      { title: 'Safer habit', body: 'Treat financial changes as controlled operations: verify out of band, compare domains and beneficiary details, and require the normal approval path every time.' },
    ],
    infographic: {
      icon: Building2,
      title: 'Authority pressure path',
      steps: [
        { label: 'Authority', detail: 'Executive identity pushes obedience' },
        { label: 'Urgency', detail: 'Time pressure weakens review' },
        { label: 'Control', detail: 'Approval workflow stops fraud' },
      ],
    },
    solveCheck: {
      questions: [
        {
          id: 'response',
          prompt: 'What is the safest response to an urgent executive payment request?',
          options: [
            { id: 'workflow-verify', label: 'Verify out of band and follow the normal approval workflow.' },
            { id: 'reply-fast', label: 'Reply quickly because the sender appears senior.' },
            { id: 'keep-secret', label: 'Keep it confidential because the message asks for secrecy.' },
            { id: 'pay-small', label: 'Proceed if the payment amount is small.' },
          ],
          correctId: 'workflow-verify',
          explanation: 'Executive fraud is defeated by slowing down, verifying through a known channel, and following payment controls.',
        },
        {
          id: 'combined-manipulation',
          prompt: 'Which combination best explains the social-engineering technique?',
          options: [
            { id: 'authority-urgency-secrecy', label: 'Authority, urgency, and secrecy are used together to bypass normal checks.' },
            { id: 'free-gift-domain', label: 'A free gift and a misspelled shopping domain are the main issue.' },
            { id: 'otp-only', label: 'The message only attempts MFA code theft.' },
            { id: 'newsletter', label: 'It is a routine newsletter with no requested action.' },
          ],
          correctId: 'authority-urgency-secrecy',
          explanation: 'Harder BEC cases often stack pressure signals: hierarchy, deadline, confidentiality, and workflow bypass.',
        },
        {
          id: 'domain-logic',
          prompt: 'Which linked destination is most clearly outside the real company domain?',
          options: [
            { id: 'external-portal', label: 'https://company-payments.example/vendor' },
            { id: 'real-finance', label: 'https://finance.company.com/vendors' },
            { id: 'intranet', label: 'https://intranet.company.com/payments' },
            { id: 'known-erp', label: 'https://erp.company.com/vendor-records' },
          ],
          correctId: 'external-portal',
          explanation: 'The registered domain is company-payments.example, not company.com. Brand words in a domain do not prove ownership.',
        },
        {
          id: 'lookalike-company',
          prompt: 'Which domain variant is a homograph-style warning for a company.com impersonation?',
          options: [
            { id: 'rn-domain', label: 'https://finance.cornpany.com - rn can visually imitate m.' },
            { id: 'subdomain-real', label: 'https://payments.company.com - a subdomain under company.com.' },
            { id: 'path-real', label: 'https://company.com/payments/vendor' },
            { id: 'help-real', label: 'https://help.company.com/security' },
          ],
          correctId: 'rn-domain',
          explanation: 'cornpany.com is a different registered domain from company.com. The rn/m visual trick is a common lookalike pattern.',
        },
        {
          id: 'pattern',
          prompt: 'Which related message should be treated as highest risk?',
          options: [
            { id: 'policy', label: 'A normal policy reminder on the company intranet.' },
            { id: 'invoice-change', label: 'A senior leader asks to change bank details privately today.' },
            { id: 'meeting', label: 'A calendar reminder from the official calendar system.' },
            { id: 'benefits', label: 'A benefits newsletter from the known HR platform.' },
          ],
          correctId: 'invoice-change',
          explanation: 'Private bank-detail changes under time pressure are a classic business email compromise pattern.',
        },
        {
          id: 'verification-chain',
          prompt: 'Which verification chain is strongest before changing vendor bank details?',
          options: [
            { id: 'known-records-dual', label: 'Use existing vendor records, call a known contact, and require dual approval in the finance system.' },
            { id: 'reply-sender', label: 'Reply to the same message thread and ask if the request is real.' },
            { id: 'trust-title', label: 'Trust it because the display name contains an executive title.' },
            { id: 'fast-link', label: 'Use the linked portal first, then verify after payment.' },
          ],
          correctId: 'known-records-dual',
          explanation: 'A strong control chain uses known records and internal approval, not attacker-provided contacts or links.',
        },
      ],
    },
  },
];

type FeedbackDetail = {
  challengeId: string;
  reason: string;
  submissionState?: 'empty' | 'partial' | 'filled';
  submittedFields?: string[];
  missingFields?: string[];
  activityTrail?: {
    kind: string;
    label: string;
    detail?: string;
    value?: string;
    at: string;
  }[];
  replyText?: string;
  linkClicked?: boolean;
  formTouched?: boolean;
  browserOpened?: boolean;
  browserSubmitted?: boolean;
  browserClosedWithoutSubmit?: boolean;
};

type InteractionAnalysis = {
  outcome: string;
  risk: string;
  exposure: string;
  summary: string;
  nextStep: string;
  badges: string[];
};

export default function ChallengeLabPage() {
  const params = useParams<{ challengeId: string }>();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [selectedId, setSelectedId] = useState(challenges[0].id);
  const [startedId, setStartedId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<Record<string, string>>({});
  const [interactionDetails, setInteractionDetails] = useState<Record<string, FeedbackDetail>>({});
  const [reviewModalId, setReviewModalId] = useState<string | null>(null);
  const [solveAnswers, setSolveAnswers] = useState<Record<string, Record<string, string>>>({});
  const [solved, setSolved] = useState<Record<string, boolean>>({});
  const [solveMessage, setSolveMessage] = useState<Record<string, string>>({});
  const [solveCooldown, setSolveCooldown] = useState<Record<string, number>>({});
  const [completedCelebration, setCompletedCelebration] = useState<string | null>(null);
  const [activeSlide, setActiveSlide] = useState(0);
  const [notice, setNotice] = useState('');
  const [emailWorkspaceFullscreen, setEmailWorkspaceFullscreen] = useState(false);

  const selected = useMemo(() => challenges.find((challenge) => challenge.id === selectedId) ?? challenges[0], [selectedId]);
  const SelectedIcon = selected.icon;
  const selectedFeedback = feedback[selected.id];
  const reviewChallenge = reviewModalId ? challenges.find((challenge) => challenge.id === reviewModalId) : null;
  const reviewFeedback = reviewModalId ? feedback[reviewModalId] : undefined;
  const reviewInteraction = reviewModalId ? interactionDetails[reviewModalId] : undefined;
  const reviewSlide = reviewChallenge?.reviewSlides[activeSlide] ?? reviewChallenge?.reviewSlides[0];

  useEffect(() => {
    const storedUser = getStoredUser();
    setUser(storedUser);
    setSolved(Object.fromEntries(getSolvedChallengeIds(storedUser).map((challengeId) => [challengeId, true])));
  }, []);

  useEffect(() => {
    const requestedId = params?.challengeId;
    if (requestedId && challenges.some((challenge) => challenge.id === requestedId)) {
      setSelectedId(requestedId);
    }
  }, [params?.challengeId]);

  useEffect(() => {
    function handleFeedback(event: Event) {
      const detail = (event as CustomEvent<FeedbackDetail>).detail;
      setFeedback((current) => ({ ...current, [detail.challengeId]: detail.reason }));
      setInteractionDetails((current) => ({ ...current, [detail.challengeId]: detail }));
    }

    window.addEventListener('phishaware:challenge-feedback', handleFeedback);
    return () => window.removeEventListener('phishaware:challenge-feedback', handleFeedback);
  }, []);

  useEffect(() => {
    setActiveSlide(0);
  }, [selectedId]);

  useEffect(() => {
    const hasCooldown = Object.values(solveCooldown).some((seconds) => seconds > 0);
    if (!hasCooldown) return;

    const timer = window.setInterval(() => {
      setSolveCooldown((current) =>
        Object.fromEntries(
          Object.entries(current).map(([challengeId, seconds]) => [challengeId, Math.max(0, seconds - 1)]),
        ),
      );
    }, 1000);

    return () => window.clearInterval(timer);
  }, [solveCooldown]);

  function startChallenge(challenge: Challenge) {
    if (challenge.state === 'locked') return;
    setSelectedId(challenge.id);
    setStartedId(challenge.id);
    recordRecentChallenge(user, challenge.id);
    setFeedback((current) => {
      const next = { ...current };
      delete next[challenge.id];
      return next;
    });
    setInteractionDetails((current) => {
      const next = { ...current };
      delete next[challenge.id];
      return next;
    });
    setReviewModalId(null);
    setSolveAnswers((current) => ({ ...current, [challenge.id]: {} }));
    setSolveCooldown((current) => ({ ...current, [challenge.id]: 0 }));
    setSolveMessage((current) => {
      const next = { ...current };
      delete next[challenge.id];
      return next;
    });
    window.dispatchEvent(
      new CustomEvent('phishaware:start-challenge', {
        detail: {
          app: challenge.app,
          messageId: challenge.messageId,
          challengeId: challenge.id,
        },
      }),
    );
    setNotice(`A new message was sent to the ${challenge.app.toUpperCase()} app.`);
  }

  function stopChallenge(challenge: Challenge) {
    setStartedId((current) => (current === challenge.id ? null : current));
    setNotice('Challenge stopped. The email was removed from the lab inbox.');
    window.dispatchEvent(new CustomEvent('phishaware:challenge-stopped', { detail: { challengeId: challenge.id } }));
  }

  function questionCooldownKey(challengeId: string, questionId: string) {
    return `${challengeId}:${questionId}`;
  }

  function selectSolveAnswer(challengeId: string, questionId: string, optionId: string) {
    if ((solveCooldown[questionCooldownKey(challengeId, questionId)] ?? 0) > 0 || solved[challengeId]) return;
    setSolveAnswers((current) => ({
      ...current,
      [challengeId]: {
        ...(current[challengeId] ?? {}),
        [questionId]: optionId,
      },
    }));
    setSolveMessage((current) => {
      const next = { ...current };
      delete next[challengeId];
      return next;
    });
  }

  function submitSolveQuestion(challenge: Challenge, question: SolveQuestion) {
    const cooldownKey = questionCooldownKey(challenge.id, question.id);
    if ((solveCooldown[cooldownKey] ?? 0) > 0 || solved[challenge.id]) return;

    const selectedAnswer = solveAnswers[challenge.id]?.[question.id];
    const correct = selectedAnswer === question.correctId;

    if (correct) {
      const nextAnswers = {
        ...(solveAnswers[challenge.id] ?? {}),
        [question.id]: selectedAnswer,
      };
      const solvedAll = challenge.solveCheck.questions.every((item) => nextAnswers[item.id] === item.correctId);
      if (solvedAll) {
        setSolved((current) => ({ ...current, [challenge.id]: true }));
        saveSolvedChallengeId(user, challenge.id);
        window.dispatchEvent(new CustomEvent('phishaware:challenge-solved', { detail: { challengeId: challenge.id } }));
        setSolveMessage((current) => ({ ...current, [challenge.id]: `All solve checks are correct. Click Completed to open your completion card. ${question.explanation}` }));
        return;
      }

      setSolveMessage((current) => ({ ...current, [challenge.id]: `Correct. ${question.explanation}` }));
      return;
    }

    setSolveCooldown((current) => ({ ...current, [cooldownKey]: 8 }));
    setSolveMessage((current) => ({
      ...current,
      [challenge.id]: selectedAnswer
        ? 'Incorrect answer. Review the infographic, URL evidence, and scenario details before trying again.'
        : 'Select one answer before checking.',
    }));
  }

  function allSolveAnswersCorrect(challenge: Challenge) {
    return challenge.solveCheck.questions.every((question) => solveAnswers[challenge.id]?.[question.id] === question.correctId);
  }

  function openCompletionCard(challenge: Challenge) {
    if (!allSolveAnswersCorrect(challenge)) return;

    if (!solved[challenge.id]) {
      setSolved((current) => ({ ...current, [challenge.id]: true }));
      saveSolvedChallengeId(user, challenge.id);
      window.dispatchEvent(new CustomEvent('phishaware:challenge-solved', { detail: { challengeId: challenge.id } }));
      setSolveMessage((current) => ({ ...current, [challenge.id]: 'All solve checks are correct. Completion card unlocked.' }));
    }

    setCompletedCelebration(challenge.id);
  }

  function interactionReviewCopy(detail: FeedbackDetail | undefined) {
    const analysis = analyzeInteraction(detail);

    if (detail?.submissionState === 'filled') {
      return {
        title: analysis.outcome,
        risk: analysis.risk,
        body: analysis.summary,
      };
    }

    if (detail?.submissionState === 'partial') {
      return {
        title: analysis.outcome,
        risk: analysis.risk,
        body: analysis.summary,
      };
    }

    if (detail?.submissionState === 'empty') {
      return {
        title: analysis.outcome,
        risk: analysis.risk,
        body: analysis.summary,
      };
    }

    return {
      title: analysis.outcome,
      risk: analysis.risk,
      body: analysis.summary,
    };
  }

  function analyzeInteraction(detail: FeedbackDetail | undefined): InteractionAnalysis {
    const trail = detail?.activityTrail ?? [];
    const openedMessage = trail.some((item) => item.kind === 'message_open');
    const openedLink = trail.some((item) => item.kind === 'link_open');
    const openedAttachment = trail.some((item) => item.kind === 'attachment_open');
    const touchedForm = trail.some((item) => item.kind === 'form_touch');
    const submittedForm = trail.some((item) => item.kind === 'form_submit');
    const replied = trail.some((item) => item.kind === 'reply');
    const closedBrowser = trail.some((item) => item.kind === 'browser_close');
    const messageAction = [...trail].reverse().find((item) => item.kind === 'message_action');
    const browserAction = [...trail].reverse().find((item) => item.kind === 'browser_action');
    const latest = [...trail].reverse().find((item) => item.kind !== 'delivered');
    const actionLabel = messageAction?.label ?? browserAction?.label ?? latest?.label ?? detail?.reason ?? 'No action yet';

    if (!trail.length) {
      return {
        outcome: 'No interaction recorded yet',
        risk: 'Not assessed',
        exposure: 'No observed exposure',
        summary: 'The lab has not recorded a meaningful interaction yet. Open the email, inspect its sender and content, then choose a response.',
        nextStep: 'Start by opening the email and checking the sender, destination, and requested action.',
        badges: ['No activity'],
      };
    }

    if (detail?.submissionState === 'filled') {
      return {
        outcome: 'Sensitive information was submitted',
        risk: 'High exposure',
        exposure: `Submitted: ${(detail.submittedFields?.length ? detail.submittedFields : ['required fields']).join(', ')}`,
        summary: 'You followed the message path into a web page and submitted the requested fields. In a real SME workplace, this could expose employee credentials, payment data, or vendor/account information to an attacker.',
        nextStep: 'Immediately reset the affected password from the official site, revoke active sessions, notify IT or the business owner, and preserve the email for investigation.',
        badges: ['Opened link', 'Form submitted', 'High risk'],
      };
    }

    if (detail?.submissionState === 'partial') {
      return {
        outcome: 'Partial information was submitted',
        risk: 'Moderate exposure',
        exposure: `Submitted: ${detail.submittedFields?.join(', ') || 'partial fields'}; missing: ${detail.missingFields?.join(', ') || 'some fields'}`,
        summary: 'You submitted some information but did not complete every required field. This is still useful to attackers because partial employee or payment details can support follow-up scams and account recovery attempts.',
        nextStep: 'Treat any submitted fields as exposed. Stop using the message path, verify through an official channel, and report the email.',
        badges: ['Opened link', 'Partial form', 'Follow-up risk'],
      };
    }

    if (detail?.submissionState === 'empty') {
      return {
        outcome: 'Form was submitted without data',
        risk: 'Low direct exposure',
        exposure: 'No form fields were submitted',
        summary: 'You reached the web page and submitted the form without entering information. The direct data exposure is low, but the behavior shows the page was trusted enough to interact with.',
        nextStep: 'Close the page, avoid retrying with real details, and report the email with the destination URL.',
        badges: ['Opened link', 'Empty submit', 'Report URL'],
      };
    }

    if (openedLink && touchedForm && !submittedForm) {
      return {
        outcome: 'Form was edited but not submitted',
        risk: 'Moderate behavior risk',
        exposure: 'Typed data may have appeared on an untrusted page',
        summary: 'You opened the linked page and edited a form field, but stopped before submitting. This avoids final submission, although sensitive data should never be typed into a page reached from an uncertain email.',
        nextStep: 'Close the page, navigate to the real service directly, and report the email link.',
        badges: ['Opened link', 'Form touched', 'Stopped before submit'],
      };
    }

    if (openedLink && closedBrowser && !submittedForm) {
      return {
        outcome: 'Link opened, no data submitted',
        risk: 'Contained exposure',
        exposure: 'Destination visited; no submitted form data',
        summary: 'You clicked through to the destination but returned without submitting data. This limits exposure, but the destination URL and page design should still be reviewed and reported.',
        nextStep: 'Use the reported URL as evidence. For real work accounts, access the service by typing the known official address instead.',
        badges: ['Opened link', 'No submission', 'URL evidence'],
      };
    }

    if (replied && !openedLink) {
      return {
        outcome: 'Reply was sent without using the link',
        risk: 'Conversation exposure',
        exposure: detail?.replyText ? `Reply text: "${detail.replyText}"` : 'Reply confirms the mailbox is active',
        summary: 'You replied to the sender instead of using the link. That avoids credential or payment submission, but replies can confirm the employee is engaged and may invite more pressure.',
        nextStep: 'Avoid continuing in the same thread. Verify the request through a known internal contact or official business channel.',
        badges: ['Reply sent', 'No link click', 'Verify out of band'],
      };
    }

    if (messageAction?.label.toLowerCase().includes('report') || messageAction?.label.toLowerCase().includes('flag')) {
      return {
        outcome: `${messageAction.label} selected`,
        risk: 'Safe response',
        exposure: 'No sensitive data submitted',
        summary: 'You used the reporting path from the email view. This is the strongest response when the sender, link, attachment, or request does not match normal business expectations.',
        nextStep: 'Include the sender, subject, visible link, and any attachment name in the report so the organization can block similar messages.',
        badges: ['Reported', 'No submission', 'Strong response'],
      };
    }

    if (openedAttachment && !openedLink) {
      return {
        outcome: 'Attachment was reviewed',
        risk: 'Attachment review needed',
        exposure: 'Attachment opened; no link submission recorded',
        summary: 'You opened the attachment path. For SME employees, unexpected invoices, shared documents, or vendor files should be verified before opening or enabling any content.',
        nextStep: 'Confirm the file with the sender through a known channel and report unexpected attachments.',
        badges: ['Attachment opened', 'No form submit', 'Verify file'],
      };
    }

    if (openedMessage && !openedLink && !replied) {
      return {
        outcome: 'Email inspected without risky follow-up',
        risk: 'Low exposure',
        exposure: 'No link click, reply, or form submission recorded',
        summary: 'You opened and inspected the email without clicking the link or sending information. This is a safer investigation pattern when the message is unexpected.',
        nextStep: 'Use the sender address, subject, and visible URL as evidence, then report or verify outside the email thread.',
        badges: ['Inspected email', 'No link click', 'Low exposure'],
      };
    }

    return {
      outcome: actionLabel,
      risk: 'Behavior review',
      exposure: 'Review the event sequence',
      summary: 'Your interaction was recorded and should be reviewed in sequence. The safest decision depends on whether the sender, domain, request, and business context all match.',
      nextStep: 'Compare the activity timeline with the phishing anatomy below and choose the safest workplace response.',
      badges: ['Activity recorded'],
    };
  }

  function activityInsights(detail: FeedbackDetail | undefined) {
    const trail = detail?.activityTrail ?? [];
    const openedMessage = trail.some((item) => item.kind === 'message_open');
    const replied = trail.some((item) => item.kind === 'reply');
    const openedLink = Boolean(detail?.linkClicked);
    const touchedForm = Boolean(detail?.formTouched);
    const submittedForm = Boolean(detail?.browserSubmitted);
    const closedBrowserWithoutSubmit = Boolean(detail?.browserClosedWithoutSubmit);
    const messageAction = trail.find((item) => item.kind === 'message_action');

    const notes = [];
    if (!openedMessage) notes.push('The challenge message reached the inbox, but it was not opened before review.');
    if (openedMessage && !openedLink) notes.push('The message was inspected without opening the embedded link. This reduces exposure when the destination is uncertain.');
    if (openedLink && !touchedForm && closedBrowserWithoutSubmit) notes.push('The link was opened, but the web page was closed before entering data. That limits direct data exposure, but the URL should still be reported.');
    if (touchedForm && !submittedForm) notes.push('A form field was edited, but the form was not submitted. Typed sensitive data should still be treated carefully on untrusted pages.');
    if (detail?.submissionState === 'empty') notes.push('The form was submitted empty. The direct data exposure is low, but trusting the page enough to submit is still a warning sign.');
    if (detail?.submissionState === 'partial') notes.push('Partial data was submitted. Attackers can use partial identity or payment details to improve follow-up scams.');
    if (detail?.submissionState === 'filled') notes.push('Required fields were submitted. In a real attack, this could expose credentials, payment data, or account recovery information.');
    if (replied) notes.push(`The learner replied: "${detail?.replyText}". Replies can confirm the account is active and may invite more pressure.`);
    if (messageAction && !openedLink) notes.push(`The learner chose "${messageAction.label}" without using the link, which is usually safer than following the message path.`);
    const analysis = analyzeInteraction(detail);
    notes.push(`Recommended next step: ${analysis.nextStep}`);

    return notes.length ? notes : ['The review is based on the monitored email-lab activity trail for this challenge.'];
  }

  function activityTime(value: string) {
    return new Date(value).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  function completionShareText(challenge: Challenge) {
    return `I completed the ${challenge.title} phishing awareness challenge on PhishAware. Level: ${challenge.level}. Classification: ${challenge.classification}.`;
  }

  function completionEmbedHtml(challenge: Challenge) {
    return `<div style="font-family:Inter,Arial,sans-serif;max-width:420px;border:1px solid #2563EB;border-radius:14px;padding:18px;background:#000000;color:#ffffff">
  <p style="margin:0 0 8px;color:#2563EB;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.08em">PhishAware Completed Challenge</p>
  <h3 style="margin:0;color:#ffffff;font-size:22px">${challenge.title}</h3>
  <p style="margin:10px 0 0;font-size:14px;line-height:1.6">Level: ${challenge.level} | Classification: ${challenge.classification} | Focus: ${challenge.infographic.title}</p>
</div>`;
  }

  async function shareCompletion(challenge: Challenge, channel: string) {
    const text = completionShareText(challenge);
    const url = typeof window === 'undefined' ? '' : window.location.href;

    if (channel === 'native' && typeof navigator !== 'undefined' && 'share' in navigator) {
      await navigator.share({ title: `Completed: ${challenge.title}`, text, url });
      return;
    }

    const shareUrls: Record<string, string> = {
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
      x: `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
      whatsapp: `https://wa.me/?text=${encodeURIComponent(`${text} ${url}`)}`,
    };

    const target = shareUrls[channel];
    if (target) window.open(target, '_blank', 'noopener,noreferrer');
  }

  async function copyCompletionEmbed(challenge: Challenge) {
    await navigator.clipboard.writeText(completionEmbedHtml(challenge));
    setNotice('Completion embed HTML copied.');
  }

  function reviewSlideDetail(challenge: Challenge, index: number) {
    if (index === 0) {
      return {
        eyebrow: 'Decision timeline',
        heading: 'Rebuild the path from message to action',
        summary: 'This step connects what appeared in the inbox with the action taken inside the email lab. The goal is to notice how pressure, sender identity, and page context influenced the decision.',
        groups: [
          { title: 'Message pressure', items: challenge.redFlags },
          { title: 'User action', items: [feedback[challenge.id] ?? 'Interaction recorded'] },
        ],
      };
    }

    if (index === 1) {
      return {
        eyebrow: 'Evidence review',
        heading: 'Compare identity, destination, and requested data',
        summary: 'A professional phishing review does not rely on one clue. It checks whether the sender, URL, page purpose, and requested information all belong together.',
        groups: [
          { title: 'URL and page checks', items: challenge.urlChecks },
          { title: 'Why it is vulnerable', items: [challenge.vulnerability] },
        ],
      };
    }

    return {
      eyebrow: 'Response playbook',
      heading: 'Turn the lesson into a repeatable safety habit',
      summary: 'After identifying the pattern, the learner should know what to do next: stop the risky flow, verify out of band, and protect any account or payment data that may have been exposed.',
      groups: [
        { title: 'How to identify similar scams', items: challenge.identification },
        { title: 'Mitigation steps', items: challenge.mitigation },
      ],
    };
  }

  return (
    <AppShell>
      <style>{`
        @keyframes phishaware-confetti-fall {
          0% {
            opacity: 0;
            transform: translate3d(0, -30px, 0) rotate(0deg) scale(0.8);
          }
          12% {
            opacity: 1;
          }
          100% {
            opacity: 0;
            transform: translate3d(18px, 72vh, 0) rotate(540deg) scale(1);
          }
        }

        @keyframes phishaware-complete-pop {
          0% {
            transform: scale(0.92);
            opacity: 0;
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }

        .phishaware-confetti-piece {
          position: absolute;
          top: -24px;
          border-radius: 2px;
          animation: phishaware-confetti-fall 2.8s ease-out forwards;
        }

        .phishaware-complete-pop {
          animation: phishaware-complete-pop 260ms ease-out both;
        }
      `}</style>
      <div className="mx-auto max-w-7xl space-y-5">
        <div className="flex items-center justify-between gap-3">
          <Link className="inline-flex items-center gap-2 text-sm font-semibold text-white/60 transition hover:text-white" href="/challenges">
            <ArrowLeft className="h-4 w-4" />
            Back to challenges
          </Link>
          <span className="rounded-full bg-white/5 px-3 py-1 text-xs font-bold uppercase tracking-widest text-white/50">Email lab</span>
        </div>

        {(() => {
          const profile = levelProfile(selected.level);
          const InfoIcon = selected.infographic.icon;
          const challengeSolved = Boolean(solved[selected.id]);
          const interactionRecorded = Boolean(selectedFeedback);
          return (
            <>
              <section className="overflow-hidden rounded-2xl bg-white/5">
                <div className="relative min-h-72">
                  <img alt="" className="absolute inset-0 h-full w-full object-cover opacity-35" src={selected.visual.imageUrl} />
                  <div className="absolute inset-0 bg-gradient-to-r from-black via-black/75 to-black/30" />
                  <div className="relative grid min-h-72 gap-5 p-5 lg:grid-cols-[1fr_340px] lg:p-7">
                    <div className="flex flex-col justify-end">
                      <div className="mb-5 flex flex-wrap gap-2">
                        <span className="rounded-full px-3 py-1 text-xs font-black uppercase tracking-widest text-black" style={{ backgroundColor: selected.visual.accent }}>{selected.level}</span>
                        <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-bold text-white/70">{selected.duration}</span>
                        <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-bold text-white/70">{selected.solveCheck.questions.length} checks</span>
                        {challengeSolved ? <span className="rounded-full bg-primary/20 px-3 py-1 text-xs font-black uppercase text-primary">Solved</span> : null}
                      </div>
                      <h1 className="max-w-4xl text-3xl font-black tracking-tight md:text-5xl">{selected.title}</h1>
                      <p className="mt-3 max-w-3xl text-sm leading-6 text-white/70 md:text-base">{selected.description}</p>
                    </div>

                    <aside className="self-end rounded-2xl bg-black/75 p-4 backdrop-blur">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/10">
                          <SelectedIcon className="h-5 w-5 text-primary" />
                        </div>
                        <span className={`rounded-full px-2.5 py-1 text-[10px] font-black uppercase ${profile.tone}`}>{profile.label}</span>
                      </div>
                      <p className="mt-4 text-xs font-bold uppercase tracking-widest text-white/45">Operation panel</p>
                      <p className="mt-2 text-sm leading-6 text-white/70">{profile.detail}</p>
                      {notice ? <p className="mt-3 rounded-xl bg-primary/15 p-3 text-sm text-white">{notice}</p> : null}
                      <button
                        className={`mt-4 flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-black ${selected.state === 'locked' ? 'bg-white/10 text-white/40' : startedId === selected.id ? 'bg-white/10 text-white active:scale-[0.98]' : 'bg-primary text-black active:scale-[0.98]'}`}
                        type="button"
                        disabled={selected.state === 'locked'}
                        onClick={() => (startedId === selected.id ? stopChallenge(selected) : startChallenge(selected))}
                      >
                        {startedId === selected.id ? 'Stop challenge' : 'Start challenge'}
                        {startedId === selected.id ? <X className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                      </button>
                      {interactionRecorded ? (
                        <button className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-black text-black" type="button" onClick={() => setReviewModalId(selected.id)}>
                          {challengeSolved ? 'View review' : 'Review and solve'}
                          <ArrowRight className="h-4 w-4" />
                        </button>
                      ) : null}
                    </aside>
                  </div>
                </div>
              </section>

              <section className="grid gap-4 xl:grid-cols-[1fr_360px]">
                <div className="space-y-4">
                  <section className="rounded-2xl bg-white/5 p-5">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-black">
                        <BookOpen className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-xs font-bold uppercase tracking-widest text-white/45">Challenge brief</p>
                        <h2 className="text-lg font-black">What this lab teaches</h2>
                      </div>
                    </div>
                    <p className="mt-4 text-sm leading-6 text-white/70">
                      This challenge focuses on {selected.infographic.title.toLowerCase()}. Start the lab to receive the email, then work inside the simulated mail environment. The review is unlocked only after interaction so the scenario does not reveal the answer early.
                    </p>
                    <div className="mt-4 grid gap-3 md:grid-cols-3">
                      {[
                        { label: 'Channel', value: selected.app.toUpperCase() },
                        { label: 'Sender persona', value: selected.sender },
                        { label: 'Completion', value: `${selected.solveCheck.questions.length} correct answers` },
                      ].map((item) => (
                        <div key={item.label} className="rounded-xl bg-black p-3">
                          <p className="text-[10px] font-bold uppercase tracking-widest text-white/40">{item.label}</p>
                          <p className="mt-1 text-sm font-bold text-white/80">{item.value}</p>
                        </div>
                      ))}
                    </div>
                  </section>

                  <section className="rounded-2xl bg-white/5 p-5">
                    <div className="mb-4">
                      <p className="text-xs font-bold uppercase tracking-widest text-white/45">Interactive email workspace</p>
                      <h2 className="mt-1 text-lg font-black">Mail environment</h2>
                    </div>
                    <EmailLabLauncher embedded open={emailWorkspaceFullscreen} onClose={() => setEmailWorkspaceFullscreen(false)} onToggle={() => setEmailWorkspaceFullscreen((value) => !value)} />
                  </section>

                  <section className="rounded-2xl bg-white/5 p-5">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-black">
                        <InfoIcon className="h-5 w-5 text-secondary" />
                      </div>
                      <div>
                        <p className="text-xs font-bold uppercase tracking-widest text-white/45">Phishing anatomy</p>
                        <h2 className="text-lg font-black">{selected.infographic.title}</h2>
                      </div>
                    </div>
                    <div className="mt-5 grid gap-3 md:grid-cols-3">
                      {selected.infographic.steps.map((step, index) => (
                        <div key={step.label} className="rounded-2xl bg-black p-4">
                          <span className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-black text-black" style={{ backgroundColor: index === 1 ? '#F59E0B' : '#2563EB' }}>{index + 1}</span>
                          <h3 className="mt-4 text-sm font-black">{step.label}</h3>
                          <p className="mt-2 text-sm leading-6 text-white/60">{step.detail}</p>
                        </div>
                      ))}
                    </div>
                  </section>

                  <section className="grid gap-4 lg:grid-cols-2">
                    <div className="rounded-2xl bg-white/5 p-5">
                      <div className="flex items-center gap-3">
                        <ShieldAlert className="h-5 w-5 text-secondary" />
                        <h2 className="text-base font-black">Indicators to investigate</h2>
                      </div>
                      <ul className="mt-4 space-y-3">
                        {selected.redFlags.map((item) => (
                          <li key={item} className="flex gap-3 text-sm leading-6 text-white/70">
                            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-secondary" />
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="rounded-2xl bg-white/5 p-5">
                      <div className="flex items-center gap-3">
                        <ExternalLink className="h-5 w-5 text-primary" />
                        <h2 className="text-base font-black">URL and page checks</h2>
                      </div>
                      <ul className="mt-4 space-y-3">
                        {selected.urlChecks.map((item) => (
                          <li key={item} className="flex gap-3 text-sm leading-6 text-white/70">
                            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </section>
                </div>

                <aside className="space-y-4">
                  <section className="rounded-2xl bg-white/5 p-5">
                    <p className="text-xs font-bold uppercase tracking-widest text-white/45">Review status</p>
                    {interactionRecorded ? (
                      <div className="mt-4 rounded-xl bg-black p-4">
                        <div className="flex items-start gap-3">
                          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                          <div>
                            <p className="font-bold">{challengeSolved ? 'Challenge solved' : 'Interaction recorded'}</p>
                            <p className="mt-1 text-sm leading-6 text-white/60">{challengeSolved ? 'This lab is complete on your profile.' : `Action recorded: ${selectedFeedback}. Review and solve checks are unlocked.`}</p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <p className="mt-4 rounded-xl bg-black p-4 text-sm leading-6 text-white/60">Start and interact with the lab before the review and solve questions unlock.</p>
                    )}
                  </section>

                  <section className="rounded-2xl bg-white/5 p-5">
                    <p className="text-xs font-bold uppercase tracking-widest text-white/45">Reporting system</p>
                    <ul className="mt-4 space-y-3 text-sm leading-6 text-white/65">
                      <li>Inspect the sender and visible domain.</li>
                      <li>Check links before entering information.</li>
                      <li>Use review to compare your action with the safest response.</li>
                    </ul>
                  </section>
                </aside>
              </section>
            </>
          );
        })()}
      </div>

      {reviewChallenge && reviewFeedback ? (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/75 p-4">
          {completedCelebration === reviewChallenge.id ? (
            <div className="pointer-events-none fixed inset-0 z-[80] overflow-hidden" aria-hidden="true">
              {celebrationPieces.map((piece, index) => (
                <span
                  key={`${piece.left}-${piece.delay}`}
                  className="phishaware-confetti-piece"
                  style={{
                    left: piece.left,
                    width: piece.size,
                    height: index % 3 === 0 ? '18px' : piece.size,
                    backgroundColor: piece.color,
                    animationDelay: piece.delay,
                  }}
                />
              ))}
            </div>
          ) : null}
          <div className="max-h-[92dvh] w-full max-w-6xl overflow-y-auto rounded-2xl bg-black text-white shadow-2xl" role="dialog" aria-modal="true" aria-labelledby="challenge-review-title">
            <div className="relative min-h-64 overflow-hidden rounded-t-2xl">
              <img alt="" className="absolute inset-0 h-full w-full object-cover opacity-45" src={reviewChallenge.visual.imageUrl} />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/55 to-transparent" />
              <div className="relative flex min-h-64 flex-col justify-between p-5 sm:p-6">
                <div className="flex items-start justify-between gap-3">
                  <span className="rounded-full px-3 py-1 text-xs font-black uppercase tracking-widest text-black" style={{ backgroundColor: reviewChallenge.visual.accent }}>
                    {reviewChallenge.visual.label}
                  </span>
                  <button className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-black/45 text-white" type="button" onClick={() => setReviewModalId(null)} aria-label="Close review">
                    <X className="h-5 w-5" />
                  </button>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: reviewChallenge.visual.accent }}>Awareness Review</p>
                  <h2 id="challenge-review-title" className="mt-1 text-3xl font-black">{reviewChallenge.title}</h2>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-bold">Classification: {reviewChallenge.classification}</span>
                    <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-bold">Outcome: {analyzeInteraction(reviewInteraction).outcome}</span>
                    {reviewInteraction?.submissionState ? <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-bold">Submission: {reviewInteraction.submissionState}</span> : null}
                  </div>
                </div>
              </div>
            </div>

            <div className="p-5 sm:p-6">
              {completedCelebration === reviewChallenge.id ? (
                <section className="phishaware-complete-pop relative mb-3 overflow-hidden rounded-2xl bg-white text-black">
                  <div className="absolute inset-x-0 top-0 h-2" style={{ backgroundColor: reviewChallenge.visual.accent }} />
                  <div className="absolute left-8 top-8 h-3 w-3 rounded-full" style={{ backgroundColor: reviewChallenge.visual.accent }} />
                  <div className="absolute right-16 top-12 h-2 w-10 rotate-12 rounded-full bg-black/15" />
                  <div className="absolute bottom-8 left-1/3 h-2 w-12 -rotate-12 rounded-full" style={{ backgroundColor: reviewChallenge.visual.accent }} />
                  <div className="relative grid gap-5 p-5 lg:grid-cols-[1fr_0.85fr]">
                    <div>
                      <div className="flex items-start gap-3">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-black text-white">
                          <CheckCircle2 className="h-6 w-6" />
                        </div>
                        <div>
                          <p className="text-xs font-black uppercase tracking-widest text-black/55">Challenge completed</p>
                          <h3 className="mt-1 text-2xl font-black">{reviewChallenge.title}</h3>
                          <p className="mt-2 max-w-2xl text-sm font-semibold leading-6 text-black/65">
                            All solve questions were answered correctly. This challenge is marked complete on your PhishAware profile.
                          </p>
                        </div>
                      </div>

                      <div className="mt-5 grid gap-3 sm:grid-cols-3">
                        {[
                          { label: 'Level', value: reviewChallenge.level },
                          { label: 'Duration', value: reviewChallenge.duration },
                          { label: 'Result', value: `${reviewChallenge.solveCheck.questions.length}/${reviewChallenge.solveCheck.questions.length} correct` },
                          { label: 'Channel', value: reviewChallenge.app.toUpperCase() },
                          { label: 'Classification', value: reviewChallenge.classification },
                          { label: 'Focus', value: reviewChallenge.infographic.title },
                        ].map((item) => (
                          <div key={item.label} className="rounded-xl bg-black/5 p-3">
                            <p className="text-[10px] font-black uppercase tracking-widest text-black/45">{item.label}</p>
                            <p className="mt-1 text-sm font-black">{item.value}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="rounded-2xl bg-black p-4 text-white">
                      <p className="text-xs font-black uppercase tracking-widest" style={{ color: reviewChallenge.visual.accent }}>Share achievement</p>
                      <p className="mt-2 text-sm leading-6 text-white/70">Share this completion or copy an embed card for another HTML platform.</p>
                      <div className="mt-4 grid grid-cols-2 gap-2">
                        <button className="flex items-center justify-center gap-2 rounded-xl bg-white/10 px-3 py-2.5 text-xs font-bold text-white" type="button" onClick={() => void shareCompletion(reviewChallenge, 'native')}>
                          <Share2 className="h-4 w-4" />
                          Share
                        </button>
                        <button className="rounded-xl bg-white/10 px-3 py-2.5 text-xs font-bold text-white" type="button" onClick={() => void shareCompletion(reviewChallenge, 'linkedin')}>
                          LinkedIn
                        </button>
                        <button className="rounded-xl bg-white/10 px-3 py-2.5 text-xs font-bold text-white" type="button" onClick={() => void shareCompletion(reviewChallenge, 'x')}>
                          X/Twitter
                        </button>
                        <button className="rounded-xl bg-white/10 px-3 py-2.5 text-xs font-bold text-white" type="button" onClick={() => void shareCompletion(reviewChallenge, 'whatsapp')}>
                          WhatsApp
                        </button>
                      </div>
                      <button className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-xs font-black text-black" style={{ backgroundColor: reviewChallenge.visual.accent }} type="button" onClick={() => void copyCompletionEmbed(reviewChallenge)}>
                        <Copy className="h-4 w-4" />
                        Copy embed HTML
                      </button>
                      <pre className="mt-3 max-h-24 overflow-y-auto rounded-xl bg-white/10 p-3 text-[10px] leading-5 text-white/65">{completionEmbedHtml(reviewChallenge)}</pre>
                      <button className="mt-3 w-full rounded-xl bg-white px-3 py-2.5 text-xs font-black uppercase tracking-widest text-black" type="button" onClick={() => setCompletedCelebration(null)}>
                        Continue review
                      </button>
                    </div>
                  </div>
                </section>
              ) : null}

              {(() => {
                const analysis = analyzeInteraction(reviewInteraction);
                const interactionCopy = interactionReviewCopy(reviewInteraction);
                const insights = activityInsights(reviewInteraction);
                return (
                  <>
                  <div className="grid gap-3 lg:grid-cols-[1.1fr_0.9fr_0.9fr]">
                    <section className="rounded-xl p-4" style={{ backgroundColor: reviewChallenge.visual.soft }}>
                      <p className="text-xs font-semibold uppercase tracking-widest text-white/60">Observed outcome</p>
                      <p className="mt-2 text-sm font-bold leading-6">{analysis.outcome}</p>
                    </section>
                    <section className="rounded-xl bg-white/5 p-4">
                      <p className="text-xs font-semibold uppercase tracking-widest text-white/60">Exposure</p>
                      <p className="mt-2 text-sm font-bold leading-6">{analysis.exposure}</p>
                    </section>
                    <section className="rounded-xl bg-white/5 p-4">
                      <p className="text-xs font-semibold uppercase tracking-widest text-white/60">Risk level</p>
                      <p className="mt-2 text-sm font-bold leading-6">{analysis.risk}</p>
                    </section>
                  </div>

                  <section className="mt-3 rounded-xl p-4" style={{ backgroundColor: reviewChallenge.visual.soft }}>
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div className="max-w-3xl">
                        <p className="text-xs font-semibold uppercase tracking-widest text-white/65">Based on your interaction</p>
                        <h3 className="mt-2 text-xl font-black">{interactionCopy.title}</h3>
                        <p className="mt-2 text-sm leading-6 text-white/80">{interactionCopy.body}</p>
                        <div className="mt-4 rounded-xl bg-black/20 p-3">
                          <p className="text-xs font-semibold uppercase tracking-widest text-white/55">Recommended next step</p>
                          <p className="mt-2 text-sm leading-6 text-white/80">{analysis.nextStep}</p>
                        </div>
                      </div>
                      <span className="rounded-full bg-black/30 px-4 py-2 text-xs font-black uppercase tracking-widest">{interactionCopy.risk}</span>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {analysis.badges.map((badge) => (
                        <span key={badge} className="rounded-full bg-black/25 px-3 py-1 text-xs font-bold text-white/75">{badge}</span>
                      ))}
                    </div>
                    {reviewInteraction?.submissionState ? (
                      <div className="mt-4 grid gap-3 md:grid-cols-2">
                        <div className="rounded-xl bg-black/20 p-3">
                          <p className="text-xs font-semibold uppercase tracking-widest text-white/55">Submitted fields</p>
                          <div className="mt-2 flex flex-wrap gap-2">
                            {(reviewInteraction.submittedFields?.length ? reviewInteraction.submittedFields : ['none']).map((field) => (
                              <span key={field} className="rounded-full bg-white/15 px-3 py-1 text-xs font-bold">{field}</span>
                            ))}
                          </div>
                        </div>
                        <div className="rounded-xl bg-black/20 p-3">
                          <p className="text-xs font-semibold uppercase tracking-widest text-white/55">Missing fields</p>
                          <div className="mt-2 flex flex-wrap gap-2">
                            {(reviewInteraction.missingFields?.length ? reviewInteraction.missingFields : ['none']).map((field) => (
                              <span key={field} className="rounded-full bg-white/15 px-3 py-1 text-xs font-bold">{field}</span>
                            ))}
                          </div>
                        </div>
                      </div>
                    ) : null}
                    <div className="mt-4 grid gap-3 lg:grid-cols-[0.95fr_1.05fr]">
                      <div className="rounded-xl bg-black/20 p-3">
                        <p className="text-xs font-semibold uppercase tracking-widest text-white/55">Monitored activity</p>
                        <div className="mt-3 max-h-64 space-y-2 overflow-y-auto pr-1">
                          {(reviewInteraction?.activityTrail?.length ? reviewInteraction.activityTrail : []).map((item, index) => (
                            <div key={`${item.at}-${item.kind}-${index}`} className="flex gap-3 rounded-xl bg-black/25 p-3">
                              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-black text-black" style={{ backgroundColor: reviewChallenge.visual.accent }}>
                                {index + 1}
                              </div>
                              <div className="min-w-0">
                                <div className="flex flex-wrap items-center gap-2">
                                  <p className="text-sm font-bold">{item.label}</p>
                                  <span className="text-[10px] uppercase tracking-widest text-white/45">{activityTime(item.at)}</span>
                                </div>
                                {item.detail ? <p className="mt-1 break-words text-xs leading-5 text-white/65">{item.detail}</p> : null}
                              </div>
                            </div>
                          ))}
                          {!reviewInteraction?.activityTrail?.length ? <p className="rounded-xl bg-black/25 p-3 text-sm text-white/65">No monitored events were recorded yet.</p> : null}
                        </div>
                      </div>
                      <div className="rounded-xl bg-black/20 p-3">
                        <p className="text-xs font-semibold uppercase tracking-widest text-white/55">Dynamic review notes</p>
                        <div className="mt-3 space-y-2">
                          {insights.map((item) => (
                            <div key={item} className="flex gap-2 rounded-xl bg-black/25 p-3 text-xs leading-5 text-white/75">
                              <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: reviewChallenge.visual.accent }} />
                              <span>{item}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </section>
                  </>
                );
              })()}

              {reviewSlide ? (
                <section className="mt-3 rounded-2xl bg-white/5 p-4 sm:p-5">
                  {(() => {
                    const detail = reviewSlideDetail(reviewChallenge, activeSlide);
                    return (
                      <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
                        <div className="rounded-xl p-4" style={{ backgroundColor: reviewChallenge.visual.soft }}>
                          <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: reviewChallenge.visual.accent }}>Review slide {activeSlide + 1}/3</p>
                          <h3 className="mt-2 text-xl font-black">{reviewSlide.title}</h3>
                          <p className="mt-2 text-sm leading-6 text-white/75">{reviewSlide.body}</p>
                          <div className="mt-4 grid grid-cols-3 gap-2">
                            {reviewChallenge.reviewSlides.map((item, index) => (
                              <button key={item.title} className={`rounded-full px-3 py-2 text-xs font-semibold ${index === activeSlide ? 'text-black' : 'bg-white/10 text-white/65'}`} style={index === activeSlide ? { backgroundColor: reviewChallenge.visual.accent } : undefined} type="button" onClick={() => setActiveSlide(index)}>
                                {index + 1}
                              </button>
                            ))}
                          </div>
                        </div>
                        <div className="rounded-xl bg-black/25 p-4">
                          <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: reviewChallenge.visual.accent }}>{detail.eyebrow}</p>
                          <h3 className="mt-2 text-lg font-black">{detail.heading}</h3>
                          <p className="mt-2 text-sm leading-6 text-white/70">{detail.summary}</p>
                          <div className="mt-4 grid gap-3 md:grid-cols-2">
                            {detail.groups.map((group) => (
                              <div key={group.title} className="rounded-xl bg-white/5 p-3">
                                <p className="text-xs font-black uppercase tracking-widest text-white/50">{group.title}</p>
                                <div className="mt-3 space-y-2">
                                  {group.items.map((item) => (
                                    <div key={item} className="flex gap-2 rounded-lg bg-black/20 p-2 text-xs leading-5 text-white/75">
                                      <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: reviewChallenge.visual.accent }} />
                                      <span>{item}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </section>
              ) : null}

            <section className="mt-3 grid gap-3 xl:grid-cols-3">
              <div className="rounded-xl bg-white/5 p-4">
                <p className="text-xs font-semibold uppercase tracking-widest text-white/50">URL / Page clues</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {reviewChallenge.urlChecks.map((item, index) => (
                    <span key={item} className="rounded-xl px-3 py-2 text-xs font-semibold leading-5 text-white" style={{ backgroundColor: index === 0 ? reviewChallenge.visual.soft : 'rgba(255,255,255,0.08)' }}>
                      {item}
                    </span>
                  ))}
                </div>
              </div>
              <div className="rounded-xl bg-white/5 p-4">
                <p className="text-xs font-semibold uppercase tracking-widest text-white/50">Warning signs</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {reviewChallenge.redFlags.map((flag, index) => (
                    <span key={flag} className="rounded-xl px-3 py-2 text-xs font-semibold leading-5" style={{ backgroundColor: index === 1 ? reviewChallenge.visual.soft : 'rgba(255,255,255,0.08)' }}>
                      {flag}
                    </span>
                  ))}
                </div>
              </div>
              <div className="rounded-xl bg-white/5 p-4">
                <p className="text-xs font-semibold uppercase tracking-widest text-white/50">Mitigation</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {reviewChallenge.mitigation.map((item, index) => (
                    <span key={item} className="rounded-xl px-3 py-2 text-xs font-semibold leading-5" style={{ backgroundColor: index === 2 ? reviewChallenge.visual.soft : 'rgba(255,255,255,0.08)' }}>
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            </section>

            <section className="mt-3 rounded-xl bg-white/5 p-4">
              <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: reviewChallenge.visual.accent }}>Pattern infographic</p>
              <div className="mt-3 grid gap-3 md:grid-cols-[140px_1fr]">
                <div className="flex min-h-32 items-center justify-center rounded-xl" style={{ backgroundColor: reviewChallenge.visual.soft }}>
                  {(() => {
                    const InfographicIcon = reviewChallenge.infographic.icon;
                    return <InfographicIcon className="h-14 w-14" style={{ color: reviewChallenge.visual.accent }} />;
                  })()}
                </div>
                <div>
                  <h3 className="font-bold">{reviewChallenge.infographic.title}</h3>
                  <div className="mt-3 grid gap-2 sm:grid-cols-3">
                    {reviewChallenge.infographic.steps.map((step, index) => (
                      <div key={step.label} className="rounded-xl bg-black/25 p-3">
                        <div className="mb-2 flex h-7 w-7 items-center justify-center rounded-full text-xs font-black text-black" style={{ backgroundColor: reviewChallenge.visual.accent }}>{index + 1}</div>
                        <p className="text-sm font-bold">{step.label}</p>
                        <p className="mt-1 text-xs leading-5 text-white/65">{step.detail}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            <section className="mt-3 rounded-xl bg-white/5 p-4">
              <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: reviewChallenge.visual.accent }}>Solve check</p>
              {(() => {
                const completionUnlocked = solved[reviewChallenge.id] || allSolveAnswersCorrect(reviewChallenge);
                return (
                  <>
              <div className="mt-2 flex items-center justify-between gap-3 rounded-xl bg-black/25 p-3">
                <p className="text-sm text-white/75">
                  Correct answers: {reviewChallenge.solveCheck.questions.filter((question) => solveAnswers[reviewChallenge.id]?.[question.id] === question.correctId).length}/{reviewChallenge.solveCheck.questions.length}
                </p>
                <span className={`rounded-full px-3 py-1 text-xs font-bold ${completionUnlocked ? 'bg-primary text-black' : 'bg-white/10 text-white/65'}`}>
                  {completionUnlocked ? 'Solved' : 'In progress'}
                </span>
              </div>
              <div className="mt-3 space-y-3">
                {reviewChallenge.solveCheck.questions.map((question, questionIndex) => {
                  const cooldownKey = questionCooldownKey(reviewChallenge.id, question.id);
                  const cooldown = solveCooldown[cooldownKey] ?? 0;
                  const selectedAnswer = solveAnswers[reviewChallenge.id]?.[question.id];
                  const questionSolved = selectedAnswer === question.correctId;
                  const locked = cooldown > 0 || solved[reviewChallenge.id];
                  return (
                    <div key={question.id} className="rounded-xl bg-black/25 p-3">
                      <div className="flex items-start justify-between gap-3">
                        <h3 className="text-sm font-bold leading-6">{questionIndex + 1}. {question.prompt}</h3>
                        {questionSolved ? <CheckCircle2 className="h-5 w-5 shrink-0 text-primary" /> : null}
                      </div>
                      {cooldown ? (
                        <p className="mt-2 rounded-xl bg-white/10 p-3 text-sm text-white/75">
                          Incorrect answer. Next selection available in {cooldown}s.
                        </p>
                      ) : null}
                      <div className="mt-3 space-y-2">
                        {orderedOptions(question).map((option) => {
                          const checked = selectedAnswer === option.id;
                          return (
                            <label key={option.id} className={`flex items-start gap-3 rounded-xl p-3 text-sm leading-6 ${locked ? 'cursor-not-allowed opacity-70' : 'cursor-pointer'} ${checked ? 'text-black' : 'bg-white/10 text-white/75'}`} style={checked ? { backgroundColor: reviewChallenge.visual.accent } : undefined}>
                              <input
                                className="mt-1 h-4 w-4 accent-current"
                                type="radio"
                                name={`solve-${reviewChallenge.id}-${question.id}`}
                                checked={checked}
                                disabled={locked}
                                onChange={() => selectSolveAnswer(reviewChallenge.id, question.id, option.id)}
                              />
                              <span>{option.label}</span>
                            </label>
                          );
                        })}
                      </div>
                      <button
                        className="mt-3 w-full rounded-full px-4 py-2.5 text-sm font-bold text-black disabled:cursor-not-allowed disabled:opacity-45"
                        style={{ backgroundColor: reviewChallenge.visual.accent }}
                        type="button"
                        disabled={cooldown > 0 || solved[reviewChallenge.id] || !selectedAnswer}
                        onClick={() => submitSolveQuestion(reviewChallenge, question)}
                      >
                        {cooldown > 0 ? `Wait ${cooldown}s` : questionSolved && solved[reviewChallenge.id] ? 'Correct' : 'Check answer'}
                      </button>
                    </div>
                  );
                })}
              </div>
              {solveMessage[reviewChallenge.id] ? (
                <p className={`mt-3 rounded-xl p-3 text-sm leading-6 ${solved[reviewChallenge.id] ? 'bg-primary/15 text-white' : 'bg-white/10 text-white/75'}`}>
                  {solveMessage[reviewChallenge.id]}
                </p>
              ) : null}
              {completionUnlocked ? (
                <div className="mt-3 rounded-2xl bg-black/25 p-4">
                  <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-black" style={{ backgroundColor: reviewChallenge.visual.accent }}>
                        <CheckCircle2 className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-black">Solve checks passed</p>
                        <p className="mt-1 text-sm leading-6 text-white/70">Every answer is correct. Open the completion card to view your platform-style achievement, share links, and embed HTML.</p>
                      </div>
                    </div>
                    <button className="rounded-full px-5 py-3 text-sm font-black text-black active:scale-[0.98]" style={{ backgroundColor: reviewChallenge.visual.accent }} type="button" onClick={() => openCompletionCard(reviewChallenge)}>
                      Completed
                    </button>
                  </div>
                </div>
              ) : (
                <div className="mt-3 rounded-2xl bg-black/25 p-4">
                  <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="font-black">Completion locked</p>
                      <p className="mt-1 text-sm leading-6 text-white/65">Answer every solve question correctly to unlock the completion card.</p>
                    </div>
                    <button className="cursor-not-allowed rounded-full bg-white/10 px-5 py-3 text-sm font-black text-white/40" type="button" disabled>
                      Completed
                    </button>
                  </div>
                </div>
              )}
                  </>
                );
              })()}
            </section>
            </div>
          </div>
        </div>
      ) : null}
    </AppShell>
  );
}
