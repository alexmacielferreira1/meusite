import sys
from playwright.sync_api import sync_playwright
routes = [("landing","/",1440,900,True),("app-visao","/app",1440,1000,False),("app-secoes","/app/secoes",1440,1000,False),
 ("app-trabalhos","/app/trabalhos?novo=1",1440,1000,False),("app-assistente","/app/assistente",1440,1000,False),
 ("app-perfil","/app/perfil",1440,1000,False),("app-publicacao","/app/publicacao",1440,1000,False),
 ("app-config","/app/configuracoes",1440,1000,False),("site-editorpro","/p/marinaduarte",1440,900,True),
 ("site-mobile","/p/marinaduarte",390,844,False),("diretorio","/diretorio",1440,900,False),("onboarding","/app/comecar",1440,900,False),("cadastro","/cadastro",1440,900,False)]
errors=[]
with sync_playwright() as p:
    b=p.chromium.launch()
    for name,path,w,h,full in routes:
        pg=b.new_page(viewport={"width":w,"height":h})
        pg.on("pageerror", lambda e, n=name: errors.append(f"{n}: {e}"))
        pg.on("console", lambda m, n=name: errors.append(f"{n} console: {m.text}") if m.type=="error" else None)
        pg.goto("http://localhost:4173"+path); pg.wait_for_timeout(1500)
        pg.screenshot(path=f"shots/{name}.png", full_page=full)
        pg.close()
    b.close()
print("\n".join(errors) or "no errors")
