import crypto from 'crypto';

export const getRandomHexValue = (len) => {
    return crypto.randomBytes(Math.ceil(len / 2)).toString('hex').slice(0, len);
};
