from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    app_name: str = "图书盲盒分拣中控系统"
    debug: bool = True
    database_url: str = "sqlite:///./book_vending.db"
    device_simulator_enabled: bool = True

    class Config:
        env_file = ".env"


settings = Settings()
