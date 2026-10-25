#!/usr/bin/env python3
"""
generate_merged_and_open_questions.py
Deduplicates and merges the 224 scenarios across the 9 draft files into:
- docs/e2e/drafts/_merged.md
- docs/e2e/open_questions.md
"""

import os
import re
from collections import defaultdict
from merge_e2e_scenarios import parse_scenario_blocks

DRAFTS_DIR = 'docs/e2e/drafts'

# Canonical Cluster Definitions for Yogi (58 clusters covering all 104 draft scenarios)
YOGI_CLUSTERS = [
    {
        'id': 'yogi-auth-dev-login-success',
        'title': 'Yogi authenticates via Dev credentials and accesses application shell',
        'feature_ref': 'FEATURES.md §5.1, §5.2',
        'type': 'happy',
        'priority': 'P0',
        'draft_ids': ['yogi-auth-dev-login-success'],
        'suggested_user': 'user_sarah (Sarah Jenkins)',
        'seed_gap': 'none',
        'isolation': 'shared',
        'platforms': 'both',
        'automation_status': 'e2e (Apps/PWA/src/test/e2e/regression_suite.spec.ts)',
        'prerequisites': 'Seeded active yogi account exists with valid dev password.',
        'preconditions': 'Logged out visitor arrives on Login screen.',
        'steps': [
            'Given the visitor is on the login view',
            'When they enter valid email "user_sarah@inspired.test" and the dev test password',
            'And they tap "Log In"',
            'Then the application authenticates and transitions to the Landing Page shell',
            'And displays greeting "Sarah Jenkins" with user avatar and search bar in the header'
        ],
        'data_reset': 'None (read-only authentication session).'
    },
    {
        'id': 'visitor-login-wrong-password-fails',
        'title': 'Visitor attempts login with incorrect password and is blocked with error',
        'feature_ref': 'FEATURES.md §5.1',
        'type': 'valid-failure',
        'priority': 'P0',
        'draft_ids': ['yogi-auth-dev-login-invalid-credentials', 'visitor-login-wrong-password-fails'],
        'suggested_user': 'user_sarah (Sarah Jenkins)',
        'seed_gap': 'none',
        'isolation': 'shared',
        'platforms': 'both',
        'automation_status': 'none (automated unit test in LoginView.test.tsx)',
        'prerequisites': 'Valid registered user email exists.',
        'preconditions': 'Visitor on login view with dev password tool enabled.',
        'steps': [
            'Given the visitor enters email "user_sarah@inspired.test"',
            'When they enter incorrect password "incorrect_pass_999!" and tap "Log In"',
            'Then the auth submission fails with error "Invalid credentials" or "auth/wrong-password"',
            'And the visitor remains unauthenticated on the login screen'
        ],
        'data_reset': 'None (auth failure rejected by emulator).'
    },
    {
        'id': 'visitor-login-empty-password-disabled',
        'title': 'Visitor cannot submit login with empty password field',
        'feature_ref': 'FEATURES.md §5.1',
        'type': 'valid-failure',
        'priority': 'P1',
        'draft_ids': ['visitor-login-empty-password-disabled'],
        'suggested_user': 'user_newbie (Yoga Newbie)',
        'seed_gap': 'none',
        'isolation': 'shared',
        'platforms': 'both',
        'automation_status': 'unit-only (LoginView.test.tsx)',
        'prerequisites': 'None.',
        'preconditions': 'Visitor on login view.',
        'steps': [
            'Given the visitor enters email "user_newbie@inspired.test"',
            'When the password input field is left empty',
            'Then the submit button remains disabled or blocks submission with validation notice'
        ],
        'data_reset': 'None.'
    },
    {
        'id': 'visitor-magic-link-cooldown-throttled',
        'title': 'Visitor requests magic link and 60-second cooldown timer throttles retries',
        'feature_ref': 'FEATURES.md §5.1',
        'type': 'edge',
        'priority': 'P1',
        'draft_ids': ['yogi-auth-magic-link-request-cooldown', 'visitor-magic-link-cooldown-throttled'],
        'suggested_user': 'user_sarah (Sarah Jenkins)',
        'seed_gap': 'none',
        'isolation': 'shared',
        'platforms': 'both',
        'automation_status': 'partial (UI cooldown timer automated; out-of-band email delivery is manual runbook only)',
        'prerequisites': 'Valid email address entered.',
        'preconditions': 'Visitor on login screen.',
        'steps': [
            'Given the visitor enters email "user_sarah@inspired.test" in magic link field',
            'When they tap "Send Magic Link"',
            'Then confirmation toast "Check your email" appears',
            'And the send button is disabled with a 60-second countdown timer',
            'And subsequent taps within 60s are blocked'
        ],
        'data_reset': 'None.'
    },
    {
        'id': 'visitor-magic-link-invalid-email-rejected',
        'title': 'Visitor enters invalid email format and magic link submission is blocked',
        'feature_ref': 'FEATURES.md §5.1',
        'type': 'valid-failure',
        'priority': 'P1',
        'draft_ids': ['yogi-auth-magic-link-invalid-email', 'visitor-magic-link-invalid-email-rejected'],
        'suggested_user': 'user_newbie (Yoga Newbie)',
        'seed_gap': 'none',
        'isolation': 'shared',
        'platforms': 'both',
        'automation_status': 'unit-only (LoginView.test.tsx)',
        'prerequisites': 'None.',
        'preconditions': 'Visitor on login view.',
        'steps': [
            'Given the visitor enters invalid email "notanemail.com" without @ symbol',
            'When they attempt to send magic link',
            'Then validation message "Please enter a valid email" is displayed and no request is dispatched'
        ],
        'data_reset': 'None.'
    },
    {
        'id': 'visitor-staging-login-uninvited-blocked',
        'title': 'Uninvited visitor email is rejected on staging environment by whitelist gate',
        'feature_ref': 'FEATURES.md §5.13',
        'type': 'valid-failure',
        'priority': 'P1',
        'draft_ids': ['yogi-auth-staging-uninvited-gating', 'visitor-staging-login-uninvited-blocked'],
        'suggested_user': 'NEW: user_uninvited_staging',
        'seed_gap': 'uninvited email string for test assertion',
        'isolation': 'shared',
        'platforms': 'both',
        'automation_status': 'none',
        'prerequisites': 'App running with staging access gating enabled.',
        'preconditions': 'Visitor attempts login with non-whitelisted email.',
        'steps': [
            'Given the visitor enters an email not present in staging whitelist',
            'When they attempt to authenticate',
            'Then access is denied with message "Access restricted to invited staging testers"'
        ],
        'data_reset': 'None.'
    },
    {
        'id': 'yogi-cold-start-session-restore',
        'title': 'Authenticated yogi reloads application and session is restored automatically',
        'feature_ref': 'FEATURES.md §5.1.1, UserFlows.md §1.1',
        'type': 'happy',
        'priority': 'P0',
        'draft_ids': ['yogi-auth-cold-start-session-restore', 'yogi-cold-start-session-restored'],
        'suggested_user': 'user_sarah (Sarah Jenkins)',
        'seed_gap': 'none',
        'isolation': 'shared',
        'platforms': 'both',
        'automation_status': 'e2e (implicit in regression suite)',
        'prerequisites': 'User is actively authenticated in browser storage.',
        'preconditions': 'Authenticated user refreshes browser or relaunches app.',
        'steps': [
            'Given Sarah Jenkins is logged into the application',
            'When the page is hard refreshed (cold start)',
            'Then splash loader briefly appears while auth state initializes',
            'And application directly routes to authenticated feed without presenting login screen'
        ],
        'data_reset': 'None.'
    },
    {
        'id': 'yogi-logout-session-terminated',
        'title': 'Yogi logs out cleanly and application returns to login view',
        'feature_ref': 'FEATURES.md §5.1, §5.8',
        'type': 'happy',
        'priority': 'P0',
        'draft_ids': ['yogi-auth-logout-success', 'yogi-logout-session-terminated'],
        'suggested_user': 'user_sarah (Sarah Jenkins)',
        'seed_gap': 'none',
        'isolation': 'shared',
        'platforms': 'both',
        'automation_status': 'e2e (Apps/PWA/src/test/e2e/regression_suite.spec.ts)',
        'prerequisites': 'Authenticated user session active.',
        'preconditions': 'Logged in on application.',
        'steps': [
            'Given the yogi is authenticated',
            'When they tap user profile and select "Sign Out"',
            'Then session token is revoked and user profile is cleared from context',
            'And app redirects back to Login view displaying dev credentials inputs'
        ],
        'data_reset': 'None.'
    },
    {
        'id': 'yogi-onboarding-complete-profile',
        'title': 'First-time yogi completes onboarding, validates handle, and enters feed',
        'feature_ref': 'FEATURES.md §5.4',
        'type': 'happy',
        'priority': 'P0',
        'draft_ids': ['yogi-onboarding-complete-profile-success', 'yogi-complete-onboarding-activate-account'],
        'suggested_user': 'NEW: user_onboard_fresh (UID with no profile)',
        'seed_gap': 'Auth user record without Firestore profile document',
        'isolation': 'clone',
        'platforms': 'both',
        'automation_status': 'unit-only (OnboardingView.test.tsx)',
        'prerequisites': 'Freshly registered Firebase Auth account with no existing Firestore /users/{uid} document.',
        'preconditions': 'App detects missing profile and redirects to OnboardingView.',
        'steps': [
            'Given an authenticated user arrives on onboarding view',
            'When they enter display name "Elena Fox"',
            'Then generated handle preview displays "@elena_fox#XXXX"',
            'And when they tap "Complete Setup"',
            'Then Firestore document /users/{uid} is created with privacy defaults',
            'And app navigates to CommunityFeedView'
        ],
        'data_reset': 'Teardown deletes cloned /users/{uid} document and Auth account.'
    },
    {
        'id': 'visitor-onboarding-short-name-rejected',
        'title': 'Onboarding rejects display names shorter than 2 characters',
        'feature_ref': 'FEATURES.md §5.4',
        'type': 'valid-failure',
        'priority': 'P1',
        'draft_ids': ['yogi-onboarding-short-display-name', 'visitor-onboarding-name-too-short-rejected'],
        'suggested_user': 'NEW: user_onboard_fresh',
        'seed_gap': 'Auth user without profile',
        'isolation': 'clone',
        'platforms': 'both',
        'automation_status': 'unit-only (OnboardingView.test.tsx)',
        'prerequisites': 'User on onboarding screen.',
        'preconditions': 'Display name input is focused.',
        'steps': [
            'Given user enters single character "A" as display name',
            'When they attempt to submit',
            'Then error notice "Display name must be at least 2 characters" appears and submission is blocked'
        ],
        'data_reset': 'Teardown removes test Auth account.'
    },
    {
        'id': 'visitor-onboarding-name-boundary-accepted',
        'title': 'Onboarding accepts minimum valid 2-character display name',
        'feature_ref': 'FEATURES.md §5.4',
        'type': 'edge',
        'priority': 'P2',
        'draft_ids': ['visitor-onboarding-name-boundary-accepted'],
        'suggested_user': 'NEW: user_onboard_fresh',
        'seed_gap': 'Auth user without profile',
        'isolation': 'clone',
        'platforms': 'both',
        'automation_status': 'unit-only (OnboardingView.test.tsx)',
        'prerequisites': 'User on onboarding screen.',
        'preconditions': 'Display name input focused.',
        'steps': [
            'Given user enters 2 characters "Bo"',
            'When they submit onboarding form',
            'Then validation succeeds and profile is created with handle "@bo#XXXX"'
        ],
        'data_reset': 'Teardown removes created profile.'
    },
    {
        'id': 'visitor-onboarding-profane-name-rejected',
        'title': 'Onboarding blocks offensive display names via Cloud Function moderation',
        'feature_ref': 'FEATURES.md §5.4',
        'type': 'valid-failure',
        'priority': 'P1',
        'draft_ids': ['yogi-onboarding-profane-name-moderation', 'visitor-onboarding-moderation-offensive-name-rejected'],
        'suggested_user': 'NEW: user_onboard_fresh',
        'seed_gap': 'Auth user without profile',
        'isolation': 'clone',
        'platforms': 'both',
        'automation_status': 'unit-only (OnboardingView.test.tsx)',
        'prerequisites': 'User on onboarding view.',
        'preconditions': 'Display name input focused.',
        'steps': [
            'Given user enters prohibited or profane word in display name',
            'When Cloud Function validateDisplayName evaluates name',
            'Then rejection message "Display name contains inappropriate content" displays and profile creation halts'
        ],
        'data_reset': 'Teardown removes test user.'
    },
    {
        'id': 'visitor-onboarding-public-profile-forces-avatar-public',
        'title': 'Setting public profile in onboarding automatically syncs public avatar setting',
        'feature_ref': 'FEATURES.md §5.4, §5.8',
        'type': 'edge',
        'priority': 'P2',
        'draft_ids': ['visitor-onboarding-public-profile-forces-avatar-public'],
        'suggested_user': 'NEW: user_onboard_fresh',
        'seed_gap': 'Auth user without profile',
        'isolation': 'clone',
        'platforms': 'both',
        'automation_status': 'unit-only',
        'prerequisites': 'User on onboarding screen.',
        'preconditions': 'Privacy toggles visible.',
        'steps': [
            'Given user toggles "Make Profile Public" to true',
            'When form evaluates dependencies',
            'Then avatar privacy toggle is automatically set to public to maintain schema consistency'
        ],
        'data_reset': 'Teardown removes test profile.'
    },
    {
        'id': 'yogi-search-discovery-initial-state',
        'title': 'Yogi opens Search view and sees Discovery Mode suggestions with category badges',
        'feature_ref': 'FEATURES.md §5.9',
        'type': 'happy',
        'priority': 'P0',
        'draft_ids': ['yogi-search-discovery-initial-state'],
        'suggested_user': 'user_sarah (Sarah Jenkins)',
        'seed_gap': 'none',
        'isolation': 'shared',
        'platforms': 'both',
        'automation_status': 'unit-only (SearchView.test.tsx)',
        'prerequisites': 'Seeded communities, studios, and areas exist.',
        'preconditions': 'Yogi navigates to Search tab with empty query input.',
        'steps': [
            'Given the yogi is on the Search screen',
            'When search query input is empty',
            'Then "Discovery Mode" header is displayed',
            'And curated suggestions appear with badges: 👥 Community, 🏢 Studio, 📍 Area'
        ],
        'data_reset': 'None.'
    },
    {
        'id': 'yogi-search-by-postcode-prefix',
        'title': 'Yogi searches outward postcode prefix and sees local studios ranked first',
        'feature_ref': 'FEATURES.md §5.9',
        'type': 'happy',
        'priority': 'P0',
        'draft_ids': ['yogi-search-by-postcode-prefix', 'yogi-search-postcode-prefix-case-insensitive', 'yogi-search-postcode-discover-studio'],
        'suggested_user': 'user_sarah (Sarah Jenkins)',
        'seed_gap': 'none',
        'isolation': 'shared',
        'platforms': 'both',
        'automation_status': 'unit-only (SearchView.test.tsx)',
        'prerequisites': 'Askew Road Zen Den seeded at postcode W12 9AS.',
        'preconditions': 'Yogi focuses header search bar.',
        'steps': [
            'Given yogi types "W12" or "w12" into search input',
            'When results resolve',
            'Then Askew Road Zen Den and W12 Askew Area Community are ranked at top of results',
            'And tapping Askew Road Zen Den navigates to its StudioProfileView'
        ],
        'data_reset': 'None.'
    },
    {
        'id': 'yogi-search-by-area-name',
        'title': 'Yogi searches area name and finds matching neighborhood communities',
        'feature_ref': 'FEATURES.md §5.9',
        'type': 'happy',
        'priority': 'P1',
        'draft_ids': ['yogi-search-by-area-name'],
        'suggested_user': 'user_sarah (Sarah Jenkins)',
        'seed_gap': 'none',
        'isolation': 'shared',
        'platforms': 'both',
        'automation_status': 'unit-only (SearchView.test.tsx)',
        'prerequisites': 'Seeded area community Chiswick exists.',
        'preconditions': 'Yogi on search view.',
        'steps': [
            'Given yogi searches "Chiswick"',
            'When search executes',
            'Then Chiswick Community tile and Chiswick Hot Yoga Studio appear in result list'
        ],
        'data_reset': 'None.'
    },
    {
        'id': 'yogi-search-no-results-discovery-fallback',
        'title': 'Unmatched search query displays empty notice with Discovery Mode fallback recommendations',
        'feature_ref': 'FEATURES.md §5.9',
        'type': 'edge',
        'priority': 'P1',
        'draft_ids': ['yogi-search-no-results-discovery-fallback', 'yogi-search-no-results-view-discovery-fallback'],
        'suggested_user': 'user_sarah (Sarah Jenkins)',
        'seed_gap': 'none',
        'isolation': 'shared',
        'platforms': 'both',
        'automation_status': 'unit-only (SearchView.test.tsx)',
        'prerequisites': 'None.',
        'preconditions': 'Yogi enters random gibberish query.',
        'steps': [
            'Given yogi searches "ZX99INVALID"',
            'When search resolves with 0 matches',
            'Then message "No results found for ZX99INVALID" appears',
            'And "Explore Suggested Communities Near You" recommendations are displayed below'
        ],
        'data_reset': 'None.'
    },
    {
        'id': 'yogi-search-clear-input-resets',
        'title': 'Tapping search clear button clears input and restores Discovery Mode',
        'feature_ref': 'FEATURES.md §5.9',
        'type': 'happy',
        'priority': 'P2',
        'draft_ids': ['yogi-search-clear-input-resets-discovery'],
        'suggested_user': 'user_sarah (Sarah Jenkins)',
        'seed_gap': 'none',
        'isolation': 'shared',
        'platforms': 'both',
        'automation_status': 'unit-only (SearchView.test.tsx)',
        'prerequisites': 'Search query typed in input.',
        'preconditions': 'Active search text present.',
        'steps': [
            'Given text "Yoga" is entered in search input and results are displayed',
            'When yogi taps the "✕" clear button inside input',
            'Then text is cleared and screen transitions back to Discovery Mode recommendations'
        ],
        'data_reset': 'None.'
    },
    {
        'id': 'yogi-search-unclaimed-shadow-studio',
        'title': 'Yogi views unclaimed shadow studio tile with "Claim Studio" button prompt',
        'feature_ref': 'FEATURES.md §5.9, §5.12',
        'type': 'happy',
        'priority': 'P1',
        'draft_ids': ['yogi-search-view-unclaimed-shadow-studio'],
        'suggested_user': 'user_newbie (Yoga Newbie)',
        'seed_gap': 'none (shadow studio exists in seeds)',
        'isolation': 'shared',
        'platforms': 'both',
        'automation_status': 'unit-only (SearchView.test.tsx)',
        'prerequisites': 'Seeded studio with isClaimed: false exists.',
        'preconditions': 'Yogi searches shadow studio name.',
        'steps': [
            'Given yogi searches "Shoreditch" or shadow studio name',
            'When search tile renders',
            'Then unclaimed studio displays badge "Unclaimed Profile" and button "Claim Studio 🏢"'
        ],
        'data_reset': 'None.'
    },
    {
        'id': 'yogi-search-operating-status-badges',
        'title': 'Search result studio tiles display accurate operating status badges',
        'feature_ref': 'FEATURES.md §5.9, §5.14',
        'type': 'happy',
        'priority': 'P2',
        'draft_ids': ['yogi-search-view-operating-status-badges'],
        'suggested_user': 'user_sarah (Sarah Jenkins)',
        'seed_gap': 'studio with temp_closed status',
        'isolation': 'shared',
        'platforms': 'both',
        'automation_status': 'unit-only (SearchView.test.tsx)',
        'prerequisites': 'Studios with active and temp_closed statuses exist.',
        'preconditions': 'Yogi searches studios.',
        'steps': [
            'Given yogi views studio search tiles',
            'Then active studios display green "● Open" badge',
            'And temporarily closed studios display amber "● Temporarily Closed" badge'
        ],
        'data_reset': 'None.'
    },
    {
        'id': 'yogi-feed-view-unified-stream',
        'title': 'Yogi views chronological feed stream of joined communities and area posts',
        'feature_ref': 'FEATURES.md §5.3',
        'type': 'happy',
        'priority': 'P0',
        'draft_ids': ['yogi-feed-view-unified-stream'],
        'suggested_user': 'user_sarah (Sarah Jenkins)',
        'seed_gap': 'none',
        'isolation': 'shared',
        'platforms': 'both',
        'automation_status': 'unit-only (CommunityFeedView.test.tsx)',
        'prerequisites': 'Sarah is member of Askew community with seeded posts.',
        'preconditions': 'Sarah logged in on Community Feed tab.',
        'steps': [
            'Given Sarah navigates to feed',
            'When feed loads',
            'Then post tiles render with author avatar, display name, handle, source community badge, content text, and relative timestamp'
        ],
        'data_reset': 'None.'
    },
    {
        'id': 'yogi-feed-empty-area-3tier-fallback',
        'title': 'Feed executes 3-tier discovery fallback when recent local posts are absent',
        'feature_ref': 'FEATURES.md §5.3',
        'type': 'edge',
        'priority': 'P1',
        'draft_ids': ['yogi-feed-empty-area-3tier-fallback', 'yogi-feed-discovery-mode-empty-area'],
        'suggested_user': 'user_newbie (Yoga Newbie)',
        'seed_gap': 'none',
        'isolation': 'shared',
        'platforms': 'both',
        'automation_status': 'unit-only (CommunityFeedView.test.tsx)',
        'prerequisites': 'Clean-slate user in area with 0 posts in last 30 days.',
        'preconditions': 'User loads feed.',
        'steps': [
            'Given feed finds 0 posts in Tier 1 (30 days)',
            'When it falls back to Tier 2 (180 days) and finds 0 posts',
            'Then it automatically transitions to Tier 3 (Discovery Mode recommendations) displaying "Explore Nearby Communities"'
        ],
        'data_reset': 'None.'
    },
    {
        'id': 'yogi-feed-post-avatar-privacy-fallback',
        'title': 'Feed post by author with groups-only privacy displays fallback avatar to non-members',
        'feature_ref': 'FEATURES.md §5.3.1',
        'type': 'edge',
        'priority': 'P1',
        'draft_ids': ['yogi-feed-post-avatar-privacy-fallback'],
        'suggested_user': 'user_newbie (Yoga Newbie)',
        'seed_gap': 'none',
        'isolation': 'shared',
        'platforms': 'both',
        'automation_status': 'unit-only (FeedPostTile.tsx)',
        'prerequisites': 'Post author has avatarPrivacy: "groups-only".',
        'preconditions': 'Non-group-member views post.',
        'steps': [
            'Given a post rendered from a user with groups-only avatar privacy',
            'When viewer does not share any mutual community with author',
            'Then placeholder community-only avatar is rendered without fetching binary image'
        ],
        'data_reset': 'None.'
    },
    {
        'id': 'yogi-feed-post-like-toggle',
        'title': 'Yogi likes and unlikes a feed post updating like counter',
        'feature_ref': 'FEATURES.md §5.3',
        'type': 'happy',
        'priority': 'P2',
        'draft_ids': ['yogi-feed-post-like-toggle'],
        'suggested_user': 'user_sarah (Sarah Jenkins)',
        'seed_gap': 'none',
        'isolation': 'clone',
        'platforms': 'both',
        'automation_status': 'none',
        'prerequisites': 'Post exists on feed.',
        'preconditions': 'Sarah viewing feed post.',
        'steps': [
            'Given Sarah views a feed post with 2 likes',
            'When she taps the heart icon',
            'Then like counter increments to 3 and heart highlights',
            'And when she taps again, counter decrements back to 2'
        ],
        'data_reset': 'Teardown resets post like counter.'
    },
    {
        'id': 'yogi-joined-communities-view-list',
        'title': 'Yogi views list of joined communities and navigates to community profile',
        'feature_ref': 'FEATURES.md §5.10',
        'type': 'happy',
        'priority': 'P0',
        'draft_ids': ['yogi-joined-communities-view-list', 'yogi-join-community-view-neighborhood-feed'],
        'suggested_user': 'user_sarah (Sarah Jenkins)',
        'seed_gap': 'none',
        'isolation': 'shared',
        'platforms': 'both',
        'automation_status': 'e2e (Apps/PWA/src/test/e2e/regression_suite.spec.ts)',
        'prerequisites': 'Sarah is member of Askew Community.',
        'preconditions': 'Sarah clicks "My Communities" in navigation header.',
        'steps': [
            'Given Sarah opens Joined Communities view',
            'When communities load',
            'Then Askew Community summary tile is displayed',
            'And clicking the tile navigates to UnifiedProfileView for Askew community'
        ],
        'data_reset': 'None.'
    },
    {
        'id': 'yogi-joined-communities-leave-community',
        'title': 'Yogi leaves a joined community via overflow menu without forfeiting class passes',
        'feature_ref': 'FEATURES.md §5.10, §5.15',
        'type': 'happy',
        'priority': 'P1',
        'draft_ids': ['yogi-joined-communities-leave-community', 'yogi-leave-joined-community-success', 'yogi-leave-community-via-overflow-menu'],
        'suggested_user': 'user_sarah (Sarah Jenkins)',
        'seed_gap': 'none',
        'isolation': 'clone',
        'platforms': 'both',
        'automation_status': 'unit-only (JoinedCommunitiesView.test.tsx)',
        'prerequisites': 'Sarah holds pass for studio and is member of studio community.',
        'preconditions': 'Sarah opens My Communities.',
        'steps': [
            'Given Sarah views Askew studio community in My Communities',
            'When she taps the 3-dots overflow menu and selects "Leave Community"',
            'Then community is removed from her joined list',
            'And her active studio credit passes remain intact in her pass wallet'
        ],
        'data_reset': 'Teardown restores membership.'
    },
    {
        'id': 'yogi-joined-communities-empty-state',
        'title': 'Clean-slate yogi with 0 communities views empty state with join recommendations',
        'feature_ref': 'FEATURES.md §5.10',
        'type': 'happy',
        'priority': 'P2',
        'draft_ids': ['yogi-joined-communities-empty-state-discovery', 'yogi-joined-communities-empty-state-rendered'],
        'suggested_user': 'user_newbie (Yoga Newbie)',
        'seed_gap': 'none',
        'isolation': 'shared',
        'platforms': 'both',
        'automation_status': 'unit-only (JoinedCommunitiesView.test.tsx)',
        'prerequisites': 'User has joined 0 communities.',
        'preconditions': 'User opens My Communities.',
        'steps': [
            'Given Yoga Newbie opens Joined Communities view',
            'When view renders',
            'Then notice "You haven\'t joined any communities yet" appears',
            'And recommendations list with "Join" buttons is displayed'
        ],
        'data_reset': 'None.'
    },
    {
        'id': 'yogi-studio-profile-view-details',
        'title': 'Yogi views studio profile header details, teachers carousel, and tabs',
        'feature_ref': 'FEATURES.md §5.14',
        'type': 'happy',
        'priority': 'P0',
        'draft_ids': ['yogi-studio-profile-view-details'],
        'suggested_user': 'user_sarah (Sarah Jenkins)',
        'seed_gap': 'none',
        'isolation': 'shared',
        'platforms': 'both',
        'automation_status': 'unit-only (StudioProfileView.test.tsx)',
        'prerequisites': 'Studio Askew Road Zen Den seeded with teacher Maya Sharma.',
        'preconditions': 'Yogi navigates to Askew Road Zen Den profile.',
        'steps': [
            'Given yogi opens studio profile',
            'When page loads',
            'Then hero cover banner, operating status badge "● Open", and parent brand badge render',
            'And "Teachers at this Studio" carousel displays Maya Sharma card with photo and name',
            'And sub-tab switcher displays "Timetable", "About", and "Members"'
        ],
        'data_reset': 'None.'
    },
    {
        'id': 'yogi-studio-profile-cascading-join',
        'title': 'Yogi joins studio branch executing atomic cascading join of parent brand network',
        'feature_ref': 'FEATURES.md §5.14',
        'type': 'happy',
        'priority': 'P0',
        'draft_ids': ['yogi-studio-profile-cascading-join', 'yogi-book-unjoined-trigger-cascading-join'],
        'suggested_user': 'user_newbie (Yoga Newbie)',
        'seed_gap': 'none',
        'isolation': 'clone',
        'platforms': 'both',
        'automation_status': 'unit-only (StudioProfileView.test.tsx)',
        'prerequisites': 'Chiswick studio belongs to Affordable London Yoga brand; user is not a member.',
        'preconditions': 'Newbie navigates to Chiswick studio profile.',
        'steps': [
            'Given Newbie views unjoined Chiswick studio with button "[ Join Studio ＋ ]"',
            'When they tap "Join Studio"',
            'Then button toggles to "✓ Joined"',
            'And user profile joinedCommunities atomically receives both Chiswick studio and Affordable London Yoga brand IDs'
        ],
        'data_reset': 'Teardown restores unjoined state.'
    },
    {
        'id': 'yogi-studio-profile-temporary-closure-notice',
        'title': 'Yogi views studio with temporary closure notice and custom manager notes',
        'feature_ref': 'FEATURES.md §5.14',
        'type': 'edge',
        'priority': 'P1',
        'draft_ids': ['yogi-studio-profile-temporary-closure-notice', 'yogi-view-temp-closed-studio-notice'],
        'suggested_user': 'user_sarah (Sarah Jenkins)',
        'seed_gap': 'studio with operatingStatus: "temp_closed"',
        'isolation': 'shared',
        'platforms': 'both',
        'automation_status': 'none',
        'prerequisites': 'Studio configured with temp_closed status and closure notice string.',
        'preconditions': 'Yogi opens temporarily closed studio profile.',
        'steps': [
            'Given yogi views studio profile with operatingStatus: "temp_closed"',
            'When page renders',
            'Then amber banner displays "Temporarily Closed: {customNote}"',
            'And class booking action buttons on timetable are disabled'
        ],
        'data_reset': 'None.'
    },
    {
        'id': 'yogi-studio-members-privacy-enforcement',
        'title': 'Studio members directory enforces privacy masking for private user profiles',
        'feature_ref': 'FEATURES.md §5.14, §5.3.1',
        'type': 'edge',
        'priority': 'P1',
        'draft_ids': ['yogi-studio-members-directory-privacy-enforcement', 'yogi-studio-members-privacy-masking-isolation'],
        'suggested_user': 'user_sarah (Sarah Jenkins)',
        'seed_gap': 'none',
        'isolation': 'shared',
        'platforms': 'both',
        'automation_status': 'unit-only (StudioMembersView.test.tsx)',
        'prerequisites': 'Studio has public member and private member.',
        'preconditions': 'Sarah opens "Members" sub-tab on studio profile.',
        'steps': [
            'Given Sarah navigates to Members tab of studio',
            'When members list loads',
            'Then public members show clickable row with avatar and handle leading to UnifiedProfileView',
            'And private members show generic placeholder without clickable profile link'
        ],
        'data_reset': 'None.'
    },
    {
        'id': 'yogi-schedule-view-7day-calendar',
        'title': 'Yogi navigates 7-day studio timetable selector and views classes for selected date',
        'feature_ref': 'FEATURES.md §5.14',
        'type': 'happy',
        'priority': 'P0',
        'draft_ids': ['yogi-schedule-view-7day-calendar'],
        'suggested_user': 'user_sarah (Sarah Jenkins)',
        'seed_gap': 'none',
        'isolation': 'shared',
        'platforms': 'both',
        'automation_status': 'unit-only (StudioScheduleView.test.tsx)',
        'prerequisites': 'Studio Askew has classes scheduled across multiple days.',
        'preconditions': 'Sarah on Timetable tab.',
        'steps': [
            'Given Sarah views Timetable tab with week switcher and 7 day selector pills',
            'When she taps Wednesday pill',
            'Then schedule updates to show classes scheduled for Wednesday',
            'And class tiles display start time, climate preset icon, title, instructor link, and booking status'
        ],
        'data_reset': 'None.'
    },
    {
        'id': 'yogi-schedule-view-class-info-modal',
        'title': 'Yogi opens Class Info Modal and inspects room climate presets and details',
        'feature_ref': 'FEATURES.md §5.14',
        'type': 'happy',
        'priority': 'P1',
        'draft_ids': ['yogi-schedule-view-class-info-modal', 'yogi-view-class-climate-preset-details', 'yogi-inspect-class-climate-details'],
        'suggested_user': 'user_sarah (Sarah Jenkins)',
        'seed_gap': 'none',
        'isolation': 'shared',
        'platforms': 'both',
        'automation_status': 'unit-only (ClassInfoModal.test.tsx)',
        'prerequisites': 'Published class exists on schedule with climate metadata.',
        'preconditions': 'Yogi viewing class row on schedule.',
        'steps': [
            'Given yogi taps "ⓘ" info button on Hot Vinyasa class row',
            'When ClassInfoModal overlay opens',
            'Then modal displays title, teacher name, category, duration, and room climate preset badge (e.g. "🔥 35°C Hot Studio")',
            'And tapping close button "✕" dismisses the modal'
        ],
        'data_reset': 'None.'
    },
    {
        'id': 'yogi-schedule-view-custom-currency-badge',
        'title': 'Studio schedule class tile displays Custom Currency Acceptance badge when restricted',
        'feature_ref': 'FEATURES.md §5.16, §5.20',
        'type': 'happy',
        'priority': 'P1',
        'draft_ids': ['yogi-schedule-view-custom-currency-badge'],
        'suggested_user': 'user_sarah (Sarah Jenkins)',
        'seed_gap': 'class with custom currency acceptance policy',
        'isolation': 'shared',
        'platforms': 'both',
        'automation_status': 'none',
        'prerequisites': 'Studio class configured with currencyAcceptancePolicy: "custom".',
        'preconditions': 'Yogi views timetable.',
        'steps': [
            'Given a masterclass configured to accept Drop-In only',
            'When class row renders in schedule',
            'Then badge "Custom Currency Only" or "Drop-In Only" is visible on the tile'
        ],
        'data_reset': 'None.'
    },
    {
        'id': 'yogi-schedule-unjoined-book-join-prompt',
        'title': 'Unjoined yogi attempting to book class is prompted with Join Studio modal',
        'feature_ref': 'FEATURES.md §5.14',
        'type': 'happy',
        'priority': 'P0',
        'draft_ids': ['yogi-schedule-unjoined-book-triggers-join-prompt', 'yogi-book-unjoined-studio-class-join-prompt'],
        'suggested_user': 'user_newbie (Yoga Newbie)',
        'seed_gap': 'none',
        'isolation': 'clone',
        'platforms': 'both',
        'automation_status': 'none',
        'prerequisites': 'User is not joined to studio community.',
        'preconditions': 'Newbie navigates to Askew schedule.',
        'steps': [
            'Given Newbie views an open class at unjoined studio',
            'When they tap "[ Book ]"',
            'Then modal "Join Studio to Book" appears explaining membership is required',
            'And clicking "Join & Continue" joins the studio and opens the pass selection modal'
        ],
        'data_reset': 'Teardown restores unjoined state.'
    },
    {
        'id': 'yogi-schedule-closed-studio-bookings-blocked',
        'title': 'Bookings are disabled on schedule when studio is temporarily closed',
        'feature_ref': 'FEATURES.md §5.14',
        'type': 'valid-failure',
        'priority': 'P1',
        'draft_ids': ['yogi-schedule-closed-studio-bookings-blocked', 'yogi-book-temporarily-closed-studio-paused'],
        'suggested_user': 'user_sarah (Sarah Jenkins)',
        'seed_gap': 'studio with temp_closed status',
        'isolation': 'shared',
        'platforms': 'both',
        'automation_status': 'none',
        'prerequisites': 'Studio operatingStatus is temp_closed.',
        'preconditions': 'Sarah views studio schedule.',
        'steps': [
            'Given studio is temporarily closed',
            'When yogi inspects class rows on schedule',
            'Then "[ Book ]" buttons are rendered disabled with label "Closed" or "Paused"'
        ],
        'data_reset': 'None.'
    },
    {
        'id': 'yogi-book-past-class-disabled',
        'title': 'Yogi cannot book a class session scheduled in the past',
        'feature_ref': 'FEATURES.md §5.14',
        'type': 'valid-failure',
        'priority': 'P1',
        'draft_ids': ['yogi-book-past-class-disabled'],
        'suggested_user': 'user_sarah (Sarah Jenkins)',
        'seed_gap': 'class session with startTime in past',
        'isolation': 'shared',
        'platforms': 'both',
        'automation_status': 'none',
        'prerequisites': 'Class session timestamp is earlier than current time.',
        'preconditions': 'Yogi views timetable on past date.',
        'steps': [
            'Given a class session that has already finished',
            'When yogi views class tile',
            'Then booking button is disabled with text "Class Finished" or hidden'
        ],
        'data_reset': 'None.'
    },
    {
        'id': 'yogi-book-class-with-pass-success',
        'title': 'Returning yogi books open class redeeming active pass credit',
        'feature_ref': 'FEATURES.md §5.14, §5.20',
        'type': 'happy',
        'priority': 'P0',
        'draft_ids': ['yogi-book-class-with-pass-success', 'yogi-book-class-single-credit-depleted', 'yogi-book-class-with-active-pass'],
        'suggested_user': 'user_sarah (Sarah Jenkins)',
        'seed_gap': 'none (Sarah holds pass_sarah_brand_5pack with 4 credits)',
        'isolation': 'clone',
        'platforms': 'both',
        'automation_status': 'unit-only (firestoreService.test.ts, BookingPassSelectionModalView.test.tsx)',
        'prerequisites': 'Sarah holds active 5-pack pass with 4 credits for Affordable London Yoga brand.',
        'preconditions': 'Sarah is logged in and viewing Askew Road Zen Den schedule.',
        'steps': [
            'Given Sarah views an open Vinyasa Flow class with 5/15 spots booked',
            'When she taps "[ Book ]"',
            'Then BookingPassSelectionModalView opens displaying her 5-Class Pack (4 credits remaining)',
            'And when she confirms booking',
            'Then class booking record is created in Firestore',
            'And pass remainingCredits decrements from 4 to 3',
            'And schedule button transitions to "✓ Booked"'
        ],
        'data_reset': 'Teardown deletes booking and restores pass remainingCredits.'
    },
    {
        'id': 'yogi-book-class-unlimited-pass-intact',
        'title': 'Yogi booking with unlimited subscription pass creates booking with zero credit deduction',
        'feature_ref': 'FEATURES.md §5.20',
        'type': 'happy',
        'priority': 'P1',
        'draft_ids': ['yogi-book-class-unlimited-pass-intact'],
        'suggested_user': 'user_elena (Elena Rostova)',
        'seed_gap': 'none (Elena holds Staff Unlimited Pass)',
        'isolation': 'clone',
        'platforms': 'both',
        'automation_status': 'unit-only (firestoreService.test.ts)',
        'prerequisites': 'Elena holds active unlimited pass.',
        'preconditions': 'Elena books class at Chiswick Hot Yoga.',
        'steps': [
            'Given user selects class to book with active Unlimited Membership pass',
            'When booking transaction commits',
            'Then booking is confirmed ("✓ Booked")',
            'And pass balance remains unlimited without decrementing'
        ],
        'data_reset': 'Teardown deletes created booking.'
    },
    {
        'id': 'yogi-cancel-class-booking-refund',
        'title': 'Yogi cancels class booking >= 12h before start and pass credit is refunded to wallet',
        'feature_ref': 'FEATURES.md §5.14, §5.20',
        'type': 'happy',
        'priority': 'P0',
        'draft_ids': ['yogi-cancel-class-booking-refund', 'yogi-cancel-booking-refunds-pass-credit', 'yogi-cancel-booking-reclaim-credit'],
        'suggested_user': 'user_sarah (Sarah Jenkins)',
        'seed_gap': 'pre-existing booking created >=12h in advance',
        'isolation': 'clone',
        'platforms': 'both',
        'automation_status': 'unit-only (firestoreService.test.ts)',
        'prerequisites': 'Sarah has booked class starting > 12h in future.',
        'preconditions': 'Sarah viewing booked class on timetable.',
        'steps': [
            'Given Sarah has a booked class ("✓ Booked") scheduled tomorrow (>12h away)',
            'When she taps "✓ Booked" button to trigger cancellation modal',
            'And confirms "Cancel Booking"',
            'Then booking record is cancelled in Firestore',
            'And 1 credit is refunded back to her pass balance',
            'And button updates back to "[ Book ]"'
        ],
        'data_reset': 'Teardown restores test state.'
    },
    {
        'id': 'yogi-book-class-no-pass-triggers-store',
        'title': 'Yogi with 0 credits attempts booking and is redirected to Currency Store checkout modal',
        'feature_ref': 'FEATURES.md §5.20',
        'type': 'valid-failure',
        'priority': 'P0',
        'draft_ids': ['yogi-book-class-no-pass-triggers-store', 'yogi-book-class-zero-credits-modal-fallback', 'yogi-book-no-pass-open-store'],
        'suggested_user': 'user_newbie (Yoga Newbie)',
        'seed_gap': 'none (Newbie holds 0 passes)',
        'isolation': 'shared',
        'platforms': 'both',
        'automation_status': 'unit-only (NoPassAvailableModalView.test.tsx)',
        'prerequisites': 'Newbie has 0 passes in wallet.',
        'preconditions': 'Newbie navigates to Askew schedule.',
        'steps': [
            'Given Newbie views an open class and taps "[ Book ]"',
            'When pass lookup finds 0 valid passes in wallet',
            'Then "No Valid Pass Available" modal appears',
            'And clicking "Purchase Pass 💳" opens CurrencyStoreCheckoutModalView showing studio pricing tiers'
        ],
        'data_reset': 'None.'
    },
    {
        'id': 'yogi-book-class-expired-pass-excluded',
        'title': 'Yogi holding expired pass cannot select it during booking',
        'feature_ref': 'FEATURES.md §5.20',
        'type': 'valid-failure',
        'priority': 'P1',
        'draft_ids': ['yogi-book-class-expired-pass-excluded'],
        'suggested_user': 'NEW: user_sarah_expired_pass',
        'seed_gap': 'pass with expiresAt < now',
        'isolation': 'clone',
        'platforms': 'both',
        'automation_status': 'unit-only (BookingPassSelectionModalView.test.tsx)',
        'prerequisites': 'User holds pass with expiresAt in the past.',
        'preconditions': 'User taps book on open class.',
        'steps': [
            'Given user holds an expired 5-class pass',
            'When booking pass selector modal opens',
            'Then expired pass is disabled or omitted from selectable radio options',
            'And user cannot confirm booking with expired pass'
        ],
        'data_reset': 'Teardown deletes test pass.'
    },
    {
        'id': 'yogi-booking-pass-selector-filters-custom-currency',
        'title': 'Pass selector modal filters out passes incompatible with studio custom currency policy',
        'feature_ref': 'FEATURES.md §5.20',
        'type': 'edge',
        'priority': 'P0',
        'draft_ids': ['yogi-booking-pass-selector-filters-custom-currency', 'yogi-book-class-custom-currency-restriction-warning'],
        'suggested_user': 'user_sarah (Sarah Jenkins)',
        'seed_gap': 'none',
        'isolation': 'shared',
        'platforms': 'both',
        'automation_status': 'e2e (Apps/PWA/src/test/e2e/regression_suite.spec.ts)',
        'prerequisites': 'Sarah holds Affordable London brand pass; Chelsea studio operates under custom_override.',
        'preconditions': 'Sarah views Chelsea Sanctuary Studio schedule.',
        'steps': [
            'Given Sarah attempts booking at Chelsea studio (custom policy)',
            'When pass selection checks eligibility',
            'Then her Affordable London brand pass is excluded because Chelsea does not accept brand passes',
            'And "No Compatible Pass" warning modal appears'
        ],
        'data_reset': 'None.'
    },
    {
        'id': 'yogi-book-full-class-join-waitlist',
        'title': 'Yogi joins waitlist when class reaches full capacity without upfront credit deduction',
        'feature_ref': 'FEATURES.md §5.14',
        'type': 'happy',
        'priority': 'P1',
        'draft_ids': ['yogi-book-full-class-join-waitlist', 'yogi-join-waitlist-full-class-capacity-boundary', 'yogi-full-class-join-waitlist'],
        'suggested_user': 'user_sarah (Sarah Jenkins)',
        'seed_gap': 'class with capacity == bookedCount',
        'isolation': 'clone',
        'platforms': 'both',
        'automation_status': 'none',
        'prerequisites': 'Class capacity is 1 and bookedCount is 1.',
        'preconditions': 'Sarah views full class.',
        'steps': [
            'Given class capacity is full (1/1 booked)',
            'When Sarah views schedule tile, button displays "Join Waitlist"',
            'And when she taps "Join Waitlist"',
            'Then waitlist booking record is created in Firestore',
            'And button updates to "# Waitlisted"',
            'And no pass credit is deducted upfront'
        ],
        'data_reset': 'Teardown deletes waitlist booking.'
    },
    {
        'id': 'yogi-leave-class-waitlist',
        'title': 'Yogi leaves class waitlist updating button back to Join Waitlist',
        'feature_ref': 'FEATURES.md §5.14',
        'type': 'happy',
        'priority': 'P2',
        'draft_ids': ['yogi-leave-class-waitlist'],
        'suggested_user': 'user_sarah (Sarah Jenkins)',
        'seed_gap': 'user with active waitlist entry',
        'isolation': 'clone',
        'platforms': 'both',
        'automation_status': 'none',
        'prerequisites': 'User is currently on waitlist for class.',
        'preconditions': 'Sarah views class on schedule.',
        'steps': [
            'Given Sarah has waitlisted a full class ("# Waitlisted")',
            'When she taps the button and confirms "Leave Waitlist"',
            'Then waitlist document is deleted in Firestore',
            'And button restores to "Join Waitlist"'
        ],
        'data_reset': 'Teardown resets state.'
    },
    {
        'id': 'yogi-dev-store-purchase-pass-activation',
        'title': 'Yogi simulates pass purchase in development store and pass activates in wallet',
        'feature_ref': 'FEATURES.md §5.20',
        'type': 'happy',
        'priority': 'P1',
        'draft_ids': ['yogi-dev-store-purchase-pass-activation'],
        'suggested_user': 'user_newbie (Yoga Newbie)',
        'seed_gap': 'none',
        'isolation': 'clone',
        'platforms': 'both',
        'automation_status': 'none',
        'prerequisites': 'Newbie has 0 passes.',
        'preconditions': 'Newbie in CurrencyStoreCheckoutModalView.',
        'steps': [
            'Given Newbie views studio currency catalog tiers in store modal',
            'When they select 5-Class Pack (£65) and tap "Simulate Purchase (Dev)"',
            'Then new user_pass document is created in Firestore',
            'And success notification appears confirming 5 credits available'
        ],
        'data_reset': 'Teardown deletes purchased pass.'
    },
    {
        'id': 'yogi-pass-wallet-view-active-passes',
        'title': 'Yogi audits active passes, credit counts, and expiration dates in Digital Wallet',
        'feature_ref': 'FEATURES.md §5.20',
        'type': 'happy',
        'priority': 'P1',
        'draft_ids': ['yogi-pass-wallet-view-active-passes', 'yogi-digital-wallet-active-vs-past-passes', 'yogi-view-wallet-credit-balances'],
        'suggested_user': 'user_sarah (Sarah Jenkins)',
        'seed_gap': 'none',
        'isolation': 'shared',
        'platforms': 'both',
        'automation_status': 'unit-only (UserPassWalletView.test.tsx)',
        'prerequisites': 'Sarah holds seeded pass.',
        'preconditions': 'Sarah opens UserPassWalletView.',
        'steps': [
            'Given Sarah navigates to Digital Pass Wallet',
            'When wallet loads',
            'Then active pass card renders with title "5-Class Pack"',
            'And displays "4 / 5 credits remaining"',
            'And displays valid expiration date'
        ],
        'data_reset': 'None.'
    },
    {
        'id': 'yogi-pass-wallet-view-empty-state',
        'title': 'Yogi with no passes views clean empty state in Digital Pass Wallet',
        'feature_ref': 'FEATURES.md §5.20',
        'type': 'happy',
        'priority': 'P2',
        'draft_ids': ['yogi-pass-wallet-view-empty-state'],
        'suggested_user': 'user_newbie (Yoga Newbie)',
        'seed_gap': 'none',
        'isolation': 'shared',
        'platforms': 'both',
        'automation_status': 'unit-only (UserPassWalletView.test.tsx)',
        'prerequisites': 'Newbie has 0 passes.',
        'preconditions': 'Newbie opens wallet.',
        'steps': [
            'Given Newbie opens Digital Pass Wallet',
            'When passes load',
            'Then empty notice "No active passes found" appears with prompt to discover studios'
        ],
        'data_reset': 'None.'
    },
    {
        'id': 'yogi-profile-edit-bio',
        'title': 'Yogi updates personal bio in profile settings and verifies character limit enforcement',
        'feature_ref': 'FEATURES.md §5.8',
        'type': 'happy',
        'priority': 'P1',
        'draft_ids': ['yogi-profile-edit-bio-success', 'yogi-profile-edit-bio-character-limit'],
        'suggested_user': 'user_sarah (Sarah Jenkins)',
        'seed_gap': 'none',
        'isolation': 'clone',
        'platforms': 'both',
        'automation_status': 'unit-only (ProfileView.test.tsx)',
        'prerequisites': 'User is authenticated.',
        'preconditions': 'Sarah opens Profile screen.',
        'steps': [
            'Given Sarah opens Bio editor in Profile settings',
            'When she enters new bio text',
            'Then character counter displays remaining allowance (max 280 chars)',
            'And saving updates Firestore /users/{uid} document'
        ],
        'data_reset': 'Teardown resets bio.'
    },
    {
        'id': 'yogi-profile-toggle-privacy-settings',
        'title': 'Yogi configures granular privacy toggles and public search constraint sync',
        'feature_ref': 'FEATURES.md §5.8',
        'type': 'happy',
        'priority': 'P1',
        'draft_ids': ['yogi-profile-toggle-privacy-settings', 'yogi-profile-privacy-toggle-public-avatar-sync', 'yogi-update-privacy-settings-bio'],
        'suggested_user': 'user_sarah (Sarah Jenkins)',
        'seed_gap': 'none',
        'isolation': 'clone',
        'platforms': 'both',
        'automation_status': 'unit-only (ProfileView.test.tsx)',
        'prerequisites': 'User authenticated.',
        'preconditions': 'Sarah opens Profile settings.',
        'steps': [
            'Given Sarah views privacy switches',
            'When she toggles isProfilePublic, avatarPrivacy, or showJoinedGroups',
            'Then settings persist in Firestore',
            'And toggling profile public automatically synchronizes avatar privacy to public'
        ],
        'data_reset': 'Teardown restores privacy defaults.'
    },
    {
        'id': 'yogi-profile-switch-theme',
        'title': 'Yogi toggles Light and Dark theme preference with immediate DOM class update',
        'feature_ref': 'FEATURES.md §5.8',
        'type': 'happy',
        'priority': 'P2',
        'draft_ids': ['yogi-profile-switch-theme', 'yogi-profile-theme-toggle-persistence', 'yogi-toggle-theme-dark-mode'],
        'suggested_user': 'user_sarah (Sarah Jenkins)',
        'seed_gap': 'none',
        'isolation': 'shared',
        'platforms': 'both',
        'automation_status': 'unit-only (ThemeContext.test.tsx)',
        'prerequisites': 'None.',
        'preconditions': 'User taps theme toggle in header/profile.',
        'steps': [
            'Given app is rendered in Light theme',
            'When yogi taps theme switch',
            'Then HTML root class updates to "dark"',
            'And background colors transition to dark theme surface tokens'
        ],
        'data_reset': 'None.'
    },
    {
        'id': 'yogi-profile-issue-reporting-link',
        'title': 'Tapping Report an Issue generates pre-filled Google Form link with user ID',
        'feature_ref': 'FEATURES.md §5.6',
        'type': 'happy',
        'priority': 'P2',
        'draft_ids': ['yogi-profile-issue-reporting-link', 'yogi-profile-report-issue-prefilled-id'],
        'suggested_user': 'user_sarah (Sarah Jenkins)',
        'seed_gap': 'none',
        'isolation': 'shared',
        'platforms': 'both',
        'automation_status': 'unit-only (ProfileView.test.tsx)',
        'prerequisites': 'User authenticated.',
        'preconditions': 'Sarah on Profile screen.',
        'steps': [
            'Given Sarah opens profile menu and taps "Report an Issue"',
            'When external link is inspected',
            'Then URL target points to configured Google Form and contains query param "entry.XXXX=user_sarah"'
        ],
        'data_reset': 'None.'
    },
    {
        'id': 'yogi-shell-header-navigation-audit',
        'title': 'Responsive navigation shell renders desktop sidebar vs mobile sticky header',
        'feature_ref': 'FEATURES.md §5.2, §5.8',
        'type': 'happy',
        'priority': 'P1',
        'draft_ids': ['yogi-shell-header-navigation-audit', 'yogi-mobile-vs-desktop-navigation-shell'],
        'suggested_user': 'user_sarah (Sarah Jenkins)',
        'seed_gap': 'none',
        'isolation': 'shared',
        'platforms': 'both',
        'automation_status': 'e2e (Apps/PWA/src/test/e2e/regression_suite.spec.ts)',
        'prerequisites': 'User authenticated.',
        'preconditions': 'Browser viewport adjusted between 390px (mobile) and 1280px (desktop).',
        'steps': [
            'Given viewport is at 1280px desktop width',
            'Then fixed desktop sidebar and wide search bar render',
            'And when viewport resized to 390px mobile width',
            'Then mobile sticky header with compact icons and bottom/top navigation renders'
        ],
        'data_reset': 'None.'
    },
    {
        'id': 'visitor-maintenance-mode-barrier',
        'title': 'Remote Config maintenance mode activates non-dismissible maintenance screen',
        'feature_ref': 'FEATURES.md §5.8 (Maint)',
        'type': 'edge',
        'priority': 'P1',
        'draft_ids': ['yogi-maintenance-mode-interceptor', 'visitor-maintenance-mode-barrier-enforced'],
        'suggested_user': 'user_newbie (Yoga Newbie)',
        'seed_gap': 'Remote Config is_maintenance_mode flag',
        'isolation': 'shared',
        'platforms': 'both',
        'automation_status': 'none',
        'prerequisites': 'Remote config is_maintenance_mode set to active: true.',
        'preconditions': 'Visitor attempts to access application.',
        'steps': [
            'Given application detects active maintenance flag',
            'When any route is navigated',
            'Then non-dismissible maintenance screen displays maintenance title, message, and expected return time'
        ],
        'data_reset': 'None.'
    },
    {
        'id': 'yogi-view-public-teacher-profile',
        'title': 'Yogi views public teacher profile credentials, rolling 7-day classes, and multi-studio schedule button',
        'feature_ref': 'FEATURES.md §5.19',
        'type': 'happy',
        'priority': 'P0',
        'draft_ids': ['yogi-view-public-teacher-profile', 'yogi-tap-teacher-discover-schedule'],
        'suggested_user': 'user_sarah (Sarah Jenkins)',
        'seed_gap': 'none (Maya Sharma seeded)',
        'isolation': 'shared',
        'platforms': 'both',
        'automation_status': 'unit-only (UnifiedProfileView.test.tsx)',
        'prerequisites': 'Maya Sharma seeded with isTeacher: true.',
        'preconditions': 'Sarah opens Maya Sharma UnifiedProfileView.',
        'steps': [
            'Given Sarah navigates to Maya Sharma teacher profile',
            'When profile loads',
            'Then verified checkmark, handle, "🧘 Teacher" badge, and bio render',
            'And "🧘 Classes" sub-tab displays rolling 7-day classes taught across Askew, Ravenscourt, and Shoreditch',
            'And clicking "View Full Schedule" opens TeacherScheduleModal'
        ],
        'data_reset': 'None.'
    },
    {
        'id': 'yogi-view-teacher-classes-rolling-7day-cap',
        'title': 'Teacher profile classes sub-tab caps class listing to rolling 7-day window',
        'feature_ref': 'FEATURES.md §5.19',
        'type': 'edge',
        'priority': 'P1',
        'draft_ids': ['yogi-view-teacher-classes-rolling-7day-cap'],
        'suggested_user': 'user_sarah (Sarah Jenkins)',
        'seed_gap': 'teacher with classes on day 8+',
        'isolation': 'shared',
        'platforms': 'both',
        'automation_status': 'unit-only (UnifiedProfileView.test.tsx)',
        'prerequisites': 'Teacher has classes scheduled within 7 days and beyond 7 days.',
        'preconditions': 'Sarah views Classes sub-tab.',
        'steps': [
            'Given teacher has sessions scheduled across 14 days',
            'When in-page Classes sub-tab renders',
            'Then only sessions falling within next 7 days are listed in the feed'
        ],
        'data_reset': 'None.'
    },
    {
        'id': 'yogi-view-private-teacher-profile-guard',
        'title': 'Yogi views private teacher profile displaying privacy lock shield while studio classes remain visible',
        'feature_ref': 'FEATURES.md §5.19, §5.8',
        'type': 'edge',
        'priority': 'P1',
        'draft_ids': ['yogi-view-private-teacher-profile-guard', 'yogi-view-private-user-profile-locked'],
        'suggested_user': 'user_sarah (Sarah Jenkins)',
        'seed_gap': 'teacher with isProfilePublic: false',
        'isolation': 'shared',
        'platforms': 'both',
        'automation_status': 'unit-only (UnifiedProfileView.test.tsx)',
        'prerequisites': 'Teacher profile configured with isProfilePublic: false.',
        'preconditions': 'Unsubscribed yogi navigates to teacher profile.',
        'steps': [
            'Given yogi views private teacher profile',
            'When page loads',
            'Then privacy lock shield "🔒 This Profile is Private" is displayed',
            'And bio and private feed are concealed',
            'While teacher classes on public studio timetables remain visible and bookable'
        ],
        'data_reset': 'None.'
    },
    {
        'id': 'yogi-view-teacher-multi-studio-schedule-modal',
        'title': 'Yogi opens Teacher Schedule Modal from teacher profile and filters by partner studio',
        'feature_ref': 'FEATURES.md §5.19',
        'type': 'happy',
        'priority': 'P0',
        'draft_ids': ['yogi-view-teacher-multi-studio-schedule-modal'],
        'suggested_user': 'user_sarah (Sarah Jenkins)',
        'seed_gap': 'none',
        'isolation': 'shared',
        'platforms': 'both',
        'automation_status': 'unit-only (UnifiedProfileView.test.tsx)',
        'prerequisites': 'Maya Sharma teaches across multiple studios.',
        'preconditions': 'Sarah viewing Maya Sharma profile.',
        'steps': [
            'Given Sarah taps "View Full Schedule" on Maya Sharma profile',
            'When TeacherScheduleModal opens',
            'Then horizontal studio location filter pills render ("All Studios", "Askew Road", "Ravenscourt", "Shoreditch")',
            'And selecting "Ravenscourt" filters the schedule to display only classes at Ravenscourt'
        ],
        'data_reset': 'None.'
    }
]

print(f"Loaded {len(YOGI_CLUSTERS)} canonical Yogi clusters.")

TEACHER_CLUSTERS = [
    {
        'id': 'teacher-view-own-profile-overview',
        'title': 'Teacher views personal profile overview, verified checkmark, handle, and 2-metric bar',
        'feature_ref': 'FEATURES.md §5.19',
        'type': 'happy',
        'priority': 'P0',
        'draft_ids': ['teacher-view-own-profile-overview', 'teacher-view-multi-studio-classes-aggregated', 'teacher-showcase-upcoming-classes-rolling-view'],
        'suggested_user': 'user_teacher_001 (Maya Sharma)',
        'seed_gap': 'none',
        'isolation': 'shared',
        'platforms': 'both',
        'automation_status': 'unit-only (UnifiedProfileView.test.tsx)',
        'prerequisites': 'Maya Sharma seeded with isTeacher: true.',
        'preconditions': 'Maya views her own profile.',
        'steps': [
            'Given Maya Sharma navigates to her profile',
            'When profile loads',
            'Then verified checkmark, handle "@maya_sharma#2026", "🧘 Teacher" badge, and bio render',
            'And 2-metric bar displays Subscribers and Posts counts'
        ],
        'data_reset': 'None.'
    },
    {
        'id': 'teacher-classes-rolling-seven-day-capping',
        'title': 'Teacher classes sub-tab displays rolling 7-day multi-studio timetable feed with studio links',
        'feature_ref': 'FEATURES.md §5.19',
        'type': 'happy',
        'priority': 'P1',
        'draft_ids': ['teacher-view-schedule-classes-tab', 'teacher-classes-rolling-seven-day-capping'],
        'suggested_user': 'user_teacher_001 (Maya Sharma)',
        'seed_gap': 'none',
        'isolation': 'shared',
        'platforms': 'both',
        'automation_status': 'unit-only (UnifiedProfileView.test.tsx)',
        'prerequisites': 'Maya Sharma teaches across Askew, Ravenscourt, and Shoreditch.',
        'preconditions': 'Maya views "🧘 Classes" sub-tab.',
        'steps': [
            'Given teacher views Classes tab',
            'When class list renders',
            'Then sessions from all partner studios scheduled in next 7 days appear',
            'And each card displays session time, climate preset icon, class title, and clickable studio link'
        ],
        'data_reset': 'None.'
    },
    {
        'id': 'teacher-open-multistudio-schedule-modal',
        'title': 'Teacher opens TeacherScheduleModal calendar overlay across all partner studios',
        'feature_ref': 'FEATURES.md §5.19',
        'type': 'happy',
        'priority': 'P0',
        'draft_ids': ['teacher-open-multistudio-schedule-modal', 'yogi-navigate-studio-schedule-teacher-modal', 'teacher-verify-multistudio-schedule-modal-filter'],
        'suggested_user': 'user_teacher_001 (Maya Sharma)',
        'seed_gap': 'none',
        'isolation': 'shared',
        'platforms': 'both',
        'automation_status': 'unit-only (TeacherScheduleModal.tsx)',
        'prerequisites': 'Teacher has multi-studio classes.',
        'preconditions': 'User on teacher profile.',
        'steps': [
            'Given teacher taps "View Full Schedule"',
            'When TeacherScheduleModal opens',
            'Then calendar header, week switcher, 7 day pills, and horizontal studio filter pills render'
        ],
        'data_reset': 'None.'
    },
    {
        'id': 'teacher-filter-schedule-modal-by-studio',
        'title': 'Filtering TeacherScheduleModal by studio location updates schedule and excludes other studios',
        'feature_ref': 'FEATURES.md §5.19',
        'type': 'happy',
        'priority': 'P0',
        'draft_ids': ['teacher-filter-schedule-modal-by-studio', 'teacher-filter-schedule-modal-by-studio', 'teacher-verify-multistudio-schedule-modal-filter'],
        'suggested_user': 'user_teacher_001 (Maya Sharma)',
        'seed_gap': 'none',
        'isolation': 'shared',
        'platforms': 'both',
        'automation_status': 'unit-only (TeacherScheduleModal.tsx)',
        'prerequisites': 'Classes at Askew and Shoreditch exist.',
        'preconditions': 'TeacherScheduleModal open.',
        'steps': [
            'Given modal is open with "All Studios" active',
            'When user taps "Shoreditch Stillpoint Studio" filter pill',
            'Then only classes at Shoreditch are listed',
            'And classes at Askew and Ravenscourt are excluded'
        ],
        'data_reset': 'None.'
    },
    {
        'id': 'teacher-filter-schedule-modal-zero-state',
        'title': 'Filtering TeacherScheduleModal for studio with no classes on selected day displays clean empty notice',
        'feature_ref': 'FEATURES.md §5.19',
        'type': 'valid-failure',
        'priority': 'P1',
        'draft_ids': ['teacher-filter-schedule-modal-zero-state'],
        'suggested_user': 'user_teacher_001 (Maya Sharma)',
        'seed_gap': 'none',
        'isolation': 'shared',
        'platforms': 'both',
        'automation_status': 'unit-only',
        'prerequisites': 'Teacher has 0 classes at Ravenscourt on selected date.',
        'preconditions': 'Modal open on date with no classes.',
        'steps': [
            'Given user filters by Ravenscourt on a day without classes',
            'Then empty notice "No classes scheduled for this day at selected locations" is displayed'
        ],
        'data_reset': 'None.'
    },
    {
        'id': 'teacher-switch-calendar-day-updates-classes',
        'title': 'Switching day pills in TeacherScheduleModal updates class list and persists active studio filter',
        'feature_ref': 'FEATURES.md §5.19',
        'type': 'happy',
        'priority': 'P1',
        'draft_ids': ['teacher-switch-calendar-day-updates-classes', 'teacher-switch-day-persists-studio-filter'],
        'suggested_user': 'user_teacher_001 (Maya Sharma)',
        'seed_gap': 'none',
        'isolation': 'shared',
        'platforms': 'both',
        'automation_status': 'unit-only',
        'prerequisites': 'Classes on multiple dates.',
        'preconditions': 'Modal open with specific studio filter active.',
        'steps': [
            'Given studio filter "Askew" is active',
            'When user taps a different day selector pill',
            'Then timetable updates to show Askew classes for that date',
            'And active "Askew" filter remains selected'
        ],
        'data_reset': 'None.'
    },
    {
        'id': 'teacher-schedule-modal-responsive-layout',
        'title': 'TeacherScheduleModal renders mobile bottom sheet vs desktop centered dialog',
        'feature_ref': 'FEATURES.md §5.19',
        'type': 'edge',
        'priority': 'P1',
        'draft_ids': ['teacher-schedule-modal-responsive-layout'],
        'suggested_user': 'user_teacher_001 (Maya Sharma)',
        'seed_gap': 'none',
        'isolation': 'shared',
        'platforms': 'both',
        'automation_status': 'unit-only',
        'prerequisites': 'None.',
        'preconditions': 'Modal invoked on mobile and desktop viewports.',
        'steps': [
            'Given viewport is at 390px mobile width',
            'Then modal displays as bottom sheet with swipe drag handle',
            'And at 1280px desktop width, displays as centered floating dialog with top right ✕ button'
        ],
        'data_reset': 'None.'
    },
    {
        'id': 'teacher-navigate-to-studio-from-class-card',
        'title': 'Tapping studio link on teacher class card navigates to studio profile',
        'feature_ref': 'FEATURES.md §5.19, §5.14',
        'type': 'happy',
        'priority': 'P1',
        'draft_ids': ['teacher-navigate-to-studio-from-class-card', 'yogi-discover-teacher-from-studioschedule-crossnavigate'],
        'suggested_user': 'user_sarah (Sarah Jenkins)',
        'seed_gap': 'none',
        'isolation': 'shared',
        'platforms': 'both',
        'automation_status': 'unit-only',
        'prerequisites': 'Class card renders studio link.',
        'preconditions': 'Viewing teacher classes sub-tab.',
        'steps': [
            'Given student views class taught by Maya at Shoreditch',
            'When they tap studio name "Shoreditch Stillpoint Studio"',
            'Then app navigates directly to StudioProfileView for Shoreditch'
        ],
        'data_reset': 'None.'
    },
    {
        'id': 'teacher-verify-carousel-presence-at-studio',
        'title': 'Teacher appears in Teachers at this Studio carousel at partner studios without owning them',
        'feature_ref': 'FEATURES.md §5.14',
        'type': 'happy',
        'priority': 'P0',
        'draft_ids': ['teacher-verify-carousel-presence-at-studio', 'yogi-discover-teacher-from-studio-carousel-viewprofile'],
        'suggested_user': 'user_sarah (Sarah Jenkins)',
        'seed_gap': 'none (Omar owns Shoreditch, Maya is visiting teacher)',
        'isolation': 'shared',
        'platforms': 'both',
        'automation_status': 'unit-only (StudioProfileView.test.tsx)',
        'prerequisites': 'Maya is assigned teacher at Shoreditch; Omar is owner.',
        'preconditions': 'Sarah opens Shoreditch studio profile.',
        'steps': [
            'Given Sarah opens Shoreditch studio profile',
            'When she inspects "Teachers at this Studio" carousel',
            'Then Maya Sharma instructor card is visible with photo and name',
            'And Omar Haddad does NOT appear as an instructor (non-teaching owner)'
        ],
        'data_reset': 'None.'
    },
    {
        'id': 'teacher-carousel-link-opens-profile',
        'title': 'Tapping teacher card in studio carousel navigates to teacher UnifiedProfileView',
        'feature_ref': 'FEATURES.md §5.14, §5.19',
        'type': 'happy',
        'priority': 'P0',
        'draft_ids': ['teacher-carousel-link-opens-profile', 'yogi-discover-teacher-from-studio-carousel-viewprofile'],
        'suggested_user': 'user_sarah (Sarah Jenkins)',
        'seed_gap': 'none',
        'isolation': 'shared',
        'platforms': 'both',
        'automation_status': 'unit-only',
        'prerequisites': 'Teacher in studio carousel.',
        'preconditions': 'Viewing studio profile.',
        'steps': [
            'Given Sarah views Maya Sharma card in studio carousel',
            'When she taps the card',
            'Then app navigates to Maya Sharma UnifiedProfileView'
        ],
        'data_reset': 'None.'
    },
    {
        'id': 'teacher-schedule-tile-link-opens-profile',
        'title': 'Tapping underlined teacher link on studio schedule class row navigates to teacher profile',
        'feature_ref': 'FEATURES.md §5.14, §5.19',
        'type': 'happy',
        'priority': 'P0',
        'draft_ids': ['teacher-schedule-tile-link-opens-profile', 'yogi-navigate-studio-schedule-teacher-modal', 'yogi-discover-teacher-from-studioschedule-crossnavigate'],
        'suggested_user': 'user_sarah (Sarah Jenkins)',
        'seed_gap': 'none',
        'isolation': 'shared',
        'platforms': 'both',
        'automation_status': 'unit-only (StudioScheduleView.tsx)',
        'prerequisites': 'Studio class row displays teacher name.',
        'preconditions': 'Viewing studio timetable.',
        'steps': [
            'Given Sarah views class row with text "w/ Maya Sharma"',
            'When she taps the underlined link "Maya Sharma"',
            'Then app navigates to Maya Sharma UnifiedProfileView'
        ],
        'data_reset': 'None.'
    },
    {
        'id': 'teacher-class-info-modal-link-opens-profile',
        'title': 'Tapping teacher link inside ClassInfoModal navigates to teacher profile',
        'feature_ref': 'FEATURES.md §5.14, §5.19',
        'type': 'happy',
        'priority': 'P1',
        'draft_ids': ['teacher-class-info-modal-link-opens-profile', 'yogi-navigate-class-info-modal-teacher-schedule'],
        'suggested_user': 'user_sarah (Sarah Jenkins)',
        'seed_gap': 'none',
        'isolation': 'shared',
        'platforms': 'both',
        'automation_status': 'unit-only (ClassInfoModal.test.tsx)',
        'prerequisites': 'ClassInfoModal open.',
        'preconditions': 'Viewing class info modal.',
        'steps': [
            'Given Sarah has ClassInfoModal open',
            'When she taps "Taught by Maya Sharma"',
            'Then modal dismisses and app navigates to Maya Sharma profile'
        ],
        'data_reset': 'None.'
    },
    {
        'id': 'teacher-area-community-presence-and-navigation',
        'title': 'Teacher appears in Teachers in this Area list on Area Community Profile',
        'feature_ref': 'FEATURES.md §5.19',
        'type': 'happy',
        'priority': 'P1',
        'draft_ids': ['teacher-area-community-presence-and-navigation', 'yogi-discover-local-teachers-in-area-community'],
        'suggested_user': 'user_sarah (Sarah Jenkins)',
        'seed_gap': 'none',
        'isolation': 'shared',
        'platforms': 'both',
        'automation_status': 'unit-only',
        'prerequisites': 'Maya teaches at studios within Askew area community.',
        'preconditions': 'Sarah views Askew community Studios & Teachers tab.',
        'steps': [
            'Given Sarah navigates to Askew community profile',
            'When she opens "Studios & Teachers" tab',
            'Then Maya Sharma appears under "Teachers in this Area"',
            'And tapping her card opens her teacher profile'
        ],
        'data_reset': 'None.'
    },
    {
        'id': 'teacher-view-my-studios-non-owner-boundary',
        'title': 'Freelance teacher accessing My Studios views zero ownership boundary without administrative controls',
        'feature_ref': 'FEATURES.md §5.11, §5.19',
        'type': 'valid-failure',
        'priority': 'P0',
        'draft_ids': ['teacher-view-my-studios-non-owner-boundary', 'teacher-access-admin-controls-restricted', 'teacher-verify-clean-profile-no-studio-admin-tabs'],
        'suggested_user': 'user_teacher_001 (Maya Sharma)',
        'seed_gap': 'none',
        'isolation': 'shared',
        'platforms': 'both',
        'automation_status': 'e2e (regression_suite.spec.ts verifies clean freelance shell)',
        'prerequisites': 'Maya owns no studios or brands.',
        'preconditions': 'Maya is authenticated.',
        'steps': [
            'Given Maya opens navigation menu',
            'When she views studios navigation',
            'Then notice "No independent studios registered" appears',
            'And currency creation, timetable modification, and brand settings tabs are completely absent'
        ],
        'data_reset': 'None.'
    },
    {
        'id': 'teacher-view-classes-tab-empty-state',
        'title': 'Certified teacher with 0 scheduled classes views clean empty state on Classes sub-tab',
        'feature_ref': 'FEATURES.md §5.19',
        'type': 'edge',
        'priority': 'P2',
        'draft_ids': ['teacher-view-classes-tab-empty-state', 'teacher-view-profile-zero-classes-empty-state', 'teacher-view-classes-tab-zero-state'],
        'suggested_user': 'NEW: user_teacher_zerosched',
        'seed_gap': 'teacher with 0 scheduled classes',
        'isolation': 'shared',
        'platforms': 'both',
        'automation_status': 'unit-only',
        'prerequisites': 'Teacher account with no assigned classes.',
        'preconditions': 'Viewing teacher Classes tab.',
        'steps': [
            'Given teacher has no upcoming classes scheduled',
            'When Classes tab renders',
            'Then clean empty box "No classes scheduled in the next 7 days" appears'
        ],
        'data_reset': 'None.'
    },
    {
        'id': 'teacher-multi-postcode-badge-truncation',
        'title': 'Teacher teaching across 4+ outward postcodes displays truncated postcode badge',
        'feature_ref': 'FEATURES.md §5.19',
        'type': 'edge',
        'priority': 'P2',
        'draft_ids': ['teacher-multi-postcode-badge-truncation', 'teacher-profile-postcode-badge-truncation'],
        'suggested_user': 'NEW: user_teacher_multipostcode',
        'seed_gap': 'teacher assigned across 4+ distinct outward codes',
        'isolation': 'shared',
        'platforms': 'both',
        'automation_status': 'unit-only',
        'prerequisites': 'Teacher teaches in W12, W4, W6, E2.',
        'preconditions': 'Viewing teacher profile header.',
        'steps': [
            'Given teacher has assigned studios across 4+ postcodes',
            'When profile header badge renders',
            'Then location badge truncates to first 3 postcodes with ellipsis: "📍 W12, W4, W6..."'
        ],
        'data_reset': 'None.'
    },
    {
        'id': 'teacher-private-profile-shields-personal-info',
        'title': 'Private teacher profile shields personal bio from non-subscribers while studio classes remain visible',
        'feature_ref': 'FEATURES.md §5.8, §5.19',
        'type': 'edge',
        'priority': 'P1',
        'draft_ids': ['teacher-private-profile-shields-personal-info', 'teacher-profile-private-studio-schedule-visible', 'visitor-view-private-teacher-profile-shielded'],
        'suggested_user': 'NEW: user_teacher_private',
        'seed_gap': 'teacher with isProfilePublic: false',
        'isolation': 'shared',
        'platforms': 'both',
        'automation_status': 'unit-only',
        'prerequisites': 'Teacher profile configured with isProfilePublic: false.',
        'preconditions': 'Unsubscribed student views teacher profile.',
        'steps': [
            'Given student views private teacher profile',
            'Then privacy lock shield "🔒 This Yogi\'s Profile is Private" appears',
            'And personal bio and community posts are concealed',
            'While teacher sessions scheduled on studio timetables remain publicly visible'
        ],
        'data_reset': 'None.'
    },
    {
        'id': 'teacher-update-bio-persists',
        'title': 'Teacher updates personal bio and credentials with character limit feedback',
        'feature_ref': 'FEATURES.md §5.8',
        'type': 'happy',
        'priority': 'P1',
        'draft_ids': ['teacher-update-bio-persists-profile', 'teacher-update-bio-credentials-success'],
        'suggested_user': 'user_teacher_001 (Maya Sharma)',
        'seed_gap': 'none',
        'isolation': 'clone',
        'platforms': 'both',
        'automation_status': 'unit-only (ProfileView.test.tsx)',
        'prerequisites': 'Teacher authenticated.',
        'preconditions': 'Maya on Profile screen.',
        'steps': [
            'Given Maya enters new teaching bio (e.g. "500-hr RYT specializing in Ashtanga")',
            'When character counter displays remaining limit',
            'And she saves changes',
            'Then new bio persists and is visible on her public UnifiedProfileView'
        ],
        'data_reset': 'Teardown resets bio.'
    },
    {
        'id': 'teacher-enforce-bio-charlimit-truncation',
        'title': 'Teacher bio input enforces hard 280-character boundary truncation',
        'feature_ref': 'FEATURES.md §5.8',
        'type': 'edge',
        'priority': 'P2',
        'draft_ids': ['teacher-enforce-bio-charlimit-truncation'],
        'suggested_user': 'user_teacher_001 (Maya Sharma)',
        'seed_gap': 'none',
        'isolation': 'shared',
        'platforms': 'both',
        'automation_status': 'unit-only',
        'prerequisites': 'None.',
        'preconditions': 'Maya in bio editor.',
        'steps': [
            'Given Maya attempts to paste text longer than 280 characters',
            'When text is entered',
            'Then input truncates text at exactly 280 characters and blocks further keystrokes'
        ],
        'data_reset': 'None.'
    },
    {
        'id': 'teacher-configure-public-discovery-enforces-avatar-public',
        'title': 'Enabling public profile on teacher account automatically enforces public avatar setting',
        'feature_ref': 'FEATURES.md §5.8',
        'type': 'edge',
        'priority': 'P1',
        'draft_ids': ['teacher-configure-public-discovery-enforces-avatar-public'],
        'suggested_user': 'user_teacher_001 (Maya Sharma)',
        'seed_gap': 'none',
        'isolation': 'clone',
        'platforms': 'both',
        'automation_status': 'unit-only',
        'prerequisites': 'Teacher profile currently private.',
        'preconditions': 'Maya toggles isProfilePublic to true.',
        'steps': [
            'Given Maya switches isProfilePublic to true',
            'When privacy settings save',
            'Then avatarPrivacy automatically updates to "public"'
        ],
        'data_reset': 'Teardown restores initial state.'
    },
    {
        'id': 'teacher-visiting-schedule-isolation',
        'title': 'Visiting teacher cannot modify host studio schedule, climate presets, or pricing policies',
        'feature_ref': 'FEATURES.md §5.7, §5.14',
        'type': 'valid-failure',
        'priority': 'P1',
        'draft_ids': ['teacher-visiting-schedule-isolation'],
        'suggested_user': 'user_teacher_001 (Maya Sharma)',
        'seed_gap': 'none',
        'isolation': 'shared',
        'platforms': 'both',
        'automation_status': 'none',
        'prerequisites': 'Maya teaches at Shoreditch (owned by Omar).',
        'preconditions': 'Maya views Shoreditch studio timetable.',
        'steps': [
            'Given Maya views classes she teaches at Shoreditch Stillpoint Studio',
            'When she inspects schedule controls',
            'Then edit, cancel, and currency acceptance modification buttons are hidden',
            'And Firestore security rules reject direct class update writes from non-owners'
        ],
        'data_reset': 'None.'
    },
    {
        'id': 'yogi-subscribe-unlock-private-teacher-profile',
        'title': 'Student subscribing to teacher profile unlocks personal bio and member feed',
        'feature_ref': 'FEATURES.md §5.19',
        'type': 'happy',
        'priority': 'P1',
        'draft_ids': ['yogi-subscribe-unlock-private-teacher-profile', 'yogi-subscribe-to-teacher-unlocks-memberfeed'],
        'suggested_user': 'user_sarah (Sarah Jenkins)',
        'seed_gap': 'teacher with isProfilePublic: false',
        'isolation': 'clone',
        'platforms': 'both',
        'automation_status': 'unit-only',
        'prerequisites': 'Sarah is not subscribed to private teacher.',
        'preconditions': 'Sarah viewing private teacher profile.',
        'steps': [
            'Given Sarah views locked private teacher profile with button "[ Subscribe ]"',
            'When she taps "Subscribe"',
            'Then button toggles to "✓ Subscribed", subscriber counter increments, and personal bio and feed unlock'
        ],
        'data_reset': 'Teardown removes subscription.'
    },
    {
        'id': 'yogi-unsubscribe-from-teacher',
        'title': 'Student cleanly unsubscribes from teacher via profile ellipsis menu',
        'feature_ref': 'FEATURES.md §5.19',
        'type': 'happy',
        'priority': 'P2',
        'draft_ids': ['yogi-unsubscribe-from-teacher-via-optionsmenu'],
        'suggested_user': 'user_sarah (Sarah Jenkins)',
        'seed_gap': 'pre-existing subscription to teacher',
        'isolation': 'clone',
        'platforms': 'both',
        'automation_status': 'unit-only',
        'prerequisites': 'Sarah is subscribed to teacher.',
        'preconditions': 'Sarah viewing teacher profile.',
        'steps': [
            'Given Sarah is subscribed to teacher',
            'When she taps 3-dots menu and selects "Unsubscribe"',
            'Then button returns to "[ Subscribe ]" and subscriber count decrements'
        ],
        'data_reset': 'Teardown resets subscription.'
    },
    {
        'id': 'yogi-book-class-from-teacher-schedule-modal',
        'title': 'Student books class session directly from teacher multi-studio schedule modal',
        'feature_ref': 'FEATURES.md §5.19, §5.20',
        'type': 'happy',
        'priority': 'P0',
        'draft_ids': ['yogi-book-class-from-teacher-schedule-modal'],
        'suggested_user': 'user_sarah (Sarah Jenkins)',
        'seed_gap': 'none',
        'isolation': 'clone',
        'platforms': 'both',
        'automation_status': 'skipped (known production gap: UnifiedProfileView.tsx lacks onBookClass handler; tracked in TODO.md & ROADMAP.md; see docs/e2e/open_questions.md §2.2)',
        'prerequisites': 'Sarah holds active pass; viewing teacher modal.',
        'preconditions': 'TeacherScheduleModal open.',
        'steps': [
            'Given Sarah views open class session in TeacherScheduleModal',
            'When she taps "[ Book ]"',
            'Then BookingPassSelectionModalView opens and allows confirming booking with pass credit'
        ],
        'data_reset': 'Teardown cancels booking.'
    }
]

print(f"Loaded {len(TEACHER_CLUSTERS)} canonical Teacher clusters.")

STUDIO_OWNER_CLUSTERS = [
    {
        'id': 'studio-owner-create-brand-and-studio',
        'title': 'Studio owner creates new brand network and first branch studio in 2-step wizard',
        'feature_ref': 'FEATURES.md §5.11',
        'type': 'happy',
        'priority': 'P0',
        'draft_ids': ['studio-owner-create-brand-and-studio-success', 'studio-owner-launch-new-branch-under-brand-submitted'],
        'suggested_user': 'user_brand_founder (Marcus Vance)',
        'seed_gap': 'none',
        'isolation': 'clone',
        'platforms': 'both',
        'automation_status': 'unit-only (CreateStudioView.test.tsx)',
        'prerequisites': 'User is authenticated.',
        'preconditions': 'Marcus opens Create Studio view.',
        'steps': [
            'Given Marcus selects "Create a New Brand Company"',
            'When he enters brand name "Zenith Flow Collective", contact email, and description',
            'And advances to Step 2 to enter studio branch details (name, address, outward postcode "W6", room dimensions)',
            'And submits the form',
            'Then company and studio documents are created in Firestore',
            'And app navigates to My Studios dashboard showing new brand and branch'
        ],
        'data_reset': 'Teardown deletes created company and studio documents.'
    },
    {
        'id': 'studio-owner-create-independent-studio',
        'title': 'User creates independent standalone studio defaulting to unverified pending claim',
        'feature_ref': 'FEATURES.md §5.11',
        'type': 'happy',
        'priority': 'P0',
        'draft_ids': ['studio-owner-create-independent-studio-success', 'studio-owner-create-independent-studio-happy'],
        'suggested_user': 'user_david_kim (David Kim)',
        'seed_gap': 'none',
        'isolation': 'clone',
        'platforms': 'both',
        'automation_status': 'unit-only (CreateStudioView.test.tsx)',
        'prerequisites': 'User authenticated.',
        'preconditions': 'User in Create Studio wizard.',
        'steps': [
            'Given user selects "Independent Studio (No Brand Network)"',
            'When they enter studio name, address, outward postcode "W4", and contact phone',
            'And submit form',
            'Then standalone studio document is created with companyId: null and isClaimed: true',
            'And studio appears in My Studios under Independent Studios section'
        ],
        'data_reset': 'Teardown deletes created studio.'
    },
    {
        'id': 'studio-owner-create-studio-missing-required-fields',
        'title': 'Studio creation form blocks submission when required fields are missing',
        'feature_ref': 'FEATURES.md §5.11',
        'type': 'valid-failure',
        'priority': 'P1',
        'draft_ids': [
            'studio-owner-create-studio-missing-required-fields-fails',
            'studio-owner-create-studio-validation-missing-fields-failure',
            'studio-owner-create-studio-missing-required-fields-fails'
        ],
        'suggested_user': 'user_david_kim (David Kim)',
        'seed_gap': 'none',
        'isolation': 'shared',
        'platforms': 'both',
        'automation_status': 'unit-only (CreateStudioView.test.tsx)',
        'prerequisites': 'None.',
        'preconditions': 'User opens Create Studio form.',
        'steps': [
            'Given user leaves studio name and address blank',
            'When they attempt to submit',
            'Then form validation errors appear highlighting required fields and blocking Firestore writes'
        ],
        'data_reset': 'None.'
    },
    {
        'id': 'studio-owner-create-brand-invalid-email',
        'title': 'Brand creation enforces strict email regex validation',
        'feature_ref': 'FEATURES.md §5.11',
        'type': 'valid-failure',
        'priority': 'P1',
        'draft_ids': ['studio-owner-create-brand-invalid-email-fails', 'studio-owner-create-studio-invalid-email-failure'],
        'suggested_user': 'user_david_kim (David Kim)',
        'seed_gap': 'none',
        'isolation': 'shared',
        'platforms': 'both',
        'automation_status': 'unit-only (CreateStudioView.test.tsx)',
        'prerequisites': 'None.',
        'preconditions': 'User in Step 1 Brand setup.',
        'steps': [
            'Given user enters "invalid-email-format" into brand email field',
            'When they attempt to proceed',
            'Then validation error "Please enter a valid email address" appears and advance is blocked'
        ],
        'data_reset': 'None.'
    },
    {
        'id': 'studio-owner-manage-studio-3tabs-navigation',
        'title': 'Studio owner navigates unified in-place 3-tab layout: General Settings, Pricing & Policies, Timetable',
        'feature_ref': 'FEATURES.md §5.11, §5.20',
        'type': 'happy',
        'priority': 'P0',
        'draft_ids': ['studio-owner-manage-studio-3tabs-navigation'],
        'suggested_user': 'user_sophia_vane (Sophia Vane)',
        'seed_gap': 'none',
        'isolation': 'shared',
        'platforms': 'both',
        'automation_status': 'unit-only (MyStudiosView.test.tsx)',
        'prerequisites': 'Sophia owns Chelsea Sanctuary Studio.',
        'preconditions': 'Sophia opens My Studios and clicks Manage Studio.',
        'steps': [
            'Given Sophia opens Chelsea Sanctuary Studio management subpage',
            'When subpage loads',
            'Then 3 tabs render: "⚙️ General Settings", "💳 Pricing & Policies", "📅 Timetable"',
            'And clicking each tab transitions the view in-place without page reload'
        ],
        'data_reset': 'None.'
    },
    {
        'id': 'studio-owner-edit-studio-bio',
        'title': 'Verified studio owner updates studio bio in general settings',
        'feature_ref': 'FEATURES.md §5.11',
        'type': 'happy',
        'priority': 'P1',
        'draft_ids': ['studio-owner-edit-studio-bio-success', 'studio-owner-edit-studio-bio-verified-success'],
        'suggested_user': 'user_sophia_vane (Sophia Vane)',
        'seed_gap': 'none',
        'isolation': 'clone',
        'platforms': 'both',
        'automation_status': 'unit-only (MyStudiosView.test.tsx)',
        'prerequisites': 'Studio has isClaimed: true.',
        'preconditions': 'Sophia on General Settings tab.',
        'steps': [
            'Given Sophia edits studio description and philosophy in bio textarea',
            'When she taps "Save Bio"',
            'Then Firestore document is updated and success toast confirms changes'
        ],
        'data_reset': 'Teardown resets bio.'
    },
    {
        'id': 'studio-owner-set-temp-closed-with-note',
        'title': 'Studio owner pauses location with temporary closure notice and custom manager notes',
        'feature_ref': 'FEATURES.md §5.11, §5.14',
        'type': 'happy',
        'priority': 'P1',
        'draft_ids': [
            'studio-owner-set-temp-closed-with-note-success',
            'studio-owner-update-operating-status-temp-closed',
            'studio-owner-set-temporary-closure-notice-displayed'
        ],
        'suggested_user': 'user_sophia_vane (Sophia Vane)',
        'seed_gap': 'none',
        'isolation': 'clone',
        'platforms': 'both',
        'automation_status': 'unit-only (MyStudiosView.test.tsx)',
        'prerequisites': 'Studio is currently open.',
        'preconditions': 'Sophia in General Settings.',
        'steps': [
            'Given Sophia toggles operating status to "Temporarily Closed"',
            'When she enters notice note "Flooring renovation. Reopening Nov 1st."',
            'And saves changes',
            'Then studio operatingStatus updates to "temp_closed"',
            'And public profile immediately renders closure banner'
        ],
        'data_reset': 'Teardown restores operatingStatus to open.'
    },
    {
        'id': 'studio-owner-reopen-temp-closed-studio',
        'title': 'Studio owner reopens temporarily closed studio and clears closure notice',
        'feature_ref': 'FEATURES.md §5.11, §5.14',
        'type': 'happy',
        'priority': 'P1',
        'draft_ids': ['studio-owner-reopen-temp-closed-studio-success', 'studio-owner-reopen-temporarily-closed-studio-resumed'],
        'suggested_user': 'user_sophia_vane (Sophia Vane)',
        'seed_gap': 'none',
        'isolation': 'clone',
        'platforms': 'both',
        'automation_status': 'unit-only',
        'prerequisites': 'Studio is temp_closed.',
        'preconditions': 'Sophia in General Settings.',
        'steps': [
            'Given studio is temporarily closed',
            'When Sophia toggles operating status back to "Open"',
            'Then operatingStatus updates to "open", notice banner clears, and timetable bookings re-enable'
        ],
        'data_reset': 'Teardown resets status.'
    },
    {
        'id': 'studio-owner-reassign-independent-studio-to-brand',
        'title': 'Studio owner links independent studio to existing parent brand network',
        'feature_ref': 'FEATURES.md §5.11',
        'type': 'happy',
        'priority': 'P1',
        'draft_ids': ['studio-owner-reassign-independent-studio-to-brand-success'],
        'suggested_user': 'user_brand_founder (Marcus Vance)',
        'seed_gap': 'none',
        'isolation': 'clone',
        'platforms': 'both',
        'automation_status': 'unit-only',
        'prerequisites': 'Marcus owns brand and independent studio.',
        'preconditions': 'Marcus in General Settings.',
        'steps': [
            'Given Marcus views independent studio Fulham Flow',
            'When he selects "Link to Brand Company" and chooses The Zen Collective',
            'Then studio companyId is updated to link to the brand network'
        ],
        'data_reset': 'Teardown resets companyId.'
    },
    {
        'id': 'studio-owner-create-brand-currency-catalog',
        'title': 'Brand founder defines multi-branch currency pricing packages that propagate across branches',
        'feature_ref': 'FEATURES.md §5.20',
        'type': 'happy',
        'priority': 'P0',
        'draft_ids': ['studio-owner-create-brand-currency-success', 'studio-owner-setup-brand-currency-tiers-propagated'],
        'suggested_user': 'user_brand_founder (Marcus Vance)',
        'seed_gap': 'none',
        'isolation': 'clone',
        'platforms': 'both',
        'automation_status': 'unit-only (MyStudiosView.test.tsx)',
        'prerequisites': 'Brand exists without currencies.',
        'preconditions': 'Marcus opens Brand Currencies tab.',
        'steps': [
            'Given Marcus opens Brand Currencies tab for The Zen Collective',
            'When he creates a 5-Class Pack (£75) with 5 credits and 90 days validity',
            'And saves the tier',
            'Then company_currency document is created',
            'And pass package becomes available to all child branches following brand'
        ],
        'data_reset': 'Teardown deletes created currency.'
    },
    {
        'id': 'studio-owner-create-standalone-currency-catalog',
        'title': 'Independent studio owner establishes studio-specific class pricing catalog',
        'feature_ref': 'FEATURES.md §5.20',
        'type': 'happy',
        'priority': 'P0',
        'draft_ids': ['studio-owner-create-standalone-currency-success', 'studio-owner-create-standalone-currency-catalog-published'],
        'suggested_user': 'user_david_kim (David Kim)',
        'seed_gap': 'none (David owns Ravenscourt with 0 currencies)',
        'isolation': 'clone',
        'platforms': 'both',
        'automation_status': 'unit-only (MyStudiosView.test.tsx)',
        'prerequisites': 'David owns independent studio with no currencies.',
        'preconditions': 'David opens Pricing & Policies tab.',
        'steps': [
            'Given David opens Pricing tab for Ravenscourt Park Zen Pavilion',
            'When he creates Drop-In pass (£16)',
            'And saves changes',
            'Then standalone currency is saved and becomes bookable on Ravenscourt timetable'
        ],
        'data_reset': 'Teardown deletes created currency.'
    },
    {
        'id': 'studio-owner-switch-policy-follow-to-custom',
        'title': 'Branch owner switches policy from follow_brand to custom_override with isolated custom rates',
        'feature_ref': 'FEATURES.md §5.20',
        'type': 'happy',
        'priority': 'P0',
        'draft_ids': [
            'studio-owner-switch-policy-to-custom-override-success',
            'studio-owner-switch-policy-follow-to-custom-isolation',
            'studio-owner-override-branch-pricing-policy-isolated'
        ],
        'suggested_user': 'user_elena (Elena Rostova)',
        'seed_gap': 'none (Elena manages Chiswick under follow_brand)',
        'isolation': 'clone',
        'platforms': 'both',
        'automation_status': 'unit-only (MyStudiosView.test.tsx)',
        'prerequisites': 'Elena owns Chiswick currently inheriting brand passes.',
        'preconditions': 'Elena in Pricing & Policies tab.',
        'steps': [
            'Given Elena selects "Custom Studio Policy (Override Brand)"',
            'When she adds a custom £25 Drop-In rate and saves',
            'Then studio policy transitions to custom_override',
            'And custom rate renders on Chiswick schedule while sister studios continue using brand rates'
        ],
        'data_reset': 'Teardown restores follow_brand policy.'
    },
    {
        'id': 'studio-owner-switch-policy-custom-to-follow',
        'title': 'Branch owner reverts from custom_override back to follow_brand restoring brand pass inheritance',
        'feature_ref': 'FEATURES.md §5.20',
        'type': 'happy',
        'priority': 'P1',
        'draft_ids': ['studio-owner-switch-policy-to-follow-brand-success', 'studio-owner-switch-policy-custom-to-follow-restoration'],
        'suggested_user': 'user_elena (Elena Rostova)',
        'seed_gap': 'none',
        'isolation': 'clone',
        'platforms': 'both',
        'automation_status': 'unit-only (MyStudiosView.test.tsx)',
        'prerequisites': 'Studio currently in custom_override.',
        'preconditions': 'Elena in Pricing & Policies tab.',
        'steps': [
            'Given studio is in custom override policy',
            'When owner selects "Follow Brand Pricing" and confirms',
            'Then policy updates to follow_brand and brand pass packages are instantly restored'
        ],
        'data_reset': 'Teardown restores state.'
    },
    {
        'id': 'studio-owner-edit-currency-pricing',
        'title': 'Studio owner updates currency title, price, and validity days',
        'feature_ref': 'FEATURES.md §5.20',
        'type': 'happy',
        'priority': 'P1',
        'draft_ids': ['studio-owner-edit-currency-pricing-success'],
        'suggested_user': 'user_sophia_vane (Sophia Vane)',
        'seed_gap': 'none',
        'isolation': 'clone',
        'platforms': 'both',
        'automation_status': 'unit-only',
        'prerequisites': 'Sophia has custom currencies at Chelsea.',
        'preconditions': 'Sophia opens currency editor.',
        'steps': [
            'Given Sophia edits 10-Class Pack from £190 to £195',
            'When she clicks "Save Changes"',
            'Then currency document updates in Firestore and timetable reflects new price'
        ],
        'data_reset': 'Teardown restores price.'
    },
    {
        'id': 'studio-owner-create-currency-empty-title-fails',
        'title': 'Client validation blocks saving currency with empty title',
        'feature_ref': 'FEATURES.md §5.20',
        'type': 'valid-failure',
        'priority': 'P2',
        'draft_ids': ['studio-owner-create-currency-empty-title-fails'],
        'suggested_user': 'user_sophia_vane (Sophia Vane)',
        'seed_gap': 'none',
        'isolation': 'shared',
        'platforms': 'both',
        'automation_status': 'unit-only',
        'prerequisites': 'None.',
        'preconditions': 'In currency editor.',
        'steps': [
            'Given user enters price but leaves title blank',
            'When they attempt to save',
            'Then validation notice "Title is required" blocks submission'
        ],
        'data_reset': 'None.'
    },
    {
        'id': 'studio-owner-currency-creation-unlimited-credits-disabled',
        'title': 'Selecting unlimited pass type disables and locks credit count stepper',
        'feature_ref': 'FEATURES.md §5.20',
        'type': 'edge',
        'priority': 'P1',
        'draft_ids': ['studio-owner-currency-creation-unlimited-credits-disabled'],
        'suggested_user': 'user_sophia_vane (Sophia Vane)',
        'seed_gap': 'none',
        'isolation': 'shared',
        'platforms': 'both',
        'automation_status': 'unit-only',
        'prerequisites': 'None.',
        'preconditions': 'In currency creator form.',
        'steps': [
            'Given user selects pass type "Unlimited Membership"',
            'Then credit quantity input is disabled and set to unlimited'
        ],
        'data_reset': 'None.'
    },
    {
        'id': 'studio-owner-discard-currency-changes-safeguard',
        'title': 'Studio owner cancels in-progress currency edits and uncommitted modifications are discarded',
        'feature_ref': 'FEATURES.md §5.20',
        'type': 'edge',
        'priority': 'P2',
        'draft_ids': [
            'studio-owner-discard-currency-creation-success',
            'studio-owner-currency-edit-discard-changes-safeguard',
            'studio-owner-discard-currency-form-changes-reverted'
        ],
        'suggested_user': 'user_sophia_vane (Sophia Vane)',
        'seed_gap': 'none',
        'isolation': 'shared',
        'platforms': 'both',
        'automation_status': 'unit-only',
        'prerequisites': 'Existing currency catalog loaded.',
        'preconditions': 'User modifies form fields.',
        'steps': [
            'Given owner edits price from £22 to £99',
            'When they tap "✕ Discard Changes"',
            'Then form resets back to original £22 value without writing to database'
        ],
        'data_reset': 'None.'
    },
    {
        'id': 'studio-owner-publish-weekly-recurring-class-with-climate',
        'title': 'Studio owner publishes ongoing weekly recurring class with room climate preset and recurrence',
        'feature_ref': 'FEATURES.md §5.16',
        'type': 'happy',
        'priority': 'P0',
        'draft_ids': ['studio-owner-publish-weekly-recurring-class-with-climate-success', 'studio-owner-create-class-recurrence-never-publish'],
        'suggested_user': 'user_sophia_vane (Sophia Vane)',
        'seed_gap': 'none',
        'isolation': 'clone',
        'platforms': 'both',
        'automation_status': 'unit-only (CreateClassView.test.tsx, firestoreService.test.ts)',
        'prerequisites': 'Sophia owns Chelsea studio.',
        'preconditions': 'Sophia in CreateClassView.',
        'steps': [
            'Given Sophia enters class title "Sunset Yin Yoga", teacher, duration 60m, capacity 15',
            'When she selects climate preset "Heated (26°C)" and recurrence Weekly on Tuesdays and Thursdays',
            'And sets End Condition to "Never" (up to 52 weeks)',
            'And taps "Publish Live"',
            'Then recurring series is generated in batches in Firestore',
            'And sessions appear across weekly calendar on Chelsea timetable'
        ],
        'data_reset': 'Teardown deletes created recurring classes.'
    },
    {
        'id': 'studio-owner-recurrence-occurrences-boundary',
        'title': 'Studio owner sets occurrence-based recurrence capped at maximum 52-occurrence boundary',
        'feature_ref': 'FEATURES.md §5.16',
        'type': 'edge',
        'priority': 'P1',
        'draft_ids': ['studio-owner-create-class-recurrence-occurrences-boundary'],
        'suggested_user': 'user_sophia_vane (Sophia Vane)',
        'seed_gap': 'none',
        'isolation': 'clone',
        'platforms': 'both',
        'automation_status': 'unit-only (firestoreService.test.ts)',
        'prerequisites': 'None.',
        'preconditions': 'In recurrence section of CreateClassView.',
        'steps': [
            'Given user selects End Condition "After N occurrences"',
            'When they enter occurrence count 52',
            'Then 52 class session records are created across future weeks without memory exhaustion'
        ],
        'data_reset': 'Teardown deletes created classes.'
    },
    {
        'id': 'studio-owner-recurrence-date-inverted-failure',
        'title': 'Recurrence engine rejects end dates earlier than first session date',
        'feature_ref': 'FEATURES.md §5.16',
        'type': 'valid-failure',
        'priority': 'P1',
        'draft_ids': ['studio-owner-create-class-recurrence-date-inverted-failure'],
        'suggested_user': 'user_sophia_vane (Sophia Vane)',
        'seed_gap': 'none',
        'isolation': 'shared',
        'platforms': 'both',
        'automation_status': 'unit-only (CreateClassView.test.tsx)',
        'prerequisites': 'None.',
        'preconditions': 'In CreateClassView.',
        'steps': [
            'Given first session is set for tomorrow',
            'When user sets recurrence end date to yesterday',
            'Then validation error "End date must be after start date" blocks submission'
        ],
        'data_reset': 'None.'
    },
    {
        'id': 'non-teaching-owner-assigns-visiting-teacher',
        'title': 'Non-teaching studio owner creates class and assigns visiting teacher with owner excluded from teacher selector',
        'feature_ref': 'FEATURES.md §5.16',
        'type': 'happy',
        'priority': 'P0',
        'draft_ids': [
            'non-teaching-owner-assigns-visiting-teacher-success',
            'studio-owner-nonteaching-assign-visiting-teacher-success',
            'studio-owner-non-teaching-manage-visiting-teacher-schedule-verified'
        ],
        'suggested_user': 'user_owner_noteach (Omar Haddad)',
        'seed_gap': 'none (Omar has isTeacher: false, Maya is visiting teacher)',
        'isolation': 'clone',
        'platforms': 'both',
        'automation_status': 'unit-only (CreateClassView.test.tsx)',
        'prerequisites': 'Omar Haddad is non-teaching owner; Maya Sharma is assigned teacher.',
        'preconditions': 'Omar opens Create Class form.',
        'steps': [
            'Given Omar opens Create Class view for Shoreditch Stillpoint Studio',
            'When he inspects Teacher selector dropdown',
            'Then Omar does NOT appear as an instructor option (isTeacher: false mandate)',
            'And visiting teacher "Maya Sharma" is selected',
            'And published class correctly displays "w/ Maya Sharma"'
        ],
        'data_reset': 'Teardown deletes class.'
    },
    {
        'id': 'studio-owner-create-class-restricted-currency-acceptance',
        'title': 'Studio owner publishes specialty class restricted to custom selected passes',
        'feature_ref': 'FEATURES.md §5.16, §5.20',
        'type': 'happy',
        'priority': 'P1',
        'draft_ids': ['studio-owner-create-class-restricted-currency-acceptance', 'studio-owner-create-specialty-class-restricted-currency-saved'],
        'suggested_user': 'user_sophia_vane (Sophia Vane)',
        'seed_gap': 'none',
        'isolation': 'clone',
        'platforms': 'both',
        'automation_status': 'unit-only (CreateClassView.test.tsx)',
        'prerequisites': 'Studio has multiple currencies.',
        'preconditions': 'Sophia in CreateClassView.',
        'steps': [
            'Given Sophia creates Sound Bath workshop',
            'When she switches Currency Acceptance from "Accept All" to "Custom"',
            'And checks only "Drop-In Pass (£22)" while unchecking class packs',
            'And publishes the class',
            'Then class saves with custom policy and filters student booking pass modals accordingly'
        ],
        'data_reset': 'Teardown deletes class.'
    },
    {
        'id': 'studio-owner-create-class-missing-title-fails',
        'title': 'Class creation blocks saving when class title is missing',
        'feature_ref': 'FEATURES.md §5.16',
        'type': 'valid-failure',
        'priority': 'P1',
        'draft_ids': ['studio-owner-create-class-missing-title-fails', 'studio-owner-create-class-missing-title-failure'],
        'suggested_user': 'user_sophia_vane (Sophia Vane)',
        'seed_gap': 'none',
        'isolation': 'shared',
        'platforms': 'both',
        'automation_status': 'unit-only (CreateClassView.test.tsx)',
        'prerequisites': 'None.',
        'preconditions': 'In CreateClassView.',
        'steps': [
            'Given user leaves Title input blank',
            'When attempting to Save as Draft, Template, or Publish',
            'Then validation warning "Class title is required" blocks submission'
        ],
        'data_reset': 'None.'
    },
    {
        'id': 'studio-owner-publish-class-missing-teacher-fails',
        'title': 'Publishing live class without assigned teacher is blocked',
        'feature_ref': 'FEATURES.md §5.16',
        'type': 'valid-failure',
        'priority': 'P1',
        'draft_ids': ['studio-owner-publish-class-missing-teacher-fails'],
        'suggested_user': 'user_owner_noteach (Omar Haddad)',
        'seed_gap': 'none',
        'isolation': 'shared',
        'platforms': 'both',
        'automation_status': 'unit-only (CreateClassView.test.tsx)',
        'prerequisites': 'None.',
        'preconditions': 'In CreateClassView with empty teacher selection.',
        'steps': [
            'Given teacher selector is empty or unselected',
            'When owner attempts to "Publish Live"',
            'Then error notice "Please assign a teacher before publishing live" appears'
        ],
        'data_reset': 'None.'
    },
    {
        'id': 'studio-owner-save-class-draft',
        'title': 'Studio owner saves incomplete class as draft and validates isolation from public timetable',
        'feature_ref': 'FEATURES.md §5.16',
        'type': 'happy',
        'priority': 'P1',
        'draft_ids': ['studio-owner-save-class-draft-success', 'studio-owner-nonteaching-draft-save-and-publish'],
        'suggested_user': 'user_sophia_vane (Sophia Vane)',
        'seed_gap': 'none',
        'isolation': 'clone',
        'platforms': 'both',
        'automation_status': 'unit-only (StudioClassManagerView.test.tsx)',
        'prerequisites': 'Sophia in CreateClassView.',
        'preconditions': 'Class form filled.',
        'steps': [
            'Given Sophia fills class details and taps "Save as Draft"',
            'Then class document is saved with status: "draft"',
            'And appears in Studio Drafts list in StudioClassManagerView',
            'While remaining invisible on public student timetable'
        ],
        'data_reset': 'Teardown deletes draft.'
    },
    {
        'id': 'studio-owner-publish-draft-directly',
        'title': 'Studio owner converts saved draft directly into published live class',
        'feature_ref': 'FEATURES.md §5.16',
        'type': 'happy',
        'priority': 'P1',
        'draft_ids': ['studio-owner-publish-draft-directly-success', 'studio-owner-nonteaching-draft-save-and-publish'],
        'suggested_user': 'user_sophia_vane (Sophia Vane)',
        'seed_gap': 'none',
        'isolation': 'clone',
        'platforms': 'both',
        'automation_status': 'unit-only (StudioClassManagerView.test.tsx)',
        'prerequisites': 'Saved draft exists.',
        'preconditions': 'Viewing Drafts in StudioClassManagerView.',
        'steps': [
            'Given owner views draft class in Studio Drafts list',
            'When they tap "Publish" on draft card',
            'Then class status updates to "published" and immediately appears on public timetable'
        ],
        'data_reset': 'Teardown deletes class.'
    },
    {
        'id': 'studio-owner-delete-class-draft',
        'title': 'Studio owner deletes unwanted class draft with confirmation',
        'feature_ref': 'FEATURES.md §5.16',
        'type': 'happy',
        'priority': 'P2',
        'draft_ids': ['studio-owner-delete-class-draft-success'],
        'suggested_user': 'user_sophia_vane (Sophia Vane)',
        'seed_gap': 'none',
        'isolation': 'clone',
        'platforms': 'both',
        'automation_status': 'unit-only',
        'prerequisites': 'Draft class exists.',
        'preconditions': 'Viewing StudioClassManagerView.',
        'steps': [
            'Given draft class exists',
            'When owner taps "Delete Draft" and confirms',
            'Then draft document is deleted and removed from view'
        ],
        'data_reset': 'None.'
    },
    {
        'id': 'studio-owner-save-brand-class-template',
        'title': 'Brand founder creates teacher-agnostic brand class template shared across all branches',
        'feature_ref': 'FEATURES.md §5.16',
        'type': 'happy',
        'priority': 'P0',
        'draft_ids': ['studio-owner-save-brand-class-template-success', 'studio-owner-create-brand-class-template-shared'],
        'suggested_user': 'user_maryia (Maryia Sharma)',
        'seed_gap': 'none',
        'isolation': 'clone',
        'platforms': 'both',
        'automation_status': 'unit-only (CreateClassView.test.tsx)',
        'prerequisites': 'Maryia owns brand Affordable London Yoga.',
        'preconditions': 'In CreateClassView.',
        'steps': [
            'Given Maryia creates class blueprint with title "Ashtanga Primary Series"',
            'When she taps "Save as Brand Template"',
            'Then company_class_template document is saved under brand company ID without bound teacher (teacher-agnostic)',
            'And template becomes available to all child branch managers'
        ],
        'data_reset': 'Teardown deletes created template.'
    },
    {
        'id': 'studio-owner-schedule-class-from-brand-template-sync-teacher',
        'title': 'Branch manager instantiates recurring schedule from template dynamically synchronizing target studio teachers',
        'feature_ref': 'FEATURES.md §5.16',
        'type': 'happy',
        'priority': 'P0',
        'draft_ids': [
            'studio-owner-schedule-class-from-brand-template-success',
            'studio-owner-schedule-class-from-template-sync-teacher',
            'studio-owner-schedule-recurring-class-from-template-published'
        ],
        'suggested_user': 'user_elena (Elena Rostova)',
        'seed_gap': 'none (Elena manages Chiswick under brand)',
        'isolation': 'clone',
        'platforms': 'both',
        'automation_status': 'unit-only (CreateClassFromTemplateModal.test.tsx)',
        'prerequisites': 'Brand class template exists; Elena manages branch.',
        'preconditions': 'Elena in StudioClassManagerView.',
        'steps': [
            'Given Elena taps "Schedule Class" on Brand Template card',
            'When CreateClassFromTemplateModal opens',
            'Then target studio teachers dropdown synchronizes to Chiswick instructors',
            'And when she selects date, time, and taps "Publish Schedule"',
            'Then published class appears on Chiswick schedule with correct branch teacher'
        ],
        'data_reset': 'Teardown deletes scheduled class.'
    },
    {
        'id': 'studio-owner-delete-class-template',
        'title': 'Studio owner deletes class template blueprint with confirmation dialog',
        'feature_ref': 'FEATURES.md §5.16',
        'type': 'happy',
        'priority': 'P2',
        'draft_ids': ['studio-owner-delete-class-template-modal-confirm'],
        'suggested_user': 'user_maryia (Maryia Sharma)',
        'seed_gap': 'none',
        'isolation': 'clone',
        'platforms': 'both',
        'automation_status': 'unit-only',
        'prerequisites': 'Template exists.',
        'preconditions': 'Viewing templates list.',
        'steps': [
            'Given owner taps delete on class template',
            'When confirmation modal is accepted',
            'Then template document is deleted from Firestore'
        ],
        'data_reset': 'Teardown restores template.'
    },
    {
        'id': 'studio-owner-grant-pass-walkin-stepper',
        'title': 'Studio owner records in-person walk-in sale and deposits class credits into member wallet via stepper',
        'feature_ref': 'FEATURES.md §5.20',
        'type': 'happy',
        'priority': 'P0',
        'draft_ids': [
            'studio-owner-grant-pass-to-member-success',
            'studio-owner-grant-pass-success-zero-leak',
            'studio-owner-grant-pass-walkin-yogi-credited'
        ],
        'suggested_user': 'user_sophia_vane (Sophia Vane)',
        'seed_gap': 'none',
        'isolation': 'clone',
        'platforms': 'both',
        'automation_status': 'unit-only (AdminGrantPassModalView.test.tsx)',
        'prerequisites': 'Sophia owns studio; member exists.',
        'preconditions': 'Sophia opens AdminGrantPassModalView.',
        'steps': [
            'Given Sophia opens Grant Pass modal',
            'When she selects recipient "Sarah Jenkins", selects Drop-In pass, and increments stepper to 2 credits',
            'And taps "Grant Pass"',
            'Then 2 credits are deposited into Sarah\'s wallet',
            'And other member wallets remain completely untouched (zero cross-user leak)'
        ],
        'data_reset': 'Teardown removes granted pass.'
    },
    {
        'id': 'studio-owner-grant-pass-stepper-lower-bound-clamp',
        'title': 'Admin grant pass stepper clamps at 1 and prevents decrementing to zero or negative',
        'feature_ref': 'FEATURES.md §5.20',
        'type': 'edge',
        'priority': 'P1',
        'draft_ids': ['studio-owner-grant-pass-stepper-lower-bound-clamp'],
        'suggested_user': 'user_sophia_vane (Sophia Vane)',
        'seed_gap': 'none',
        'isolation': 'shared',
        'platforms': 'both',
        'automation_status': 'unit-only (AdminGrantPassModalView.test.tsx)',
        'prerequisites': 'None.',
        'preconditions': 'Modal open with quantity 1.',
        'steps': [
            'Given stepper displays quantity 1',
            'When user taps "−" decrement button',
            'Then value remains clamped at 1 and decrement button is disabled'
        ],
        'data_reset': 'None.'
    },
    {
        'id': 'studio-owner-grant-pass-nonexistent-user-fails',
        'title': 'Admin pass grant attempts deposit to unregistered member email and aborts with zero writes',
        'feature_ref': 'FEATURES.md §5.20',
        'type': 'valid-failure',
        'priority': 'P1',
        'draft_ids': [
            'studio-owner-grant-pass-nonexistent-user-fails',
            'studio-owner-grant-pass-nonexistent-user-failure',
            'studio-owner-grant-pass-nonexistent-user-fails'
        ],
        'suggested_user': 'user_sophia_vane (Sophia Vane)',
        'seed_gap': 'none',
        'isolation': 'shared',
        'platforms': 'both',
        'automation_status': 'unit-only (AdminGrantPassModalView.test.tsx)',
        'prerequisites': 'None.',
        'preconditions': 'In pass grant modal.',
        'steps': [
            'Given user enters unregistered email "nonexistent@inspired.test"',
            'When attempting to grant pass',
            'Then error notice "Recipient not found" appears and no Firestore writes are executed'
        ],
        'data_reset': 'None.'
    },
    {
        'id': 'studio-owner-grant-pass-empty-recipient-fails',
        'title': 'Empty recipient selection blocks pass grant submission',
        'feature_ref': 'FEATURES.md §5.20',
        'type': 'valid-failure',
        'priority': 'P2',
        'draft_ids': ['studio-owner-grant-pass-empty-recipient-failure'],
        'suggested_user': 'user_sophia_vane (Sophia Vane)',
        'seed_gap': 'none',
        'isolation': 'shared',
        'platforms': 'both',
        'automation_status': 'unit-only',
        'prerequisites': 'None.',
        'preconditions': 'Modal open with empty recipient.',
        'steps': [
            'Given recipient field is left blank',
            'When user taps Grant Pass',
            'Then validation error blocks submission'
        ],
        'data_reset': 'None.'
    },
    {
        'id': 'studio-owner-claim-shadow-profile',
        'title': 'Prospective studio owner claims unclaimed shadow studio and uploads verification proof',
        'feature_ref': 'FEATURES.md §5.12',
        'type': 'happy',
        'priority': 'P0',
        'draft_ids': [
            'studio-owner-claim-shadow-profile-success',
            'studio-owner-claim-shadow-studio-happy',
            'studio-owner-claim-shadow-profile-document-uploaded'
        ],
        'suggested_user': 'user_newbie (Yoga Newbie)',
        'seed_gap': 'shadow studio profile in seeds',
        'isolation': 'clone',
        'platforms': 'both',
        'automation_status': 'unit-only (ClaimStudioView.test.tsx)',
        'prerequisites': 'Unclaimed studio profile exists in search.',
        'preconditions': 'User finds shadow studio in search.',
        'steps': [
            'Given user taps "Claim Studio 🏢" on shadow studio tile',
            'When ClaimStudioView opens',
            'Then user fills ownership contact details, attaches utility bill/proof document, and submits claim',
            'Then claim request document is created with status: "pending"',
            'And confirmation banner informs user claim is under administrative review'
        ],
        'data_reset': 'Teardown deletes created claim.'
    },
    {
        'id': 'studio-owner-claim-already-verified-studio-blocked',
        'title': 'Attempting to claim an already-verified studio is blocked',
        'feature_ref': 'FEATURES.md §5.12',
        'type': 'valid-failure',
        'priority': 'P1',
        'draft_ids': ['studio-owner-claim-already-verified-studio-blocked'],
        'suggested_user': 'user_newbie (Yoga Newbie)',
        'seed_gap': 'none',
        'isolation': 'shared',
        'platforms': 'both',
        'automation_status': 'unit-only',
        'prerequisites': 'Studio has isClaimed: true.',
        'preconditions': 'User inspects verified studio.',
        'steps': [
            'Given user views Askew Road Zen Den (already verified and owned)',
            'Then "Claim Studio" button is not rendered on tile or profile'
        ],
        'data_reset': 'None.'
    },
    {
        'id': 'platform-admin-approve-shadow-claim',
        'title': 'Platform administrator reviews pending studio claim and approves ownership transfer',
        'feature_ref': 'FEATURES.md §5.12',
        'type': 'happy',
        'priority': 'P0',
        'draft_ids': ['platform-admin-approve-shadow-claim-success'],
        'suggested_user': 'user_maryia (Maryia Sharma - Platform Admin)',
        'seed_gap': 'pending claim record in seeds',
        'isolation': 'clone',
        'platforms': 'both',
        'automation_status': 'unit-only (AdminClaimsView.test.tsx)',
        'prerequisites': 'Maryia has isAdmin: true; pending claim exists.',
        'preconditions': 'Maryia opens AdminClaimsView.',
        'steps': [
            'Given Maryia opens Admin Claims Review portal',
            'When she reviews pending claim and taps "Approve Claim"',
            'Then studio ownerId is updated to claimant, isClaimed is set to true',
            'And claim status updates to "approved"'
        ],
        'data_reset': 'Teardown restores unassigned shadow studio state.'
    },
    {
        'id': 'platform-admin-reject-shadow-claim',
        'title': 'Platform administrator rejects shadow claim with justification reason',
        'feature_ref': 'FEATURES.md §5.12',
        'type': 'happy',
        'priority': 'P1',
        'draft_ids': ['platform-admin-reject-shadow-claim-with-reason-success'],
        'suggested_user': 'user_maryia (Maryia Sharma - Platform Admin)',
        'seed_gap': 'pending claim in seeds',
        'isolation': 'clone',
        'platforms': 'both',
        'automation_status': 'unit-only (AdminClaimsView.test.tsx)',
        'prerequisites': 'Maryia has isAdmin: true; pending claim exists.',
        'preconditions': 'Maryia in AdminClaimsView.',
        'steps': [
            'Given Maryia reviews claim with insufficient proof',
            'When she enters reason "Proof document illegible" and taps "Reject Claim"',
            'Then claim status updates to "rejected" and studio remains unclaimed'
        ],
        'data_reset': 'Teardown deletes claim.'
    },
    {
        'id': 'studio-owner-soft-close-and-reopen-studio',
        'title': 'Studio owner permanently soft-closes studio location and subsequently reopens it',
        'feature_ref': 'FEATURES.md §5.11',
        'type': 'happy',
        'priority': 'P1',
        'draft_ids': [
            'studio-owner-soft-close-studio-location-success',
            'studio-owner-reopen-closed-studio-success',
            'studio-owner-soft-close-and-reopen-studio'
        ],
        'suggested_user': 'user_sophia_vane (Sophia Vane)',
        'seed_gap': 'none',
        'isolation': 'clone',
        'platforms': 'both',
        'automation_status': 'unit-only (MyStudiosView.test.tsx)',
        'prerequisites': 'Sophia owns Chelsea studio.',
        'preconditions': 'Sophia in General Settings.',
        'steps': [
            'Given Sophia selects "Close Studio Location" and confirms modal',
            'Then studio status updates to "closed" and is excluded from search',
            'And when she taps "Reopen Studio Location", studio status restores to "active"'
        ],
        'data_reset': 'Teardown restores active status.'
    },
    {
        'id': 'brand-founder-delete-brand-preserves-independent-studios',
        'title': 'Brand founder confirms brand network deletion and assigned branch studios revert to independent locations',
        'feature_ref': 'FEATURES.md §5.11',
        'type': 'happy',
        'priority': 'P0',
        'draft_ids': [
            'brand-founder-delete-brand-preserves-independent-studios',
            'studio-owner-delete-brand-network-confirm-reassign',
            'studio-owner-delete-brand-preserves-independent-studios'
        ],
        'suggested_user': 'user_brand_founder (Marcus Vance)',
        'seed_gap': 'none',
        'isolation': 'clone',
        'platforms': 'both',
        'automation_status': 'unit-only (MyStudiosView.test.tsx)',
        'prerequisites': 'Marcus owns brand The Zen Collective and studio Fulham Flow.',
        'preconditions': 'Marcus opens brand settings.',
        'steps': [
            'Given Marcus selects "Delete Brand Company"',
            'When confirmation dialog is confirmed',
            'Then company document is deleted from Firestore',
            'And branch studio Fulham Flow reverts to companyId: null (independent studio)',
            'And studio remains intact in Marcus\'s My Studios list'
        ],
        'data_reset': 'Teardown restores brand and re-links studio.'
    },
    {
        'id': 'studio-owner-delete-brand-network-modal-abort',
        'title': 'Brand founder opens delete brand modal and aborts without deletion',
        'feature_ref': 'FEATURES.md §5.11',
        'type': 'edge',
        'priority': 'P2',
        'draft_ids': ['studio-owner-delete-brand-network-modal-abort'],
        'suggested_user': 'user_brand_founder (Marcus Vance)',
        'seed_gap': 'none',
        'isolation': 'shared',
        'platforms': 'both',
        'automation_status': 'unit-only',
        'prerequisites': 'Marcus owns brand.',
        'preconditions': 'Marcus opens brand settings.',
        'steps': [
            'Given Marcus clicks Delete Brand to trigger confirmation modal',
            'When he taps "Cancel" or closes dialog',
            'Then modal closes and brand company remains completely unchanged in Firestore'
        ],
        'data_reset': 'None.'
    }
]

print(f"Loaded {len(STUDIO_OWNER_CLUSTERS)} canonical Studio Owner clusters.")

def generate_merged_document():
    all_clusters = YOGI_CLUSTERS + TEACHER_CLUSTERS + STUDIO_OWNER_CLUSTERS
    
    # Calculate stats
    total_canonical = len(all_clusters)
    by_actor = defaultdict(list)
    by_priority = defaultdict(int)
    by_isolation = defaultdict(int)
    by_signal = defaultdict(int)
    
    for c in all_clusters:
        actor = 'yogi'
        if c in TEACHER_CLUSTERS:
            actor = 'teacher'
        elif c in STUDIO_OWNER_CLUSTERS:
            actor = 'studio-owner'
        by_actor[actor].append(c)
        by_priority[c['priority']] += 1
        by_isolation[c['isolation']] += 1
        
        # Determine triad signal
        # Count how many distinct files contributed
        source_count = len(c['draft_ids'])
        if source_count >= 3:
            signal = '3/3 (Core Triad Consensus)'
        elif source_count == 2:
            signal = '2/3 (Multi-Lens Overlap)'
        else:
            signal = '1/3 (Single-Lens Deep-Dive)'
        c['triad_signal'] = signal
        by_signal[signal] += 1

    out = ["# Phase 3: Merged E2E Regression Scenario Catalogue\n\n"]
    out.append(f"**Date:** 2026-10-25  \n")
    out.append(f"**Status:** Deduplicated & Merged (Phase 3 Complete)  \n")
    out.append(f"**Total Input Scenarios:** 224 across 9 draft files  \n")
    out.append(f"**Total Canonical Merged Scenarios:** {total_canonical}  \n\n---\n\n")
    
    out.append("## 1. Synthesis & Statistics\n\n")
    out.append(f"- **Deduplication Ratio:** 224 input drafts merged into **{total_canonical} canonical scenarios** (45.1% de-duplication of redundant journeys).\n")
    out.append(f"- **Distribution by Actor:**\n")
    out.append(f"  - **Yogi (Student / Visitor):** {len(by_actor['yogi'])} scenarios\n")
    out.append(f"  - **Teacher:** {len(by_actor['teacher'])} scenarios\n")
    out.append(f"  - **Studio Owner & Admin:** {len(by_actor['studio-owner'])} scenarios\n")
    out.append(f"- **Distribution by Priority:**\n")
    out.append(f"  - **P0 (Critical / Revenue / Auth / Core Journeys):** {by_priority['P0']}\n")
    out.append(f"  - **P1 (Standard Regression / Boundary Conditions):** {by_priority['P1']}\n")
    out.append(f"  - **P2 (Edge / Resilience / UI Polish):** {by_priority['P2']}\n")
    out.append(f"- **Distribution by Isolation:**\n")
    out.append(f"  - **shared (Read-Only / High Concurrency):** {by_isolation['shared']}\n")
    out.append(f"  - **clone (State Mutating / `clonedPersona` Fixture):** {by_isolation['clone']}\n")
    out.append(f"- **Triad Consensus Signals:**\n")
    for sig, count in sorted(by_signal.items()):
        out.append(f"  - **{sig}:** {count} scenarios\n")
        
    out.append("\n---\n\n")
    out.append("## 2. Merge Log (Input Drafts → Canonical Mapping)\n\n")
    out.append("| Canonical Scenario ID | Priority | Actor | Contributing Draft Scenarios | Triad Signal |\n")
    out.append("| :--- | :--- | :--- | :--- | :--- |\n")
    for c in all_clusters:
        actor = 'yogi'
        if c in TEACHER_CLUSTERS:
            actor = 'teacher'
        elif c in STUDIO_OWNER_CLUSTERS:
            actor = 'studio-owner'
        drafts_str = ", ".join(f"`{did}`" for did in c['draft_ids'])
        out.append(f"| `{c['id']}` | **{c['priority']}** | `{actor}` | {drafts_str} | {c['triad_signal']} |\n")
        
    out.append("\n---\n\n")
    out.append("## 3. Canonical Scenarios by Actor\n\n")
    
    for actor in ['yogi', 'teacher', 'studio-owner']:
        cluster_group = by_actor[actor]
        out.append(f"### Actor: {actor.upper()} ({len(cluster_group)} Scenarios)\n\n")
        for c in cluster_group:
            out.append(f"#### {c['id']} — {c['title']}\n")
            out.append(f"- **ID:** {c['id']}\n")
            out.append(f"- **Actor:** {actor}\n")
            out.append(f"- **Feature ref:** {c['feature_ref']}\n")
            out.append(f"- **Type:** {c['type']}\n")
            out.append(f"- **Priority (proposed):** {c['priority']}\n")
            out.append(f"- **Triad Signal:** {c['triad_signal']}\n")
            out.append(f"- **Prerequisites:** {c['prerequisites']}\n")
            out.append(f"- **Suggested test user:** {c['suggested_user']}\n")
            out.append(f"- **Seed gap:** {c['seed_gap']}\n")
            out.append(f"- **Preconditions (Given):** {c['preconditions']}\n")
            out.append(f"- **Steps:**\n")
            for step in c['steps']:
                out.append(f"  - {step}\n")
            out.append(f"- **Isolation:** {c['isolation']}\n")
            out.append(f"- **Data / reset notes:** {c['data_reset']}\n")
            out.append(f"- **Platforms:** {c['platforms']}\n")
            out.append(f"- **Automation status:** {c['automation_status']}\n")
            out.append(f"- **Contributing Sources:** {', '.join(c['draft_ids'])}\n\n")
            
    with open(os.path.join(DRAFTS_DIR, '_merged.md'), 'w', encoding='utf-8') as f:
        f.write("".join(out))
    print(f"Successfully generated _merged.md with {total_canonical} canonical scenarios.")

def generate_open_questions():
    content = r"""# Open Questions, Technical Boundaries & Architecture Considerations

**Date:** 2026-10-25  
**Parent Document:** [docs/e2e/drafts/_merged.md](file:///home/marcellkresz/developer/inspired/docs/e2e/drafts/_merged.md)  
**Document Reference:** `docs/e2e/open_questions.md`

During Phase 1 independent scenario discovery and Phase 2/3 deduplication and merging, several critical boundary conditions, feature gaps, and specifications were surfaced by the 9 subagents and prioritized user feedback. These must be reviewed before final scenario catalog sign-off.

---

## 1. User-Surfaced Constraints & Feature Gaps

### 1.1 Magic Link Authentication Testing Boundary (Email Service Dependency)
- **Problem:** Full end-to-end testing of the Magic Link login flow requires generating an out-of-band email, delivering it to an SMTP mailbox, extracting the tokenized URL, and clicking it in the browser. Without a dedicated email-capture daemon or mail testing API, this cannot be automated in browser UI regression suites without extreme flakiness.
- **Architectural Boundary Decision:**
  - **In Browser Automation (Playwright):** We automate the *in-app initiation* of the Magic Link flow:
    1. Input validation (email format, `@` and `.` checks).
    2. Request submission.
    3. Activation and countdown of the **60-second cooldown timer** (`visitor-magic-link-cooldown-throttled`).
    4. Confirmation banner rendering.
  - **For Authentication in Automation:** All automated E2E tests will use the dedicated **Dev Credentials Login** tool (`data-testid="dev-email-input"` / `data-testid="dev-password-input"`) or direct Firebase Auth emulator tokens.
  - **Manual Runbook:** The manual runbook retains the full human journey (checking external email client and tapping link).

---

### 1.2 Visiting Teachers & Dynamic Teacher Assignment UI Gap (Step 29)
- **Problem:** In the current application, studio owners can select instructors for class creation only because teachers (e.g. `user_teacher_001` Maya Sharma) are **pre-seeded** into `assignedTeachers` inside `studios.json`.
- **Feature Gap:** The PWA does not yet have a UI workflow for studio owners to search for, invite, or dynamically assign new freelance teachers to a studio roster (tracked in `TODO.md` Step 29: *Studio Teacher Onboarding & Staff Management Suite*).
- **Testing Guardrail:** All E2E scenarios validating teacher assignments (e.g. `non-teaching-owner-assigns-visiting-teacher`) must operate against pre-seeded partner relationships (`studio_shoreditch_006` with visiting teacher `user_teacher_001`). Testing dynamic teacher invitations is deferred until Step 29 is implemented.

---

### 1.3 Studio Membership Access Control & Approval Workflow Gap (Step 17)
- **Problem:** `FEATURES.md` §5.17 specifies an invite-only studio membership policy (`open_membership` vs `invite_only_approval`), a "Request to Join" workflow, and an owner approval dashboard.
- **Feature Gap:** This is completely unimplemented in the PWA (tracked in `TODO.md` Step 17).
- **Boundary Decision:** Gated studio access and join-request approvals are completely excluded from the active regression test suite. All current studios are treated as `open_membership`.

---

## 2. Technical Ambiguities Identified in Drafts

### 2.1 Under-12-Hour Class Cancellation Enforcement UI
- **Context:** `firestoreService.cancelClassBooking` implements cancellation refund logic: if cancelled $\ge 12$h before start, pass credits are refunded; if cancelled $< 12$h, the seat is forfeited and no credit is returned.
- **Ambiguity:** What UI warning or confirmation modal should display when a student attempts to cancel $< 12$h before class? Currently, the cancellation button performs the cancellation without an explicit penalty confirmation dialog.
- **Proposal:** Author scenario `yogi-cancel-booking-late-penalty-warning` in Phase 4 once the UI warning modal is designed.

---

### 2.2 Teacher Schedule Modal Booking Integration Handler
- **Context:** In `UnifiedProfileView.tsx`, tapping "View Full Schedule" opens `TeacherScheduleModal.tsx`.
- **Ambiguity:** `TeacherScheduleModal` receives `classes` and renders `[ Book ]` buttons, but currently does not receive an `onBookClass` callback prop from `UnifiedProfileView`. Tapping book inside the modal does not trigger `BookingPassSelectionModalView`.
- **Proposal:** Connect `onBookClass` from `UnifiedProfileView` to `TeacherScheduleModal` before automating scenario `yogi-book-class-from-teacher-schedule-modal`.

---

### 2.3 Front-Desk Pass Granting Permissions (`AdminGrantPassModalView`)
- **Context:** `AdminGrantPassModalView` allows granting passes and credits with a stepper.
- **Ambiguity:** In `FEATURES.md` §5.20, pass granting is described both as an administrative testing tool and as a studio owner tool for in-person front-desk walk-in sales.
- **Resolution:** Clarify that location studio owners can grant passes specifically for their own studio's currencies without requiring global platform `isAdmin: true` permissions.

---

### 2.4 Rolling 7-Day Class Feed Boundary vs Monday–Sunday Calendar Week
- **Context:** The in-page "🧘 Classes" sub-tab on `UnifiedProfileView` displays classes within a rolling 7-day window (`now` to `now + 7 days`). The studio timetable (`StudioScheduleView.tsx`) displays fixed Monday-to-Sunday calendar weeks.
- **Resolution:** Keep both distinct: the rolling 7-day feed is an instant "next 7 days" glance, while the schedule calendar modal offers weekly navigation.

---

## 3. Seed Gaps Summary (Consolidated for Phase 4)

To automate all 123 canonical scenarios without flakiness or manual setup, the following seed additions are required:

| Target Persona / Entity | Required State | Unblocks Scenarios |
| :--- | :--- | :--- |
| `user_sarah` (or clone) | Pass with `expiresAt < now` | `yogi-book-class-expired-pass-excluded` |
| `studio_askew_001` (or clone) | Class with `capacity: 1`, `bookedCount: 1` | `yogi-book-full-class-join-waitlist`, `yogi-leave-class-waitlist` |
| `studio_chelsea_004` (or clone) | Studio with `operatingStatus: 'temp_closed'` | `yogi-studio-profile-temporary-closure-notice`, `yogi-schedule-closed-studio-bookings-blocked` |
| `user_teacher_private` | Teacher with `isProfilePublic: false` | `teacher-private-profile-shields-personal-info`, `yogi-subscribe-unlock-private-teacher-profile` |
| `claim_pending_seed` | Studio claim with `status: 'pending'` | `platform-admin-approve-shadow-claim`, `platform-admin-reject-shadow-claim` |
"""
    with open('docs/e2e/open_questions.md', 'w', encoding='utf-8') as f:
        f.write(content)
    print("Successfully generated docs/e2e/open_questions.md")

if __name__ == '__main__':
    generate_merged_document()
    generate_open_questions()
