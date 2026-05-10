'use client';

import { Badge } from '@/components/ui/badge';
import { Tag, Stethoscope } from 'lucide-react';

interface ICDTaggerProps {
  icd10Codes: string[];
  snomedCodes: string[];
  specialty: string;
  tags: string[];
}

const ICD_DESCRIPTIONS: Record<string, string> = {
  'I50.0': 'Congestive heart failure',
  'I50.1': 'Left ventricular failure',
  'I50.9': 'Heart failure, unspecified',
  'J44.1': 'COPD with acute exacerbation',
};

const SNOMED_DESCRIPTIONS: Record<string, string> = {
  '42343007': 'Congestive heart failure',
  '266275004': 'Acute heart failure',
};

export function ICDTagger({ icd10Codes, snomedCodes, specialty, tags }: ICDTaggerProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Tag className="h-4 w-4 text-teal-400" />
        <span className="text-sm font-semibold text-teal-400">Clinical Codes</span>
      </div>

      {/* Specialty */}
      <div className="flex items-center gap-2">
        <Stethoscope className="h-3.5 w-3.5 text-muted-foreground" />
        <Badge className="bg-teal-600/20 text-teal-400 border-teal-700/40 hover:bg-teal-600/30">
          {specialty}
        </Badge>
      </div>

      {/* ICD-10 Codes */}
      <div className="space-y-1">
        <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
          ICD-10
        </span>
        <div className="flex flex-wrap gap-1.5">
          {icd10Codes.map((code) => (
            <Badge
              key={code}
              variant="outline"
              className="text-[10px] border-rose-700/40 text-rose-400 font-mono"
              title={ICD_DESCRIPTIONS[code] || code}
            >
              {code}
            </Badge>
          ))}
        </div>
      </div>

      {/* SNOMED CT Codes */}
      <div className="space-y-1">
        <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
          SNOMED CT
        </span>
        <div className="flex flex-wrap gap-1.5">
          {snomedCodes.map((code) => (
            <Badge
              key={code}
              variant="outline"
              className="text-[10px] border-violet-700/40 text-violet-400 font-mono"
              title={SNOMED_DESCRIPTIONS[code] || code}
            >
              {code}
            </Badge>
          ))}
        </div>
      </div>

      {/* Tags */}
      <div className="space-y-1">
        <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
          Tags
        </span>
        <div className="flex flex-wrap gap-1.5">
          {tags.map((tag) => (
            <Badge
              key={tag}
              variant="outline"
              className="text-[10px] border-border/40 text-muted-foreground"
            >
              {tag}
            </Badge>
          ))}
        </div>
      </div>
    </div>
  );
}
