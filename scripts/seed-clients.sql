INSERT INTO clients (client_id, client_secret, redirect_uri)
VALUES
  ('project1', 'secret123', 'http://localhost:3001/callback'),
  ('project2', 'secret001', 'http://localhost:4000/callback'),
  ('project3', 'secret003', 'http://localhost:3002/callback')
ON CONFLICT (client_id) DO UPDATE
SET
  client_secret = EXCLUDED.client_secret,
  redirect_uri = EXCLUDED.redirect_uri;
