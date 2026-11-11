from playwright.sync_api import sync_playwright
import json
errs=[]
B="http://localhost:4173"
def st(pg): return json.loads(pg.evaluate("localStorage.getItem('foliocom:portfolio:v1')"))
with sync_playwright() as p:
    b=p.chromium.launch(); pg=b.new_page(viewport={"width":1440,"height":1000})
    pg.on("pageerror", lambda e: errs.append(str(e)))
    pg.goto(B+"/app/secoes"); pg.wait_for_timeout(900)
    pg.get_by_role("button", name="Salvar como meu modelo").click()
    pg.fill("input[name=name]","Alex · Audiovisual"); pg.get_by_role("button", name="Salvar", exact=True).click(); pg.wait_for_timeout(300)
    # trocar cor e modelo, depois CSS
    ap=pg.locator("section").filter(has_text="Aparência")
    ap.get_by_role("button", name="Editorial").first.click(); pg.wait_for_timeout(300)
    pg.locator("summary", has_text="CSS personalizado").click()
    pg.locator("textarea").first.fill("h1 { color: rgb(255, 0, 0) !important; } @import url(http://x); body { outline: 3px solid red }")
    pg.get_by_label("Ativar CSS").click(); pg.wait_for_timeout(800)
    fr=pg.frame_locator("iframe[title='Prévia do site']")
    color=fr.locator("h1").first.evaluate("e=>getComputedStyle(e).color"); print("h1 color in preview:", color)
    panel_h1=pg.locator("h1").first.evaluate("e=>getComputedStyle(e).color"); print("painel h1 color (não pode ser vermelho):", panel_h1)
    assert color=="rgb(255, 0, 0)" and panel_h1!="rgb(255, 0, 0)"
    css=fr.locator("style").last.inner_text(); assert "@import" not in css and ".fc-site h1" in css, css
    # seção salva
    pg.locator("li", has_text="Sobre").first.click(); pg.get_by_role("button", name="Salvar esta seção na biblioteca →").click()
    pg.fill("input[name=name]","Sobre editorial"); pg.get_by_role("button", name="Salvar", exact=True).click(); pg.wait_for_timeout(300)
    # biblioteca: aplicar só cores do modelo salvo
    pg.goto(B+"/app/biblioteca"); pg.wait_for_timeout(1000)
    pg.screenshot(path="shots/biblioteca.png")
    pg.get_by_role("button", name="Só cores e fontes").click(); pg.wait_for_timeout(300)
    pg.screenshot(path="shots/biblioteca-aplicar.png")
    pg.get_by_role("button", name="Aplicar", exact=True).click(); pg.wait_for_timeout(300)
    s=st(pg); print("tpl", s["site"]["templateId"], "accent", s["site"]["theme"]["accent"], "versões", len(s["versions"]), "lib", [i["kind"] for i in s["library"]])
    assert s["site"]["templateId"]=="editorial" and s["site"]["theme"]["accent"]=="#7c36ea"
    pg.get_by_role("button", name="Versões e restaurar").click(); pg.wait_for_timeout(300)
    pg.screenshot(path="shots/versoes.png")
    pg.get_by_role("button", name="Ver e restaurar").last.click(); pg.wait_for_timeout(600)
    pg.get_by_role("button", name="Restaurar esta versão").click(); pg.wait_for_timeout(300)
    print("após restaurar:", st(pg)["site"]["templateId"])
    # estúdio
    pg.goto(B+"/app/estudio"); pg.wait_for_timeout(800)
    pg.get_by_role("button", name="Editar arte").nth(1).click(); pg.wait_for_timeout(500)
    pg.set_input_files("input[type=file]", "fixtures/teste.jpg"); pg.wait_for_timeout(800)
    pg.get_by_role("button", name="Vertical 9:16").click(); pg.get_by_role("button", name="Ajustar ao modelo").click(); pg.wait_for_timeout(400)
    pg.screenshot(path="shots/estudio-editor.png")
    pg.get_by_role("button", name="Salvar e usar como capa").click(); pg.wait_for_timeout(600)
    s=st(pg); w=s["works"][0]; print("cover data?", w["cover"][:11], "original", w.get("coverOriginal","")[:10], "versões", len(w.get("coverVersions",[])))
    assert w["cover"].startswith("data:image/jpeg") and w["coverOriginal"].startswith("grad:")
    pg.screenshot(path="shots/estudio.png")
    # mídia: arquivo grande no grátis
    pg.goto(B+"/app/trabalhos?novo=1"); pg.wait_for_timeout(500)
    pg.get_by_role("button", name="Enviar arquivo").click()
    pg.set_input_files("input[type=file]", "fixtures/video-grande.mp4"); pg.wait_for_timeout(500)
    msg=pg.locator("text=passa do limite").count(); print("bloqueio por limite:", msg)
    assert msg>0
    pg.screenshot(path="shots/trabalhos-cota.png")
    b.close()
print("ERRORS:", errs or "none")
