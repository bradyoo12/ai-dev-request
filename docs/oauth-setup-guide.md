# OAuth Setup Guide

Complete guide to configure social login providers for AI Dev Request platform.

## Overview

The platform supports 4 OAuth providers:
- **Google** - Most widely used
- **Kakao** - Popular in South Korea
- **LINE** - Popular in Japan, Thailand, Taiwan
- **Apple** - Required for iOS apps

## Redirect URIs

All providers need these redirect URIs registered:

### Development
```
http://localhost:5173/auth/callback/google
http://localhost:5173/auth/callback/kakao
http://localhost:5173/auth/callback/line
http://localhost:5173/auth/callback/apple
```

### Staging
```
https://icy-desert-07c08ba00.2.azurestaticapps.net/auth/callback/google
https://icy-desert-07c08ba00.2.azurestaticapps.net/auth/callback/kakao
https://icy-desert-07c08ba00.2.azurestaticapps.net/auth/callback/line
https://icy-desert-07c08ba00.2.azurestaticapps.net/auth/callback/apple
```

### Production
```
https://ai-dev-request.kr/auth/callback/google
https://ai-dev-request.kr/auth/callback/kakao
https://ai-dev-request.kr/auth/callback/line
https://ai-dev-request.kr/auth/callback/apple
```

---

## 1. Kakao OAuth Setup

### Prerequisites
- Kakao account
- [Kakao Developers Console](https://developers.kakao.com) access

### Steps

#### 1.1 Create Application
1. Go to [Kakao Developers Console](https://developers.kakao.com)
2. Click **"내 애플리케이션"** (My Applications)
3. Click **"애플리케이션 추가하기"** (Add Application)
4. Fill in:
   - **App Name**: AI Dev Request
   - **Company Name**: (your company)
   - **Category**: Productivity

#### 1.2 Configure Web Platform
1. Go to **앱 설정 → 플랫폼** (App Settings → Platform)
2. Click **"Web 플랫폼 등록"** (Register Web Platform)
3. Add **Site Domains**:
   ```
   http://localhost:5173
   https://icy-desert-07c08ba00.2.azurestaticapps.net
   https://ai-dev-request.kr
   ```

#### 1.3 Enable Kakao Login
1. Go to **제품 설정 → 카카오 로그인** (Product Settings → Kakao Login)
2. Click **"활성화 설정"** (Activation Settings) → **ON**
3. Add **Redirect URIs**:
   ```
   http://localhost:5173/auth/callback/kakao
   https://icy-desert-07c08ba00.2.azurestaticapps.net/auth/callback/kakao
   https://ai-dev-request.kr/auth/callback/kakao
   ```

#### 1.4 Configure Consent Items
1. Go to **제품 설정 → 카카오 로그인 → 동의항목** (Consent Items)
2. Enable these scopes:
   - **닉네임** (profile_nickname) - Required ✅
   - **프로필 사진** (profile_image) - Required ✅
   - **카카오계정(이메일)** (account_email) - Optional (needs business verification)

**Note**: Email scope requires business app verification. Without it, users get placeholder emails like `{kakao_id}@kakao.placeholder`.

#### 1.5 Get Credentials
1. Go to **앱 설정 → 요약 정보** (App Settings → Summary)
2. Copy **REST API 키** (REST API Key) → This is your `ClientId`
3. Go to **제품 설정 → 카카오 로그인 → 보안** (Security)
4. Enable **Client Secret** → Click **코드 생성** (Generate Code)
5. Copy the secret → This is your `ClientSecret`

#### 1.6 Add to Azure Web App Settings
```bash
OAuth__Kakao__ClientId=<REST_API_KEY>
OAuth__Kakao__ClientSecret=<CLIENT_SECRET>
```

---

## 2. Google OAuth Setup

### Prerequisites
- Google account
- [Google Cloud Console](https://console.cloud.google.com) access

### Steps

#### 2.1 Create Project
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Click project dropdown → **"New Project"**
3. Name: **AI Dev Request**
4. Click **"Create"**

#### 2.2 Enable Google+ API
1. Go to **APIs & Services → Library**
2. Search **"Google+ API"**
3. Click **"Enable"**

#### 2.3 Configure OAuth Consent Screen
1. Go to **APIs & Services → OAuth consent screen**
2. Choose **External** → Click **"Create"**
3. Fill in:
   - **App name**: AI Dev Request
   - **User support email**: (your email)
   - **Developer contact**: (your email)
4. Click **"Save and Continue"**
5. **Scopes**: Add `openid`, `email`, `profile`
6. **Test users**: (optional for development)
7. Click **"Save and Continue"**

#### 2.4 Create OAuth Client
1. Go to **APIs & Services → Credentials**
2. Click **"Create Credentials"** → **"OAuth client ID"**
3. Application type: **Web application**
4. Name: **AI Dev Request Web**
5. **Authorized redirect URIs**:
   ```
   http://localhost:5173/auth/callback/google
   https://icy-desert-07c08ba00.2.azurestaticapps.net/auth/callback/google
   https://ai-dev-request.kr/auth/callback/google
   ```
6. Click **"Create"**
7. Copy **Client ID** and **Client Secret**

#### 2.5 Add to Azure Web App Settings
```bash
OAuth__Google__ClientId=<CLIENT_ID>
OAuth__Google__ClientSecret=<CLIENT_SECRET>
```

---

## 3. LINE OAuth Setup

### Prerequisites
- LINE account
- [LINE Developers Console](https://developers.line.biz) access

### Steps

#### 3.1 Create Provider
1. Go to [LINE Developers Console](https://developers.line.biz/console/)
2. Click **"Create a new provider"**
3. Provider name: **Your Company Name**

#### 3.2 Create Channel
1. Click **"Create a LINE Login channel"**
2. Fill in:
   - **Channel type**: LINE Login
   - **Provider**: (select the provider you created)
   - **Company or owner's country or region**: (your country)
   - **Channel name**: AI Dev Request
   - **Channel description**: AI-powered development platform
   - **App types**: Web app
3. Click **"Create"**

#### 3.3 Configure Channel
1. Go to **LINE Login** tab
2. **Callback URL**: Add all redirect URIs
   ```
   http://localhost:5173/auth/callback/line
   https://icy-desert-07c08ba00.2.azurestaticapps.net/auth/callback/line
   https://ai-dev-request.kr/auth/callback/line
   ```
3. **Email address permission**: Apply (optional, requires review)

#### 3.4 Get Credentials
1. Go to **Basic settings** tab
2. Copy **Channel ID** → This is your `ChannelId`
3. Copy **Channel secret** → This is your `ChannelSecret`

#### 3.5 Add to Azure Web App Settings
```bash
OAuth__Line__ChannelId=<CHANNEL_ID>
OAuth__Line__ChannelSecret=<CHANNEL_SECRET>
```

---

## 4. Apple OAuth Setup

### Prerequisites
- Apple Developer account ($99/year)
- [Apple Developer Console](https://developer.apple.com) access

### Steps

#### 4.1 Create App ID
1. Go to [Apple Developer Console](https://developer.apple.com/account)
2. Go to **Certificates, Identifiers & Profiles → Identifiers**
3. Click **"+"** → Select **App IDs** → Click **"Continue"**
4. Type: **App**
5. Description: **AI Dev Request**
6. Bundle ID: `com.yourcompany.aidevrequest`
7. Check **Sign in with Apple** → Click **"Configure"**
   - **Primary App ID**: (leave as is)
   - Click **"Save"**
8. Click **"Continue"** → **"Register"**

#### 4.2 Create Service ID
1. Go to **Identifiers** → Click **"+"** → Select **Service IDs**
2. Description: **AI Dev Request Web**
3. Identifier: `com.yourcompany.aidevrequest.web`
4. Check **Sign in with Apple** → Click **"Configure"**
   - **Primary App ID**: (select the App ID you created)
   - **Domains and Subdomains**:
     ```
     localhost
     icy-desert-07c08ba00.2.azurestaticapps.net
     ai-dev-request.kr
     ```
   - **Return URLs**:
     ```
     http://localhost:5173/auth/callback/apple
     https://icy-desert-07c08ba00.2.azurestaticapps.net/auth/callback/apple
     https://ai-dev-request.kr/auth/callback/apple
     ```
5. Click **"Save"** → **"Continue"** → **"Register"**

#### 4.3 Create Private Key
1. Go to **Keys** → Click **"+"**
2. Key Name: **AI Dev Request Sign in with Apple Key**
3. Check **Sign in with Apple** → Click **"Configure"**
   - **Primary App ID**: (select your App ID)
4. Click **"Save"** → **"Continue"** → **"Register"**
5. **Download** the `.p8` file immediately (can't re-download!)
6. Note the **Key ID** (10-character string like `ABC123DEFG`)

#### 4.4 Get Team ID
1. Go to **Membership** section in Apple Developer portal
2. Copy your **Team ID** (10-character string like `XYZ987TEAM`)

#### 4.5 Add to Azure Web App Settings
```bash
OAuth__Apple__ClientId=com.yourcompany.aidevrequest.web
OAuth__Apple__TeamId=<TEAM_ID>
OAuth__Apple__KeyId=<KEY_ID>
OAuth__Apple__PrivateKey=<PRIVATE_KEY_CONTENT>
```

**Private Key Format**: Copy the entire `.p8` file contents including `-----BEGIN PRIVATE KEY-----` and `-----END PRIVATE KEY-----`

---

## Testing

### Local Development
1. Set environment variables in `appsettings.Local.json` (gitignored):
   ```json
   {
     "OAuth": {
       "Google": {
         "ClientId": "...",
         "ClientSecret": "..."
       },
       "Kakao": {
         "ClientId": "...",
         "ClientSecret": "..."
       },
       "Line": {
         "ChannelId": "...",
         "ChannelSecret": "..."
       },
       "Apple": {
         "ClientId": "...",
         "TeamId": "...",
         "KeyId": "...",
         "PrivateKey": "..."
       }
     }
   }
   ```

2. Test each provider:
   ```bash
   cd platform/frontend
   npm run dev
   # Click each social login button
   ```

### Azure Deployment
1. Add all settings to Azure Web App:
   - Azure Portal → App Services → ai-dev-request-api
   - Configuration → Application settings → **"+ New application setting"**

2. Restart the web app after adding settings

3. Test on staging: https://icy-desert-07c08ba00.2.azurestaticapps.net

---

## Troubleshooting

### "OAuth provider not configured" (503)
- Missing `ClientId` or `ClientSecret` in Azure settings
- Check: Azure Portal → App Services → Configuration

### "Social login failed. Please try again." (400)
1. **Redirect URI mismatch**
   - Check: Provider console redirect URIs match exactly
   - Common mistake: HTTP vs HTTPS, trailing slash

2. **Invalid credentials**
   - Check: ClientId/ClientSecret are correct
   - Test: Try with a fresh credential

3. **Network error**
   - Check: Backend can reach provider API (not blocked by firewall)
   - Check browser console for CORS errors

### "Authorization code expired"
- Code must be exchanged within 60 seconds
- Don't reuse codes (they're one-time use)
- If testing, generate a new auth flow each time

### Kakao: "동의 항목 설정이 올바르지 않습니다"
- Enable required consent items: `profile_nickname`, `profile_image`
- Check: 카카오 로그인 → 동의항목

### Apple: "invalid_client"
- Check Service ID matches `OAuth__Apple__ClientId`
- Ensure redirect URI is registered for the Service ID (not App ID)
- Verify private key is in correct PEM format

---

## Security Best Practices

1. **Never commit secrets** to git
   - Use Azure App Settings for production
   - Use `appsettings.Local.json` (gitignored) for local dev
   - Use environment variables or user secrets

2. **Use HTTPS in production**
   - OAuth providers may reject HTTP redirect URIs

3. **Validate state parameter**
   - Prevents CSRF attacks
   - Frontend automatically generates random state

4. **Rotate secrets regularly**
   - Change ClientSecret every 6-12 months
   - Apple private keys: rotate annually

5. **Monitor failed login attempts**
   - Check backend logs for suspicious patterns
   - Set up alerts for high failure rates

---

## Reference

- [Kakao Developers Docs](https://developers.kakao.com/docs/latest/ko/kakaologin/rest-api)
- [Google OAuth 2.0 Docs](https://developers.google.com/identity/protocols/oauth2)
- [LINE Login Docs](https://developers.line.biz/en/docs/line-login/)
- [Sign in with Apple Docs](https://developer.apple.com/sign-in-with-apple/)
