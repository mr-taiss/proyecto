import {normalizeName,recognizeStudent} from '../dev/sisgop-domain.js';

// Se ejecuta exclusivamente en Node, nunca en el navegador.
export async function resetStudentPassword({auth,db,token,course,name,password}) {
  const caller=await auth.verifyIdToken(token,true);
  const admin=await db.collection('perfiles_prueba').doc(caller.uid).get();
  if(!admin.exists||admin.data().rol!=='admin'||admin.data().activo===false) {
    const error=new Error('Se requiere una cuenta de administrador activa.');error.status=403;throw error;
  }
  const student=recognizeStudent(course,name);
  if(!student||normalizeName(student.name)!==normalizeName(name)||typeof password!=='string'||password.length<10||password.length>128) {
    const error=new Error('Selecciona el curso, el nombre completo y una contraseña de 10 a 128 caracteres.');error.status=400;throw error;
  }
  // Busca el UID existente por curso y nombre; no crea cuentas ni cambia sus correos.
  const profiles=await db.collection('perfiles_prueba').where('curso','==',course).get();
  const matches=profiles.docs.filter(entry=>entry.data().rol==='estudiante'&&normalizeName(entry.data().alias)===normalizeName(student.name));
  if(matches.length!==1) {
    const error=new Error(matches.length?'Hay más de una cuenta con ese nombre y curso. El responsable debe revisar las cuentas existentes.':'No se encontró la cuenta asignada a ese estudiante.');error.status=409;throw error;
  }
  const entry=matches[0];
  await auth.updateUser(entry.id,{password});
  try {
    await entry.ref.update({requiereCambioClave:true});
    await auth.revokeRefreshTokens(entry.id);
  } catch {
    const error=new Error('La contraseña se cambió, pero falta completar la actualización del perfil. Conserva la contraseña nueva y solicita asistencia al responsable.');error.status=503;throw error;
  }
  return {passwordUpdated:true,message:'Contraseña actualizada.'};
}
