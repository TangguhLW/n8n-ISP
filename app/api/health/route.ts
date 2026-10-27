export async function GET() { return Response.json({status:'UP', service:'ATH Control Center', timestamp:new Date().toISOString()}, {headers:{'Cache-Control':'no-store'}}); }
