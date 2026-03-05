# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Static website for the Chinese Music and Culture Association (CMCA), a 501(c)(3) nonprofit in the San Francisco Bay Area. Domain: `findacappella.com`. Built on the Tooplate "Little Fashion" template.

## Development

No build system, package manager, or test framework. Edit HTML/CSS/JS files directly and preview in a browser. VSCode Live Preview is configured to open `faq.html` by default.

Hosted as a static site (likely GitHub Pages). Remote: `https://github.com/findacappella/findacappella.com.git`.

## Architecture

### Pages
- `index.html` — Home with hero carousel and event calendar
- `about.html` — Mission, programs, initiatives, values
- `groups.html` — Music group showcases
- `faq.html` — FAQ accordion sections
- `contact.html` — Contact form and info
- `donation.html` — Donation page
- `partials.html` — Shared templates (navbar, footer, preloader)

### Template Injection (`js/includes.js`)
Shared components (navbar, footer, preloader) live as `<template>` elements in `partials.html`. On page load, `includes.js` fetches `partials.html`, clones templates by ID, and injects them into matching `<div>` elements. Scripts within templates are executed after injection.

### Internationalization (`js/i18n.js`)
Full English/Chinese (Simplified) support. HTML elements use `data-i18n` attributes for text and `data-i18n-html` for HTML content. Language is persisted in localStorage (`cmca-lang` key) with browser language auto-detection fallback.

Public API on `window.CMCA_I18N`:
- `t(key, lang)` — Get translation
- `setLanguage(lang)` — Change language (`en` or `zh`)
- `getLanguage()` — Get current language
- `translations` — All translation data

Fires `i18n:languageChanged` event on `document` when language switches.

### Event Calendar (`js/custom.js` + `activities.json`)
Events are stored in `activities.json` (bilingual). `custom.js` fetches this file, filters to show events from the past 7 days onward, and renders event cards. Re-renders automatically on language change via the `i18n:languageChanged` event.

### Tech Stack
- Bootstrap 5 (grid, components, icons — loaded locally)
- jQuery + Slick carousel (image slideshows)
- Headroom.js (auto-hide navbar on scroll)
- Google Fonts: Inter + Noto Sans SC
- Chatbase AI widget (embedded in footer)

### CSS (`css/custom.css`)
Custom branding overrides on top of Bootstrap. Includes Chinese-specific typography rules (Noto Sans SC, Microsoft YaHei) with adjusted line-heights for CJK text. Language-specific styles target `[lang="zh"]`.

## Key Conventions

- All pages share the same navbar and footer via the template injection system in `partials.html`
- Translation keys in `i18n.js` are organized by section (nav, hero, about, groups, faq, contact, donation, footer)
- Event data in `activities.json` includes both `title`/`description` (English) and `title_zh`/`description_zh` (Chinese) fields
- Images use Chinese filenames where appropriate (e.g., `新年音乐会合照.jpg`)
- SEO metadata (OpenGraph, Twitter Cards, JSON-LD schema) is included in every page
