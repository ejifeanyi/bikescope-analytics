from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    db_password: str 
    mongodb_url: str 
    database_name: str
    gbfs_info_url: str = "https://gbfs.citibikenyc.com/gbfs/en/station_information.json"
    gbfs_status_url: str = "https://gbfs.citibikenyc.com/gbfs/en/station_status.json"
    update_interval: int = 60  # seconds

    class Config:
        env_file = ".env"

settings = Settings()
