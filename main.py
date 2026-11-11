"""Reserva para a ShardCloud: com o comando do painel vazio, ela executa ``python main.py``.

Todo o início em produção está no ``run.py``; este arquivo só o chama.
"""

import runpy
from pathlib import Path

if __name__ == "__main__":
    runpy.run_path(str(Path(__file__).resolve().parent / "run.py"), run_name="__main__")
