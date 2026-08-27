from fastapi import APIRouter
from sqlalchemy import select

from app.api.deps import CurrentUser, DbSession
from app.core.errors import AppError
from app.models.oauth_account import OAuthAccount

router = APIRouter(prefix="/oauth", tags=["oauth"])


@router.get("/providers")
def list_providers(user: CurrentUser, db: DbSession):
    accounts = db.scalars(
        select(OAuthAccount).where(OAuthAccount.user_id == user.id)
    ).all()

    return [
        {
            "id": a.id,
            "provider": a.provider,
            "provider_email": a.provider_email,
            "last_used_at": a.last_used_at.isoformat(),
        }
        for a in accounts
    ]


@router.post("/google")
def google_login():
    raise AppError(501, "Google OAuth is not configured yet.")


@router.post("/google/callback")
def google_callback():
    raise AppError(501, "Google OAuth is not configured yet.")


@router.post("/google/link")
def google_link():
    raise AppError(501, "Google OAuth is not configured yet.")


@router.delete("/google/unlink")
def google_unlink(user: CurrentUser, db: DbSession):
    account = db.scalar(
        select(OAuthAccount).where(
            OAuthAccount.user_id == user.id,
            OAuthAccount.provider == "google",
        )
    )
    if account is None:
        raise AppError(404, "Google account is not linked.")
    raise AppError(501, "Google OAuth is not configured yet.")


@router.post("/apple")
def apple_login():
    raise AppError(501, "Apple OAuth is not configured yet.")


@router.post("/apple/callback")
def apple_callback():
    raise AppError(501, "Apple OAuth is not configured yet.")


@router.post("/apple/link")
def apple_link():
    raise AppError(501, "Apple OAuth is not configured yet.")


@router.delete("/apple/unlink")
def apple_unlink(user: CurrentUser, db: DbSession):
    account = db.scalar(
        select(OAuthAccount).where(
            OAuthAccount.user_id == user.id,
            OAuthAccount.provider == "apple",
        )
    )
    if account is None:
        raise AppError(404, "Apple account is not linked.")
    raise AppError(501, "Apple OAuth is not configured yet.")
