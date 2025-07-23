# BikeScope Analytics 🚴‍♂️

A multi-tenant SaaS platform for bike share operators to monitor real-time station availability and operational alerts using live Citibike data.

## 🌟 Features

- **Real-time Station Monitoring**: Live station status updates with color-coded availability indicators
- **Multi-tenant Architecture**: Isolated data views for different bike share operators
- **Interactive Map Interface**: Leaflet-based map with clickable station markers
- **Operational Alerts System**: Automated alerts for low inventory, full stations, and offline status
- **Analytics Dashboard**: Historical trip data analysis with charts and metrics
- **Auto-refresh**: Background updates every 60 seconds from GBFS feeds

## 🏗️ Architecture

### Tech Stack

- **Frontend**: React 19 + TypeScript + Tailwind CSS
- **Backend**: Python + FastAPI + Motor (async MongoDB driver)
- **Database**: MongoDB with multi-tenant collections
- **Maps**: Leaflet + React-Leaflet
- **Charts**: Recharts
- **Data Source**: Citibike GBFS feeds + Historical trip data

### System Overview

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   React Frontend│    │  FastAPI Backend│    │   MongoDB Atlas │
│                 │    │                 │    │                 │
│ • Station Map   │◄──►│ • GBFS Service  │◄──►│ • Stations Coll │
│ • Alerts Feed   │    │ • Alert System  │    │ • Alerts Coll   │
│ • Analytics     │    │ • Analytics     │    │ • Trips Coll    │
│ • Tenant Switch │    │ • Multi-tenant  │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │
         └───────────────────────┼─────────► GBFS Feeds
                                 │           (60s intervals)
                                 └─────────► Citibike Data
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- Python 3.9+
- MongoDB Atlas account (or local MongoDB)

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd bikescope-analytics
```

### 2. Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Environment setup
cp .env.example .env
# Edit .env with your MongoDB credentials
```

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm start
```

### 4. Start the Backend

```bash
cd backend

# Run the FastAPI server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

The application will be available at:

- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API Documentation: http://localhost:8000/docs

## 📊 Data Import Scripts

The `data/scripts/` directory contains utilities for importing and processing historical data.

### Trip Data Processing

Use `process_trip_data.py` to import historical Citibike trip data from CSV files:

```bash
cd data/scripts

# Activate backend virtual environment first
source ../../backend/venv/bin/activate

# Process trip data CSV
python process_trip_data.py path/to/your/trip_data.csv
```

#### Script Features

**Data Processing Pipeline:**

- **CSV Validation**: Automatically detects and handles various CSV column formats
- **Data Cleaning**: Removes invalid records, calculates trip durations, filters unrealistic trips
- **Tenant Assignment**: Assigns trips to Manhattan/Brooklyn tenants based on coordinates or station lookup
- **Batch Processing**: Efficient bulk insertion with 10,000 record batches

**Supported CSV Formats:**
The script handles multiple CSV column naming conventions:

- Standard: `started_at`, `ended_at`, `start_station_id`, `end_station_id`
- Legacy: `starttime`, `stoptime`, `start time`, `stop time`
- Coordinate variants: `start_lat`/`start_lng` or `start_station_latitude`/`start_station_longitude`

**Tenant Assignment Logic:**

```python
# Brooklyn assignment criteria
if lat < 40.68:  # South Brooklyn (Coney Island, Bay Ridge)
    return "brooklyn"
elif lat < 40.72 and lon > -73.98:  # Central/North Brooklyn (Williamsburg, DUMBO)
    return "brooklyn"
elif lat < 40.71 and lon > -73.95:  # Eastern Brooklyn
    return "brooklyn"
else:
    return "manhattan"  # Everything else (Manhattan, Bronx, Staten Island)
```

**Data Quality Filters:**

- Removes trips with missing critical data
- Filters trips with duration < 1 minute or > 24 hours
- Validates datetime formats and numeric fields
- Ensures positive duration values

#### Usage Examples

```bash
# Process a standard Citibike CSV export
python process_trip_data.py ~/Downloads/202401-citibike-tripdata.csv

# Process historical data with different column names
python process_trip_data.py ~/data/legacy_trip_data.csv
```

#### Script Output

```
Loading trip data from: tripdata.csv
Loaded 2,456,789 trip records
Available columns: ['started_at', 'ended_at', 'start_station_id', ...]
Cleaning data...
After cleaning: 2,398,234 records (removed 58,555 invalid records)
Assigning tenants...
Using coordinate-based tenant assignment
Tenant distribution:
manhattan    1,876,543
brooklyn       521,691
Name: tenant_id, dtype: int64
Inserting 2,398,234 trip records...
Inserted batch 1: 10000 records
Inserted batch 2: 10000 records
...
Trip data processing completed!

Final statistics:
Manhattan trips: 1,876,543
Brooklyn trips: 521,691
Total trips: 2,398,234
```

#### Error Handling

The script includes comprehensive error handling for:

- **Missing Files**: Validates CSV file existence before processing
- **Invalid CSV Format**: Graceful handling of malformed CSV files
- **Database Connection**: Checks MongoDB connectivity and collection access
- **Memory Management**: Processes large files efficiently with batch operations
- **Data Validation**: Logs and skips invalid records without stopping processing

#### Dependencies

The script requires these Python packages (included in `backend/requirements.txt`):

- `pandas`: CSV processing and data manipulation
- `pymongo`: MongoDB database operations
- `python-dotenv`: Environment variable management

### Future Scripts

Additional data processing scripts could include:

- `process_station_data.py`: Import and update station information
- `generate_sample_data.py`: Create synthetic data for testing
- `data_migration.py`: Schema updates and data migrations
- `backup_restore.py`: Database backup and restoration utilities

## 🏢 Multi-Tenant Configuration

The system supports two demo tenants with geographical boundaries:

### Manhattan BikeShare

- **Coverage**: Stations south of 59th Street (lat < 40.769)
- **Tenant ID**: `manhattan`
- **Map Center**: Times Square area

### Brooklyn Cycle Co

- **Coverage**: Brooklyn stations (lat < 40.75 && lon < -73.95)
- **Tenant ID**: `brooklyn`
- **Map Center**: Brooklyn Heights area

Tenant filtering is implemented at the database level using `tenant_id` fields.

## 📊 Data Models

### Stations Collection

```javascript
{
  _id: ObjectId,
  tenant_id: "manhattan" | "brooklyn",
  station_id: "72",
  name: "W 52 St & 11 Ave",
  lat: 40.767,
  lon: -73.993,
  capacity: 39,
  current_status: {
    bikes_available: 12,
    docks_available: 24,
    last_updated: ISODate,
    is_installed: true,
    is_renting: true
  }
}
```

### Alerts Collection

```javascript
{
  _id: ObjectId,
  tenant_id: "brooklyn",
  station_id: "123",
  station_name: "Station Name",
  type: "low_bikes" | "full_station" | "offline",
  severity: "info" | "warning" | "critical",
  timestamp: ISODate,
  resolved: false
}
```

### Trips Collection

```javascript
{
  _id: ObjectId,
  tenant_id: "manhattan",
  started_at: ISODate,
  ended_at: ISODate,
  start_station_id: "72",
  end_station_id: "523",
  duration_seconds: 840
}
```

## 🔄 Real-time Data Flow

### GBFS Data Pipeline

1. **Background Service**: Fetches from Citibike GBFS every 60 seconds
2. **Data Processing**: Normalizes and assigns tenant IDs based on coordinates
3. **Alert Generation**: Triggers alerts based on availability thresholds
4. **Database Update**: Upserts station status and creates alert records
5. **Frontend Sync**: React hooks poll API endpoints for updates

### Alert Triggers

- **Low Bikes**: `bikes_available <= 3` → Warning severity
- **Station Full**: `docks_available <= 3` → Warning severity
- **Station Offline**: `is_installed == false` OR `is_renting == false` → Critical severity

## 📈 Analytics Features

### Computed Metrics

- **Top 5 Stations**: By trip start count (last 30 days)
- **Average Trip Duration**: Filtered for realistic values (1min - 24hrs)
- **Peak Usage Hour**: Most common trip start hour (0-23)
- **Total Trips**: Complete trip count per tenant

### Data Visualization

- Interactive bar chart for top stations
- Metric cards with icons and color coding
- Responsive design with Recharts integration

## 🗂️ Project Structure

```
bikescope-analytics/
├── frontend/                   # React TypeScript app
│   ├── src/
│   │   ├── components/         # React components
│   │   │   ├── AlertsFeed.tsx  # Alerts display
│   │   │   ├── AnalyticsPanel.tsx # Charts & metrics
│   │   │   ├── StationMap.tsx  # Leaflet map
│   │   │   └── ...
│   │   ├── hooks/             # Custom React hooks
│   │   │   └── useBikeData.ts # Data fetching hook
│   │   ├── services/          # API communication
│   │   │   └── api.ts
│   │   ├── utils/             # Helper functions
│   │   └── types/             # TypeScript interfaces
│   ├── package.json
│   └── tailwind.config.js
├── backend/                   # FastAPI Python app
│   ├── app/
│   │   ├── api/              # API routes
│   │   ├── core/             # Configuration
│   │   ├── database/         # MongoDB connection
│   │   ├── models/           # Pydantic schemas
│   │   ├── services/         # Business logic
│   │   │   ├── gbfs_service.py    # GBFS data fetching
│   │   │   ├── analytics_service.py # Analytics computation
│   │   │   └── alert_service.py   # Alert generation
│   │   └── main.py           # FastAPI app
│   ├── requirements.txt
│   └── .env
├── data/                      # Data processing utilities
│   └── scripts/              # Data import/processing scripts
│       └── process_trip_data.py  # Historical trip data processor
└── README.md
```

## 🔧 Configuration

### Environment Variables (.env)

```bash
# MongoDB Configuration
MONGODB_URL=mongodb+srv://username:password@cluster.mongodb.net/?retryWrites=true&w=majority
DB_PASSWORD=your_password
DATABASE_NAME=bikescope

# GBFS Endpoints (default values)
GBFS_INFO_URL=https://gbfs.citibikenyc.com/gbfs/en/station_information.json
GBFS_STATUS_URL=https://gbfs.citibikenyc.com/gbfs/en/station_status.json

# Update interval in seconds
UPDATE_INTERVAL=60
```

### Database Indexes

The system automatically creates optimized indexes:

- `stations`: `station_id` (unique), `tenant_id`
- `alerts`: `tenant_id + timestamp`, `station_id + timestamp`
- `trips`: `tenant_id`, `start_station_id`, `started_at`

## 🎯 API Endpoints

### Station Endpoints

- `GET /api/v1/stations/{tenant_id}` - Get all stations for tenant
- `POST /api/v1/stations/refresh` - Trigger manual GBFS refresh

### Alert Endpoints

- `GET /api/v1/alerts/{tenant_id}?limit=50` - Get recent alerts

### Analytics Endpoints

- `GET /api/v1/analytics/{tenant_id}` - Get analytics summary

### System Endpoints

- `GET /api/v1/health` - Health check
- `GET /` - API info

## 🎨 UI Components

### StationMap

- Leaflet integration with custom markers
- Color-coded status (🟢 healthy, 🟡 low availability, 🔴 empty/full)
- Click popups with station details
- Auto-refresh every 60 seconds

### AlertsFeed

- Real-time alert stream with severity colors
- Alert type icons and formatting
- Relative timestamps ("2m ago", "1h ago")
- Empty state handling

### AnalyticsPanel

- Key metrics cards with icons
- Top stations bar chart with tooltips
- Responsive grid layout
- Loading states and error handling

### TenantSelector

- Dropdown for switching between operators
- Instant data filtering and map updates

## 🔍 Technical Decisions

### Frontend Architecture

- **React Hooks**: Custom `useBikeData` hook centralizes all data fetching
- **TypeScript**: Strong typing for API responses and component props
- **Error Boundaries**: Graceful error handling with fallback UI
- **Tailwind CSS**: Utility-first styling with responsive design

### Backend Architecture

- **FastAPI**: Modern async Python framework with auto-generated docs
- **Motor**: Async MongoDB driver for high performance
- **Pydantic**: Data validation and serialization
- **Background Tasks**: Non-blocking GBFS updates with asyncio

### Database Design

- **Multi-tenant**: Single database with tenant_id filtering
- **Denormalized**: Station status embedded for fast reads
- **Indexed**: Strategic indexes for query performance
- **ObjectId**: MongoDB native IDs with Pydantic integration

## 🧪 Development

```bash
# Frontend build
cd frontend
npm run build

# Backend deployment
cd backend
# Deploy with gunicorn or similar ASGI server
```

## 🚦 Known Limitations

1. **Historical Data**: Requires manual CSV import for trip analytics
2. **Authentication**: Demo uses hardcoded tenant switching
3. **Scaling**: Single MongoDB instance (would need sharding for production)
4. **Error Recovery**: Limited retry logic for GBFS failures
5. **Real-time**: Polling-based updates (WebSockets would be more efficient)

## 🔮 Future Enhancements

- [ ] WebSocket integration for true real-time updates
- [ ] User authentication and role-based access
- [ ] Historical data import automation
- [ ] Advanced analytics (forecasting, trends)
- [ ] Mobile-responsive improvements
- [ ] Export functionality (CSV, PDF reports)
- [ ] Alert acknowledgment and management
- [ ] Performance monitoring and caching
