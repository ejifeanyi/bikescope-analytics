# data/scripts/process_trip_data.py
import pandas as pd
import sys
import os
from datetime import datetime
import pymongo
from dotenv import load_dotenv

# Add parent directory to path to import from backend
sys.path.append(os.path.join(os.path.dirname(__file__), '..', '..', 'backend'))
from app.database.database import trips_collection, stations_collection

load_dotenv()

def assign_tenant_from_coordinates(lat, lon):
    """Assign tenant based on station coordinates - Manhattan vs Brooklyn only"""
    if pd.isna(lat) or pd.isna(lon):
        return "manhattan"  # default
    
    # Brooklyn assignment - covers all Brooklyn areas
    if lat < 40.68:  # South Brooklyn (Coney Island, Bay Ridge area)
        return "brooklyn"
    elif lat < 40.72 and lon > -73.98:  # Central/North Brooklyn (Williamsburg, DUMBO, Brooklyn Heights)
        return "brooklyn"
    elif lat < 40.71 and lon > -73.95:  # Eastern Brooklyn areas
        return "brooklyn"
    else:
        # Everything else (Manhattan, Bronx, Staten Island, etc.) goes to Manhattan
        return "manhattan"

def process_trip_data(csv_file_path):
    """Process historical trip data and load into MongoDB"""
    
    print(f"Loading trip data from: {csv_file_path}")
    
    # Read CSV with pandas - fix the dtype warning
    try:
        df = pd.read_csv(csv_file_path, low_memory=False)
        print(f"Loaded {len(df)} trip records")
    except Exception as e:
        print(f"Error loading CSV: {e}")
        return
    
    # Clean column names (remove spaces)
    df.columns = df.columns.str.strip()
    
    # Print available columns for debugging
    print("Available columns:", df.columns.tolist())
    
    # Map common column name variations
    column_mapping = {
        'starttime': 'started_at',
        'stoptime': 'ended_at',
        'start time': 'started_at',
        'stop time': 'ended_at',
        'start station id': 'start_station_id',
        'end station id': 'end_station_id',
        'start station latitude': 'start_station_latitude',
        'start station longitude': 'start_station_longitude',
        'tripduration': 'duration_seconds',
        'start_lat': 'start_station_latitude',
        'start_lng': 'start_station_longitude'
    }
    
    df = df.rename(columns=column_mapping)
    
    # Required columns (removed duration_seconds since we'll calculate it)
    required_cols = ['started_at', 'ended_at', 'start_station_id']
    
    # Check if we have coordinate data
    has_coordinates = 'start_station_latitude' in df.columns and 'start_station_longitude' in df.columns
    
    if not has_coordinates:
        print("No coordinate data found in CSV. Will use station lookup for tenant assignment.")
        # Create station lookup from current stations collection
        try:
            stations_cursor = stations_collection.find({}, {"station_id": 1, "tenant_id": 1})
            station_lookup = {str(station["station_id"]): station["tenant_id"] for station in stations_cursor}
            print(f"Loaded {len(station_lookup)} stations for tenant lookup")
        except Exception as e:
            print(f"Error loading stations from database: {e}")
            print("Using coordinate-based assignment as fallback")
            station_lookup = {}
            # If we have lat/lng columns, we can still use coordinate-based assignment
            if 'start_lat' in df.columns and 'start_lng' in df.columns:
                has_coordinates = True
                df['start_station_latitude'] = df['start_lat']
                df['start_station_longitude'] = df['start_lng']
    
    # Check for required columns
    missing_cols = [col for col in required_cols if col not in df.columns]
    if missing_cols:
        print(f"Missing required columns: {missing_cols}")
        return
    
    # Clean data
    print("Cleaning data...")
    initial_count = len(df)
    
    # Remove rows with missing critical data
    df = df.dropna(subset=required_cols)
    
    # Convert datetime columns
    df['started_at'] = pd.to_datetime(df['started_at'])
    df['ended_at'] = pd.to_datetime(df['ended_at'])
    
    # Calculate duration in seconds
    df['duration_seconds'] = (df['ended_at'] - df['started_at']).dt.total_seconds()
    
    # Convert station IDs to strings
    df['start_station_id'] = df['start_station_id'].astype(str)
    df['end_station_id'] = df['end_station_id'].astype(str)
    
    # Ensure duration is numeric and positive
    df['duration_seconds'] = pd.to_numeric(df['duration_seconds'], errors='coerce')
    df = df.dropna(subset=['duration_seconds'])
    
    # Remove unrealistic durations (less than 1 minute or more than 24 hours)
    df = df[(df['duration_seconds'] >= 60) & (df['duration_seconds'] <= 86400)]
    
    print(f"After cleaning: {len(df)} records (removed {initial_count - len(df)} invalid records)")
    
    # Assign tenants
    print("Assigning tenants...")
    if has_coordinates:
        print("Using coordinate-based tenant assignment")
        df['tenant_id'] = df.apply(
            lambda row: assign_tenant_from_coordinates(
                row['start_station_latitude'], 
                row['start_station_longitude']
            ), axis=1
        )
    else:
        print("Using station lookup for tenant assignment")
        df['tenant_id'] = df['start_station_id'].map(station_lookup).fillna('manhattan')
    
    # Show tenant distribution
    print("Tenant distribution:")
    print(df['tenant_id'].value_counts())
    
    # Prepare documents for MongoDB
    print("Preparing documents for MongoDB...")
    
    trip_documents = []
    for _, row in df.iterrows():
        doc = {
            "tenant_id": row['tenant_id'],
            "started_at": row['started_at'],
            "ended_at": row['ended_at'],
            "start_station_id": row['start_station_id'],
            "end_station_id": row['end_station_id'],
            "duration_seconds": int(row['duration_seconds'])
        }
        trip_documents.append(doc)
    
    # Insert in batches
    print(f"Inserting {len(trip_documents)} trip records...")
    batch_size = 10000
    
    # Clear existing trip data first
    try:
        result = trips_collection.delete_many({})
        print(f"Cleared {result.deleted_count} existing trip records")
    except Exception as e:
        print(f"Error clearing existing data: {e}")
    
    try:
        for i in range(0, len(trip_documents), batch_size):
            batch = trip_documents[i:i + batch_size]
            trips_collection.insert_many(batch)
            print(f"Inserted batch {i//batch_size + 1}: {len(batch)} records")
    except Exception as e:
        print(f"Error inserting data: {e}")
        return
    
    print("Trip data processing completed!")
    
    # Show some statistics
    try:
        manhattan_count = trips_collection.count_documents({"tenant_id": "manhattan"})
        brooklyn_count = trips_collection.count_documents({"tenant_id": "brooklyn"})
        
        print(f"\nFinal statistics:")
        print(f"Manhattan trips: {manhattan_count}")
        print(f"Brooklyn trips: {brooklyn_count}")
        print(f"Total trips: {manhattan_count + brooklyn_count}")
    except Exception as e:
        print(f"Error getting final statistics: {e}")

if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: python process_trip_data.py <path_to_csv_file>")
        sys.exit(1)
    
    csv_file_path = sys.argv[1]
    if not os.path.exists(csv_file_path):
        print(f"File not found: {csv_file_path}")
        sys.exit(1)
    
    process_trip_data(csv_file_path)