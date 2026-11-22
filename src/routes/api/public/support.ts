import { createFileRoute } from '@tanstack/react-router';
import { z } from 'zod';
const cors = {'access-control-allow-origin':'*','access-control-allow-methods':'POST, OPTIONS','access-control-allow-headers':'authorization, content-type','cache-control':'no-store'};
export const Route = createFileRoute('/api/public/support')({server:{handlers:{
  OPTIONS:()=>new Response(null,{status:204,headers:cors}),
  POST:async ({request})=>{
    try {
      const token=(request.headers.get('authorization') ?? '').replace(/^Bearer\s+/i,'');
      if(!token) return Response.json({error:'Please sign in first.'},{status:401,headers:cors});
      const {supabaseAdmin}=await import('@/integrations/supabase/client.server');
      const {data,error}=await supabaseAdmin.auth.getUser(token);
      if(error || !data.user) return Response.json({error:'Please sign in again.'},{status:401,headers:cors});
      return new Response(null, { status: 204, headers: cors });
    }catch(error){
      const aborted=error instanceof Error && error.name==='AbortError';
      return Response.json({error:aborted?'Reply stopped.':error instanceof z.ZodError?'Invalid request.':error instanceof Error?error.message:'Leo is unavailable.'},{status:aborted?499:503,headers:cors});
    }
  }
}}});