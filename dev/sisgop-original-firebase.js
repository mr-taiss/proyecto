import {initializeApp,getApps} from 'https://www.gstatic.com/firebasejs/12.4.0/firebase-app.js';
import {getAuth,signInWithEmailAndPassword,createUserWithEmailAndPassword,updatePassword,signOut,onAuthStateChanged} from 'https://www.gstatic.com/firebasejs/12.4.0/firebase-auth.js';
import {getFirestore,doc,getDoc,collection,getDocs,query,where,addDoc,setDoc,updateDoc,deleteDoc,serverTimestamp} from 'https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js';
import {firebaseConfig} from './firebase-config.local.js';
const app=initializeApp(firebaseConfig), auth=getAuth(app), db=getFirestore(app);
const $=id=>document.getElementById(id), shared=()=>collection(db,'objetos_compartidos_prueba');
let profile=null, objects=[], publicSearch=false, adminLoginRequested=false;
window.publicSearchMode=false;
const accounts=[{alias:'Alumno A',curso:'6B',email:''},{alias:'Alumno B',curso:'6B',email:''},{alias:'Administrador Prueba',curso:'6B',email:''}];
try{const m=await import('./sisgop-firebase-accounts.local.js');accounts.forEach((a,i)=>{const entry=m.testAccounts?.[i]||{};a.email=entry.email||'';a.alias=entry.alias||a.alias;a.curso=entry.curso||a.curso;});}catch(e){report('Falta configuración de cuentas ficticias de Firebase.');}
function report(msg){$('fbGlobalStatus').textContent=msg;$('fbGlobalStatus').style.display='block';}
function switchPage(id){document.querySelectorAll('.page').forEach(x=>x.classList.remove('active'));$(id)?.classList.add('active');window.scrollTo(0,0);}
function checkLogin(){if(!profile){showLogin();return false;}return true;}
// El estudiante utiliza curso + nombre + contrasena. Firebase valida la contrasena.
// Cuentas previas de la prueba se reconocen mediante el catalogo local, sin guardar claves.
const courses=['1A','1B','1C','2A','2B','2C','3A','3B','4A','4B','5A','5B','5C','6A','6B','6C'];
function identityKey(curso,nombre){
 const norm=nombre.trim().normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/\s+/g,' ');
 return `${curso.toLowerCase()}_${norm.replace(/[^a-z0-9 ]/g,'').replace(/ /g,'-')}`;
}
// Identificador tecnico, sin consulta publica de correos ni indice de usuarios.
// Las contrasenas se validan solamente en Firebase Authentication.
function authIdentifier(curso,nombre){
 const key=identityKey(curso,nombre);
 if(!/^[a-z0-9]{1,3}_[a-z0-9-]{3,100}$/.test(key))throw new Error('Verifica el curso y el nombre completo.');
 return key+'@cuentas.sisgop.invalid';
}
function adminAuthIdentifier(nombre){
 const norm=nombre.trim().normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/\s+/g,' ');
 const slug=norm.replace(/[^a-z0-9 ]/g,'').trim().replace(/ /g,'-');
 if(slug.length<3 || slug.length>80)throw new Error('Escribe un nombre de administrador válido.');
 return `admin_${slug}@cuentas.sisgop.invalid`;
}
for(const id of ['fbCourse','fbRegisterCourse']){$(id).replaceChildren(...courses.map(c=>new Option(c,c)));$(id).value='6B';}
function showLogin(admin=false){
 adminLoginRequested=admin;
 $('fbLoginForm').querySelector('h2').textContent=admin?'Acceso de administrador':'Ingreso a SISGOP';
 $('fbCourseLabel').style.display=admin?'none':'';
 $('fbPersonLabel').textContent=admin?'Nombre de usuario':'Nombre del estudiante';
 $('fbPerson').placeholder=admin?'Ej. Director, Gerente, Juan Pérez':'Nombre y apellido';
 $('fbShowRegister').style.display=admin?'none':'';
 $('fbShowRegister').textContent='Crear cuenta de estudiante';
 $('fbAuthOverlay').style.display='flex';$('fbLoginStatus').textContent='';
}
window.showSISGOPLogin=()=>showLogin(false);window.openAdminAccess=()=>showLogin(true);
$('fbCancelLogin').onclick=()=>{$('fbAuthOverlay').style.display='none'};
$('fbShowRegister').onclick=()=>{
 if(adminLoginRequested){ return; }
 $('fbAuthOverlay').style.display='none';$('fbRegisterOverlay').style.display='flex';
};
$('fbRegisterCancel').onclick=()=>{$('fbRegisterOverlay').style.display='none';showLogin();};
$('fbLoginForm').onsubmit=async e=>{
 e.preventDefault();
 const curso=$('fbCourse').value,nombre=$('fbPerson').value.trim(),pass=$('fbPassword').value;
 $('fbLoginStatus').textContent='Validando...';
 try{
  const prev=accounts.find(a=>(!adminLoginRequested || a.alias.toLocaleLowerCase('es').includes('admin'))&&(!adminLoginRequested ? a.curso===curso : true)&&a.alias.trim().toLocaleLowerCase('es')===nombre.toLocaleLowerCase('es'));
  let email=prev?.email;
  if(!email){
   email=adminLoginRequested?adminAuthIdentifier(nombre):authIdentifier(curso,nombre);
  }
  await signInWithEmailAndPassword(auth,email,pass);
  $('fbPassword').value='';$('fbLoginStatus').textContent='';
 }catch(err){$('fbLoginStatus').textContent='No se pudo ingresar. Verifica curso, nombre y contraseña.';}
};
let registering=false;
$('fbRegisterForm').onsubmit=async e=>{
 e.preventDefault();
 const curso=$('fbRegisterCourse').value,alias=$('fbRegisterName').value.trim();
 const email=authIdentifier(curso,alias);
 const password=$('fbRegisterPassword').value,status=$('fbRegisterStatus');
 if(alias.length<3){status.textContent='Ingresa el nombre completo.';return;}
 if(password!==$('fbRegisterConfirm').value){status.textContent='Las contraseñas no coinciden.';return;}
 registering=true;status.textContent='Creando cuenta...';
 try{
  const cred=await createUserWithEmailAndPassword(auth,email,password);
  await setDoc(doc(db,'perfiles_prueba',cred.user.uid),{alias,curso,rol:'estudiante'});
  $('fbRegisterOverlay').style.display='none';$('fbRegisterForm').reset();
  status.textContent='';registering=false;await loadSession(cred.user);
 }catch(err){status.textContent=(err.code==='auth/email-already-in-use'?'Ya existe una cuenta con ese curso y nombre.': 'No se pudo completar el registro: '+(err.code||err.message));registering=false;}
};
window.openAdminCreate=()=>{
 if(profile?.rol!=='admin'||!auth.currentUser){report('Primero inicia sesión como administrador.');return;}
 $('fbAdminCreateStatus').textContent='';$('fbAdminCreateOverlay').style.display='flex';
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
 }catch(error){
  const code=error.code||'unknown';
  status.textContent='No se pudo crear: '+code+'. Si ya existe en Authentication, no repitas el mismo nombre.';
 }finally{
  if(secondaryAuth)await signOut(secondaryAuth).catch(()=>{});
  if(button)button.disabled=false;
 }
};
window.logoutSISGOP=async()=>{await signOut(auth);};
window.returnToWelcome=()=>switchPage('welcomeScreen');window.openHome=()=>{if(checkLogin())switchPage('homeScreen')};
window.openRegister=()=>{if(!checkLogin())return;$('objectForm').reset();$('objectDate').value=new Date().toISOString().slice(0,10);$('studentCourse').value=profile.curso||'6B';$('studentCourse').disabled=true;$('studentName').value=profile.alias||'';$('objectStatus').closest('.form-group').style.display=profile.rol==='admin'?'':'none';switchPage('registerScreen')};
window.openSearch=()=>{if(!checkLogin())return;publicSearch=false;window.publicSearchMode=false;$('searchStatus').disabled=false;search();switchPage('searchScreen');};
window.openObjects=window.openSearch;
window.openPublicSearch=async()=>{publicSearch=true;window.publicSearchMode=true;$('searchStatus').value='Perdido';$('searchStatus').disabled=true;switchPage('searchScreen');await refresh();};
window.openStudentProfile=()=>{if(!checkLogin())return;const mine=objects.filter(o=>o.creadorUid===auth.currentUser.uid);$('profileContent').replaceChildren();const head=document.createElement('p');head.textContent=`${profile.alias} · Curso ${profile.curso} · ${mine.length} registros`; $('profileContent').append(head);for(const o of mine){const p=document.createElement('p');p.textContent=`${o.nombre} — ${o.estado} — ${o.lugar}`;$('profileContent').append(p)}switchPage('profileScreen');};
window.openNotifications=()=>{if(!checkLogin())return;const target=$('notificationsContent');target.replaceChildren();const found=objects.filter(o=>o.estado==='Encontrado');for(const o of found){const block=document.createElement('div');block.className='notification-card';const title=document.createElement('h3');title.textContent='Objeto encontrado: '+o.nombre;const desc=document.createElement('p');desc.textContent='Lugar: '+o.lugar;const btn=document.createElement('button');btn.textContent='Ver detalles';btn.onclick=()=>window.viewDetails(o.id);block.append(title,desc,btn);target.append(block)}if(!found.length)target.textContent='No hay avisos de objetos encontrados.';switchPage('notificationsScreen');};
window.adminChangeStudentPassword=()=>report('El administrador no puede leer ni cambiar contraseñas desde el navegador; cada usuario debe recuperar la suya con su correo.');
window.openObjects=window.openSearch;
function updateStats(){for(const [id,state] of [['lostCount','Perdido'],['foundCount','Encontrado'],['recoveredCount','Recuperado']])$(id).textContent=objects.filter(o=>o.estado===state).length;$('notificationBadge').textContent=objects.filter(o=>o.estado==='Encontrado').length;}
function labelDate(obj){if(typeof obj.fechaEvento==='string' && /^\d{4}-\d{2}-\d{2}$/.test(obj.fechaEvento)){const [y,m,d]=obj.fechaEvento.split('-');return `${d}/${m}/${y}`;}const v=obj.creado?.toDate?.();return v?v.toLocaleDateString('es-BO'):'—';}
function drawRows(id,source){const body=$(id);if(!body)return;body.replaceChildren();for(const obj of source){const row=document.createElement('tr');for(const val of [obj.id.slice(0,6),obj.nombre,labelDate(obj),obj.lugar,obj.estado]){const td=document.createElement('td');td.textContent=val;row.append(td)}const act=document.createElement('td');const view=document.createElement('button');view.textContent='Ver';view.onclick=()=>window.viewDetails(obj.id);act.append(view);if(profile?.rol==='admin'){const change=document.createElement('button');change.textContent='Cambiar estado';change.onclick=async()=>{const target=prompt('Estado: Perdido, Encontrado o Recuperado',obj.estado);if(!['Perdido','Encontrado','Recuperado'].includes(target))return;try{await updateDoc(doc(db,'objetos_compartidos_prueba',obj.id),{estado:target});await refresh();}catch(e){report('Error: '+e.code)}};const del=document.createElement('button');del.textContent='Eliminar';del.onclick=async()=>{if(!confirm('¿Eliminar este registro?'))return;try{await deleteDoc(doc(db,'objetos_compartidos_prueba',obj.id));await refresh()}catch(e){report('Error: '+e.code)}};act.append(change,del)}row.append(act);body.append(row)}if(!source.length){const row=document.createElement('tr');const cell=document.createElement('td');cell.colSpan=6;cell.textContent='No hay objetos para mostrar.';row.append(cell);body.append(row)}}
function search(){if(!profile && !publicSearch)return;const q=$('searchInput').value.trim().toLocaleLowerCase(),status=$('searchStatus').value;drawRows('searchTableBody',objects.filter(o=>(!publicSearch || o.estado==='Perdido')&&(status==='Todos'||o.estado===status)&&`${o.nombre} ${o.lugar}`.toLocaleLowerCase().includes(q)))}
window.searchObjects=search;window.filterObjects=(val)=>{drawRows('objectsTableBody',objects.filter(o=>val==='Todos'||o.estado===val))};
window.viewDetails=async id=>{const o=objects.find(x=>x.id===id);if(!o)return;$('detailContent').replaceChildren();for(const [k,v] of [['Objeto',o.nombre],['Categoría',o.categoria||'—'],['Descripción',o.descripcion||'—'],['Fecha del evento',o.fechaEvento||'—'],['Lugar',o.lugar],['Estado',o.estado],['Fecha de registro',labelDate(o)]]){let p=document.createElement('p');p.textContent=`${k}: ${v}`;$('detailContent').append(p)}if(profile && auth.currentUser && o.creadorUid){const p=document.createElement('p');p.textContent='Registrado por: consultando...';$('detailContent').append(p);try{const registrante=await getDoc(doc(db,'perfiles_prueba',o.creadorUid));p.textContent='Registrado por: '+(registrante.exists()?registrante.data().alias:'No disponible');}catch(e){p.textContent='Registrado por: No disponible';}}if(o.imageData){const img=document.createElement('img');img.src=o.imageData;img.alt='Fotografía del objeto';img.style.cssText='max-width:100%;max-height:350px;object-fit:contain;border-radius:12px';$('detailContent').append(img)}switchPage('detailScreen')};
window.backFromDetails=()=>{if(publicSearch){switchPage('searchScreen');}else{window.openSearch();}};
async function refresh(){if(!profile&&!publicSearch)return;try{const snap=await getDocs(publicSearch?query(shared(),where('estado','==','Perdido')):shared());objects=snap.docs.map(d=>({id:d.id,...d.data()}));if(profile){updateStats();drawRows('objectsTableBody',objects);}search();report(`Firestore: ${objects.length} objetos compartidos cargados.`);}catch(e){report('No se pudo consultar Firestore: '+(e.code||e.message))}}
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
$('objectImage').onchange=async e=>{
 const target=$('imagePreview');target.replaceChildren();
 try{const file=e.target.files?.[0];if(!file)return;const image=await compressImage(file);const img=document.createElement('img');img.src=image;img.alt='Vista previa de la fotografía';img.style.cssText='max-width:100%;max-height:220px;object-fit:contain';target.append(img)}catch(error){report(error.message);e.target.value=''}
};
$('objectForm').onsubmit=async e=>{e.preventDefault();if(!checkLogin())return;const name=$('objectName').value.trim(),place=$('objectPlace').value,state=profile.rol==='admin'?$('objectStatus').value:'Perdido';const categoria=$('objectCategory').value,descripcion=$('objectDescription').value.trim(),fechaEvento=$('objectDate').value,curso=profile.curso||'6B';if(!name||!place||!categoria||!descripcion||!fechaEvento)return;try{const file=$('objectImage').files?.[0];const imageData=await compressImage(file);const payload={nombre:name,lugar:place,estado:state,categoria,descripcion,fechaEvento,curso,creadorUid:auth.currentUser.uid,creado:serverTimestamp()};if(imageData)payload.imageData=imageData;await addDoc(shared(),payload);await refresh();window.openSearch();}catch(err){report('No se pudo guardar: '+(err.code||err.message))}};
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
 try{
  const snap=await getDoc(doc(db,'perfiles_prueba',user.uid));
  if(!snap.exists()||!['estudiante','admin'].includes(snap.data().rol)){report('La cuenta no tiene perfil autorizado.');return;}
  profile=snap.data();if(adminLoginRequested && profile.rol!=='admin'){profile=null;adminLoginRequested=false;await signOut(auth);showLogin(true);$('fbLoginStatus').textContent='Esta cuenta no tiene permisos de administrador.';return;}adminLoginRequested=false;publicSearch=false;window.publicSearchMode=false;$('searchStatus').disabled=false;$('fbAuthOverlay').style.display='none';$('fbRegisterOverlay').style.display='none';
  $('sisgopAdminPasswordCard').style.display='none';$('sisgopCreateAdminCard').style.display=profile.rol==='admin'?'':'none';
  pendingChange=profile.rol==='estudiante' && profile.requiereCambioClave===true;
  if(pendingChange){$('fbChangePasswordOverlay').style.display='flex';switchPage('welcomeScreen');return;}
  $('fbChangePasswordOverlay').style.display='none';await refresh();switchPage('homeScreen');
 }catch(e){report('Error de perfil: '+(e.code||e.message));}
}
onAuthStateChanged(auth,async user=>{
 if(registering)return;
 profile=null;objects=[];pendingChange=false;$('fbChangePasswordOverlay').style.display='none';
 if(!user){if(!publicSearch)switchPage('welcomeScreen');$('fbAuthOverlay').style.display='none';return;}
 await loadSession(user);
});
