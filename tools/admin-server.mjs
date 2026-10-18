import {createServer as createHttpServer} from 'node:http';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {dirname,resolve} from 'node:path';
import {readFileSync} from 'node:fs';
import {createServer as createViteServer} from 'vite';
import {applicationDefault,initializeApp} from 'firebase-admin/app';
import {getAuth} from 'firebase-admin/auth';
import {getFirestore} from 'firebase-admin/firestore';
import {resetStudentPassword} from './admin-password.js';

if(!process.env.GOOGLE_APPLICATION_CREDENTIALS) {
  throw new Error('Configura GOOGLE_APPLICATION_CREDENTIALS con la ruta de la credencial administrativa, fuera de la carpeta del proyecto. Consulta README.md.');
}
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
process.env.GOOGLE_APPLICATION_CREDENTIALS=resolve(root,process.env.GOOGLE_APPLICATION_CREDENTIALS);
const {firebaseConfig}=await import(pathToFileURL(resolve(root,'dev/firebase-config.local.js')).href);
const credentialInfo=JSON.parse(readFileSync(process.env.GOOGLE_APPLICATION_CREDENTIALS,'utf8'));
if(credentialInfo.type!=='service_account'||credentialInfo.project_id!==firebaseConfig.projectId)throw new Error('La credencial administrativa debe pertenecer al mismo proyecto Firebase que SISGOP.');
initializeApp({credential:applicationDefault(),projectId:firebaseConfig.projectId});
const auth=getAuth(),db=getFirestore();
const vite=await createViteServer({root,server:{middlewareMode:true,hmr:false,fs:{strict:true,allow:[root],deny:['.env','.env.*','*.{crt,pem,key}','**/.git/**','**/*firebase-adminsdk*.json']}}});
const origin='http://localhost:5173';
const allowedHosts=new Set(['localhost:5173','127.0.0.1:5173']);
const server=createHttpServer(async(req,res)=>{
  const reply=(status,data)=>{res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'});res.end(JSON.stringify(data));};
  if(!allowedHosts.has(req.headers.host)){reply(403,{message:'Abre SISGOP desde la dirección local indicada.'});return;}
  if(req.url==='/__sisgop_admin/status'){reply(200,{available:true});return;}
  if(req.url!=='/__sisgop_admin/reset-password'){vite.middlewares(req,res);return;}
  if(req.method!=='POST'){reply(405,{message:'Utiliza el formulario de SISGOP.'});return;}
  if(req.headers.origin!=='http://'+req.headers.host){reply(403,{message:'Abre SISGOP desde la dirección local indicada.'});return;}
  const token=req.headers.authorization?.match(/^Bearer (.+)$/)?.[1];
  if(!token){reply(401,{message:'Inicia sesión como administrador.'});return;}
  try {
    const chunks=[];let size=0;
    for await(const chunk of req){chunks.push(chunk);size+=chunk.length;if(size>4096){reply(413,{message:'Datos demasiado grandes.'});return;}}
    let data;try{data=JSON.parse(Buffer.concat(chunks).toString('utf8'));}catch{reply(400,{message:'Formulario inválido.'});return;}
    if(!data||typeof data!=='object'||Array.isArray(data)){reply(400,{message:'Formulario inválido.'});return;}
    const result=await resetStudentPassword({auth,db,token,course:data.course,name:data.name,password:data.password});
    reply(200,result);
  } catch(error) {
    const status=error.status||(error.code?.startsWith('auth/')?401:500);
    reply(status,{message:error.status?error.message:'No se pudo completar la operación. Comprueba la sesión y la configuración administrativa.'});
  }
});
server.listen(5173,'127.0.0.1',()=>console.log('SISGOP administrativo: '+origin));
server.on('error',()=>{console.error('No se pudo abrir el puerto 5173. Cierra el otro servidor de SISGOP y vuelve a intentar.');process.exitCode=1;vite.close();});
