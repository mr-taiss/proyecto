import {initializeApp,getApps} from 'https://www.gstatic.com/firebasejs/12.4.0/firebase-app.js';
import {getAuth,signInWithEmailAndPassword,createUserWithEmailAndPassword,EmailAuthProvider,reauthenticateWithCredential,updatePassword,signOut,onAuthStateChanged} from 'https://www.gstatic.com/firebasejs/12.4.0/firebase-auth.js';
import {getFirestore,doc,getDoc,collection,getDocs,query,where,addDoc,setDoc,updateDoc,deleteDoc,serverTimestamp} from 'https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js';
import {students} from './sisgop-students.js';
import {courses,normalizeName,studentMatches,recognizeStudent,authIdentifier,localDate,eventDate,registrationDate,newestFirst,filterObjects} from './sisgop-domain.js';
// Se carga el mismo archivo local, sin incorporarlo al repositorio ni cambiar su contenido.
const {firebaseConfig}=await import(/* @vite-ignore */ new URL('dev/firebase-config.local.js',document.baseURI).href);
const app=initializeApp(firebaseConfig), auth=getAuth(app), db=getFirestore(app);
const $=id=>document.getElementById(id), shared=()=>collection(db,'objetos_compartidos_prueba');
let profile=null, objects=[], publicSearch=false, adminLoginRequested=false, sessionVersion=0, requestVersion=0;
let objectsLoadState='idle',objectsLoadMessage='';
window.publicSearchMode=false;
const accounts=[{alias:'Alumno A',curso:'6B',email:''},{alias:'Alumno B',curso:'6B',email:''},{alias:'Administrador Prueba',curso:'6B',email:''}];
try{const m=await import(/* @vite-ignore */ new URL('dev/sisgop-firebase-accounts.local.js',document.baseURI).href);accounts.forEach((a,i)=>{const entry=m.testAccounts?.[i]||{};a.email=entry.email||'';a.alias=entry.alias||a.alias;a.curso=entry.curso||a.curso;});}catch{/* El catálogo de cuentas de prueba es opcional. */}
function report(msg){$('fbGlobalStatus').textContent=msg;$('fbGlobalStatus').style.display='block';}
function switchPage(id){document.querySelectorAll('.page').forEach(x=>x.classList.remove('active'));$(id)?.classList.add('active');window.scrollTo(0,0);}
function checkLogin(){if(!profile || !auth.currentUser){showLogin();return false;}if(pendingChange){$('fbChangePasswordOverlay').style.display='flex';return false;}return true;}
// El estudiante utiliza curso + nombre + contrasena. Firebase valida la contrasena.
// Cuentas previas de la prueba se reconocen mediante el catalogo local, sin guardar claves.
// Identificador tecnico, sin consulta publica de correos ni indice de usuarios.
// Las contrasenas se validan solamente en Firebase Authentication.
function adminAuthIdentifier(nombre){
 const norm=nombre.trim().normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/\s+/g,' ');
 const slug=norm.replace(/[^a-z0-9 ]/g,'').trim().replace(/ /g,'-');
 if(slug.length<3 || slug.length>80)throw new Error('Escribe un nombre de administrador válido.');
 return `admin_${slug}@cuentas.sisgop.invalid`;
}
for(const id of ['fbCourse','fbRegisterCourse','fbResetCourse']){$(id).replaceChildren(new Option('Selecciona tu curso',''),...courses.map(c=>new Option(c,c)));}
function loginRoster(){return [...students,...accounts.filter(a=>a.email && !a.alias.toLocaleLowerCase('es').includes('admin')).map(a=>({name:a.alias,course:a.curso}))];}
function suggestStudents(){
 const roster=loginRoster(),course=$('fbCourse').value;
 $('fbStudentOptions').replaceChildren(...studentMatches(course,$('fbPerson').value,roster).map(s=>new Option(s.name,s.name)));
 $('fbPerson').setCustomValidity('');
}
$('fbCourse').onchange=()=>{$('fbPerson').value='';suggestStudents();};
$('fbPerson').oninput=suggestStudents;
$('fbPerson').onchange=()=>{
 if(adminLoginRequested)return;
 const match=recognizeStudent($('fbCourse').value,$('fbPerson').value,loginRoster());
 if(match)$('fbPerson').value=match.name;
};
function loginEmail(){
 const course=$('fbCourse').value,entered=$('fbPerson').value.trim();
 const student=adminLoginRequested?null:recognizeStudent(course,entered,loginRoster());
 if(!adminLoginRequested&&!student)throw new Error('Selecciona un curso y el nombre completo de un estudiante de ese curso.');
 const name=student?.name||entered;
 if(student)$('fbPerson').value=name;
 const previous=accounts.find(a=>(adminLoginRequested?a.alias.toLocaleLowerCase('es').includes('admin'):a.curso===course)&&normalizeName(a.alias)===normalizeName(name));
 return previous?.email || (adminLoginRequested?adminAuthIdentifier(name):authIdentifier(course,name));
}
function showLogin(admin=false){
 adminLoginRequested=admin;
 $('fbLoginForm').querySelector('h2').textContent=admin?'Acceso de administrador':'Ingreso a SISGOP';
 $('fbCourseLabel').style.display=admin?'none':'';
 $('fbPersonLabel').textContent=admin?'Nombre de usuario':'Nombre del estudiante';
 $('fbPerson').placeholder=admin?'Ej. Director, Gerente, Juan Pérez':'Nombre y apellido';
 $('fbPerson').setAttribute('list',admin?'':'fbStudentOptions');
 $('fbCourse').required=!admin;
 $('fbPerson').setCustomValidity('');
 $('fbPassword').value='';
 $('fbShowRegister').style.display='none';
 $('fbStudentPasswordButton').style.display=admin?'none':'';
 $('fbForgotPassword').style.display=admin?'none':'';
 if(!admin)suggestStudents();
 $('fbAuthOverlay').style.display='flex';$('fbLoginStatus').textContent='';
}
window.showSISGOPLogin=()=>showLogin(false);window.openAdminAccess=()=>showLogin(true);
$('fbCancelLogin').onclick=()=>{$('fbAuthOverlay').style.display='none'};
$('fbShowRegister').onclick=()=>report('Cada estudiante ya tiene una cuenta asignada. Solicita ayuda al administrador.');
$('fbForgotPassword').onclick=()=>{$('fbLoginStatus').textContent='Si olvidaste tu contraseña, solicita al administrador que te asigne una nueva. Indica tu curso y nombre completo.';};
$('fbRegisterCancel').onclick=()=>{$('fbRegisterOverlay').style.display='none';showLogin();};
$('fbLoginForm').onsubmit=async e=>{
 e.preventDefault();
 const pass=$('fbPassword').value;
 $('fbLoginStatus').textContent='Validando...';
 try{
  const email=loginEmail();
  await signInWithEmailAndPassword(auth,email,pass);
  $('fbPassword').value='';$('fbLoginStatus').textContent='';
 }catch(err){$('fbLoginStatus').textContent=err.code?'No se pudo ingresar. Verifica curso, nombre y contraseña.':err.message;}
};
// Las cuentas del alumnado ya están asignadas; se conserva el formulario anterior sin permitir altas libres.
$('fbRegisterForm').onsubmit=e=>{
 e.preventDefault();
 $('fbRegisterStatus').textContent='El registro libre está cerrado. Utiliza la cuenta que te asignó el administrador.';
};
window.openAdminCreate=()=>{
 if(profile?.rol!=='admin'||!auth.currentUser){report('Primero inicia sesión como administrador.');return;}
 $('fbAdminCreateStatus').textContent='';$('fbAdminCreateOverlay').style.display='flex';
 renderAdminList();
};
$('fbAdminCreateCancel').onclick=()=>{$('fbAdminCreateOverlay').style.display='none';};
$('fbAdminCreateForm').onsubmit=async e=>{
 e.preventDefault();
 const status=$('fbAdminCreateStatus'),name=$('fbNewAdminName').value.trim(),pass=$('fbNewAdminPassword').value;
 if(profile?.rol!=='admin'||!auth.currentUser){status.textContent='Se requiere una sesión administrativa.';return;}
 if(pass!==$('fbNewAdminConfirm').value){status.textContent='Las contraseñas no coinciden.';return;}
 const button=e.submitter;if(button)button.disabled=true;
 let secondaryAuth=null;
 try{
  const email=adminAuthIdentifier(name);
  const secondary=getApps().find(a=>a.name==='sisgop-alta-admin') || initializeApp(firebaseConfig,'sisgop-alta-admin');
  secondaryAuth=getAuth(secondary);
  // La app secundaria evita cerrar la sesión del administrador actual.
  const created=await createUserWithEmailAndPassword(secondaryAuth,email,pass);
  // Firestore utiliza la sesión principal, cuyo perfil debe ser admin.
  await setDoc(doc(db,'perfiles_prueba',created.user.uid),{alias:name,curso:'',rol:'admin'});
  status.textContent='Administrador creado. Ya puede ingresar con su nombre y contraseña.';
  $('fbAdminCreateForm').reset();
   await renderAdminList();
 }catch(error){
  const code=error.code||'unknown';
  status.textContent='No se pudo crear: '+code+'. Si ya existe en Authentication, no repitas el mismo nombre.';
 }finally{
  if(secondaryAuth)await signOut(secondaryAuth).catch(()=>{});
  if(button)button.disabled=false;
 }
};
window.logoutSISGOP=async()=>{try{await signOut(auth);}catch{report('No se pudo cerrar la sesión. Intenta nuevamente.');}};
window.returnToWelcome=()=>{publicSearch=false;window.publicSearchMode=false;switchPage('welcomeScreen');};
window.openHome=async()=>{if(!checkLogin())return;publicSearch=false;window.publicSearchMode=false;$('searchStatus').disabled=false;switchPage('homeScreen');await refresh();};
window.openRegister=()=>{
 if(!checkLogin())return;
 $('objectForm').reset();$('objectDate').value=localDate();$('studentCourse').value=profile.curso||'';$('studentCourse').disabled=true;
 $('studentCourseGroup').hidden=profile.rol==='admin';$('studentName').value=profile.alias||'';
 $('objectStatus').closest('.form-group').style.display=profile.rol==='admin'?'':'none';
 $('imagePreview').replaceChildren();$('imagePreview').classList.remove('visible');previewVersion++;
 switchPage('registerScreen');
};
window.openSearch=async()=>{
 if(!checkLogin())return;publicSearch=false;window.publicSearchMode=false;
 $('searchStatus').disabled=false;$('searchStatus').value='Todos';$('searchInput').value='';
 $('searchBackButton').textContent='← Volver al menú';switchPage('searchScreen');await refresh();
};
window.openObjects=window.openSearch;
window.openPublicSearch=async()=>{
 publicSearch=true;window.publicSearchMode=true;$('searchStatus').value='Todos';$('searchStatus').disabled=false;
 $('searchInput').value='';$('searchBackButton').textContent='← Volver a portada';switchPage('searchScreen');await refresh();
};
window.openStudentProfile=()=>{
 if(!checkLogin())return;const mine=objects.filter(o=>o.creadorUid===auth.currentUser.uid);$('profileContent').replaceChildren();
 const head=document.createElement('p');head.textContent=profile.rol==='admin'?profile.alias+' · Administración':profile.alias+' · Curso '+profile.curso;
 const count=document.createElement('p');count.textContent=mine.length+' registros';$('profileContent').append(head,count);
 if(profile.rol==='estudiante'){const change=document.createElement('button');change.className='primary-button';change.textContent='🔑 Cambiar mi contraseña';change.onclick=()=>openPersonalPassword({email:auth.currentUser.email,alias:profile.alias,course:profile.curso});$('profileContent').append(change);}
 for(const o of mine){const p=document.createElement('p');p.textContent=o.nombre+' — '+o.estado+' — '+o.lugar+' — '+eventDate(o);$('profileContent').append(p);}
 switchPage('profileScreen');
};
window.openNotifications=()=>{if(!checkLogin())return;const target=$('notificationsContent');target.replaceChildren();const found=objects.filter(o=>o.estado==='Encontrado');for(const o of found){const block=document.createElement('div');block.className='notification-card';const title=document.createElement('h3');title.textContent='Objeto encontrado: '+o.nombre;const desc=document.createElement('p');desc.textContent='Lugar: '+o.lugar;const btn=document.createElement('button');btn.textContent='Ver detalles';btn.onclick=()=>window.viewDetails(o.id);block.append(title,desc,btn);target.append(block)}if(!found.length)target.textContent='No hay avisos de objetos encontrados.';switchPage('notificationsScreen');};
window.adminChangeStudentPassword=()=>{
 if(!checkLogin()||profile.rol!=='admin')return;
 $('fbAdminResetForm').reset();$('fbResetStudent').replaceChildren(new Option('Selecciona primero el curso',''));
 $('fbAdminResetStatus').textContent='';$('fbAdminResetOverlay').style.display='flex';
};
window.openObjects=window.openSearch;
function updateStats(){for(const [id,state] of [['lostCount','Perdido'],['foundCount','Encontrado'],['recoveredCount','Recuperado']])$(id).textContent=objects.filter(o=>o.estado===state).length;$('notificationBadge').textContent=objects.filter(o=>o.estado==='Encontrado').length;}
function labelDate(obj){return eventDate(obj);}
function drawRows(id,source){
 const body=$(id);if(!body)return;body.replaceChildren();
 for(const obj of source){
  const row=document.createElement('tr');for(const val of [obj.id.slice(0,6),obj.nombre,labelDate(obj),obj.lugar,obj.estado]){const td=document.createElement('td');td.textContent=val;row.append(td);}
  const act=document.createElement('td'),view=document.createElement('button');view.className='table-action';view.textContent='Ver';view.onclick=()=>window.viewDetails(obj.id);act.append(view);
  if(!publicSearch&&profile?.rol==='admin'){
   const change=document.createElement('button');change.type='button';change.className='table-action';change.textContent='Cambiar estado';change.onclick=()=>{
    if(change.hidden)return;
    const editor=document.createElement('span'),select=document.createElement('select'),save=document.createElement('button'),cancel=document.createElement('button'),message=document.createElement('span');
    editor.style.cssText='display:inline-flex;align-items:center;gap:5px;flex-wrap:wrap';
    select.className='table-action';select.setAttribute('aria-label','Estado de '+obj.nombre);
    select.replaceChildren(...['Perdido','Encontrado','Recuperado'].map(state=>new Option(state,state)));select.value=obj.estado;
    save.type='button';save.className='table-action found';save.textContent='Guardar';
    cancel.type='button';cancel.className='table-action';cancel.textContent='Cancelar';message.setAttribute('role','status');
    const close=()=>{editor.remove();change.hidden=false;del.hidden=false;};cancel.onclick=close;
    save.onclick=async()=>{
     if(save.disabled||!checkLogin()||publicSearch||profile.rol!=='admin')return;
     const target=select.value;if(!['Perdido','Encontrado','Recuperado'].includes(target))return;
     if(target===obj.estado){close();return;}
     const version=sessionVersion;save.disabled=true;cancel.disabled=true;select.disabled=true;message.textContent='Guardando...';
     try{await updateDoc(doc(db,'objetos_compartidos_prueba',obj.id),{estado:target});if(version===sessionVersion)await refresh();}
     catch(e){message.textContent='No se pudo guardar el estado. Intenta nuevamente.';report('No se pudo cambiar el estado: '+(e.code||e.message));}
     finally{save.disabled=false;cancel.disabled=false;select.disabled=false;}
    };
    editor.append(select,save,cancel,message);change.hidden=true;del.hidden=true;act.append(editor);select.focus();
   };
   const del=document.createElement('button');del.className='table-action delete';del.textContent='Eliminar';del.onclick=async()=>{
    if(!confirm('¿Eliminar este registro?'))return;
    try{await deleteDoc(doc(db,'objetos_compartidos_prueba',obj.id));await refresh();}catch(e){report('No se pudo eliminar: '+e.code);}
   };act.append(change,del);
  }
  row.append(act);body.append(row);
 }
 if(!source.length){const row=document.createElement('tr'),cell=document.createElement('td');cell.colSpan=6;cell.textContent='No hay objetos para mostrar.';row.append(cell);body.append(row);}
}
function tableNotice(id,message,retry=false){
 const body=$(id);if(!body)return;body.replaceChildren();
 const row=document.createElement('tr'),cell=document.createElement('td'),text=document.createElement('p');
 cell.colSpan=6;text.textContent=message;text.setAttribute('role','status');cell.append(text);
 if(retry){const button=document.createElement('button');button.type='button';button.className='table-action';button.textContent='Reintentar';button.onclick=()=>refresh();cell.append(button);}
 row.append(cell);body.append(row);
}
function search(){
 if(!profile&&!publicSearch)return;
 if(objectsLoadState==='loading'||objectsLoadState==='error'){
  tableNotice('searchTableBody',objectsLoadMessage,objectsLoadState==='error'||objectsLoadMessage!=='Cargando objetos...');return;
 }
 drawRows('searchTableBody',filterObjects(objects,$('searchInput').value,$('searchStatus').value));
}
window.searchObjects=search;window.filterObjects=(val)=>{drawRows('objectsTableBody',objects.filter(o=>val==='Todos'||o.estado===val))};
window.viewDetails=async id=>{
 const o=objects.find(x=>x.id===id);if(!o)return;
 const version=sessionVersion;
 const target=$('detailContent');target.replaceChildren();
 const course=document.createElement('p');course.textContent='Curso del registrante: '+(o.curso||'Administración');
 for(const [k,v] of [['Objeto',o.nombre],['Categoría',o.categoria||'—'],['Descripción',o.descripcion||'—'],['Fecha del evento',eventDate(o)],['Lugar',o.lugar],['Estado',o.estado],['Fecha de registro',registrationDate(o)]]){const p=document.createElement('p');p.textContent=k+': '+v;target.append(p);}
 target.append(course);
 if(profile&&auth.currentUser&&o.creadorUid){
  const p=document.createElement('p');p.textContent='Registrado por: '+(o.registranteNombre||'consultando...');target.append(p);
  try{const snap=await getDoc(doc(db,'perfiles_prueba',o.creadorUid));if(snap.exists()){const creator=snap.data();p.textContent='Registrado por: '+creator.alias;course.textContent=creator.rol==='admin'?'Registrante: Administración':'Curso del registrante: '+(o.curso||creator.curso||'No disponible');}else p.textContent='Registrado por: '+(o.registranteNombre||'No disponible');}catch{p.textContent='Registrado por: '+(o.registranteNombre||'No disponible');}
 }
 if(o.imageData){const img=document.createElement('img');img.src=o.imageData;img.alt='Fotografía del objeto';img.style.cssText='max-width:100%;max-height:350px;object-fit:contain;border-radius:12px';target.append(img);}
 if(version===sessionVersion)switchPage('detailScreen');
};
window.backFromDetails=()=>{if(publicSearch){switchPage('searchScreen');}else{window.openSearch();}};
async function refresh(){
 if(!profile&&!publicSearch)return;
 const request=++requestVersion,session=sessionVersion;
 objectsLoadState='loading';objectsLoadMessage='Cargando objetos...';search();
 const slowNotice=setTimeout(()=>{
  if(request!==requestVersion||session!==sessionVersion)return;
  objectsLoadMessage='La consulta está tardando. Comprueba tu conexión o pulsa Reintentar.';search();
 },15000);
 try{
  const snap=await getDocs(publicSearch?query(shared(),where('estado','in',['Perdido','Encontrado','Recuperado'])):shared());
  if(request!==requestVersion||session!==sessionVersion)return;
  if(!snap.docs.length&&snap.metadata?.fromCache)throw Object.assign(new Error('No se pudo confirmar la consulta con el servidor.'),{code:'unavailable'});
  objects=newestFirst(snap.docs.map(d=>({id:d.id,...d.data()})));
  objectsLoadState='ready';objectsLoadMessage='';
  if(profile){updateStats();drawRows('objectsTableBody',objects);}search();report(objects.length+' objetos cargados.');
 }catch(e){
  if(request!==requestVersion||session!==sessionVersion)return;
  objects=[];objectsLoadState='error';
  objectsLoadMessage=e.code==='permission-denied'
   ?(publicSearch?'Firebase no permite esta consulta sin iniciar sesión (permission-denied).':'Firebase rechazó la consulta de objetos (permission-denied).')
   :'No se pudieron cargar los objetos. Comprueba la conexión y pulsa Reintentar. ('+(e.code||e.message)+')';
  search();tableNotice('objectsTableBody',objectsLoadMessage,true);updateStats();report(objectsLoadMessage);
 }finally{clearTimeout(slowNotice);}
}
async function compressImage(file){
 if(!file)return null;
 if(!file.type.startsWith('image/'))throw new Error('Selecciona una imagen válida.');
 if(file.size>12*1024*1024)throw new Error('La fotografía es demasiado grande (máximo 12 MB).');
 const url=URL.createObjectURL(file);
 try{
  const img=new Image();img.src=url;await img.decode();
  const factor=Math.min(1,960/Math.max(img.naturalWidth,img.naturalHeight));
  const canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.round(img.naturalWidth*factor));canvas.height=Math.max(1,Math.round(img.naturalHeight*factor));
  canvas.getContext('2d').drawImage(img,0,0,canvas.width,canvas.height);
  let quality=.72;let data=canvas.toDataURL('image/jpeg',quality);
  while(data.length>200000 && quality>.25){quality-=.1;data=canvas.toDataURL('image/jpeg',quality)}
  if(data.length>200000)throw new Error('La foto no pudo comprimirse. Utiliza una imagen más pequeña.');
  return data;
 }finally{URL.revokeObjectURL(url)}
}
let previewVersion=0;
$('objectImage').onchange=async e=>{
 const target=$('imagePreview'),version=++previewVersion;target.replaceChildren();target.classList.remove('visible');
 try{const file=e.target.files?.[0];if(!file)return;const data=await compressImage(file);if(version!==previewVersion)return;const img=document.createElement('img');img.src=data;img.alt='Vista previa de la fotografía';target.append(img);target.classList.add('visible');}catch(error){if(version!==previewVersion)return;report(error.message);e.target.value='';}
};
$('objectForm').onsubmit=async e=>{
 e.preventDefault();if(!checkLogin())return;
 const name=$('objectName').value.trim(),place=$('objectPlace').value,state=profile.rol==='admin'?$('objectStatus').value:'Perdido';
 const categoria=$('objectCategory').value,descripcion=$('objectDescription').value.trim(),fechaEvento=$('objectDate').value,curso=profile.rol==='admin'?'':profile.curso;
 if(!name||!place||!categoria||!descripcion||!fechaEvento)return;
 const button=e.submitter;if(button?.disabled)return;if(button)button.disabled=true;
 const user=auth.currentUser,session=sessionVersion;
 try{
  const imageData=await compressImage($('objectImage').files?.[0]);
  if(session!==sessionVersion||auth.currentUser?.uid!==user.uid)return;
  // Conserva los campos admitidos por las reglas anteriores. El nombre se consulta desde el perfil.
  const payload={nombre:name,lugar:place,estado:state,categoria,descripcion,fechaEvento,curso,creadorUid:user.uid,creado:serverTimestamp()};
  if(imageData)payload.imageData=imageData;await addDoc(shared(),payload);
  if(session===sessionVersion)await window.openSearch();
 }catch(err){report('No se pudo guardar: '+(err.code||err.message));}finally{if(button)button.disabled=false;}
};
$('searchInput').oninput=search;$('searchStatus').onchange=search;$('objectCategory').onchange=()=>{};
// Cambio de clave inicial para alumnos incorporados mediante el importador.
// El backend sigue siendo necesario para una garantia antifraude completa.
let pendingChange=false;
$('fbChangePasswordLogout').onclick=()=>signOut(auth);
$('fbChangePasswordForm').onsubmit=async event=>{
 event.preventDefault();
 const status=$('fbChangePasswordStatus'),next=$('fbNewPassword').value,again=$('fbConfirmNewPassword').value;
 if(!auth.currentUser || !profile || !pendingChange){status.textContent='Inicia sesión nuevamente.';return;}
 if(next.length<10 || next==='sucre123'){status.textContent='Utiliza una clave personal de al menos 10 caracteres, diferente de la inicial.';return;}
 if(next!==again){status.textContent='Las contraseñas no coinciden.';return;}
 const btn=event.submitter;if(btn)btn.disabled=true;
 status.textContent='Actualizando contraseña...';
 try{
  await updatePassword(auth.currentUser,next);
  await updateDoc(doc(db,'perfiles_prueba',auth.currentUser.uid),{requiereCambioClave:false});
  pendingChange=false;profile.requiereCambioClave=false;
  $('fbChangePasswordOverlay').style.display='none';$('fbChangePasswordForm').reset();status.textContent='';
  await refresh();switchPage('homeScreen');
 }catch(err){status.textContent='No se completó el cambio: '+(err.code||err.message)+'. Si la contraseña ya cambió, inicia sesión nuevamente con la nueva.';}
 finally{if(btn)btn.disabled=false;}
};
async function loadSession(user){
 const version=sessionVersion;
 try{
  const snap=await getDoc(doc(db,'perfiles_prueba',user.uid));
  if(version!==sessionVersion||auth.currentUser?.uid!==user.uid)return;
  if(!snap.exists()||!['estudiante','admin'].includes(snap.data().rol)||snap.data().activo===false){report('La cuenta no tiene un acceso activo.');await signOut(auth);return;}
  profile=snap.data();if(adminLoginRequested && profile.rol!=='admin'){profile=null;adminLoginRequested=false;await signOut(auth);showLogin(true);$('fbLoginStatus').textContent='Esta cuenta no tiene permisos de administrador.';return;}adminLoginRequested=false;publicSearch=false;window.publicSearchMode=false;$('searchStatus').disabled=false;$('fbAuthOverlay').style.display='none';$('fbRegisterOverlay').style.display='none';
  $('sisgopAdminPasswordCard').style.display=profile.rol==='admin'?'':'none';$('sisgopCreateAdminCard').style.display=profile.rol==='admin'?'':'none';
  pendingChange=profile.rol==='estudiante' && profile.requiereCambioClave===true;
  if(pendingChange){$('fbChangePasswordOverlay').style.display='flex';switchPage('welcomeScreen');return;}
  $('fbChangePasswordOverlay').style.display='none';await refresh();if(version===sessionVersion)switchPage('homeScreen');
 }catch(e){report('Error de perfil: '+(e.code||e.message));}
}
onAuthStateChanged(auth,async user=>{
 sessionVersion++;requestVersion++;profile=null;objects=[];pendingChange=false;objectsLoadState='idle';objectsLoadMessage='';
 for(const id of ['searchTableBody','objectsTableBody','detailContent','profileContent','notificationsContent','fbAdminList'])$(id).replaceChildren();
 for(const id of ['fbAdminCreateOverlay','fbAdminResetOverlay','fbPersonalPasswordOverlay'])$(id).style.display='none';
 updateStats();$('fbChangePasswordOverlay').style.display='none';
 if(!user){$('fbAuthOverlay').style.display='none';if(publicSearch)await refresh();else switchPage('welcomeScreen');return;}
 await loadSession(user);
});


async function renderAdminList(){
 const target=$('fbAdminList');target.replaceChildren();
 const loading=document.createElement('p');loading.textContent='Cargando administradores...';target.append(loading);
 const version=sessionVersion;
 try{
  const snap=await getDocs(query(collection(db,'perfiles_prueba'),where('rol','==','admin')));
  if(version!==sessionVersion||profile?.rol!=='admin')return;
  target.replaceChildren();
  for(const entry of [...snap.docs].sort((a,b)=>a.data().alias.localeCompare(b.data().alias,'es'))){
   const data=entry.data(),row=document.createElement('article'),name=document.createElement('p');
   name.textContent=data.alias+(data.activo===false?' · Sin acceso':entry.id===auth.currentUser.uid?' · Tu cuenta':'');row.append(name);
   if(data.activo!==false&&entry.id!==auth.currentUser.uid){
    const remove=document.createElement('button');remove.type='button';remove.className='secondary-button';remove.textContent='Retirar acceso';
    remove.onclick=async()=>{
     if(!confirm('¿Retirar el acceso de '+data.alias+'? Sus registros se conservarán.'))return;
     remove.disabled=true;
     try{await updateDoc(doc(db,'perfiles_prueba',entry.id),{activo:false});await renderAdminList();}
     catch{$('fbAdminCreateStatus').textContent='No se pudo retirar el acceso.';remove.disabled=false;}
    };row.append(remove);
   }
   target.append(row);
  }
  if(!snap.docs.length)target.textContent='No hay administradores para mostrar.';
 }catch{if(version===sessionVersion)target.textContent='No se pudo cargar la lista de administradores.';}
}

let passwordIdentity=null,passwordReturnToLogin=false;
function openPersonalPassword(identity,fromLogin=false){
 passwordIdentity=identity;passwordReturnToLogin=fromLogin;
 $('fbPersonalPasswordForm').reset();$('fbPersonalPasswordStatus').textContent='';
 $('fbPersonalPasswordIdentity').textContent=identity.alias+' · Curso '+identity.course;
 $('fbAuthOverlay').style.display='none';$('fbPersonalPasswordOverlay').style.display='flex';
}
$('fbStudentPasswordButton').onclick=()=>{
 try{const email=loginEmail();openPersonalPassword({email,alias:$('fbPerson').value,course:$('fbCourse').value},true);}
 catch(error){$('fbLoginStatus').textContent=error.message;}
};
$('fbPersonalPasswordCancel').onclick=()=>{
 $('fbPersonalPasswordOverlay').style.display='none';$('fbPersonalPasswordForm').reset();passwordIdentity=null;
 if(passwordReturnToLogin)showLogin(false);
};
$('fbPersonalPasswordForm').onsubmit=async event=>{
 event.preventDefault();if(!passwordIdentity)return;
 const status=$('fbPersonalPasswordStatus'),old=$('fbOldPassword').value,next=$('fbPersonalNewPassword').value;
 if(next.length<10){status.textContent='Utiliza al menos 10 caracteres.';return;}
 if(next!==$('fbPersonalConfirmPassword').value){status.textContent='Las contraseñas no coinciden.';return;}
 if(next===old){status.textContent='La contraseña nueva debe ser diferente de la actual.';return;}
 const button=event.submitter;if(button?.disabled)return;if(button)button.disabled=true;
 let secondaryAuth=null;status.textContent='Comprobando contraseña actual...';
 try{
  const secondary=getApps().find(a=>a.name==='sisgop-cambio-clave')||initializeApp(firebaseConfig,'sisgop-cambio-clave');
  secondaryAuth=getAuth(secondary);
  const cred=await signInWithEmailAndPassword(secondaryAuth,passwordIdentity.email,old);
  const secondaryDb=getFirestore(secondary),ref=doc(secondaryDb,'perfiles_prueba',cred.user.uid),snap=await getDoc(ref);
  if(!snap.exists()||snap.data().rol!=='estudiante'||snap.data().activo===false)throw new Error('Se requiere una cuenta de estudiante activa.');
  await reauthenticateWithCredential(cred.user,EmailAuthProvider.credential(passwordIdentity.email,old));
  await updatePassword(cred.user,next);
  if(snap.data().requiereCambioClave===true)await updateDoc(ref,{requiereCambioClave:false});
  if(auth.currentUser?.uid===cred.user.uid&&profile){pendingChange=false;profile.requiereCambioClave=false;$('fbChangePasswordOverlay').style.display='none';}
  $('fbPersonalPasswordOverlay').style.display='none';$('fbPersonalPasswordForm').reset();passwordIdentity=null;
  if(passwordReturnToLogin){showLogin(false);$('fbLoginStatus').textContent='Contraseña actualizada. Ingresa con tu nueva contraseña.';}
  else report('Tu contraseña se actualizó correctamente.');
 }catch(error){status.textContent=error.code?'No se pudo completar el cambio. Comprueba la contraseña actual e intenta nuevamente.':error.message;}
 finally{if(secondaryAuth)await signOut(secondaryAuth).catch(()=>{});if(button)button.disabled=false;}
};

$('fbResetCourse').onchange=()=>{
 $('fbResetStudent').replaceChildren(new Option('Selecciona un estudiante',''),...studentMatches($('fbResetCourse').value,'').map(s=>new Option(s.name,s.name)));
};
$('fbAdminResetCancel').onclick=()=>{$('fbAdminResetOverlay').style.display='none';$('fbAdminResetForm').reset();};
$('fbAdminResetForm').onsubmit=async event=>{
 event.preventDefault();if(!checkLogin()||profile.rol!=='admin')return;
 const status=$('fbAdminResetStatus'),next=$('fbResetPassword').value;
 if(next.length<10){status.textContent='Utiliza al menos 10 caracteres.';return;}
 if(next!==$('fbResetConfirm').value){status.textContent='Las contraseñas no coinciden.';return;}
 const student=recognizeStudent($('fbResetCourse').value,$('fbResetStudent').value);
 if(!student){status.textContent='Selecciona un estudiante de ese curso.';return;}
 const button=event.submitter;if(button?.disabled)return;if(button)button.disabled=true;status.textContent='Actualizando contraseña...';
 try{
  const response=await fetch(new URL('__sisgop_admin/reset-password',document.baseURI),{
   method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+await auth.currentUser.getIdToken()},
   body:JSON.stringify({course:student.course,name:student.name,password:next}),signal:AbortSignal.timeout(20000)
  });
  if(!response.headers.get('content-type')?.includes('application/json'))throw new Error('Esta opción necesita el servicio administrativo local. Solicita al responsable del proyecto que lo inicie.');
  const result=await response.json();if(!response.ok)throw new Error(result.message||'No se pudo cambiar la contraseña.');
  if(result.passwordUpdated!==true)throw new Error('El servicio no confirmó el cambio de contraseña. Comprueba que iniciaste la versión actual de SISGOP.');
  $('fbAdminResetForm').reset();$('fbResetStudent').replaceChildren(new Option('Selecciona primero el curso',''));
  status.textContent='Contraseña asignada. El estudiante deberá cambiarla al ingresar.';
 }catch(error){status.textContent=error.name==='TimeoutError'?'La operación tardó demasiado. Verifica el resultado antes de repetirla.':error.message;}
 finally{if(button)button.disabled=false;}
};
