import {existsSync,mkdirSync,copyFileSync} from 'node:fs';
// Solo configuración del cliente. Nunca se copian credenciales administrativas.
const files=['firebase-config.local.js','sisgop-firebase-accounts.local.js'];
for(const name of files){
  if(existsSync('dev/'+name)){mkdirSync('dist/dev',{recursive:true});copyFileSync('dev/'+name,'dist/dev/'+name);}
}
if(!existsSync('dev/firebase-config.local.js'))console.warn('Compilación preparada sin configuración Firebase: resta copiar dev/firebase-config.local.js para conectar el proyecto real.');
