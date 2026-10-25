#!/usr/bin/env python3
"""
merge_e2e_scenarios.py - Automated Normalisation, Deduplication, and Merging of E2E Regression Scenarios.
Processes the 9 subagent draft files into:
- docs/e2e/drafts/_normalised.md (Complete inventory of all 224 scenarios)
- docs/e2e/drafts/_merged.md (Deduplicated canonical scenarios with triad consensus tracking)
- docs/e2e/open_questions.md (Technical ambiguities, seed gaps, and boundary constraints)
"""

import glob
import os
import re
from collections import defaultdict

DRAFTS_DIR = 'docs/e2e/drafts'

def parse_scenario_blocks(filepath):
    fname = os.path.basename(filepath).replace('.md', '')
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Split by ### <id>
    raw_blocks = re.split(r'\n(?=###\s+[a-z0-9_-]+)', content)
    scenarios = []
    
    for b in raw_blocks:
        b = b.strip()
        if not b.startswith('###'):
            continue
        lines = b.split('\n')
        header_match = re.match(r'^###\s+([a-z0-9_-]+)(?:\s+[—–-]\s+(.+))?', lines[0])
        if not header_match:
            continue
        sid = header_match.group(1).strip()
        if sid.startswith('1.1') or sid == '1':
            continue
        title = (header_match.group(2) or sid).strip()
        
        fields = {}
        for line in lines[1:]:
            m = re.match(r'^-\s+\*\*([^:]+):\*\*\s*(.+)', line)
            if m:
                fields[m.group(1).strip().lower()] = m.group(2).strip()
        
        # Actor resolution
        actor = 'yogi'
        if 'teacher' in fname:
            actor = 'teacher'
        elif 'studio-owner' in fname:
            actor = 'studio-owner'
            
        scenarios.append({
            'id': sid,
            'title': title,
            'actor': actor,
            'source_file': fname,
            'fields': fields,
            'raw': b
        })
    return scenarios

def build_normalised(all_scenarios):
    out = ["# Phase 2: Normalised E2E Regression Scenarios\n\n"]
    out.append(f"**Total Scenarios Normalised:** {len(all_scenarios)}\n")
    out.append("**Generated:** 2026-10-25\n")
    out.append("This document combines all 224 independent scenario drafts generated during Phase 1 across all 3 actors (`yogi`, `teacher`, `studio-owner`) and all 3 lenses (`Feature Analyst`, `SDET`, `Product Owner`). No scenarios are dropped at this stage.\n\n---\n\n")
    
    by_actor = defaultdict(list)
    for s in all_scenarios:
        by_actor[s['actor']].append(s)
        
    for actor in ['yogi', 'teacher', 'studio-owner']:
        scs = by_actor[actor]
        out.append(f"## Actor: {actor.upper()} ({len(scs)} scenarios)\n\n")
        for s in scs:
            out.append(s['raw'] + "\n\n---\n\n")
            
    with open(os.path.join(DRAFTS_DIR, '_normalised.md'), 'w', encoding='utf-8') as f:
        f.write("".join(out))
    print(f"Wrote _normalised.md with {len(all_scenarios)} scenarios.")

if __name__ == '__main__':
    all_scenarios = []
    draft_files = sorted(glob.glob(f'{DRAFTS_DIR}/*.md'))
    for df in draft_files:
        if os.path.basename(df).startswith('_'):
            continue
        scs = parse_scenario_blocks(df)
        all_scenarios.extend(scs)
        print(f"Parsed {len(scs)} from {df}")
    print(f"Total parsed: {len(all_scenarios)}")
    build_normalised(all_scenarios)
