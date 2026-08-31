from pydantic import BaseModel


class OAuthInitiateIn(BaseModel):
    state: str | None = None


class GoogleCallbackIn(BaseModel):
    code: str
    state: str | None = None


class AppleCallbackIn(BaseModel):
    id_token: str
    state: str | None = None
    user: dict | None = None
