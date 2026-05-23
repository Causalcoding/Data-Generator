# MMX Model File Designer

A React app for generating synthetic marketing mix model input files — RC_File, Sales_File, Spend_File, Panel_Data, Config_File, DMA_Sales, and DMA_Spend.

## Project Structure

```
mmx-model-file-designer/
├── public/
│   └── index.html
├── src/
│   ├── App.js          ← entire application
│   └── index.js        ← React entry point
├── .github/
│   └── workflows/
│       └── deploy.yml  ← auto-deploy on push to main
├── package.json
└── README.md
```

## Local Development

Make sure you have Node.js 16+ installed.

```bash
# Install dependencies
npm install

# Start local dev server at localhost:3000
npm start
```

## Deploy to GitHub Pages

### One-time setup

1. Replace `YOUR-GITHUB-USERNAME` in `package.json` homepage field with your actual GitHub username
2. Push the repo to GitHub
3. Run:

```bash
npm install
npm run deploy
```

This builds the app and pushes it to the `gh-pages` branch automatically.

Your app will be live at:
`https://YOUR-GITHUB-USERNAME.github.io/mmx-model-file-designer`

### Auto-deploy on every push (CI/CD)

The `.github/workflows/deploy.yml` file sets up automatic deployment whenever you push to `main`. No manual steps needed after the first deploy.

To enable it:
1. Go to your GitHub repo → Settings → Pages
2. Set Source to `gh-pages` branch

## Features

- **External Model** — Generate RC_File, Sales_File, Spend_File with configurable segments, channels, date ranges, lag periods, and promotional costs
- **Internal Model — Basic** — Synthetic HCP-level panel data with adstock, transformations, and response curves
- **Internal Model — DMA** — DMA-level Sales and Spend files with GRP data

## Notes

- `localStorage` is used to persist custom channel names across sessions
- CSV downloads use `URL.createObjectURL` — works in all modern browsers when hosted
- Neither feature works inside the Claude.ai artifact sandbox (by design)
