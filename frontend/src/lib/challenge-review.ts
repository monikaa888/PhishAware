import { getChallengeById } from './challenge-activity';

export type BusinessChallengeReview = {
  challengeId: string;
  summary: string;
  email: {
    from: string;
    to: string;
    subject: string;
    body: string[];
    linkText: string;
    linkUrl: string;
    attachment?: string;
  };
  objectives: string[];
  indicators: string[];
  questions: {
    prompt: string;
    options: string[];
    answer: string;
    explanation: string;
  }[];
  reporting: string[];
};

const reviews: Record<string, BusinessChallengeReview> = {
  'student-aid-confirmation': {
    challengeId: 'student-aid-confirmation',
    summary: 'A fake scholarship confirmation email asks the learner to verify school credentials before a deadline.',
    email: {
      from: 'Student Aid Office <support@grant-verify.example>',
      to: 'employee@company.com',
      subject: 'Scholarship confirmation required today',
      body: [
        'Your scholarship confirmation is pending and must be verified before the end of the day.',
        'Use the secure confirmation portal below to keep your aid record active.',
        'Failure to verify may delay your account and award status.',
      ],
      linkText: 'Confirm scholarship access',
      linkUrl: 'https://grant-verify.example/student-portal',
    },
    objectives: ['Recognize credential harvesting through copied portals.', 'Compare sender and landing-page domains.', 'Practice safe reporting instead of entering credentials.'],
    indicators: ['Lookalike grant domain', 'Deadline pressure', 'Password request after email link', 'Institution name without official domain proof'],
    questions: [
      {
        prompt: 'What is the strongest evidence that the portal is unsafe?',
        options: ['It asks for a password on grant-verify.example', 'It mentions a deadline', 'It uses a formal title', 'It has a login button'],
        answer: 'It asks for a password on grant-verify.example',
        explanation: 'The risk is the combination of domain mismatch and a credential request.',
      },
      {
        prompt: 'What should the learner do if credentials were submitted?',
        options: ['Reset the password from the real portal and report it', 'Reply to the email', 'Submit again', 'Ignore it'],
        answer: 'Reset the password from the real portal and report it',
        explanation: 'Account recovery and reporting should happen through trusted channels.',
      },
    ],
    reporting: ['Report the message to the real IT or helpdesk address.', 'Reset password only from the typed official portal.', 'Review MFA and active sessions.'],
  },
  'delivery-fee-email': {
    challengeId: 'delivery-fee-email',
    summary: 'A parcel notice asks for a small redelivery fee and attempts to capture payment details.',
    email: {
      from: 'Delivery Notice <notice@parcel-update.example>',
      to: 'employee@company.com',
      subject: 'Package held: redelivery fee required',
      body: [
        'We attempted delivery but your parcel is currently on hold.',
        'A small redelivery fee is required before the package can be released.',
        'Please complete payment now to avoid return to sender.',
      ],
      linkText: 'Pay redelivery fee',
      linkUrl: 'https://parcel-update.example/pay',
    },
    objectives: ['Identify payment phishing patterns.', 'Verify shipment status outside email links.', 'Spot generic courier domains.'],
    indicators: ['Unexpected tiny fee', 'Generic parcel domain', 'Urgent payment language', 'Full card collection for a minor charge'],
    questions: [
      {
        prompt: 'Which pattern best describes the risk?',
        options: ['Generic domain plus full card details for a small fee', 'The email is short', 'The fee is low', 'The subject mentions delivery'],
        answer: 'Generic domain plus full card details for a small fee',
        explanation: 'Small fees are used to lower resistance while collecting valuable payment data.',
      },
      {
        prompt: 'Where should delivery status be checked?',
        options: ['Official courier app or typed official website', 'The payment link', 'A reply to the sender', 'A random tracking page'],
        answer: 'Official courier app or typed official website',
        explanation: 'Using a trusted route prevents the attacker from controlling the verification path.',
      },
    ],
    reporting: ['Do not pay through the email link.', 'Verify through the courier’s official website.', 'Contact the bank if card details were entered.'],
  },
  'recruiter-verification-email': {
    challengeId: 'recruiter-verification-email',
    summary: 'A recruiter-themed email uses career opportunity pressure to request sensitive verification details.',
    email: {
      from: 'Campus Careers <verify@campus-careers-help.example>',
      to: 'employee@company.com',
      subject: 'Action needed to continue your interview process',
      body: [
        'Your profile was shortlisted for an upcoming role.',
        'Before we schedule the next step, confirm your eligibility with the verification portal.',
        'Incomplete verification may remove your profile from the candidate list.',
      ],
      linkText: 'Verify candidate profile',
      linkUrl: 'https://campus-careers-help.example/verify',
    },
    objectives: ['Recognize opportunity-based pressure.', 'Understand that recruiters never need passwords.', 'Verify contacts through official channels.'],
    indicators: ['Career bait', 'Unverified help-style domain', 'Credential or private detail request', 'Threat of losing opportunity'],
    questions: [
      {
        prompt: 'What is the clearest social engineering sign?',
        options: ['A recruiter asks for account secrets', 'The message is polite', 'It mentions a job', 'It has a signature'],
        answer: 'A recruiter asks for account secrets',
        explanation: 'Legitimate recruiters do not need passwords, OTPs, or recovery codes.',
      },
      {
        prompt: 'How should the recruiter be verified?',
        options: ['Use the official careers office website', 'Reply to the same email', 'Send the password', 'Click faster'],
        answer: 'Use the official careers office website',
        explanation: 'Out-of-band verification breaks the attacker-controlled conversation.',
      },
    ],
    reporting: ['Contact the real careers or HR office.', 'Never send passwords or OTPs in replies.', 'Report opportunity-based credential requests.'],
  },
};

function generatedReview(challengeId: string): BusinessChallengeReview {
  const challenge = getChallengeById(challengeId);
  const title = challenge?.title ?? 'Email lab';
  const category = challenge?.category ?? 'Email security';
  const hard = challenge?.difficulty === 'Hard';

  return {
    challengeId,
    summary: `${title} teaches ${category.toLowerCase()} through a workplace email scenario.`,
    email: {
      from: `Workplace Notice <alerts@${hard ? 'secure-workflow.example' : 'office-update.example'}>`,
      to: 'employee@company.com',
      subject: `${title}: action requested`,
      body: [
        'A workplace message asks the recipient to act from the email.',
        hard ? 'The message includes similar-looking domains, urgency, and authority pressure.' : 'The message includes a sender and link that should be verified before action.',
        'The learner must inspect the sender, link destination, request type, and safest response.',
      ],
      linkText: 'Open secure request',
      linkUrl: hard ? 'https://secure-workflow.example/login' : 'https://office-update.example/action',
      attachment: hard ? 'Shared_Workflow_Details.html' : undefined,
    },
    objectives: [
      `Identify ${category.toLowerCase()} signals.`,
      'Inspect sender, URL, wording, and requested action.',
      'Choose a safe reporting or verification path.',
    ],
    indicators: hard
      ? ['Lookalike or generic domain', 'Authority and urgency pressure', 'Credential or secret request', 'Attachment or web form path']
      : ['Unverified sender', 'Unexpected request', 'External link', 'Pressure to act quickly'],
    questions: [
      {
        prompt: 'What should be inspected before taking action?',
        options: ['Sender domain, link destination, and request type', 'Only the logo', 'Only the greeting', 'Only the message length'],
        answer: 'Sender domain, link destination, and request type',
        explanation: 'Visual design can be copied. The safest review checks identity, destination, and requested data.',
      },
      {
        prompt: 'What is the safest response?',
        options: ['Verify through a known official channel', 'Reply with private information', 'Use the link immediately', 'Forward it to coworkers'],
        answer: 'Verify through a known official channel',
        explanation: 'A trusted channel prevents the attacker from controlling the response path.',
      },
      ...(hard
        ? [{
            prompt: 'Which extra sign matters most in harder phishing?',
            options: ['Multiple weak signals appearing together', 'A neat layout', 'A short subject', 'A familiar color'],
            answer: 'Multiple weak signals appearing together',
            explanation: 'Harder phishing often avoids one obvious error and relies on stacked subtle signals.',
          }]
        : []),
    ],
    reporting: ['Do not submit sensitive data.', 'Report the message internally.', 'Verify requests through known business channels.'],
  };
}

export function getBusinessChallengeReview(challengeId: string) {
  return reviews[challengeId] ?? generatedReview(challengeId);
}
