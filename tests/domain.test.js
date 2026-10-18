import test from 'node:test';
import assert from 'node:assert/strict';
import {students} from '../dev/sisgop-students.js';
import {courses,recognizeStudent,studentMatches,authIdentifier,localDate,eventDate,registrationDate,newestFirst,filterObjects} from '../dev/sisgop-domain.js';

test('los 659 estudiantes mantienen curso e identificador Firebase',()=>{
  assert.equal(students.length,659);
  for(const student of students){
    assert.ok(courses.includes(student.course));
    const old=student.course.toLowerCase()+'_'+student.name.trim().normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/\s+/g,' ').replace(/[^a-z0-9 ]/g,'').replace(/ /g,'-')+'@cuentas.sisgop.invalid';
    assert.equal(authIdentifier(student.course,student.name),old);
    assert.equal(recognizeStudent(student.course,student.name)?.name,student.name);
  }
});
test('reconoce acentos, restringe por curso y no elige entre homónimos',()=>{
  assert.equal(recognizeStudent('6B','acuña barrios diana camila')?.name,'ACUÑA BARRIOS DIANA CAMILA');
  assert.equal(recognizeStudent('1A','ACUÑA BARRIOS DIANA CAMILA'),null);
  assert.equal(recognizeStudent('6B','nombre inventado'),null);
  assert.equal(recognizeStudent('6B','ARANCIBIA'),null);
  assert.ok(studentMatches('6B','ARANCIBIA').length>1);
  assert.equal(recognizeStudent('6B',''),null);
});
test('la fecha local no se adelanta por UTC y la fecha del evento es independiente',()=>{
  const local={getFullYear:()=>2026,getMonth:()=>9,getDate:()=>17};
  assert.equal(localDate(local),'2026-10-17');
  const item={fechaEvento:'2026-10-10',creado:{toDate:()=>({toLocaleDateString:()=> '17/10/2026'})}};
  assert.equal(eventDate(item),'10/10/2026');
  assert.equal(registrationDate(item),'17/10/2026');
});
test('ordena por registro descendente sin descartar fechas antiguas ni mutar datos',()=>{
  const original=[{id:'antiguo',fechaEvento:'2026-10-17',creado:{seconds:5}},{id:'nuevo',fechaEvento:'2026-10-10',creado:{toMillis:()=>20000}},{id:'sin-fecha'}];
  assert.deepEqual(newestFirst(original).map(x=>x.id),['nuevo','antiguo','sin-fecha']);
  assert.equal(original[0].id,'antiguo');
});
test('los tres estados y la búsqueda por curso funcionan',()=>{
  const items=[{estado:'Encontrado',nombre:'Chompa',curso:'6B'},{estado:'Recuperado',nombre:'Cuaderno',curso:'1A'}];
  assert.equal(filterObjects(items,'6b','Todos')[0].nombre,'Chompa');
  assert.equal(filterObjects(items,'','Recuperado').length,1);
  assert.equal(filterObjects(items,'','Todos').length,2);
});
