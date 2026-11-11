from playwright.sync_api import sync_playwright
errs=[]
with sync_playwright() as p:
    b=p.chromium.launch(); pg=b.new_page(viewport={"width":1440,"height":1000})
    pg.on("pageerror", lambda e: errs.append(str(e)))
    pg.goto("http://localhost:4173/app/modelos"); pg.wait_for_timeout(1500)
    pg.click("text=Todos >> nth=0"); pg.wait_for_timeout(800)
    pg.screenshot(path="shots/modelos.png", full_page=True)
    pg.get_by_label("Ver Documental em tamanho grande").click(); pg.wait_for_timeout(1200)
    pg.screenshot(path="shots/modelos-grande.png")
    pg.get_by_role("button", name="Usar este modelo").last.click(); pg.wait_for_url("**/app/secoes"); pg.wait_for_timeout(1200)
    pg.get_by_text("Trabalhos", exact=True).nth(1).click(); pg.wait_for_timeout(300)
    pg.get_by_role("button", name="Impacto", exact=True).first.click(); pg.wait_for_timeout(1500)
    pg.screenshot(path="shots/secoes-variante.png")
    b.close()
print("ERRORS:", errs or "none")
