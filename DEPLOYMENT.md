# Quick Deployment Guide

## 🚀 Deploy to Vercel in 5 minutes

### Step 1: Install Dependencies
```bash
npm install
```

### Step 2: Set up Database
Choose one of these cloud database providers:

**Option A: PlanetScale (Recommended)**
1. Go to [planetscale.com](https://planetscale.com)
2. Create account and new database
3. Copy connection string

**Option B: Railway**
1. Go to [railway.app](https://railway.app)
2. Create MySQL database
3. Copy connection string

### Step 3: Configure Environment
```bash
cp .env.example .env
```

Edit `.env` with your database URL:
```env
DATABASE_URL=mysql://username:password@host:port/database
NODE_ENV=production
```

### Step 4: Import Database Schema
Import `database_schema.sql` into your cloud database.

### Step 5: Deploy
```bash
# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login

# Deploy
vercel --prod
```

### Step 6: Configure Vercel Environment Variables
In your Vercel dashboard, add:
- `DATABASE_URL` - Your database connection string
- `NODE_ENV` - `production`

### Step 7: Test
Visit your deployed URL and test the application!

## 🔧 Advanced Setup

### Local Development
```bash
npm run dev
```

### Check Setup
```bash
npm run setup
```

### Re-deploy
```bash
npm run deploy
```

## 📋 Troubleshooting

**Database Connection Issues:**
- Verify DATABASE_URL in Vercel environment variables
- Check database is accessible from external connections
- Ensure SSL is enabled for production databases

**API Endpoints Not Working:**
- Check Vercel function logs
- Verify CORS headers are properly set
- Test API endpoints individually

**Frontend Issues:**
- Check browser console for errors
- Verify API_BASE_URL configuration
- Test with mock data fallback

## 🎯 Production Checklist

- [ ] Database set up and accessible
- [ ] Environment variables configured in Vercel
- [ ] Database schema imported
- [ ] API endpoints tested
- [ ] Frontend loads correctly
- [ ] Authentication working (if implemented)
- [ ] Mobile responsive design verified

## 📞 Support

Need help? Check:
1. [Vercel Documentation](https://vercel.com/docs)
2. [PlanetScale Documentation](https://docs.planetscale.com)
3. Project README.md
4. GitHub Issues

---

🎉 **Congratulations! Your CRM is now live on Vercel!** 