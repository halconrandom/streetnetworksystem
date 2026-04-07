export const neoClerkAppearance = {
  variables: {
    colorPrimary: '#8b5cf6',
    colorBackground: '#fdfbf7',
    colorInputBackground: '#fdfbf7',
    colorInputText: '#111827',
    colorText: '#111827',
    colorTextSecondary: '#475569',
    borderRadius: '0px',
    fontFamily: '"Space Grotesk", "Inter", ui-sans-serif, system-ui, sans-serif',
  },
  elements: {
    rootBox: {
      width: '100%',
    },
    cardBox: {
      width: '100%',
      boxShadow: 'none',
    },
    card: {
      width: '100%',
      background: '#fdfbf7',
      border: '2px solid #000',
      borderTop: '0',
      borderRadius: '0',
      boxShadow: '6px 6px 0 #000',
      overflow: 'hidden',
    },
    header: {
      display: 'none',
    },
    main: {
      padding: '28px 32px',
    },
    socialButtonsBlockButton: {
      border: '2px solid #000',
      borderRadius: '0',
      background: '#fdfbf7',
      boxShadow: '2px 2px 0 #000',
      fontWeight: 700,
    },
    socialButtonsBlockButtonText: {
      color: '#111827',
      fontWeight: 700,
    },
    formFieldLabel: {
      color: '#475569',
      fontSize: '11px',
      letterSpacing: '0.12em',
      textTransform: 'uppercase',
      fontWeight: 700,
    },
    formFieldInput: {
      border: '2px solid #000',
      borderRadius: '0',
      background: '#fdfbf7',
      color: '#111827',
    },
    formButtonPrimary: {
      border: '2px solid #000',
      borderRadius: '0',
      background: '#8b5cf6',
      boxShadow: '4px 4px 0 #000',
      color: '#fff',
      textTransform: 'uppercase',
      letterSpacing: '0.06em',
      fontWeight: 700,
    },
    dividerLine: {
      background: '#000',
    },
    dividerText: {
      color: '#64748b',
      fontSize: '10px',
      letterSpacing: '0.12em',
      textTransform: 'uppercase',
      fontWeight: 700,
    },
    footer: {
      borderTop: '2px solid #000',
      background: '#ede9e0',
      padding: '12px 16px',
    },
    footerActionText: {
      color: '#64748b',
      fontSize: '12px',
    },
    footerActionLink: {
      color: '#6d28d9',
      fontWeight: 700,
      textTransform: 'uppercase',
      letterSpacing: '0.06em',
    },
    footerPages: {
      display: 'none',
    },
    alert: {
      border: '2px solid #000',
      borderRadius: '0',
    },
    formResendCodeLink: {
      color: '#6d28d9',
      fontWeight: 700,
    },
    formFieldAction: {
      color: '#6d28d9',
      fontWeight: 700,
    },
  },
} as const;
