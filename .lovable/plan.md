

# Visual Redesign — MCI Platform (Based on Design References)

The uploaded design images reveal a significantly more polished and feature-rich UI than what's currently implemented. Here's the plan to align the platform with the new design system.

## Design Analysis (from screenshots)

| Screen | Key Design Elements |
|--------|-------------------|
| **Landing** (screen-7) | Orange hero with bold typography, AI feature cards, trending recipes carousel, pricing section, social feed preview |
| **Feed** (screen-10) | 3-column layout: left sidebar nav, center feed cards, right sidebar (challenge + trending chefs + AI tip) |
| **Profile** (screen-5) | Large avatar, stats row (recipes/likes/engagement), photo grid for posts, featured recipes cards with ratings |
| **Discover Chefs** (screen-6) | Featured master chefs with large cards, national ranking sidebar, rising stars carousel, popular by location |
| **Messages** (screen-9) | Clean 2-panel chat, online status indicator, orange sent bubbles, white received bubbles, date separators |
| **Settings** (screen) | Sidebar tabs (Perfil/Segurança/Assinaturas/Notificações), subscription plan cards, notification preferences |
| **AI Chef** (screen-2) | Conversational chat UI, quick action sidebar, recipe cards inline, daily limit counter |
| **Meal Planner** (screen-3) | Budget/ingredients input, 7-day carousel with dish cards, shopping list sidebar |
| **Chef Analytics** (screen-4) | Dashboard with KPI cards, follower growth chart, monetization status, audience insights |
| **Notifications** (screen-8) | Left sidebar, notification cards with action buttons, weekly summary widget |

## Implementation Plan

### 1. Landing Page Redesign
Rebuild `Landing.tsx` to match screen-7:
- Hero section with bold left-aligned text + food image with AI suggestion overlay
- "Cozinha Inteligente com IA" feature section (ingredient analysis + recipe generation cards)
- "Tendências em Luanda" trending recipes carousel
- "Feed Social" section with preview screenshots
- Pricing plans section (Free / Chef Starter / Chef Pro / Chef Elite)
- Footer with product/company/social links

### 2. Feed Page — 3-Column Layout
Redesign `Feed.tsx` to match screen-10:
- **Left sidebar** (desktop): Logo, nav links (Home, AI Assistant, Saved Recipes, Messages, My Profile), user info at bottom
- **Center feed**: Post cards with author avatar, image, title, description, like/comment/save/share actions, nested comments
- **Right sidebar** (desktop): Challenge of the Week card, Trending Chefs list, AI Kitchen Tip widget
- Mobile: Keep current bottom nav, hide sidebars

### 3. User Profile Redesign
Rebuild `UserProfile.tsx` to match screen-5:
- Header: Large circular avatar with camera badge, name + @username + chef tier badge, bio, follower/following/likes counts
- Action buttons: Follow (orange), Message (outline), Share icon
- Stats row: Total Recipes, Avg. Likes, Engagement Rate
- Tabs: Posts (photo grid), Recipes, Saved
- Featured Recipes section with rating stars and save bookmarks

### 4. Discover Chefs Redesign
Rebuild `DiscoverChefs.tsx` to match screen-6:
- Featured Master Chefs: Large image cards with tier badge, cuisine tags, follower count, follow button
- National Ranking sidebar: Numbered list with avatar, name, tier, points
- Rising Stars: Horizontal carousel with smaller cards
- Popular in [City]: Location-based chef grid
- "Apply to become a Certified Chef" CTA card

### 5. Messages Redesign
Restyle `Messages.tsx` to match screen-9:
- Top nav with Feed/Recipes/Messages links + search bar + "Back to Feed" button
- Left panel: "Conversations" header with compose icon, conversation list with avatar + name + last message + timestamp
- Chat panel: Header with avatar + name + online status, date separators ("TODAY"), white received bubbles, orange sent bubbles with read receipts, message input with attachment/emoji/send buttons

### 6. Settings Page (New)
Create `Settings.tsx` matching screen:
- Left sidebar tabs: Perfil, Segurança, Assinaturas, Notificações
- **Perfil tab**: Avatar upload, name, username, bio, location fields, save button
- **Segurança tab**: Change password form, 2FA toggle
- **Assinaturas tab**: 4 plan cards (Free/Starter/Pro/Elite) with current plan badge
- **Notificações tab**: Toggle switches for email, push, SMS preferences
- Move existing Profile.tsx logic into this new settings structure

### 7. Notifications Page (New)
Create `Notifications.tsx` matching screen-8:
- Left sidebar nav (Dashboard, Receitas, Comunidade, Desafios, IA Cozinheiro, Notificações)
- Tab filters: Todas, Atividade, Sistema
- Notification cards: different styles for likes, follows, comments, challenges, rewards
- "Resumo da Semana" sidebar widget with follower/like/comment counts
- Chef progress badge widget
- "Mark all as read" action

### 8. Global Design System Updates
- Update color accents to match: primary orange `#E8612D`, dark navy text `#1A2332`
- Cards with subtle rounded corners (`rounded-xl`), light borders, clean shadows
- Orange gradient buttons for primary CTAs
- Consistent icon usage (Lucide)
- Font hierarchy: Sora bold for headings, DM Sans for body

### File Changes Summary

| Action | File |
|--------|------|
| Rewrite | `src/pages/Landing.tsx` |
| Rewrite | `src/pages/Feed.tsx` |
| Rewrite | `src/pages/UserProfile.tsx` |
| Rewrite | `src/pages/DiscoverChefs.tsx` |
| Rewrite | `src/pages/Messages.tsx` |
| Rewrite | `src/pages/Profile.tsx` → becomes Settings |
| Create | `src/pages/Settings.tsx` |
| Create | `src/pages/Notifications.tsx` |
| Update | `src/components/AppLayout.tsx` (add left sidebar for desktop) |
| Update | `src/App.tsx` (add new routes) |
| Update | `src/index.css` (minor color tweaks) |

This is a large visual overhaul. I recommend implementing it in 2-3 messages to avoid overwhelming the build process:
- **Message 1**: Landing page + AppLayout sidebar + Settings page
- **Message 2**: Feed (3-column) + Notifications page
- **Message 3**: UserProfile + DiscoverChefs + Messages

