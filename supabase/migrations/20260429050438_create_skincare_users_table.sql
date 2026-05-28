/*
  # Skincare Recommender - Users Table

  1. New Tables
    - `skincare_users`
      - `id` (uuid, primary key)
      - `name` (text) - user's full name
      - `age` (integer) - must be 40+
      - `skin_type` (text) - Dry / Oily / Combination / Sensitive
      - `concerns` (text[]) - array of concerns: Wrinkles, Pigmentation, Dryness, Acne
      - `lifestyle` (jsonb) - stress, sleep, diet info
      - `recommendation` (jsonb) - AI-generated morning/night routine + tips
      - `created_at` (timestamptz) - record creation time

  2. Security
    - Enable RLS on `skincare_users` table
    - Public insert policy (anonymous users can submit form)
    - No read policy for public (data is write-only from form)

  3. Notes
    - Uses JSONB for flexible recommendation and lifestyle storage
    - concerns stored as text array for easy querying
*/

CREATE TABLE IF NOT EXISTS skincare_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  age integer NOT NULL CHECK (age >= 40),
  skin_type text NOT NULL,
  concerns text[] NOT NULL DEFAULT '{}',
  lifestyle jsonb NOT NULL DEFAULT '{}',
  recommendation jsonb,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE skincare_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert skincare profile"
  ON skincare_users
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (age >= 40);
