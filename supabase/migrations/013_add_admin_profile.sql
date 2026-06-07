-- Add bonus balance and set username for admin account
UPDATE profiles
SET
  username = 'Mille Bluff',
  balance = balance + 1000,
  updated_at = NOW()
WHERE email = 'aziregue633@gmail.com'
OR id IN (
  SELECT id FROM auth.users WHERE email = 'aziregue633@gmail.com'
);
