import crypto from 'crypto';

export const getChallenge = (platform: 'li', userData: string): string => {
  const challengeSeed = '000000000019d6689c085ae165831e934ff763ae46a2a6c172b3f1b60a8ce26f';
  return crypto.createHmac('sha256', challengeSeed)
    .update([platform, userData].join(':'))
    .digest('hex');
};
