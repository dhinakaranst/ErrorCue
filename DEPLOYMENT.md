# Render Deployment Configuration

## Environment Variables Required:
- MONGODB_URI=your_mongodb_atlas_connection_string
- SLACK_WEBHOOK_URL=your_slack_webhook_url
- JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
- NODE_ENV=production

## Render Settings:
- Build Command: npm install && npm run build
- Start Command: npm start
- Environment: Node
- Region: Choose closest to your users
- Instance Type: Starter (can upgrade as needed)

## Auto-Deploy:
- Connect your GitHub repository
- Enable auto-deploy from main branch
- Render will automatically redeploy when you push to main

## Custom Domain (Optional):
- Add your custom domain in Render dashboard
- Update CORS origins in server/index.js if needed
