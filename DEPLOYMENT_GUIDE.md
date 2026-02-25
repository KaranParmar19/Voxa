# Voxa Deployment Guide for Render

This guide explains how to deploy your Voxa application to Render using the `render.yaml` Blueprint I created.

## ⚠️ Critical Step: Update API URLs
**Before deploying**, you MUST update your client code to point to the production server instead of `localhost`. 

Since you reverted the automatic change, please **manually update** these files:

1.  **`client/src/services/api.js`**:
    Change:
    ```javascript
    const API_URL = 'http://localhost:5001/api';
    ```
    To:
    ```javascript
    const API_URL = `${import.meta.env.VITE_SERVER_URL || 'http://localhost:5001'}/api`;
    ```

2.  **`client/src/services/socket.js`**:
    Change:
    ```javascript
    const SOCKET_URL = 'http://localhost:5001';
    ```
    To:
    ```javascript
    const SOCKET_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:5001';
    ```

> **Why?** `localhost` refers to *your* computer. When deployed, the client runs on the user's browser, and the server runs on Render. They are on different machines. The `VITE_SERVER_URL` environment variable tells the client where the server is living on the internet.

## Deployment Steps

1.  **Push Changes to GitHub**
    Running `git push` will upload the new `render.yaml` and your code changes to GitHub.

2.  **Create a New Blueprint on Render**
    1.  Go to [dashboard.render.com/blueprints](https://dashboard.render.com/blueprints).
    2.  Click **"New Blueprint Instance"**.
    3.  Connect your GitHub repository (`KaranParmar19/Voxa`).
    4.  Render will automatically detect the `render.yaml` file.

3.  **Configure Environment Variables**
    Render will ask for the environment variables defined in `render.yaml`.
    You must provide values for the secrets (which are NOT in the yaml for security):
    *   `JWT_SECRET`: Any random string.
    *   `GOOGLE_CLIENT_ID`: From Google Cloud Console.
    *   `GOOGLE_CLIENT_SECRET`: From Google Cloud Console.
    *   `GEMINI_API_KEY`: Your Gemini API Key.
    *   `OPENAI_API_KEY`: Your OpenAI API Key.

4.  **Deploy**
    Click **"Apply"** or **"Create"**. Render will deploy both the server and the client.

## Troubleshooting
*   **CORS Errors**: If you see CORS errors in the browser console, ensure the `CLIENT_URL` environment variable in the Server service matches the actual URL of your deployed Client. The `render.yaml` tries to set this automatically, but double-check it.
