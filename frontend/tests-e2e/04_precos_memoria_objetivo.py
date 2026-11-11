from playwright.sync_api import sync_playwright
import json
errs=[]
with sync_playwright() as p:
    b=p.chromium.launch(); pg=b.new_page(viewport={"width":1440,"height":1000})
    pg.on("pageerror", lambda e: errs.append(str(e)))
    # memória por modelo
    pg.goto("http://localhost:4173/app/secoes"); pg.wait_for_timeout(1000)
    ap=pg.locator("section").filter(has_text="Aparência")
    ap.get_by_role("button", name="Cor #ff5c8a").click(); pg.wait_for_timeout(200)
    ap.get_by_role("button", name="Grade Suíça").first.click(); pg.wait_for_timeout(300)
    ap.get_by_role("button", name="Editor Pro").first.click(); pg.wait_for_timeout(300)
    st=json.loads(pg.evaluate("localStorage.getItem('foliocom:portfolio:v1')"))
    assert st["site"]["theme"]["accent"]=="#ff5c8a", st["site"]["theme"]
    print("memória por modelo OK")
    pg.goto("http://localhost:4173/app/configuracoes"); pg.wait_for_timeout(600)
    pg.screenshot(path="shots/config-v4.png", full_page=True)
    pg.get_by_role("button", name="+30 créditos · R$ 4,90").click()
    pg.goto("http://localhost:4173/p/marinaduarte"); pg.wait_for_timeout(1200)
    pg.screenshot(path="shots/editorpro-violeta.png")
    pg.evaluate("localStorage.clear()")
    pg.goto("http://localhost:4173/app/comecar"); pg.wait_for_timeout(400)
    pg.get_by_role("button", name="Designer").first.click(); pg.click("text=Continuar")
    pg.fill("input[placeholder='Ex.: Marina Duarte']","Bia Teste"); pg.locator("button", has_text="Conseguir clientes").click()
    pg.screenshot(path="shots/onboarding-objetivo.png")
    pg.click("text=Continuar"); pg.wait_for_timeout(500)
    pg.get_by_role("button", name="Gerar meu portfólio").click(); pg.wait_for_selector("text=Seu rascunho está pronto!", timeout=10000)
    st=json.loads(pg.evaluate("localStorage.getItem('foliocom:portfolio:v1')"))
    types=[s["type"] for s in st["site"]["sections"]]; print("goal", st["site"]["goal"], types)
    assert "services" in types and types[-1]=="contact"
    pg.goto("http://localhost:4173/"); pg.wait_for_timeout(1200)
    pg.locator("#planos").screenshot(path="shots/planos-v4.png")
    b.close()
print("ERRORS:", errs or "none")
