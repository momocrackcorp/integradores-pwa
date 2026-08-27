/**
 * VERSION DE PRUEBA del router con soporte accion=ultimos.
 * NO desplegar sobre producción hasta validar el Apps Script histórico.
 *
 * Variables de entorno:
 *   INTEGRADORES_APPS_SCRIPT_URL
 *   MINICIERRE_APPS_SCRIPT_URL
 */
export default {
  async fetch(request, env) {
    const cors = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET,OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Cache-Control': 'no-store'
    };

    if (request.method === 'OPTIONS') return new Response(null,{status:204,headers:cors});
    if (request.method !== 'GET') return json({ok:false,error:'Método no permitido.'},405,cors);

    try {
      const incoming = new URL(request.url);
      const action = String(incoming.searchParams.get('accion') || '').toLowerCase();

      // Consulta de solo lectura para poblar "Anterior" en la PWA.
      if (action === 'ultimos') {
        const target = env.INTEGRADORES_APPS_SCRIPT_URL;
        if (!target) return json({ok:false,error:'Backend Integradores no configurado.'},500,cors);

        const upstream = new URL(target);
        upstream.searchParams.set('accion','ultimos');
        upstream.searchParams.set('t',Date.now().toString());

        const response = await fetch(upstream.toString(),{
          method:'GET',
          redirect:'follow',
          cf:{cacheTtl:0,cacheEverything:false}
        });
        const body = await response.text();
        const headers = new Headers(cors);
        headers.set('Content-Type',response.headers.get('Content-Type') || 'application/json; charset=utf-8');
        return new Response(body,{status:response.status,headers});
      }

      // Flujo existente de escritura por lote.
      const rawLot = incoming.searchParams.get('lote');
      if (!rawLot) return json({ok:false,error:'Falta parámetro lote.'},400,cors);

      let lot;
      try { lot = JSON.parse(rawLot); }
      catch { return json({ok:false,error:'Lote JSON inválido.'},400,cors); }

      const moduleName = String(lot?.modulo || 'INTEGRADORES').toUpperCase();
      let target;
      if (moduleName === 'NIVELES_TANQUES') target = env.MINICIERRE_APPS_SCRIPT_URL;
      else if (moduleName === 'INTEGRADORES') target = env.INTEGRADORES_APPS_SCRIPT_URL;
      else return json({ok:false,error:'Módulo no permitido: '+moduleName},400,cors);

      if (!target) return json({ok:false,error:'Backend no configurado para '+moduleName},500,cors);

      const upstream = new URL(target);
      upstream.searchParams.set('lote',rawLot);
      upstream.searchParams.set('t',incoming.searchParams.get('t') || Date.now().toString());

      const response = await fetch(upstream.toString(),{
        method:'GET',redirect:'follow',cf:{cacheTtl:0,cacheEverything:false}
      });
      const body = await response.text();
      const headers = new Headers(cors);
      headers.set('Content-Type',response.headers.get('Content-Type') || 'application/json; charset=utf-8');
      return new Response(body,{status:response.status,headers});
    } catch (err) {
      return json({ok:false,error:String(err?.message || err)},500,cors);
    }
  }
};

function json(obj,status,headers){
  const h=new Headers(headers);
  h.set('Content-Type','application/json; charset=utf-8');
  return new Response(JSON.stringify(obj),{status,headers:h});
}
