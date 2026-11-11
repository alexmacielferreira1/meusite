export const PROVIDERS = [
 {id:"youtube",label:"YouTube",prefix:"https://www.youtube.com/watch?v=",hint:"Somente o código de 11 caracteres do vídeo",pattern:/^[\w-]{11}$/},
 {id:"vimeo",label:"Vimeo",prefix:"https://vimeo.com/",hint:"Código numérico do vídeo",pattern:/^\d{1,15}(?:\/[a-zA-Z0-9]+)?$/},
 {id:"instagram-reel",label:"Instagram · Reel",prefix:"https://www.instagram.com/reel/",hint:"Código do Reel público",pattern:/^[\w-]{3,100}$/},
 {id:"instagram-post",label:"Instagram · Publicação",prefix:"https://www.instagram.com/p/",hint:"Código da publicação pública",pattern:/^[\w-]{3,100}$/},
 {id:"drive",label:"Google Drive",prefix:"https://drive.google.com/file/d/",hint:"ID do arquivo; compartilhe com qualquer pessoa com o link",pattern:/^[\w-]{10,200}$/},
 {id:"facebook",label:"Facebook",prefix:"",hint:"URL pública do vídeo ou publicação; links de compartilhamento podem exigir abrir na origem"},
 {id:"tiktok",label:"TikTok",prefix:"",hint:"URL completa do vídeo público"},
 {id:"spotify",label:"Spotify",prefix:"",hint:"URL pública de episódio, faixa ou programa"},
 {id:"soundcloud",label:"SoundCloud",prefix:"",hint:"URL pública do áudio"},
 {id:"behance",label:"Behance",prefix:"",hint:"URL do projeto"},
 {id:"other",label:"Outra origem / site / arquivo",prefix:"",hint:"Endereço completo com https://"},
] as const;
export type ProviderId=typeof PROVIDERS[number]["id"];
export function publicUrl(value:string):URL|null {try{const u=new URL(value);return /^https?:$/.test(u.protocol)&&!u.username&&!u.password?u:null;}catch{return null;}}
export function identifyProvider(value:string):ProviderId {
 const u=publicUrl(value);if(!u)return "other";const h=u.hostname.toLowerCase().replace(/^www\./,"");
 if(["youtube.com","m.youtube.com","youtu.be","youtube-nocookie.com"].includes(h))return "youtube";
 if(h==="vimeo.com"||h==="player.vimeo.com")return "vimeo";
 if(h==="instagram.com")return u.pathname.startsWith("/reel/")?"instagram-reel":"instagram-post";
 if(h==="drive.google.com"||h==="docs.google.com")return "drive";
 if(h==="facebook.com"||h==="m.facebook.com"||h==="fb.watch")return "facebook";
 if(h==="tiktok.com"||h.endsWith(".tiktok.com"))return "tiktok";
 if(h==="open.spotify.com")return "spotify";
 if(h==="soundcloud.com"||h==="on.soundcloud.com")return "soundcloud";
 if(h==="behance.net")return "behance";
 return "other";
}
export function mediaCode(id:ProviderId,value:string):string {
 const u=publicUrl(value);if(!u)return value.trim();const parts=u.pathname.split("/").filter(Boolean);
 if(id==="youtube"&&identifyProvider(value)==="youtube")return u.searchParams.get("v")||parts[parts.length-1]||"";
 if(id==="vimeo"&&identifyProvider(value)==="vimeo")return parts.filter(x=>x!=="video").join("/");
 if(id.startsWith("instagram")&&identifyProvider(value).startsWith("instagram"))return parts[1]||"";
 if(id==="drive"&&identifyProvider(value)==="drive")return /\/d\/([\w-]+)/.exec(u.pathname)?.[1]||u.searchParams.get("id")||"";
 return value;
}
export function buildMediaUrl(id:ProviderId,value:string) {
 const p=PROVIDERS.find(p=>p.id===id)!; const code=mediaCode(id,value).trim();
 return p.prefix?`${p.prefix}${code}${id==="drive"?"/view":id.startsWith("instagram")?"/":""}`:code;
}
export function mediaError(id:ProviderId,value:string) {
 if(!value)return "Informe o endereço ou código do trabalho.";
 const p=PROVIDERS.find(p=>p.id===id)!; const code=mediaCode(id,value);
 if("pattern" in p)return p.pattern.test(code)?"":p.hint;
 const u=publicUrl(value);if(!u)return "Informe um endereço válido com http:// ou https://.";
 return id!=="other"&&identifyProvider(value)!==id?`Use um link de ${p.label}, ou selecione Outra origem.`:"";
}
export function providerEmbed(value?:string):string|null {
 if(!value)return null; const u=publicUrl(value);if(!u)return null;const id=identifyProvider(value);if(mediaError(id,value))return null;
 const code=mediaCode(id,value);
 if(id==="youtube")return `https://www.youtube-nocookie.com/embed/${code}?autoplay=1`;
 if(id==="vimeo"){const [video,hash]=code.split("/");return `https://player.vimeo.com/video/${video}?autoplay=1${hash?`&h=${hash}`:""}`;}
 if(id.startsWith("instagram"))return `https://www.instagram.com/${id==="instagram-reel"?"reel":"p"}/${code}/embed/`;
 if(id==="drive")return `https://drive.google.com/file/d/${code}/preview`;
 if(id==="facebook"&&["facebook.com","www.facebook.com","m.facebook.com"].includes(u.hostname))return `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(value)}&show_text=false`;
 if(id==="tiktok"){const video=/\/video\/(\d{10,25})/.exec(u.pathname)?.[1];return video?`https://www.tiktok.com/player/v1/${video}`:null;}
 if(id==="spotify"&&/^\/(track|episode|show|album|playlist)\/[\w]+/.test(u.pathname))return `https://open.spotify.com/embed${u.pathname}`;
 if(id==="soundcloud"&&u.hostname==="soundcloud.com")return `https://w.soundcloud.com/player/?url=${encodeURIComponent(value)}&auto_play=false`;
 return null;
}
