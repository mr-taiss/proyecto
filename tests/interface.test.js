import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {JSDOM} from 'jsdom';
import * as domain from '../dev/sisgop-domain.js';
import {students} from '../dev/sisgop-students.js';

const html=await readFile(new URL('../index.html',import.meta.url),'utf8');
const raw=await readFile(new URL('../dev/sisgop-original-firebase.js',import.meta.url),'utf8');
// Solo el adaptador Firebase se sustituye: se ejecutan los formularios reales en un DOM real.
// No se leen credenciales ni se realizan llamadas a Firebase.
const source=raw.split('\n').filter(line=>!line.startsWith('import ')&&!line.startsWith('const {firebaseConfig}=')).join('\n');
const AsyncFunction=Object.getPrototypeOf(async function(){}).constructor;
async function createInterface({role='estudiante',requiresChange=false}={}){
  const dom=new JSDOM(html,{url:'http://127.0.0.1:5173/'}),window=dom.window,document=window.document;
  window.scrollTo=()=>{};
  const student=students.find(s=>s.course==='6B');
  const profiles={student:{alias:student.name,curso:'6B',rol:'estudiante',requiereCambioClave:requiresChange},admin:{alias:'Directora',curso:'',rol:'admin'},other:{alias:'Profesor',curso:'',rol:'admin'}};
  const user={uid:role==='admin'?'admin':'student',email:'cuenta-existente@ejemplo.test',getIdToken:async()=> 'token-simulado'};
  const state={dom,window,document,profiles,user,student,objects:[
    {id:'antiguo',nombre:'Chompa',estado:'Perdido',curso:'6B',creadorUid:'student',fechaEvento:'2026-10-17',creado:{seconds:10,toDate:()=>new Date('2026-10-17T12:00:00Z')}},
    {id:'reciente',nombre:'Cuaderno',estado:'Recuperado',curso:'1A',creadorUid:'student',fechaEvento:'2026-10-10',creado:{seconds:30,toDate:()=>new Date('2026-10-17T12:00:00Z')}},
    {id:'medio',nombre:'Gorra',estado:'Encontrado',curso:'6B',creadorUid:'student',fechaEvento:'2026-10-15',creado:{seconds:20,toDate:()=>new Date('2026-10-17T12:00:00Z')}}
  ],queries:[],writes:[],signIns:[],passwords:[],credentials:[],fetches:[],creates:0,auths:new Map()};
  const apps=[];
  const snap=(id,data)=>({id,exists:()=>Boolean(data),data:()=>data});
  const deps={...domain,students,
    initializeApp:(_config,name='default')=>{const app={name};apps.push(app);return app;},getApps:()=>apps,
    getAuth:app=>{if(!state.auths.has(app.name))state.auths.set(app.name,{name:app.name,currentUser:app.name==='default'?user:null});return state.auths.get(app.name);},
    getFirestore:app=>({app}),doc:(db,path,id)=>({db,path,id}),collection:(db,path)=>({db,path}),where:(...args)=>args,query:(ref,...conditions)=>({...ref,conditions}),
    getDoc:async ref=>snap(ref.id,profiles[ref.id]),
    getDocs:async ref=>{
      state.queries.push(ref);
      if(state.nextReadWait){const wait=state.nextReadWait;state.nextReadWait=null;await wait;}
      if(state.nextReadError){const code=typeof state.nextReadError==='string'?state.nextReadError:'unavailable';state.nextReadError=false;throw Object.assign(Error('offline'),{code});}
      return {docs:ref.path==='perfiles_prueba'?Object.entries(profiles).filter(([,v])=>v.rol==='admin').map(([id,v])=>snap(id,v)):state.objects.map(o=>snap(o.id,o))};
    },
    addDoc:async(ref,payload)=>{state.writes.push(['add',ref,payload]);return {id:'creado'};},
    setDoc:async(ref,payload)=>{state.writes.push(['set',ref,payload]);profiles[ref.id]=payload;},
    updateDoc:async(ref,payload)=>{
      if(state.nextWriteError){state.nextWriteError=false;throw Object.assign(Error('rechazado'),{code:'permission-denied'});}
      state.writes.push(['update',ref,payload]);
      if(ref.path==='objetos_compartidos_prueba')Object.assign(state.objects.find(item=>item.id===ref.id)||{},payload);
      else Object.assign(profiles[ref.id]||{},payload);
    },
    deleteDoc:async ref=>state.writes.push(['delete',ref]),serverTimestamp:()=> 'server-timestamp',
    signInWithEmailAndPassword:async(auth,email,password)=>{state.signIns.push({auth:auth.name,email});if(password!=='actual-12345')throw Object.assign(Error('incorrecta'),{code:'auth/invalid-credential'});auth.currentUser={...user,uid:'student',email};return {user:auth.currentUser};},
    createUserWithEmailAndPassword:async auth=>{state.creates++;auth.currentUser={uid:'nuevo-admin'};return {user:auth.currentUser};},
    updatePassword:async(user,password)=>state.passwords.push({uid:user.uid,password}),
    EmailAuthProvider:{credential:(email,password)=>({email,password})},
    reauthenticateWithCredential:async(user,credential)=>state.credentials.push({uid:user.uid,credential}),
    signOut:async auth=>{auth.currentUser=null;if(auth.name==='default')await state.observer(null);},
    onAuthStateChanged:(_auth,callback)=>{state.observer=callback;return ()=>{};}
  };
  window.HTMLCanvasElement.prototype.getContext=()=>({drawImage:()=>{}});
  window.HTMLCanvasElement.prototype.toDataURL=()=> 'data:image/jpeg;base64,YWJj';
  class FakeImage{naturalWidth=100;naturalHeight=100;async decode(){}}
  const fakeURL=class extends URL{static createObjectURL(){return 'blob:simulada';}static revokeObjectURL(){}};
  const fakeFetch=async(url,options)=>{state.fetches.push({url:String(url),options});return {ok:true,headers:{get:()=> 'application/json'},json:async()=>state.resetReply??({passwordUpdated:true,message:'OK'})};};
  const run=new AsyncFunction('deps','window','document','Option','Image','URL','fetch','prompt','confirm',
    'const firebaseConfig={projectId:"solo-pruebas"};const {'+Object.keys(deps).join(',')+'}=deps;'+source);
  await run(deps,window,document,window.Option,FakeImage,fakeURL,fakeFetch,()=>null,()=>true);
  state.$=id=>document.getElementById(id);
  state.login=()=>state.observer(user);
  state.submit=async id=>state.$(id).onsubmit({preventDefault(){},submitter:document.createElement('button')});
  return state;
}

test('el HTML conserva las fotos, las pantallas y el registro libre está cerrado',async()=>{
  const f=await createInterface();
  assert.equal(f.$('fbShowRegister').hidden,true);
  await f.submit('fbRegisterForm');assert.equal(f.creates,0);
  assert.match(f.$('fbRegisterStatus').textContent,/cerrado/);
  assert.equal(f.$('detailContent').closest('header'),null);
  assert.equal(f.$('notificationsContent').closest('header'),null);
  const ids=[...f.document.querySelectorAll('[id]')].map(el=>el.id);assert.equal(new Set(ids).size,ids.length);
  f.window.close();
});
test('la consulta pública muestra los tres estados en orden y funciona al volver al panel',async()=>{
  const f=await createInterface();await f.login();await f.window.openPublicSearch();
  assert.equal(f.$('searchStatus').disabled,false);
  assert.deepEqual([...f.$('searchTableBody').rows].map(row=>row.cells[1].textContent),['Cuaderno','Gorra','Chompa']);
  assert.deepEqual(f.queries.at(-1).conditions,[['estado','in',['Perdido','Encontrado','Recuperado']]]);
  f.$('searchStatus').value='Encontrado';f.window.searchObjects();assert.equal(f.$('searchTableBody').rows.length,1);
  await f.window.openHome();await f.window.openSearch();assert.equal(f.$('searchStatus').value,'Todos');assert.equal(f.$('searchTableBody').rows.length,3);
  f.window.close();
});
test('detalles muestran curso, foto y fechas distintas sin cambiar el registro',async()=>{
  const f=await createInterface();f.objects[0].imageData='data:image/jpeg;base64,YWJj';f.objects[0].fechaEvento='2026-10-10';await f.login();
  await f.window.viewDetails('antiguo');const text=f.$('detailContent').textContent;
  assert.match(text,/Curso del registrante: 6B/);assert.match(text,/Fecha del evento: 10\/10\/2026/);assert.match(text,/Fecha de registro: 17\/10\/2026/);
  assert.equal(f.$('detailContent').querySelectorAll('img').length,1);assert.equal(f.writes.length,0);
  f.window.close();
});
test('el administrador registra sin curso ficticio y mantiene la sesión al crear otra cuenta',async()=>{
  const f=await createInterface({role:'admin'});await f.login();f.window.openRegister();assert.equal(f.$('studentCourseGroup').hidden,true);
  for(const [id,value] of Object.entries({objectName:'Chompa',objectPlace:'Patio',objectCategory:'Prendas',objectDescription:'Azul',objectDate:'2026-10-17'}))f.$(id).value=value;
  await f.submit('objectForm');const payload=f.writes.find(w=>w[0]==='add')[2];assert.equal(payload.curso,'');assert.equal(payload.creadorUid,'admin');assert.equal('registranteNombre' in payload,false);
  f.$('fbNewAdminName').value='Otro profesor';f.$('fbNewAdminPassword').value='nueva-12345';f.$('fbNewAdminConfirm').value='nueva-12345';
  await f.submit('fbAdminCreateForm');assert.equal(f.auths.get('default').currentUser.uid,'admin');assert.equal(f.creates,1);
  assert.ok(f.writes.some(w=>w[0]==='set'&&w[2].rol==='admin'));f.window.close();
});
test('el estudiante conserva su curso y no puede registrar objetos encontrados',async()=>{
  const f=await createInterface();await f.login();f.window.openRegister();assert.equal(f.$('studentCourseGroup').hidden,false);
  for(const [id,value] of Object.entries({objectName:'Gorra',objectPlace:'Patio',objectCategory:'Prendas',objectDescription:'Azul',objectDate:'2026-10-17',objectStatus:'Encontrado'}))f.$(id).value=value;
  await f.submit('objectForm');const payload=f.writes.find(w=>w[0]==='add')[2];assert.equal(payload.curso,'6B');assert.equal(payload.estado,'Perdido');
  // Contrato de creación de las reglas anteriores: un campo extra rechaza todo el documento.
  const allowed=['nombre','lugar','estado','creadorUid','creado','categoria','descripcion','fechaEvento','curso','imageData'];
  assert.ok(Object.keys(payload).every(key=>allowed.includes(key)));assert.equal('registranteNombre' in payload,false);f.window.close();
});
test('una contraseña actual incorrecta no modifica la clave ni la sesión principal',async()=>{
  const f=await createInterface();await f.login();f.window.openStudentProfile();f.$('profileContent').querySelector('button').onclick();
  f.$('fbOldPassword').value='incorrecta';f.$('fbPersonalNewPassword').value='nueva-12345';f.$('fbPersonalConfirmPassword').value='nueva-12345';await f.submit('fbPersonalPasswordForm');
  assert.equal(f.passwords.length,0);assert.equal(f.auths.get('default').currentUser.uid,'student');assert.match(f.$('fbPersonalPasswordStatus').textContent,/Comprueba/);f.window.close();
});
test('el cambio personal valida la contraseña anterior y actualiza la cuenta existente',async()=>{
  const f=await createInterface();await f.login();f.window.openStudentProfile();f.$('profileContent').querySelector('button').onclick();
  f.$('fbOldPassword').value='actual-12345';f.$('fbPersonalNewPassword').value='nueva-12345';f.$('fbPersonalConfirmPassword').value='nueva-12345';await f.submit('fbPersonalPasswordForm');
  assert.deepEqual(f.passwords,[{uid:'student',password:'nueva-12345'}]);assert.equal(f.credentials[0].credential.password,'actual-12345');assert.equal(f.auths.get('default').currentUser.uid,'student');f.window.close();
});
test('el botón anterior al ingreso usa el nombre reconocido y permite cambiar la contraseña',async()=>{
  const f=await createInterface();f.window.showSISGOPLogin();f.$('fbCourse').value='6B';f.$('fbPerson').value=f.student.name;f.$('fbStudentPasswordButton').onclick();
  f.$('fbOldPassword').value='actual-12345';f.$('fbPersonalNewPassword').value='nueva-12345';f.$('fbPersonalConfirmPassword').value='nueva-12345';await f.submit('fbPersonalPasswordForm');
  assert.equal(f.passwords.length,1);assert.equal(f.$('fbAuthOverlay').style.display,'flex');assert.match(f.$('fbLoginStatus').textContent,/actualizada/);f.window.close();
});
test('la lista permite retirar otro administrador sin borrar sus registros ni retirarse a uno mismo',async()=>{
  const f=await createInterface({role:'admin'});await f.login();f.window.openAdminCreate();await new Promise(resolve=>setImmediate(resolve));
  const rows=[...f.$('fbAdminList').querySelectorAll('article')];assert.equal(rows.find(row=>row.textContent.includes('Directora')).querySelector('button'),null);
  await rows.find(row=>row.textContent.includes('Profesor')).querySelector('button').onclick();
  assert.equal(f.profiles.other.activo,false);assert.equal(f.writes.some(w=>w[0]==='delete'),false);f.window.close();
});
test('un error de conexión limpia resultados viejos y el cierre de sesión limpia los detalles',async()=>{
  const f=await createInterface();await f.login();await f.window.viewDetails('antiguo');f.nextReadError=true;await f.window.openSearch();
  assert.match(f.$('searchTableBody').textContent,/No se pudieron cargar/);assert.match(f.$('searchTableBody').textContent,/Reintentar/);await f.window.logoutSISGOP();assert.equal(f.$('detailContent').textContent,'');assert.equal(f.$('lostCount').textContent,'0');f.window.close();
});
test('la consulta pública muestra carga, informa permisos rechazados y permite reintentar',async()=>{
  const f=await createInterface();let finish;f.nextReadWait=new Promise(resolve=>{finish=resolve;});
  const loading=f.window.openPublicSearch();assert.match(f.$('searchTableBody').textContent,/Cargando objetos/);
  f.nextReadError='permission-denied';finish();await loading;
  assert.match(f.$('searchTableBody').textContent,/sin iniciar sesión/);assert.match(f.$('searchTableBody').textContent,/permission-denied/);
  assert.doesNotMatch(f.$('searchTableBody').textContent,/No hay objetos/);
  f.$('searchInput').value='';f.window.searchObjects();assert.match(f.$('searchTableBody').textContent,/permission-denied/);
  await f.$('searchTableBody').querySelector('button').onclick();assert.equal(f.$('searchTableBody').rows.length,3);f.window.close();
});
test('una notificación de sesión inicial no deja vacía una consulta pública en curso',async()=>{
  const f=await createInterface();let finish;f.nextReadWait=new Promise(resolve=>{finish=resolve;});
  const first=f.window.openPublicSearch();await f.observer(null);finish();await first;
  assert.equal(f.$('searchTableBody').rows.length,3);assert.match(f.$('searchTableBody').textContent,/Cuaderno/);f.window.close();
});
test('la foto tiene vista previa visible y al abrir un nuevo registro se limpia',async()=>{
  const f=await createInterface();await f.login();f.window.openRegister();await f.$('objectImage').onchange({target:{files:[{type:'image/jpeg',size:100}]}});
  assert.equal(f.$('imagePreview').classList.contains('visible'),true);assert.equal(f.$('imagePreview').querySelectorAll('img').length,1);
  f.window.openRegister();assert.equal(f.$('imagePreview').classList.contains('visible'),false);assert.equal(f.$('imagePreview').children.length,0);f.window.close();
});
test('el restablecimiento envía solo el curso, estudiante y contraseña al servicio local',async()=>{
  const f=await createInterface({role:'admin'});await f.login();f.window.adminChangeStudentPassword();f.$('fbResetCourse').value='6B';f.$('fbResetCourse').onchange();f.$('fbResetStudent').value=f.student.name;
  f.$('fbResetPassword').value='temporal-123';f.$('fbResetConfirm').value='temporal-123';await f.submit('fbAdminResetForm');
  assert.equal(f.fetches.length,1);assert.equal(f.fetches[0].options.headers.Authorization,'Bearer token-simulado');assert.deepEqual(JSON.parse(f.fetches[0].options.body),{course:'6B',name:f.student.name,password:'temporal-123'});assert.equal(f.passwords.length,0);assert.match(f.$('fbAdminResetStatus').textContent,/Contraseña asignada/);f.window.close();
});

test('no muestra éxito si el servicio no confirma la actualización de la contraseña',async()=>{
  const f=await createInterface({role:'admin'});await f.login();f.window.adminChangeStudentPassword();
  f.$('fbResetCourse').value='6B';f.$('fbResetCourse').onchange();f.$('fbResetStudent').value=f.student.name;
  f.$('fbResetPassword').value='temporal-123';f.$('fbResetConfirm').value='temporal-123';f.resetReply={message:'OK'};
  await f.submit('fbAdminResetForm');assert.match(f.$('fbAdminResetStatus').textContent,/no confirmó/);assert.equal(f.$('fbResetPassword').value,'temporal-123');f.window.close();
});
test('el administrador cambia el estado con un desplegable y conserva los demás datos',async()=>{
  const f=await createInterface({role:'admin'});await f.login();await f.window.openSearch();
  const before={...f.objects.find(item=>item.id==='antiguo')};
  const row=[...f.$('searchTableBody').rows].find(row=>row.cells[1].textContent==='Chompa');
  [...row.querySelectorAll('button')].find(button=>button.textContent==='Cambiar estado').onclick();
  const select=row.querySelector('select');assert.equal(select.value,'Perdido');assert.deepEqual([...select.options].map(option=>option.value),['Perdido','Encontrado','Recuperado']);
  select.value='Encontrado';await [...row.querySelectorAll('button')].find(button=>button.textContent==='Guardar').onclick();
  const change=f.writes.find(write=>write[0]==='update');assert.deepEqual(change[2],{estado:'Encontrado'});
  assert.deepEqual(f.objects.find(item=>item.id==='antiguo'),{...before,estado:'Encontrado'});
  assert.equal([...f.$('searchTableBody').rows].find(row=>row.cells[1].textContent==='Chompa').cells[4].textContent,'Encontrado');
  await f.window.openPublicSearch();assert.equal(f.$('searchTableBody').querySelector('select'),null);f.window.close();
});
test('cancelar no cambia el estado y un error permite reintentar desde el desplegable',async()=>{
  const f=await createInterface({role:'admin'});await f.login();await f.window.openSearch();
  const row=[...f.$('searchTableBody').rows].find(row=>row.cells[1].textContent==='Chompa');
  const change=[...row.querySelectorAll('button')].find(button=>button.textContent==='Cambiar estado');
  change.onclick();row.querySelector('select').value='Encontrado';[...row.querySelectorAll('button')].find(button=>button.textContent==='Cancelar').onclick();
  assert.equal(f.writes.length,0);assert.equal(row.querySelector('select'),null);assert.equal(change.hidden,false);
  change.onclick();const select=row.querySelector('select');select.value='Encontrado';f.nextWriteError=true;
  const save=[...row.querySelectorAll('button')].find(button=>button.textContent==='Guardar');await save.onclick();
  assert.equal(row.cells[4].textContent,'Perdido');assert.match(row.textContent,/No se pudo guardar/);assert.equal(save.disabled,false);assert.equal(select.disabled,false);
  await save.onclick();assert.equal(f.objects.find(item=>item.id==='antiguo').estado,'Encontrado');f.window.close();
});
