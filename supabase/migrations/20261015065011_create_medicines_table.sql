/*
# Create medicines table with curated verified medicine data

1. New Tables
- `medicines`
  - `id` (uuid, primary key)
  - `name` (text, unique, not null) — the common tablet/medicine name
  - `active_ingredient` (text, not null) — the active pharmaceutical ingredient
  - `common_uses` (text[], not null) — list of common medical uses
  - `side_effects` (text[], not null) — list of known side effects
  - `precautions` (text[], not null) — list of precautions
  - `important_warnings` (text[], not null) — list of important warnings
  - `image_url` (text, nullable) — URL to a medicine photo
  - `source` (text, not null) — trusted information source citation
  - `aliases` (text[], not null default '{}') — alternative names and brand names for matching
  - `created_at` (timestamptz, default now())

2. Security
- Enable RLS on `medicines`.
- This is a no-auth single-tenant app; all medicine data is intentionally public/shared.
- Allow anon + authenticated to SELECT (read-only reference data).
- No INSERT/UPDATE/DELETE policies — medicine data is curated and managed via migrations only.

3. Important Notes
- Data is curated from verified public medicine information sources (NHS, MedlinePlus, FDA labels).
- The table is read-only from the client; only migrations can add or modify medicine records.
- This table serves as the controlled medicine data source required by the backend validation layer.
*/

CREATE TABLE IF NOT EXISTS medicines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  active_ingredient text NOT NULL,
  common_uses text[] NOT NULL,
  side_effects text[] NOT NULL,
  precautions text[] NOT NULL,
  important_warnings text[] NOT NULL,
  image_url text,
  source text NOT NULL,
  aliases text[] NOT NULL DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE medicines ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_read_medicines" ON medicines;
CREATE POLICY "anon_read_medicines"
ON medicines FOR SELECT
TO anon, authenticated USING (true);

-- Insert curated, verified medicine data
INSERT INTO medicines (name, active_ingredient, common_uses, side_effects, precautions, important_warnings, image_url, source, aliases) VALUES
(
  'Paracetamol',
  'Paracetamol (Acetaminophen)',
  ARRAY['Relief of mild to moderate pain such as headache, toothache, and backache', 'Reduction of fever (antipyretic)', 'Relief of cold and flu symptoms', 'Pain relief for osteoarthritis'],
  ARRAY['Nausea (rare at normal doses)', 'Skin rash or allergic reactions (rare)', 'Liver damage in overdose or prolonged use', 'Low blood platelets (thrombocytopenia) with long-term use'],
  ARRAY['Do not exceed the maximum daily dose (4 g for adults)', 'Avoid alcohol while taking paracetamol', 'Consult a doctor if you have liver or kidney disease', 'Do not combine with other paracetamol-containing products'],
  ARRAY['Overdose can cause serious liver damage — seek immediate medical help', 'Do not give to children without age-appropriate dosing guidance', 'Seek urgent medical attention if you suspect an overdose or notice yellowing of skin or eyes'],
  'https://images.pexels.com/photos/3652092/pexels-photo-3652092.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
  'NHS UK / MedlinePlus (verified public medicine information)',
  ARRAY['Acetaminophen', 'Tylenol', 'Calpol', 'Panadol', 'Crocin', 'Dolo']
),
(
  'Cetirizine',
  'Cetirizine Hydrochloride',
  ARRAY['Relief of allergic rhinitis (hay fever) symptoms', 'Relief of seasonal and perennial allergy symptoms', 'Treatment of chronic urticaria (hives)', 'Relief of sneezing, runny nose, and itchy eyes', 'Relief of skin allergies and itching'],
  ARRAY['Drowsiness (less common than older antihistamines)', 'Dry mouth', 'Headache', 'Dizziness', 'Fatigue', 'Gastrointestinal discomfort'],
  ARRAY['Consult a doctor if you have kidney or liver impairment — dose adjustment may be needed', 'Avoid alcohol as it may increase drowsiness', 'Use caution when driving or operating machinery until you know how it affects you', 'Not recommended for children under 6 months without medical advice'],
  ARRAY['Seek medical attention if you experience signs of a serious allergic reaction (swelling of face, lips, tongue, or throat)', 'Do not exceed the recommended dose', 'Consult a healthcare professional if symptoms persist beyond 10 days'],
  'https://images.pexels.com/photos/4058277/pexels-photo-4058277.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
  'NHS UK / MedlinePlus (verified public medicine information)',
  ARRAY['Zyrtec', 'Cetirizine Hydrochloride', 'Reactine', 'Cetzine', 'Alerid']
),
(
  'Ibuprofen',
  'Ibuprofen',
  ARRAY['Relief of mild to moderate pain including headache, dental pain, and menstrual pain', 'Reduction of inflammation in conditions like arthritis', 'Reduction of fever', 'Relief of muscle and joint pain', 'Relief of pain after minor injuries'],
  ARRAY['Stomach pain or discomfort', 'Heartburn and indigestion', 'Nausea', 'Dizziness', 'Fluid retention (edema)', 'Increased risk of gastrointestinal ulcers with long-term use', 'Skin rash (rare)'],
  ARRAY['Take with food or milk to reduce stomach irritation', 'Do not use if you have a history of stomach ulcers without medical advice', 'Consult a doctor if you have asthma — NSAIDs may trigger bronchospasm', 'Avoid in the third trimester of pregnancy', 'Do not exceed the recommended daily dose', 'Consult a doctor if you have kidney or heart disease'],
  ARRAY['Seek urgent medical help if you experience signs of stomach bleeding (blood in vomit or stools)', 'Stop taking and seek medical attention if you develop a severe skin reaction', 'Do not take with other NSAIDs including aspirin without medical advice', 'Long-term use increases cardiovascular risk — consult a doctor for extended use'],
  'https://images.pexels.com/photos/7083682/pexels-photo-7083682.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
  'NHS UK / MedlinePlus / FDA Drug Label (verified public medicine information)',
  ARRAY['Advil', 'Brufen', 'Motrin', 'Nurofen', 'Ibuprofen', 'Calgel']
),
(
  'Aspirin',
  'Acetylsalicylic Acid',
  ARRAY['Relief of mild to moderate pain', 'Reduction of fever', 'Anti-inflammatory use for conditions like rheumatoid arthritis', 'Low-dose aspirin for prevention of heart attacks and strokes in high-risk patients (under medical supervision)', 'Prevention of blood clots'],
  ARRAY['Stomach irritation and pain', 'Heartburn', 'Increased risk of bleeding', 'Nausea', 'Tinnitus (ringing in ears) at high doses', 'Allergic reactions in sensitive individuals'],
  ARRAY['Do not give to children under 16 years due to risk of Reye''s syndrome', 'Take with food to reduce stomach irritation', 'Consult a doctor if you have a bleeding disorder', 'Avoid if you have a stomach ulcer', 'Consult a doctor before use if pregnant', 'Do not take with other NSAIDs without medical advice'],
  ARRAY['Seek urgent medical help for signs of gastrointestinal bleeding (blood in vomit or stools)', 'Stop taking and seek medical attention if you experience ringing in the ears or hearing loss', 'Never give to children or teenagers with viral infections without medical supervision', 'Consult a doctor before starting low-dose aspirin therapy'],
  'https://images.pexels.com/photos/3683048/pexels-photo-3683048.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
  'NHS UK / MedlinePlus / FDA Drug Label (verified public medicine information)',
  ARRAY['Acetylsalicylic Acid', 'ASA', 'Disprin', 'Aspirin', 'Ecosprin', 'Bayer']
),
(
  'Amoxicillin',
  'Amoxicillin (as trihydrate)',
  ARRAY['Treatment of bacterial infections including ear infections', 'Treatment of respiratory tract infections such as bronchitis and pneumonia', 'Treatment of urinary tract infections', 'Treatment of skin infections', 'Treatment of sinus infections', 'Used in combination for H. pylori eradication'],
  ARRAY['Nausea and vomiting', 'Diarrhea', 'Skin rash', 'Allergic reactions including hives', 'Yeast infections (oral thrush or vaginal candidiasis)', 'Rarely, severe allergic reaction (anaphylaxis)'],
  ARRAY['Inform your doctor of any penicillin allergy before taking', 'Complete the full course as prescribed even if symptoms improve', 'Take at evenly spaced intervals', 'Consult a doctor if you have kidney disease — dose adjustment may be needed', 'Do not use for viral infections like colds or flu'],
  ARRAY['Seek urgent medical help if you experience signs of a severe allergic reaction (swelling of face, throat, difficulty breathing)', 'Stop taking and contact a doctor if you develop a severe skin rash', 'Contact a doctor if severe or bloody diarrhea occurs during or after treatment', 'Never share antibiotics with others or use leftover medication'],
  'https://images.pexels.com/photos/31406904/pexels-photo-31406904.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
  'NHS UK / MedlinePlus / FDA Drug Label (verified public medicine information)',
  ARRAY['Amoxil', 'Moxatag', 'Amoxicillin Trihydrate', 'Novamox', 'Amox', 'Mox']
),
(
  'Omeprazole',
  'Omeprazole',
  ARRAY['Treatment of gastroesophageal reflux disease (GERD)', 'Healing of erosive esophagitis', 'Treatment of stomach and duodenal ulcers', 'Prevention of NSAID-induced ulcers', 'Used in combination therapy for H. pylori eradication', 'Relief of persistent heartburn'],
  ARRAY['Headache', 'Diarrhea', 'Constipation', 'Nausea', 'Stomach pain', 'Flatulence', 'Rarely, low magnesium levels with long-term use', 'Increased risk of bone fractures with long-term high-dose use'],
  ARRAY['Consult a doctor before long-term use', 'Do not crush or chew capsules — swallow whole', 'Inform your doctor of all medications — omeprazole may interact with clopidogrel and other drugs', 'Consult a doctor if you have liver disease', 'Do not take continuously for more than 14 days without medical advice (OTC use)'],
  ARRAY['Seek medical attention if you experience severe diarrhea that does not improve', 'Contact a doctor if you develop signs of low magnesium (muscle spasms, irregular heartbeat, seizures)', 'Long-term use may reduce vitamin B12 absorption — discuss with your doctor', 'Report any unusual symptoms such as severe skin reactions to your doctor immediately'],
  'https://images.pexels.com/photos/7904428/pexels-photo-7904428.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
  'NHS UK / MedlinePlus / FDA Drug Label (verified public medicine information)',
  ARRAY['Prilosec', 'Losec', 'Omez', 'Gastracid', 'Protium', 'Omeprazole Magnesium']
)
ON CONFLICT (name) DO NOTHING;
