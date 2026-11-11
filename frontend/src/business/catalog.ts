export const BOARDS=[
 {n:11,title:"Sabores do bairro",names:["Pizzaria","Restaurante","Hamburgueria"],ids:["pizzaria","restaurante","hamburgueria"],mode:"order"},
 {n:12,title:"Pequenos prazeres",names:["Padaria","Cafeteria","Sorveteria"],ids:["padaria","cafeteria","sorveteria"],mode:"order"},
 {n:13,title:"Espaços para viver",names:["Imobiliária","Corretor de imóveis","Empreendimento"],ids:["imobiliaria","corretor","empreendimento"],mode:"quote"},
 {n:14,title:"Beleza e bem-estar",names:["Salão de beleza","Barbearia","Spa"],ids:["salao","barbearia","spa"],mode:"booking"},
 {n:15,title:"Cuidado próximo",names:["Odontologia","Clínica veterinária","Nutrição"],ids:["odontologia","veterinaria","nutricao"],mode:"booking"},
 {n:16,title:"Serviços que resolvem",names:["Oficina","Estética automotiva","Manutenção residencial"],ids:["oficina","estetica-auto","manutencao"],mode:"quote"},
 {n:17,title:"Mundo pet",names:["Petshop","Hotel pet","Adestramento"],ids:["petshop","hotel-pet","adestramento"],mode:"booking"},
 {n:18,title:"Corpo em movimento",names:["Academia","Pilates","Escola de futebol"],ids:["academia","pilates","futebol"],mode:"booking"},
 {n:19,title:"Viver experiências",names:["Pousada","Turismo local","Espaço de festas"],ids:["pousada","turismo","festas"],mode:"booking"},
 {n:20,title:"Comércio autoral",names:["Floricultura","Joalheria","Cerâmica"],ids:["floricultura","joalheria","ceramica"],mode:"order"},
] as const;
const palettes=["#d44824","#1c6c51","#ddab29","#b56b41","#5c714a","#e16c8e","#0f6868","#8e4b38","#668d36","#b65379","#af854a","#66916c","#3792aa","#6f8d3e","#d48065","#d8453a","#82a83b","#477f9b","#d68f34","#5f8c52","#8b68ae","#ec672b","#7585c1","#3d8744","#9c975c","#2c8d9b","#b35f71","#bd5676","#a08247","#b57850"];
export const SEGMENTS=BOARDS.flatMap((b,bi)=>b.ids.map((id,i)=>({id,name:b.names[i],board:b.n,boardTitle:b.title,mode:b.mode,accent:palettes[bi*3+i],layout:["split","poster","overlap","editorial","mosaic","horizontal","cinematic","portrait","stage","minimal","cards","story"][bi*3%12+i]??"split"})));
export const segmentById=(id:string)=>SEGMENTS.find(s=>s.id===id)??SEGMENTS[0];
