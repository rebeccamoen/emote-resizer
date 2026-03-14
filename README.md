# Emote Resizer

A quick and easy way to resize emotes and badges to the required sizes for multiple streaming and chat platforms directly in your browser.

The app runs entirely client-side, so your images never leave your device.

## Live Demo

You can access the live version here:
https://rebeccamoen.github.io/emote-resizer

## Features

- Resize images to the required sizes for multiple platforms:
  - **Twitch**
    - Emotes: 28×28, 56×56, 112×112
    - Badges: 18×18, 36×36, 72×72
  - **Discord**
    - 128×128
  - **YouTube**
    - 24×24
    - 48×48
  - **Facebook**
    - 128×128
    - 240×240

- Automatic compression to meet Twitch's **25KB size limit**
- Preview emotes directly in a Twitch-style chat preview with both **dark mode and light mode**
- Download resized images individually or download **all sizes at once as a ZIP archive**

## Development

Install dependencies:

```bash
yarn install
yarn start
```

http://localhost:3000

## Building

```bash
yarn build
```

The compiled site will be generated in the `build/` folder.

## Deploying

Deploy to GitHub Pages:

```bash
yarn deploy
```

This will build the project and publish it to the `gh-pages` branch.

## Requirements

This project uses Node 16.

If you use nvm:

```bash
nvm use
```

## Attribution

This project is based on the original Twitch Emote Resizer by tma02:

https://github.com/tma02/twitch-emote-resizer

The original project provided the foundation for resizing Twitch emotes and badges.
This version extends it with additional platform sizes and modifications.