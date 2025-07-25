# 🚀 Render Deployment Guide

## 📋 **Overview**

This guide explains the `render.yml` configuration for deploying the AGMO Farm application on Render.

## 🏗️ **Services Configuration**

### **1. Backend Service (Python/FastAPI)**

#### **Configuration:**

```yaml
- type: web
  name: agmo-farm-backend
  env: python
  plan: starter
```

#### **Build Process:**

```yaml
buildCommand: |
  cd backend
  pip install -r requirements.txt
```

#### **Start Command:**

```yaml
startCommand: |
  cd backend
  uvicorn agmo.main:app --host 0.0.0.0 --port $PORT
```

#### **Environment Variables:**

- **PYTHON_VERSION**: 3.10.12 (compatible with TensorFlow)
- **DATABASE_URL**: PostgreSQL connection string
- **SECRET_KEY**: Auto-generated for security
- **API Keys**: Manual configuration required

### **2. Frontend Service (Static/React)**

#### **Configuration:**

```yaml
- type: web
  name: agmo-farm-frontend
  env: static
```

#### **Build Process:**

```yaml
buildCommand: |
  cd frontend
  npm install
  npm run build
```

#### **Static Files:**

```yaml
staticPublishPath: ./frontend/dist
```

### **3. Database Service (PostgreSQL)**

#### **Configuration:**

```yaml
- name: agmo-farm-db
  databaseName: agmo_farm
  user: agmo_user
  plan: starter
```

## 🔧 **Key Features**

### **TensorFlow CPU Optimization:**

- ✅ **tensorflow-cpu** instead of full TensorFlow
- ✅ **Smaller package size** for faster deployment
- ✅ **Better compatibility** with Render's environment
- ✅ **Reduced memory usage**

### **Health Checks:**

- ✅ **Backend**: `/health` endpoint
- ✅ **Automatic monitoring** by Render
- ✅ **Deployment validation**

### **Auto-Deploy:**

- ✅ **Automatic deployments** on git push
- ✅ **Continuous integration** ready
- ✅ **Zero-downtime updates**

## 🚀 **Deployment Steps**

### **1. Connect Repository**

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click "New +" → "Blueprint"
3. Connect your GitHub repository
4. Select the repository with `render.yml`

### **2. Configure Environment Variables**

Set these in Render dashboard:

#### **Required:**

- `OPENAI_API_KEY` - Your OpenAI API key
- `WEATHER_API_KEY` - Weather API key (optional)
- `GOOGLE_MAPS_API_KEY` - Google Maps API key (optional)

#### **Optional:**

- `SMTP_USER` - Email configuration
- `SMTP_PASSWORD` - Email configuration

### **3. Deploy**

1. Render will automatically detect `render.yml`
2. Build all services in parallel
3. Deploy backend, frontend, and database
4. Configure service URLs automatically

## 📊 **Service URLs**

After deployment, you'll get:

- **Backend**: `https://agmo-farm-backend.onrender.com`
- **Frontend**: `https://agmo-farm-frontend.onrender.com`
- **Database**: Internal PostgreSQL database

## 🔍 **Monitoring**

### **Health Check Endpoints:**

- **Backend Health**: `GET /health`
- **Model Status**: Available via disease detection API

### **Logs:**

- **Backend Logs**: Available in Render dashboard
- **Build Logs**: Real-time build monitoring
- **Runtime Logs**: Application performance

## ⚠️ **Important Notes**

### **TensorFlow CPU:**

- ✅ **Optimized for server deployment**
- ✅ **No GPU dependencies**
- ✅ **Faster startup time**
- ✅ **Lower memory usage**

### **Database:**

- ✅ **PostgreSQL automatically provisioned**
- ✅ **Connection string auto-configured**
- ✅ **Backup and monitoring included**

### **Model Loading:**

- ✅ **Your trained model** (`maize_leaf_cnn_model.keras`)
- ✅ **Automatic model loading** on startup
- ✅ **Real disease detection** predictions

## 🎯 **Expected Results**

### **Successful Deployment:**

```
✅ Backend: https://agmo-farm-backend.onrender.com
✅ Frontend: https://agmo-farm-frontend.onrender.com
✅ Database: PostgreSQL (internal)
✅ TensorFlow: CPU-optimized model loading
✅ Health Check: /health endpoint responding
```

### **API Endpoints:**

- ✅ **Disease Detection**: `/api/disease-detection`
- ✅ **Authentication**: `/api/auth/*`
- ✅ **Farm Management**: `/api/farms/*`
- ✅ **Weather Data**: `/api/weather/*`

## 🚨 **Troubleshooting**

### **If Backend Fails:**

1. Check **Python version** (should be 3.10.12)
2. Verify **TensorFlow CPU** installation
3. Check **model file** exists in `backend/models/`
4. Review **build logs** for errors

### **If Frontend Fails:**

1. Check **Node.js version** (auto-detected)
2. Verify **npm install** completes
3. Check **build output** in `frontend/dist/`
4. Review **environment variables**

### **If Database Fails:**

1. Check **PostgreSQL connection**
2. Verify **database credentials**
3. Check **migration logs**
4. Review **connection string**

---

## ✅ **Status: Ready for Deployment**

The `render.yml` configuration is optimized for your TensorFlow maize disease detection application with CPU-optimized deployment and automatic service provisioning.
