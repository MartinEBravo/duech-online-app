/**
 * Shared styles for email templates
 */

export const main = {
  backgroundColor: '#f6f9fc',
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

export const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 0 48px',
  marginBottom: '64px',
  maxWidth: '600px',
  width: '100%',
};

export const heading = {
  fontSize: 'clamp(24px, 5vw, 32px)',
  lineHeight: '1.3',
  fontWeight: '700',
  color: '#0066cc',
  textAlign: 'center' as const,
  padding: '5% 0',
};

export const paragraph = {
  fontSize: 'clamp(14px, 2.5vw, 16px)',
  lineHeight: '1.6',
  color: '#333333',
  padding: '0 5%',
  marginBottom: '3%',
};

export const buttonContainer = {
  textAlign: 'center' as const,
  margin: '5% 0',
};

export const button = {
  backgroundColor: '#0066cc',
  borderRadius: '8px',
  color: '#ffffff',
  fontSize: 'clamp(14px, 2.5vw, 16px)',
  fontWeight: '600',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '3% 8%',
  maxWidth: '90%',
  boxSizing: 'border-box' as const,
};

export const linkText = {
  fontSize: 'clamp(12px, 2vw, 14px)',
  color: '#0066cc',
  padding: '0 5%',
  wordBreak: 'break-all' as const,
  marginBottom: '4%',
  maxWidth: '90%',
  margin: '0 auto',
  display: 'block',
};

export const footer = {
  fontSize: 'clamp(12px, 2vw, 14px)',
  color: '#666666',
  padding: '0 5%',
  marginTop: '5%',
  lineHeight: '1.6',
};
