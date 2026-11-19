(function(root){
 'use strict';
 const clean=(value,max=500)=>typeof value==='string'?value.trim().slice(0,max):'';
 function validate(data){
  if(!data||typeof data!=='object'||!Array.isArray(data.services))throw new Error('El archivo no contiene una lista de servicios válida.');
  if(data.services.length>30)throw new Error('Puedes administrar hasta 30 servicios.');
  const ids=new Set();let totalImageCharacters=0;
  const services=data.services.map((s,i)=>{
   if(!s||typeof s!=='object'||!clean(s.title,90))throw new Error(`El servicio ${i+1} necesita un título.`);
   if(typeof s.image==='string'&&s.image.length>1000000)throw new Error('La imagen de un servicio supera el tamaño permitido.');
   const image=clean(s.image,1000000);totalImageCharacters+=image.length;
   if(totalImageCharacters>3000000)throw new Error('El catálogo supera el límite de imágenes de 3 MB. Reduce el tamaño de las imágenes antes de exportar.');
   if(image&&!/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/.test(image))throw new Error('Las imágenes deben ser PNG, JPG o WebP cargadas desde el panel.');
   const id=clean(s.id,80)||`service-${i}`;
   if(ids.has(id))throw new Error('Hay servicios con identificadores duplicados.');ids.add(id);
   return {id,title:clean(s.title,90),category:clean(s.category,40),description:clean(s.description,500),features:Array.isArray(s.features)?s.features.slice(0,8).map(x=>clean(x,120)).filter(Boolean):[],price:clean(s.price,80),image,published:s.published!==false};
  });
  return {version:1,heading:clean(data.heading,130)||'Software para tu forma de trabajar.',description:clean(data.description,600),services};
 }
 function serialize(data){return 'window.RAYLAB_SERVICES = '+JSON.stringify(validate(data),null,2).replace(/</g,'\\u003c').replace(/>/g,'\\u003e').replace(/\u2028/g,'\\u2028').replace(/\u2029/g,'\\u2029')+';\n';}
 function catalogZip(data){
  const name=new TextEncoder().encode('js/services-data.js'),body=new TextEncoder().encode(serialize(data));
  let crc=0xffffffff;for(const byte of body){crc^=byte;for(let bit=0;bit<8;bit++)crc=(crc>>>1)^((crc&1)?0xedb88320:0)}crc=(crc^0xffffffff)>>>0;
  const localSize=30+name.length+body.length,centralSize=46+name.length;
  const bytes=new Uint8Array(localSize+centralSize+22),view=new DataView(bytes.buffer);
  const u16=(o,n)=>view.setUint16(o,n,true),u32=(o,n)=>view.setUint32(o,n,true);
  u32(0,0x04034b50);u16(4,20);u16(6,0x800);u16(12,33);u32(14,crc);u32(18,body.length);u32(22,body.length);u16(26,name.length);bytes.set(name,30);bytes.set(body,30+name.length);
  const c=localSize;u32(c,0x02014b50);u16(c+4,20);u16(c+6,20);u16(c+8,0x800);u16(c+14,33);u32(c+16,crc);u32(c+20,body.length);u32(c+24,body.length);u16(c+28,name.length);bytes.set(name,c+46);
  const e=localSize+centralSize;u32(e,0x06054b50);u16(e+8,1);u16(e+10,1);u32(e+12,centralSize);u32(e+16,localSize);return bytes;
 }
 const api={validate,serialize,catalogZip};root.RaylabServices=api;
 if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
