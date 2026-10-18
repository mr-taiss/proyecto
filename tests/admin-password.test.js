import test from 'node:test';
import assert from 'node:assert/strict';
import {resetStudentPassword} from '../tools/admin-password.js';
import {students} from '../dev/sisgop-students.js';

function fixture({role='admin',active=true,count=1,failProfile=false}={}){
  const student=students[0],calls=[];
  const entry={id:'uid-existente',data:()=>({alias:student.name,curso:student.course,rol:'estudiante'}),ref:{update:async data=>{calls.push(['perfil',data]);if(failProfile)throw Error('offline');}}};
  const auth={verifyIdToken:async()=>({uid:'admin-actual'}),updateUser:async(uid,data)=>calls.push(['clave',uid,data]),revokeRefreshTokens:async uid=>calls.push(['sesiones',uid])};
  const db={collection:()=>({doc:()=>({get:async()=>({exists:true,data:()=>({rol:role,activo:active})})}),where:()=>({get:async()=>({docs:Array.from({length:count},()=>entry)})})})};
  return {auth,db,calls,course:student.course,name:student.name,password:'nueva-clave-123',token:'simulado'};
}
test('restablece la cuenta existente y exige cambio inicial sin crear ni borrar cuentas',async()=>{
  const f=fixture();const result=await resetStudentPassword(f);
  assert.equal(result.passwordUpdated,true);
  assert.deepEqual(f.calls,[['clave','uid-existente',{password:'nueva-clave-123'}],['perfil',{requiereCambioClave:true}],['sesiones','uid-existente']]);
});
test('estudiantes y administradores retirados no pueden restablecer contraseñas',async()=>{
  for(const f of [fixture({role:'estudiante'}),fixture({active:false})]){
    await assert.rejects(resetStudentPassword(f),error=>error.status===403);assert.equal(f.calls.length,0);
  }
});
test('no elige una cuenta al azar cuando falta o está duplicada',async()=>{
  for(const count of [0,2]){const f=fixture({count});await assert.rejects(resetStudentPassword(f),error=>error.status===409);assert.equal(f.calls.length,0);}
});
test('no cambia claves de nombres inventados o contraseñas incompletas',async()=>{
  for(const changes of [{name:'Estudiante inventado'},{password:'corta'}]){const f={...fixture(),...changes};await assert.rejects(resetStudentPassword(f),error=>error.status===400);assert.equal(f.calls.length,0);}
});
test('informa si la clave cambió pero la actualización del perfil falló',async()=>{
  const f=fixture({failProfile:true});await assert.rejects(resetStudentPassword(f),error=>error.status===503&&error.message.includes('La contraseña se cambió'));
});
