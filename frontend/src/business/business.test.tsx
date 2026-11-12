import {describe,it,expect} from "vitest";
import {renderToStaticMarkup} from "react-dom/server";
import {SEGMENTS,BOARDS} from "./catalog";
import {MODEL_LIST} from "./Public";
import {businessDemo,adaptBusiness,sampleBusiness} from "./adapter";
import {BusinessSite} from "./BusinessSite";

describe('MeuSite: catálogo e adaptação',()=>{
 it('inclui 75 composições e 30 direções, sem IDs repetidos',()=>{
  expect(MODEL_LIST).toHaveLength(105);expect(new Set(MODEL_LIST.map(x=>x.id)).size).toBe(105);expect(SEGMENTS).toHaveLength(30);expect(BOARDS).toHaveLength(10);
 });
 it('preserva conteúdo empresarial e não publica redes de demonstração da pessoa',()=>{
  const p=businessDemo('imobiliaria','editor-pro');expect(p.profile.name).toBe(p.business?.name);expect(p.profile.linkedin).toBe('');expect(p.experience).toEqual([]);expect(p.education).toEqual([]);expect(p.works[0].title).toBe(p.business?.items[0].name);expect(p.works[0].kind).toBe('image');
 });
 it('troca composição sem mudar segmento ou itens do negócio',()=>{
  const p=businessDemo('pizzaria','biz-restaurante');const html=renderToStaticMarkup(<BusinessSite portfolio={p} preview/>);expect(html).toContain('ms-layout-poster');expect(html).toContain('Pizzaria Aurora');expect(p.business?.segment).toBe('pizzaria');
 });
 it('preserva projeto e versões de arte ao editar dados do negócio',()=>{
  const p=businessDemo();p.works[0].coverOriginal='data:image/jpeg;base64,original';p.works[0].coverVersions=['data:image/jpeg;base64,version'];const next=adaptBusiness(p,{...p.business!,name:'Outro nome'});expect(next.works[0].coverVersions).toEqual(p.works[0].coverVersions);expect(next.works[0].coverOriginal).toBe(p.works[0].coverOriginal);
 });
 it('cada segmento recebe uma apresentação própria e objetivo coerente',()=>{
  expect(new Set(SEGMENTS.map(s=>sampleBusiness(s.id).headline)).size).toBe(30);expect(sampleBusiness('pizzaria').orderMode).toBe('order');expect(sampleBusiness('imobiliaria').items[0].kind).toBe('property');expect(sampleBusiness('pilates').orderMode).toBe('booking');
 });
});

describe('QA 12/11: textos do catálogo',()=>{
  it('um item diz "1 opção" e o aviso de meia-meia só aparece se algum item permite',()=>{
    const p=businessDemo('pizzaria','biz-restaurante');
    p.business!.items=[{...p.business!.items[0],allowHalf:false}];p.business!.halfPizza=true;
    let html=renderToStaticMarkup(<BusinessSite portfolio={p} preview/>);
    expect(html).toContain('1 opção</span>');expect(html).not.toContain('Meia-meia:');
    p.business!.items=[{...p.business!.items[0],allowHalf:true}];
    html=renderToStaticMarkup(<BusinessSite portfolio={p} preview/>);
    expect(html).toContain('Meia-meia:');
  });
});

import {faqFor} from "./adapter";
describe('QA 12/11: FAQ de exemplo segue o tipo de negócio',()=>{
  it('pedido, horário, orçamento e imóvel têm perguntas próprias',()=>{
    expect(faqFor('order').map(x=>x.question)).toEqual(['Como faço um pedido?','O pedido é confirmado na hora?']);
    expect(faqFor('booking')[1].question).toBe('Os horários são confirmados automaticamente?');
    expect(faqFor('quote')[1].question).toBe('Quanto tempo leva o orçamento?');
    expect(faqFor('quote',true)[1].question).toBe('Como agendo uma visita?');
    expect(businessDemo('pizzaria','biz-restaurante').business!.faq.map(x=>x.question)).not.toContain('Os horários são confirmados automaticamente?');
  });
});

describe('QA 12/11: FAQ sem resposta não é publicado',()=>{
  it('esconde pergunta vazia ou sem resposta',()=>{
    const p=businessDemo('pizzaria','biz-restaurante');
    p.business!.faq=[{question:'Fazem entrega?',answer:'Sim, na região.'},{question:'Nova pergunta',answer:''}];
    const html=renderToStaticMarkup(<BusinessSite portfolio={p} preview/>);
    expect(html).toContain('Fazem entrega?');expect(html).not.toContain('Nova pergunta');
    p.business!.faq=[{question:'Nova pergunta',answer:''}];
    expect(renderToStaticMarkup(<BusinessSite portfolio={p} preview/>)).not.toContain('Pode perguntar');
  });
});
