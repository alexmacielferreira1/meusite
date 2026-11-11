from playwright.sync_api import sync_playwright
errs=[]
with sync_playwright() as p:
    b=p.chromium.launch(); pg=b.new_page(viewport={"width":1440,"height":950})
    pg.on("pageerror", lambda e: errs.append(str(e)))
    pg.goto("http://localhost:4173/cadastro")
    pg.fill("input >> nth=0","Alex Maciel"); pg.fill("input[type=email]","alex@teste.com"); pg.fill("input[type=password]","12345678")
    pg.click("text=Criar conta"); pg.wait_for_url("**/app/comecar")
    pg.click("text=Fotógrafo"); pg.click("text=Continuar")
    pg.fill("input[placeholder='Porto Alegre']","Porto Alegre"); pg.fill("input[placeholder='12']","16"); pg.click("text=Continuar")
    pg.click("text=Grade Suíça"); pg.click("text=Gerar meu portfólio")
    pg.wait_for_selector("text=Seu rascunho está pronto!", timeout=10000)
    pg.screenshot(path="shots/flow-1-pronto.png")
    pg.click("text=Ver meu site montado"); pg.wait_for_timeout(2000)
    pg.screenshot(path="shots/flow-2-secoes.png")
    pg.goto("http://localhost:4173/app/trabalhos?novo=1"); pg.wait_for_timeout(500)
    pg.fill("input[placeholder^='https://www.youtube']","https://www.youtube.com/watch?v=dQw4w9WgXcQ")
    pg.fill("input[placeholder='Ex.: Rios do Brasil']","Ensaio Orla do Guaíba")
    pg.fill("input[placeholder='Direção, roteiro e edição']","Fotografia")
    pg.click("text=Sugerir descrição com IA"); pg.wait_for_timeout(1300)
    pg.click("text=Salvar trabalho"); pg.wait_for_timeout(400)
    assert pg.locator("text=Ensaio Orla do Guaíba").count()>0, "trabalho não salvo"
    pg.goto("http://localhost:4173/app/assistente"); pg.click("text=Gerar sugestão"); pg.wait_for_timeout(1300)
    pg.click("text=Aplicar à bio"); pg.wait_for_timeout(300)
    pg.goto("http://localhost:4173/p/alex-maciel"); pg.wait_for_timeout(1200)
    pg.screenshot(path="shots/flow-3-site.png", full_page=True)
    assert pg.locator("text=Ensaio Orla do Guaíba").count()>0, "trabalho não aparece no site"
    b.close()
print("ERRORS:", errs or "none")
