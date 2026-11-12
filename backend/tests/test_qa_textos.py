from fastapi.testclient import TestClient

from app.main import app


def test_site_inexistente_fala_de_site_e_nao_de_portfolio():
    """QA 12/11/2026: texto herdado do Folios dizia "Portfólio não publicado"."""
    response = TestClient(app).get("/api/v1/public/sites/nao-existe-qa")
    assert response.status_code == 404
    assert response.json()["detail"] == "Site não publicado ou endereço inválido."
