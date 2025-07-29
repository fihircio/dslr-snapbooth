# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default tseslint.config([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      ...tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      ...tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      ...tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default tseslint.config([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

---

## DSLR Helper Integration

### Overview
This frontend integrates with the DSLR Helper backend service to provide advanced camera controls (settings, burst, video, gallery, etc.) for photobooth applications.

### Setup
1. **Start the DSLR Helper backend** (see its README for details). It must be running on the same machine, typically at `http://localhost:3000`.
2. **Configure the API token:**
   - In your `snapbooth-frontend/.env` file, set:
     ```
     VITE_DSLR_API_TOKEN=yourtoken
     ```
   - This must match the `DSLR_API_TOKEN` used by the backend.
3. **Start the frontend:**
   ```sh
   npm run dev
   ```
4. **Open the app:**
   - Go to [http://localhost:5173/](http://localhost:5173/) in your browser.

### Usage
- The status bar at the top shows whether the DSLR Helper is running and if a camera is connected.
- DSLR controls (settings, burst, video, etc.) are only available when the helper is running and a camera is detected.
- All features are accessible via keyboard and screen reader (ARIA labels, live regions).

### Troubleshooting
- **DSLR Helper not detected:**
  - Make sure the backend is running and accessible at `http://localhost:3000`.
  - Check that the API token matches in both frontend and backend `.env` files.
- **DSLR Helper running, but no camera detected:**
  - Ensure your camera is plugged in, powered on, and set to the correct mode.
  - Run `gphoto2 --auto-detect` to verify the camera is visible to the system.
- **API errors:**
  - Check the browser console and network tab for error messages.
  - Ensure the backend is not blocked by a firewall or permissions issue.

### Accessibility
- All controls are keyboard accessible.
- Status and error messages use ARIA live regions for screen readers.
- Color and icon cues are provided for quick status recognition.

---
