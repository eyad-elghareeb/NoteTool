// Demo Note: Acute Heart Failure Management
// Following "The Surgeon's Mind" Philosophy: Dissect → Map → Act → Connect

import type { NoteData } from '@/stores/notetool-store';

export const acuteHeartFailureNote: NoteData = {
  id: 'acute-heart-failure',
  title: 'Acute Heart Failure Management',
  category: 'Cardiology',
  specialty: 'Cardiology',
  summary: 'Emergency assessment, stabilization & ongoing management of acute heart failure — a medical emergency requiring immediate intervention.',
  icd10Codes: ['I50.0', 'I50.1', 'I50.9'],
  snomedCodes: ['42343007', '266275004'],
  tags: ['heart-failure', 'emergency', 'cardiology', 'pharmacology', 'acute-care'],
  links: [
    { targetId: 'chronic-heart-failure', relation: 'continuum', label: 'Chronic HF Progression' },
    { targetId: 'renal-failure', relation: 'via-RAA-system', label: 'Cardiorenal Syndrome' },
    { targetId: 'afib', relation: 'comorbidity', label: 'Atrial Fibrillation' },
    { targetId: 'aortic-stenosis', relation: 'etiology', label: 'Valvular Heart Disease' },
    { targetId: 'pneumonia', relation: 'differential-diagnosis', label: 'Respiratory Infection' },
    { targetId: 'copd', relation: 'differential-diagnosis', label: 'COPD Exacerbation' },
    { targetId: 'pulmonary-embolism', relation: 'differential-diagnosis', label: 'Pulmonary Embolism' },
  ],
  highYieldSummary: [
    'Acute HF = rapid onset or worsening of HF symptoms, requiring urgent treatment',
    'Left-sided HF: dyspnea, orthopnea, PND, bibasal crackles, S3 gallop',
    'Right-sided HF: raised JVP, peripheral edema, hepatomegaly, ascites',
    'Killip Classification: I (no crackles) → IV (cardiogenic shock)',
    'First-line: O2, IV furosemide, GTN (if SBP >110), morphine (if agitated)',
    'In cardiogenic shock: inotropes (dobutamine), consider IABP/ECMO',
    'Echo is essential — assess EF, valve function, wall motion abnormalities',
    'BNP/NT-proBNP: rule-out HF if <100/300 respectively',
    'Post-stabilization: start ACEi/ARB, beta-blocker, MRA (HFrEF)',
    'Monitor U&O, renal function, electrolytes — furosemide causes K+ loss',
  ],
  sections: [
    {
      id: 'overview',
      title: 'Overview & Definition',
      type: 'content',
      content: `
**Acute Heart Failure (AHF)** is defined as the rapid onset of, or worsening of, symptoms and signs of heart failure. It is a medical emergency that requires immediate assessment and treatment. AHF may present as **de novo** heart failure (first occurrence) or as **acute decompensated heart failure** (ADHF) in a patient with pre-existing chronic heart failure.

The condition arises when the heart is unable to pump blood at a rate commensurate with the requirements of the metabolizing tissues, or can do so only from an elevated filling pressure. The underlying mechanisms include increased afterload (pressure overload), increased preload (volume overload), or decreased contractility (systolic dysfunction). The clinical presentation varies from mild dyspnea on exertion to frank cardiogenic shock with end-organ hypoperfusion.

AHF accounts for approximately 1 million hospitalizations annually in the United States alone, with a 30-day readmission rate approaching 25%. The in-hospital mortality rate ranges from 4% in stable patients to over 50% in those with cardiogenic shock, making early recognition and evidence-based management critical to patient outcomes.
      `,
    },
    {
      id: 'clinical-algorithm',
      title: 'Clinical Algorithm',
      type: 'algorithm',
      content: {
        id: 'ahf-algorithm',
        title: 'Acute Heart Failure Management Algorithm',
        code: `graph TD
    A["Patient presents with\ndyspnea + suspected AHF"] --> B{"SBP assessment"}
    B -->|"SBP >110 mmHg"| C["Warm & Wet Profile\n(Congested, Adequate Perfusion)"]
    B -->|"SBP <110 mmHg"| D{"Signs of\nhypoperfusion?"}

    C --> E["IV Furosemide\n(1-2x oral dose)"]
    E --> F["IV GTN infusion\n(if ongoing ischemia)"]
    F --> G["O2 to maintain SpO2 >90%"]
    G --> H["Monitor U&O, electrolytes"]

    D -->|"Yes - Cold & Wet"| I["Cardiogenic Shock Pathway"]
    D -->|"No - Cold & Dry"| J["Low Output\nwithout congestion"]

    I --> K["Inotropes:\nDobutamine / Milrinone"]
    K --> L["Consider IABP or\nVA-ECMO if refractory"]
    L --> M["Urgent Echo\nAssess etiology"]

    J --> N["Cautious IV fluids\nAssess for bradyarrhythmia"]

    H --> O{"Response after\n1-2 hours?"}
    O -->|"Improving"| P["Continue current therapy\nPlan discharge education"]
    O -->|"No improvement"| Q["Escalate: increase diuretic\nConsider ultrafiltration\nCardiology consult"]

    P --> R["Post-stabilization:\nACEi + Beta-blocker + MRA"]
    R --> S["Discharge planning\nFollow-up within 7 days"]

    style A fill:#0d9488,stroke:#0f766e,color:#fff
    style I fill:#dc2626,stroke:#b91c1c,color:#fff
    style K fill:#f59e0b,stroke:#d97706,color:#000
    style P fill:#10b981,stroke:#059669,color:#fff
    style R fill:#6366f1,stroke:#4f46e5,color:#fff`,
      },
    },
    {
      id: 'pathophysiology-pharmacology-tabs',
      title: 'Pathophysiology vs Pharmacology',
      type: 'tabs',
      content: {
        tabs: [
          {
            id: 'pathophysiology',
            label: 'Pathophysiology',
            content: `
## The Hemodynamic Substrate

Acute heart failure fundamentally represents a **mismatch between cardiac output and metabolic demand**. The pathophysiology can be dissected into three interlocking mechanisms:

### 1. Systolic Dysfunction (Decreased Contractility)
The most common mechanism in AHF. Myocardial injury — whether from acute ischemia, infarction, or chronic remodeling — reduces the stroke volume. The Frank-Starling mechanism initially compensates by increasing preload (chamber dilation), but beyond a critical point, further dilation reduces contractile efficiency, creating a vicious cycle of falling output and rising filling pressures.

### 2. Diastolic Dysfunction (Impaired Relaxation)
In diastolic HF (HFpEF), the ventricle is stiff and non-compliant. Filling pressures rise dramatically even with normal stroke volumes. The atrial contribution to filling becomes critical — hence the catastrophic hemodynamic consequences of new-onset atrial fibrillation in these patients. Hypertension, ischemia, and aging all contribute to this phenotype.

### 3. Volume Overload (Increased Preload)
Whether from valvular regurgitation, renal sodium retention (RAAS activation), or iatrogenic fluid administration, volume overload elevates pulmonary capillary pressures. When hydrostatic pressure exceeds oncotic pressure (~18-20 mmHg), transudation into the interstitium and alveoli produces pulmonary edema — the hallmark of acute left-sided decompensation.

### The Neurohormonal Cascade
The body's compensatory response — sympathetic activation and RAAS upregulation — becomes maladaptive. Vasoconstriction increases afterload, sodium retention increases preload, and direct myocardial toxicity promotes further remodeling. Breaking this cycle is the rationale for ACE inhibitors, beta-blockers, and MRAs.
            `,
          },
          {
            id: 'pharmacology',
            label: 'Pharmacology',
            content: `
## Drug Mechanisms & Clinical Pearls

### Loop Diuretics — Furosemide
- **Mechanism**: Inhibits Na-K-2Cl cotransporter in thick ascending limb → massive natriuresis
- **Dose**: IV 40-80mg bolus (1-2x oral maintenance dose); may use continuous infusion for resistance
- **Onset**: IV 5 minutes; peak 30 minutes
- **Key risks**: Hypokalemia, hypomagnesemia, ototoxicity (rapid bolus >4mg/min), metabolic alkalosis
- **Pearl**: "Diuretic resistance" — consider adding thiazide (metolazone) for sequential nephron blockade

### Vasodilators — GTN (Glyceryl Trinitrate)
- **Mechanism**: NO donor → venodilation (reduces preload) > arteriodilation (reduces afterload)
- **Indication**: SBP >110 mmHg with congestion/signs of ischemia
- **Dose**: Start 10-20 mcg/min IV, titrate to effect (max 200 mcg/min)
- **Key risks**: Hypotension, reflex tachycardia, tolerance with prolonged use
- **Pearl**: Reduces both preload and afterload simultaneously — ideal for "warm and wet" profile

### Inotropes — Dobutamine
- **Mechanism**: Beta-1 agonist → increased contractility and heart rate; mild beta-2 vasodilation
- **Indication**: Cardiogenic shock / low output state with congestion ("cold and wet")
- **Dose**: 2.5-20 mcg/kg/min IV infusion
- **Key risks**: Tachyarrhythmias, myocardial ischemia (increases O2 demand), hypotension at high doses
- **Pearl**: Dobutamine increases cardiac output but also heart rate → may worsen ischemia in ACS

### ACE Inhibitors / ARBs
- **Mechanism**: Blocks angiotensin II production (ACEi) or action (ARB) → reduced afterload, reduced aldosterone, reduced remodeling
- **Timing**: Start post-stabilization (not in acute phase if hypotensive)
- **Key risks**: First-dose hypotension, hyperkalemia, acute kidney injury, cough (ACEi), angioedema
- **Pearl**: Start low, go slow — but uptitrate to target dose before discharge if possible

### Mineralocorticoid Receptor Antagonists — Spironolactone
- **Mechanism**: Blocks aldosterone receptor → potassium-sparing diuresis + anti-remodeling
- **Indication**: HFrEF (EF <35%) post-stabilization
- **Key risks**: Hyperkalemia (especially with ACEi/ARB + renal impairment)
- **Pearl**: RALES trial showed 30% mortality reduction — underprescribed despite level 1 evidence
            `,
          },
          {
            id: 'classification',
            label: 'Classification',
            content: `
## Killip Classification (Post-MI Heart Failure)

| Class | Features | Mortality |
|-------|----------|-----------|
| **I** | No heart failure signs (no crackles, S3) | ~6% |
| **II** | Mild HF (bibasal crackles, S3 gallop) | ~17% |
| **III** | Pulmonary edema (extensive crackles, pink frothy sputum) | ~38% |
| **IV** | Cardiogenic shock (hypotension, cold extremities, oliguria) | ~67% |

## NYHA Functional Classification

| Class | Description |
|-------|-------------|
| **I** | No limitation of physical activity |
| **II** | Slight limitation; comfortable at rest, ordinary activity causes symptoms |
| **III** | Marked limitation; comfortable at rest, less than ordinary activity causes symptoms |
| **IV** | Symptoms at rest; unable to carry on any physical activity |

## Hemodynamic Profiles (Nohria-Stevenson)

| Profile | Congestion? | Perfusion? | Profile Name | Treatment Strategy |
|---------|-------------|------------|--------------|-------------------|
| **I** | No | Adequate | Warm & Dry | Observe, optimize oral therapy |
| **II** | Yes | Adequate | Warm & Wet | Diuresis + vasodilation |
| **III** | No | Inadequate | Cold & Dry | Cautious IV fluids, inotropes |
| **IV** | Yes | Inadequate | Cold & Wet | Inotropes + diuresis (worst prognosis) |
            `,
          },
          {
            id: 'investigations',
            label: 'Investigations',
            content: `
## Essential Investigations

### Blood Tests
- **BNP <100 pg/mL or NT-proBNP <300 pg/mL**: Effectively rules out heart failure (NPV >98%)
- **Troponin**: Rule out acute coronary syndrome as precipitant
- **U&Es**: Baseline renal function — ACEi/diuretics will affect this
- **LFTs**: Hepatic congestion can cause transaminitis ("cardiac liver")
- **FBC**: Anemia can worsen symptoms; infection as precipitant
- **CRP**: Infection screen — common trigger for decompensation

### Imaging
- **Chest X-ray**: Cardiomegaly, upper lobe diversion, Kerley B lines, pleural effusions, alveolar edema
- **Echocardiography**: THE critical investigation — assess EF, valve function, wall motion, pericardial effusion
- **Point-of-care lung ultrasound**: B-lines (comet tails) = interstitial edema; highly sensitive

### ECG
- Look for: AF, LVH, Q waves (prior MI), ST changes (acute ischemia), LBBB
- An entirely normal ECG makes HF unlikely

### Urinalysis
- Proteinuria may suggest renal cause; specific gravity for volume status
            `,
          },
        ],
      },
    },
    {
      id: 'mcq-section',
      title: 'Active Recall: Next Step in Management',
      type: 'mcq',
      content: {
        id: 'ahf-mcq-1',
        question:
          'A 72-year-old man with known chronic heart failure (EF 30%, on bisoprolol and ramipril) presents with acute dyspnea at rest, bibasal crackles, SpO2 88% on room air, BP 150/90 mmHg, and HR 110/min in sinus rhythm. He has taken his usual medications today. What is the most appropriate immediate management?',
        options: [
          'Intubate and ventilate immediately',
          'IV furosemide 80mg + IV GTN infusion + supplemental O2',
          'Oral furosemide 40mg and arrange outpatient echo',
          'IV dobutamine infusion for inotropic support',
          'IV morphine 10mg + IV furosemide 40mg alone',
        ],
        correctIndex: 1,
        explanation: `This patient presents with acute decompensated heart failure in the "warm and wet" hemodynamic profile (adequate perfusion with BP 150/90, but significant congestion). The correct approach is the "LMNOP" framework adapted for this scenario:

**Option B is correct** because:
- **IV Furosemide** at 1-2x the oral dose (80mg IV here, since he is likely on 40-80mg oral) provides rapid decongestion by reducing preload through venodilation (initial effect) followed by natriuresis
- **IV GTN** is indicated because SBP >110 mmHg with ongoing congestion — it reduces both preload (venodilation) and afterload (arteriodilation), providing immediate symptomatic relief
- **Supplemental O2** to maintain SpO2 >90% is standard first-line therapy

**Why not the others?**
- **A (Intubation)**: Premature — he is maintaining his airway and can be managed medically first. NIV (CPAP/BiPAP) would be considered before intubation if SpO2 does not improve
- **C (Oral furosemide + outpatient echo)**: Completely inadequate for acute decompensation. IV route is essential for rapid effect, and he requires inpatient monitoring
- **D (Dobutamine)**: Inappropriate — he has adequate blood pressure and perfusion. Inotropes are reserved for "cold" profiles (hypoperfusion/cardiogenic shock)
- **E (Morphine + furosemide alone)**: Morphine is no longer recommended as routine therapy (it can cause respiratory depression and hypotension). GTN is preferred as the vasodilator of choice`,
      },
    },
    {
      id: 'mcq-section-2',
      title: 'Active Recall: Differential Diagnosis',
      type: 'mcq',
      content: {
        id: 'ahf-mcq-2',
        question:
          'A 68-year-old woman with a history of hypertension and type 2 diabetes presents to A&E with acute onset dyspnea, orthopnea, and a productive cough with pink frothy sputum. On examination, BP is 100/60 mmHg, HR 125/min, JVP is elevated, and there are widespread coarse crackles bilaterally. ECG shows sinus tachycardia with lateral T-wave inversion. NT-proBNP is 4500 pg/mL. Which of the following is the most likely precipitant of her acute decompensation?',
        options: [
          'Pulmonary embolism',
          'Acute coronary syndrome',
          'Pneumonia',
          'Atrial fibrillation with rapid ventricular response',
          'Renal failure causing volume overload',
        ],
        correctIndex: 1,
        explanation: `The most likely precipitant is **acute coronary syndrome (ACS)**. The key evidence supporting this is:

1. **ECG findings**: Lateral T-wave inversion is a hallmark of myocardial ischemia affecting the circumflex territory. This is not a non-specific finding — it directly suggests active cardiac ischemia
2. **Hemodynamic profile**: "Cold and wet" (hypotension + congestion) is the most concerning profile and suggests significant myocardial dysfunction, consistent with ischemic injury
3. **Clinical context**: Hypertension + diabetes = high pre-test probability for coronary artery disease
4. **NT-proBNP**: Markedly elevated at 4500 pg/mL, consistent with significant myocardial stress/injury

**Why not the others?**
- **A (PE)**: PE can cause right heart strain and elevated BNP, but would typically show right-sided heart failure signs (prominent A-wave in JVP, right axis deviation on ECG) rather than lateral T-wave inversion and pulmonary edema
- **C (Pneumonia)**: Can precipitate HF decompensation, but the pink frothy sputum, widespread crackles (not focal), and lateral T-wave inversion point more toward primary cardiac ischemia
- **D (AF with RVR)**: The ECG shows sinus tachycardia, not atrial fibrillation. While AF can precipitate decompensation, it is not present here
- **E (Renal failure)**: While volume overload can cause pulmonary edema, the ECG changes and clinical picture suggest cardiac ischemia as the primary driver`,
      },
    },
    {
      id: 'flashcards',
      title: 'High-Yield Flashcards',
      type: 'flashcard',
      content: [
        {
          id: 'fc-1',
          type: 'cloze' as const,
          front: 'The first-line diuretic in acute heart failure is ___ and the typical initial IV dose is ___ times the oral maintenance dose.',
          back: 'Furosemide; 1-2x the oral maintenance dose',
          tags: ['pharmacology', 'emergency'],
        },
        {
          id: 'fc-2',
          type: 'cloze' as const,
          front: 'GTN is indicated in acute HF when SBP > ___ mmHg. It works primarily by ___ (reducing preload) and ___ (reducing afterload).',
          back: '110; venodilation; arteriodilation',
          tags: ['pharmacology', 'vasodilators'],
        },
        {
          id: 'fc-3',
          type: 'cloze' as const,
          front: 'The "cold and wet" hemodynamic profile (Nohria-Stevenson) indicates both ___ and ___. The treatment requires ___ plus ___.',
          back: 'Congestion; hypoperfusion; inotropes; diuresis',
          tags: ['classification', 'management'],
        },
        {
          id: 'fc-4',
          type: 'cloze' as const,
          front: 'BNP < ___ pg/mL or NT-proBNP < ___ pg/mL effectively rules out heart failure.',
          back: '100; 300',
          tags: ['investigations', 'biomarkers'],
        },
        {
          id: 'fc-5',
          type: 'cloze' as const,
          front: 'The RALES trial showed that ___ (drug) reduced mortality by ___% in HFrEF patients when added to standard therapy.',
          back: 'Spironolactone; 30%',
          tags: ['pharmacology', 'evidence-based'],
        },
      ],
    },
    {
      id: 'chest-xray',
      title: 'Chest X-ray: Pulmonary Edema',
      type: 'asset',
      content: {
        id: 'cxr-01',
        noteId: 'acute-heart-failure',
        filename: 'cxr_pulmonary_edema.png',
        type: 'image',
        caption:
          'Chest X-ray demonstrating acute pulmonary edema: bilateral perihilar "bat-wing" infiltrates, Kerley B lines, upper lobe blood diversion, and cardiomegaly. Note the blunted costophrenic angles suggesting bilateral pleural effusions.',
        path: '/assets/acute-heart-failure/cxr_pulmonary_edema.png',
      },
    },
  ],
  ddxComparison: [
    { feature: 'Breath sound character', copd: 'Wheeze + prolonged expiration', ahf: 'Crackles (bibasal)' },
    { feature: 'Sputum', copd: 'Mucopurulent (infective)', ahf: 'Pink frothy' },
    { feature: 'Chest shape', copd: 'Barrel chest, hyperinflated', ahf: 'Normal or displaced apex' },
    { feature: 'JVP', copd: 'Normal (unless cor pulmonale)', ahf: 'Elevated' },
    { feature: 'Peripheral edema', copd: 'Ankle edema (cor pulmonale only)', ahf: 'Bilateral pitting edema' },
    { feature: 'BNP level', copd: '<100 pg/mL', ahf: '>400 pg/mL' },
    { feature: 'CXR findings', copd: 'Hyperinflation, flat diaphragms', ahf: 'Cardiomegaly, upper lobe diversion, Kerley B lines' },
    { feature: 'ABG pattern', copd: 'Type 2 RF (high CO2)', ahf: 'Type 1 RF (low O2, normal/low CO2 initially)' },
    { feature: 'Response to diuretics', copd: 'Minimal', ahf: 'Significant improvement' },
  ],
  createdAt: Date.now() - 86400000 * 30,
  updatedAt: Date.now(),
};

// Second demo note for DDx comparison
export const copdExacerbationNote: NoteData = {
  id: 'copd-exacerbation',
  title: 'COPD Acute Exacerbation',
  category: 'Respiratory Medicine',
  specialty: 'Respiratory Medicine',
  summary: 'Differential diagnosis comparison with Acute Heart Failure — acute worsening of COPD symptoms beyond day-to-day variation.',
  icd10Codes: ['J44.1'],
  snomedCodes: [],
  tags: ['copd', 'respiratory', 'differential-diagnosis', 'emergency'],
  links: [
    { targetId: 'acute-heart-failure', relation: 'differential-diagnosis', label: 'Acute Heart Failure' },
    { targetId: 'pneumonia', relation: 'common-trigger', label: 'Pneumonia' },
    { targetId: 'asthma', relation: 'differential-diagnosis', label: 'Asthma Exacerbation' },
  ],
  highYieldSummary: [
    'COPD exacerbation: acute worsening of dyspnea, cough, or sputum beyond day-to-day variation',
    'Most common triggers: viral URTI, bacterial infection, air pollution',
    'Key signs: wheeze, prolonged expiratory phase, hyperinflated chest, use of accessory muscles',
    'ABG: Type 2 respiratory failure (hypoxia + hypercapnia) differentiates from HF',
    'First-line: nebulized salbutamol + ipratropium, prednisolone 30mg, antibiotics if bacterial',
    'O2 target: 88-92% in known COPD (risk of CO2 retention with high-flow O2)',
    'CXR: hyperinflation, flat diaphragms, no pulmonary venous congestion',
    'BNP typically <100 in pure COPD (useful differentiator from HF)',
  ],
  sections: [
    {
      id: 'copd-overview',
      title: 'Overview',
      type: 'content',
      content: `**COPD Acute Exacerbation** is defined as an acute worsening of respiratory symptoms (dyspnea, cough, and/or sputum production) beyond normal day-to-day variation, requiring additional treatment. It is a leading cause of hospitalization and mortality in COPD patients.

The most common triggers are viral upper respiratory tract infections (rhinovirus, influenza), bacterial infections (*H. influenzae*, *S. pneumoniae*, *M. catarrhalis*), and environmental factors (air pollution, temperature changes). Approximately 30% of exacerbations have no identifiable trigger.

Management focuses on bronchodilation, anti-inflammatory therapy, and addressing the underlying trigger. Oxygen delivery must be carefully titrated to avoid CO2 retention in patients with chronic hypercapnia.`,
    },
  ],
  createdAt: Date.now() - 86400000 * 15,
  updatedAt: Date.now(),
};

// Third demo note for the library
export const lapCholeNote: NoteData = {
  id: 'lap-cholecystectomy',
  title: 'Laparoscopic Cholecystectomy',
  category: 'General Surgery',
  specialty: 'General Surgery',
  summary: 'Pre-operative assessment, surgical technique, and post-operative management of laparoscopic cholecystectomy for symptomatic gallstone disease.',
  icd10Codes: ['K80.0', 'K80.1', 'K80.2'],
  snomedCodes: ['38102005'],
  tags: ['surgery', 'gallbladder', 'laparoscopic', 'biliary', 'general-surgery'],
  links: [
    { targetId: 'acute-heart-failure', relation: 'perioperative-risk', label: 'Cardiac Risk Assessment' },
    { targetId: 'cholecystitis', relation: 'indication', label: 'Acute Cholecystitis' },
    { targetId: 'pancreatitis', relation: 'complication', label: 'Gallstone Pancreatitis' },
  ],
  highYieldSummary: [
    'Laparoscopic cholecystectomy: gold standard for symptomatic gallstones',
    "Calot's triangle: cystic duct, common hepatic duct, liver edge — critical view of safety",
    'CVS (Critical View of Safety): clear identification of cystic duct & artery before clipping',
    'IOC (Intraoperative cholangiogram): detects CBD stones, defines biliary anatomy',
    'Most common serious complication: bile duct injury (~0.3-0.5%)',
    'Post-op: monitor for bile leak, bleeding, and signs of CBD injury',
    'ERCP: pre-operative for jaundice/cholangitis; post-operative for retained CBD stones',
    'Early lap chole (<72h) for acute cholecystitis reduces complications vs delayed',
  ],
  sections: [
    {
      id: 'lap-chole-overview',
      title: 'Overview',
      type: 'content',
      content: `**Laparoscopic Cholecystectomy** is the gold standard surgical treatment for symptomatic gallstone disease. Since its introduction in the late 1980s, it has largely replaced open cholecystectomy due to reduced post-operative pain, shorter hospital stays, and faster recovery.

The procedure involves the removal of the gallbladder through 3-4 small incisions using a camera and specialized instruments. The critical step is the safe dissection of Calot's triangle and identification of the cystic duct and cystic artery before any structures are divided.

**Key indications**: symptomatic gallstones (biliary colic), acute cholecystitis, gallstone pancreatitis, and rarely, gallbladder polyps >1cm.

**Contraindications**: severe cardiopulmonary disease precluding general anesthesia, uncorrectable coagulopathy. Previous upper abdominal surgery is a relative contraindication (may require open approach).`,
    },
  ],
  createdAt: Date.now() - 86400000 * 7,
  updatedAt: Date.now(),
};

export const akiNote: NoteData = {
  id: 'acute-kidney-injury',
  title: 'Acute Kidney Injury',
  category: 'Nephrology',
  specialty: 'Nephrology',
  summary: 'KDIGO classification, causes, investigation, and management of acute kidney injury.',
  icd10Codes: ['N17.0', 'N17.1', 'N17.2', 'N17.9'],
  snomedCodes: ['14669001'],
  tags: ['aki', 'nephrology', 'renal', 'emergency', 'critical-care'],
  links: [
    { targetId: 'acute-heart-failure', relation: 'cardiorenal', label: 'Cardiorenal Syndrome' },
    { targetId: 'copd-exacerbation', relation: 'sepsis-related', label: 'Sepsis-Induced AKI' },
  ],
  highYieldSummary: [
    'AKI: abrupt reduction in kidney function over hours-days (KDIGO criteria)',
    'KDIGO Stage 1: Cr ↑1.5-1.9x baseline OR ↑≥26.5 μmol/L in 48h',
    'Pre-renal (most common): hypovolemia, HF, sepsis, NSAIDs/ACEi',
    'Intrinsic: ATN (most common), AIN, glomerulonephritis',
    'Post-renal: obstruction — always bladder scan / US',
    'FENa <1% = pre-renal; FENa >2% = intrinsic (ATN)',
    'Muddy brown casts = ATN; WBC casts = AIN; RBC casts = GN',
    'Urgent dialysis: K+ >6.5, refractory acidosis, pulmonary edema, uremic pericarditis',
  ],
  sections: [
    {
      id: 'aki-overview',
      title: 'Overview',
      type: 'content',
      content: `**Acute Kidney Injury (AKI)** is defined as an abrupt reduction in kidney function over hours to days, resulting in the accumulation of nitrogenous waste products and the inability to maintain fluid, electrolyte, and acid-base homeostasis.

The KDIGO classification defines AKI as:
1. Increase in serum creatinine by ≥26.5 μmol/L within 48h, OR
2. Increase in serum creatinine to ≥1.5 times baseline within 7 days, OR
3. Urine output <0.5 mL/kg/h for 6 hours

AKI is extremely common in hospitalized patients (up to 20% of admissions) and is associated with significant morbidity, mortality, and healthcare costs. Even mild AKI that resolves is associated with long-term risk of chronic kidney disease. Prompt identification and management are essential.`,
    },
  ],
  createdAt: Date.now() - 86400000 * 3,
  updatedAt: Date.now(),
};
