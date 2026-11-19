(function (root) {
  'use strict';
  const question = (label, placeholder) => ({label, placeholder});
  const choice = (label, options) => ({label, options});
  const services = {
    web: {label:'Diseño y desarrollo de páginas web', questions:[
      choice('¿Qué tipo de página necesitas?', ['Landing page','Web corporativa','Tienda virtual','Desarrollo personalizado','Necesito orientación']),
      question('¿Qué funcionalidades deseas?', 'Ej.: formulario, catálogo, reservas. Si no lo sabes, pide orientación.'),
      question('¿Tienes alguna página de referencia?', 'Comparte un enlace o escribe «No tengo referencias».'),
      question('¿Para cuándo la necesitas?', 'Fecha aproximada o «No tengo una fecha definida».')
    ]},
    odoo: {label:'Odoo ERP', questions:[
      question('¿Qué procesos deseas gestionar?', 'Ej.: ventas, inventario, compras o administración.'),
      choice('¿Utilizas Odoo actualmente?', ['Sí','No','Estoy evaluándolo']),
      question('¿Qué módulos necesitas?', 'Menciona los módulos o escribe «Necesito orientación».'),
      question('¿Cuántos usuarios utilizarán el sistema?', 'Cantidad aproximada o «Por definir».')
    ]},
    whatsapp: {label:'Agentes inteligentes de WhatsApp', questions:[
      question('¿Qué consultas deseas automatizar?', 'Ej.: servicios, horarios y envío de catálogos.'),
      choice('¿Utilizas WhatsApp Business?', ['Sí, la aplicación','Sí, la plataforma/API','No','No estoy seguro']),
      question('¿Necesitas integración con otros sistemas?', 'Indica cuáles, «No» o «Necesito orientación».'),
      question('¿Qué volumen aproximado de consultas recibes?', 'Ej.: 20 consultas al día o «Todavía no lo sé».')
    ]},
    microapps: {label:'Desarrollo de microapps', questions:[
      question('¿Qué problema necesitas resolver?', 'Describe brevemente la tarea que quieres simplificar.'),
      question('¿Qué funcionalidades necesitas?', 'Ej.: calcular importes, recibir reservas o registrar solicitudes.'),
      question('¿Quiénes utilizarán la aplicación?', 'Ej.: clientes, equipo interno o ambos.'),
      question('¿Necesitas integraciones?', 'Indica las herramientas, «No» o «Por definir».')
    ]},
    ads: {label:'Meta Ads y Google Ads', questions:[
      question('¿Qué deseas promocionar?', 'Tu producto, servicio o campaña.'),
      question('¿Cuál es tu objetivo comercial?', 'Ej.: recibir consultas, presentar una oferta o atraer visitas.'),
      choice('¿En qué plataformas deseas anunciarte?', ['Meta Ads','Google Ads','Ambas','Necesito orientación']),
      question('¿Cuál es tu presupuesto aproximado?', 'Indica monto, moneda y período, o escribe «Por definir».')
    ]},
    analytics: {label:'Analítica y medición digital', questions:[
      question('¿Qué página o plataforma deseas medir?', 'Comparte su dirección o nombre. Sin accesos ni contraseñas.'),
      question('¿Qué información necesitas conocer?', 'Ej.: origen de visitas, formularios o clics de contacto.'),
      choice('¿Utilizas Google Analytics actualmente?', ['Sí','No','No estoy seguro']),
      choice('¿Necesitas reportes o dashboards?', ['Sí, reportes','Sí, un dashboard','Ambos','Necesito orientación'])
    ]},
    nfc: {label:'Soluciones NFC', questions:[
      question('¿Para qué utilizarás la tecnología NFC?', 'Ej.: tarjeta de presentación, catálogo o punto de atención.'),
      question('¿Qué información deseas compartir?', 'Ej.: contacto, redes sociales, menú o catálogo.'),
      question('¿Cuántas unidades necesitas?', 'Cantidad aproximada o «Por definir».'),
      choice('¿Necesitas un diseño personalizado?', ['Sí','No, ya tengo un diseño','Necesito orientación'])
    ]}
  };
  const text = value => String(value || '').trim();
  const validContact = value => {
    const s = text(value);
    if (s.includes('@')) return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
    return /^[+\d\s().-]+$/.test(s) && /^\d{7,15}$/.test(s.replace(/\D/g,''));
  };
  function validate(data) {
    const errors = {};
    if (!Object.hasOwn(services,data.service)) errors.service = 'Selecciona un servicio para continuar.';
    if (!text(data.name)) errors.name = 'Escribe tu nombre.';
    if (!validContact(data.contact)) errors.contact = 'Escribe un correo válido o un número de WhatsApp de 7 a 15 dígitos, con código de país.';
    if (Object.hasOwn(services,data.service)) services[data.service].questions.forEach((q,i) => {
      const answer = text(data.answers?.[i]);
      if (!answer) errors['answer-'+i] = 'Completa esta respuesta. Si no lo sabes, indica que necesitas orientación.';
      else if (answer.length>450 || (q.options && !q.options.includes(answer))) errors['answer-'+i] = 'Revisa esta respuesta y selecciona una opción válida.';
    });
    if (text(data.name).length>100 || text(data.contact).length>160 || text(data.company).length>120 || text(data.comments).length>700) errors.length = 'Reduce el texto para respetar los límites de los campos.';
    return errors;
  }
  function buildMessage(data) {
    if (Object.keys(validate(data)).length) throw new Error('Solicitud incompleta o inválida.');
    const service = services[data.service];
    const lines = ['Hola, Raylab. Quiero solicitar una cotización.','', 'Servicio: '+service.label,'','SOBRE MI PROYECTO'];
    service.questions.forEach((q,i) => lines.push(q.label, text(data.answers[i]), ''));
    lines.push('DATOS DE CONTACTO','Nombre: '+text(data.name));
    if(text(data.company)) lines.push('Empresa: '+text(data.company));
    lines.push('WhatsApp o correo: '+text(data.contact));
    if(text(data.comments)) lines.push('','COMENTARIOS',text(data.comments));
    return lines.join('\n');
  }
  const api = Object.freeze({services, validContact, validate, buildMessage});
  root.RaylabQuotation = api;
  if(typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
